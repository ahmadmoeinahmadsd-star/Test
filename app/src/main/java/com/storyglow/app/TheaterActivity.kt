package com.storyglow.app

import android.annotation.SuppressLint
import android.app.Activity
import android.graphics.Color
import android.media.AudioAttributes
import android.media.MediaPlayer
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.view.View
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient

/**
 * The illustrated audiobook demo (Hansel and Gretel).
 * The animation engine is a web canvas in assets/theater; the audio is played natively here
 * and its position is pushed to the page a few times per second.
 */
class TheaterActivity : Activity() {

    private lateinit var web: WebView
    private var player: MediaPlayer? = null
    private val ui = Handler(Looper.getMainLooper())

    private val sync = object : Runnable {
        override fun run() {
            push()
            ui.postDelayed(this, 400)
        }
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        player = MediaPlayer().apply {
            setAudioAttributes(AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_MEDIA)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH).build())
            assets.openFd("demo/hansel.mp3").use { setDataSource(it.fileDescriptor, it.startOffset, it.length) }
            prepare()
            setOnCompletionListener { push() }
        }

        web = WebView(this).apply {
            setBackgroundColor(Color.BLACK)
            settings.javaScriptEnabled = true
            settings.domStorageEnabled = true
            settings.mediaPlaybackRequiresUserGesture = false
            webChromeClient = WebChromeClient()
            webViewClient = WebViewClient()
            addJavascriptInterface(Bridge(), "StoryGlowNative")
        }
        setContentView(web)
        web.loadUrl("file:///android_asset/theater/index.html")
    }

    private fun push() {
        val p = player ?: return
        val js = "window.__sync && window.__sync(${p.currentPosition}, ${p.isPlaying}, ${p.duration})"
        web.evaluateJavascript(js, null)
    }

    inner class Bridge {
        @JavascriptInterface fun play() = ui.post { player?.start(); push() }.let { }
        @JavascriptInterface fun pause() = ui.post { player?.pause(); push() }.let { }
        @JavascriptInterface fun seek(ms: Int) = ui.post {
            val p = player ?: return@post
            if (Build.VERSION.SDK_INT >= 26) p.seekTo(ms.toLong(), MediaPlayer.SEEK_CLOSEST) else p.seekTo(ms)
            ui.postDelayed({ push() }, 150)
        }.let { }
        @JavascriptInterface fun duration(): Int = player?.duration ?: 0
    }

    override fun onResume() {
        super.onResume()
        hideBars()
        ui.post(sync)
    }

    override fun onPause() {
        super.onPause()
        ui.removeCallbacks(sync)
        player?.pause()
        push()
    }

    override fun onDestroy() {
        super.onDestroy()
        player?.release(); player = null
        web.destroy()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideBars()
    }

    @Suppress("DEPRECATION")
    private fun hideBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
        }
    }
}
