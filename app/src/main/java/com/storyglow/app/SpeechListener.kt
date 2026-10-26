package com.storyglow.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

/**
 * Listens continuously through the microphone and reports what the narrator says.
 * Android's recognizer stops after each phrase, so we restart it in a loop.
 * Prefers the on-device (offline) recognizer; falls back to the standard one.
 */
class SpeechListener(
    private val context: Context,
    private val onText: (text: String, isFinal: Boolean) -> Unit,
    private val onProblem: (String) -> Unit,
    private val onStatus: (String) -> Unit = {},
) {
    private var recognizer: SpeechRecognizer? = null
    private val handler = Handler(Looper.getMainLooper())
    private var useOnDevice = true
    private var errorsInARow = 0

    var active = false
        private set

    fun isAvailable(): Boolean = SpeechRecognizer.isRecognitionAvailable(context) ||
        (Build.VERSION.SDK_INT >= 31 && SpeechRecognizer.isOnDeviceRecognitionAvailable(context))

    fun start() {
        if (active) return
        active = true
        errorsInARow = 0
        create()
        listen()
    }

    fun stop() {
        active = false
        handler.removeCallbacksAndMessages(null)
        try { recognizer?.cancel() } catch (_: Throwable) {}
        try { recognizer?.destroy() } catch (_: Throwable) {}
        recognizer = null
    }

    private fun create() {
        try { recognizer?.destroy() } catch (_: Throwable) {}
        recognizer = if (useOnDevice && Build.VERSION.SDK_INT >= 31 &&
            SpeechRecognizer.isOnDeviceRecognitionAvailable(context)) {
            SpeechRecognizer.createOnDeviceSpeechRecognizer(context)
        } else {
            useOnDevice = false
            SpeechRecognizer.createSpeechRecognizer(context)
        }
        recognizer?.setRecognitionListener(listener)
    }

    private fun listen() {
        if (!active) return
        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_PREFER_OFFLINE, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 1)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 1500L)
            putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 8000L)
        }
        try {
            recognizer?.startListening(intent)
        } catch (e: Throwable) {
            onStatus("Couldn't start listening: ${e.javaClass.simpleName}")
            later(1000) { create(); listen() }
        }
    }

    private fun errorName(e: Int) = when (e) {
        SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "network timeout"
        SpeechRecognizer.ERROR_NETWORK -> "network"
        SpeechRecognizer.ERROR_AUDIO -> "audio/mic busy"
        SpeechRecognizer.ERROR_SERVER -> "server"
        SpeechRecognizer.ERROR_CLIENT -> "client"
        SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "busy"
        SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "no mic permission"
        12 -> "language not supported"
        13 -> "language not downloaded"
        else -> "other"
    }

    private fun later(ms: Long, block: () -> Unit) {
        handler.removeCallbacksAndMessages(null)
        handler.postDelayed({ if (active) block() }, ms)
    }

    private fun firstResult(b: Bundle?): String? =
        b?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull()?.takeIf { it.isNotBlank() }

    private val listener = object : RecognitionListener {
        override fun onResults(results: Bundle?) {
            errorsInARow = 0
            firstResult(results)?.let { onText(it, true) }
            later(50) { listen() }
        }

        override fun onPartialResults(partialResults: Bundle?) {
            firstResult(partialResults)?.let { onText(it, false) }
        }

        override fun onError(error: Int) {
            if (!active) return
            if (error != SpeechRecognizer.ERROR_NO_MATCH && error != SpeechRecognizer.ERROR_SPEECH_TIMEOUT)
                onStatus("Recognizer error $error (${errorName(error)})${if (useOnDevice) " · on-device" else ""}")
            else onStatus("🎙 Listening… (nothing understood yet)")
            when (error) {
                SpeechRecognizer.ERROR_NO_MATCH,
                SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> later(50) { listen() }

                SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> {
                    onProblem("Story mode needs the microphone permission")
                    stop()
                }

                // 12/13 = language not supported / not downloaded for on-device recognition
                12, 13 -> {
                    if (useOnDevice) {
                        useOnDevice = false
                        later(200) { create(); listen() }
                    } else {
                        onProblem("Speech recognition for this language isn't available on this phone")
                        stop()
                    }
                }

                else -> {
                    errorsInARow++
                    if (useOnDevice && errorsInARow >= 4) useOnDevice = false
                    if (errorsInARow >= 12) {
                        onProblem("Speech recognition keeps failing on this phone")
                        stop()
                    } else {
                        later(600L * errorsInARow.coerceAtMost(5)) { create(); listen() }
                    }
                }
            }
        }

        override fun onReadyForSpeech(params: Bundle?) { onStatus("🎙 Listening…${if (useOnDevice) " (on-device)" else ""}") }
        override fun onBeginningOfSpeech() { onStatus("🎙 Hearing speech…") }
        override fun onRmsChanged(rmsdB: Float) {}
        override fun onBufferReceived(buffer: ByteArray?) {}
        override fun onEndOfSpeech() {}
        override fun onEvent(eventType: Int, params: Bundle?) {}
    }
}
