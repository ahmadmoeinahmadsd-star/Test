package com.storyglow.app

import android.media.audiofx.Visualizer
import kotlin.math.sqrt

/**
 * Optional "voice sync": listens to the phone's audio output mix (session 0)
 * and turns it into a 0..1 loudness level. Nothing is recorded or stored.
 *
 * Some phones block or silence session 0; then [level] stays -1 and the
 * animation falls back to a gentle built-in rhythm.
 */
class AudioTap {
    private var visualizer: Visualizer? = null
    private var silentFrames = 0

    /** 0..1 loudness, or -1 when no real audio data is available. */
    @Volatile var level = -1f
        private set

    val running get() = visualizer != null

    fun start(): Boolean {
        stop()
        return try {
            val v = Visualizer(0)
            v.setEnabled(false)
            val range = Visualizer.getCaptureSizeRange()
            v.setCaptureSize(512.coerceIn(range[0], range[1]))
            v.setDataCaptureListener(object : Visualizer.OnDataCaptureListener {
                override fun onWaveFormDataCapture(vis: Visualizer?, wave: ByteArray?, rate: Int) {
                    if (wave == null || wave.isEmpty()) return
                    var sum = 0.0
                    var allFlat = true
                    for (b in wave) {
                        val s = (b.toInt() and 0xFF) - 128
                        if (s != 0 && s != -128) allFlat = false
                        sum += (s * s).toDouble()
                    }
                    if (allFlat) {
                        silentFrames++
                        // ~3 s of pure zeros: device is probably blocking capture
                        level = if (silentFrames > 60) -1f else 0f
                        return
                    }
                    silentFrames = 0
                    val rms = sqrt(sum / wave.size) / 128.0
                    level = (rms * 4.0).toFloat().coerceIn(0f, 1f)
                }

                override fun onFftDataCapture(vis: Visualizer?, fft: ByteArray?, rate: Int) {}
            }, Visualizer.getMaxCaptureRate() / 2, true, false)
            v.setEnabled(true)
            visualizer = v
            true
        } catch (t: Throwable) {
            visualizer = null
            level = -1f
            false
        }
    }

    fun stop() {
        try {
            visualizer?.setEnabled(false)
            visualizer?.release()
        } catch (_: Throwable) {}
        visualizer = null
        level = -1f
        silentFrames = 0
    }
}
