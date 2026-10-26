package com.storyglow.app

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.Bitmap
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.text.TextUtils
import android.util.TypedValue
import android.view.Gravity
import android.view.View
import android.view.ViewGroup
import android.view.WindowInsets
import android.view.WindowInsetsController
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.Toast

class MainActivity : Activity() {

    private lateinit var story: StoryView
    private lateinit var topPanel: LinearLayout
    private lateinit var bottomPanel: LinearLayout
    private lateinit var setupPanel: LinearLayout
    private lateinit var bookText: TextView
    private lateinit var chapterText: TextView
    private lateinit var authorText: TextView
    private lateinit var timeText: TextView
    private lateinit var progress: ProgressBar
    private lateinit var playBtn: TextView
    private lateinit var voiceBtn: TextView
    private lateinit var anyBtn: TextView
    private lateinit var storyBtn: TextView
    private lateinit var subtitle: TextView
    private lateinit var speech: SpeechListener
    private var storyMode = false
    private var lastHeardAt = 0L
    private var lastBook: String? = null

    private lateinit var watcher: AudibleWatcher
    private val tap = AudioTap()
    private val ui = Handler(Looper.getMainLooper())
    private val prefs by lazy { getSharedPreferences("storyglow", MODE_PRIVATE) }

    private var lastCover: Bitmap? = null
    private var controlsVisible = true
    private var lastTouch = 0L

    private val ticker = object : Runnable {
        override fun run() {
            tick()
            ui.postDelayed(this, 250)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        watcher = AudibleWatcher(this) { onMediaChanged() }
        watcher.followAnyPlayer = prefs.getBoolean("anyPlayer", false)
        speech = SpeechListener(this, { text, _ -> onHeard(text) }, { msg -> toast(msg) })
        storyMode = prefs.getBoolean("storyMode", false)
        buildUi()
        story.setScene(if (storyMode) StoryView.STORY else prefs.getInt("scene", 0))
    }

    override fun onResume() {
        super.onResume()
        hideSystemBars()
        val hasAccess = hasNotificationAccess()
        setupPanel.visibility = if (hasAccess) View.GONE else View.VISIBLE
        if (hasAccess) watcher.start()
        if (prefs.getBoolean("voice", false) && hasMic()) startVoice(quiet = true)
        updateToggleLabels()
        lastTouch = System.currentTimeMillis()
        ui.post(ticker)
    }

    override fun onPause() {
        super.onPause()
        ui.removeCallbacks(ticker)
        watcher.stop()
        tap.stop()
        speech.stop()
    }

    override fun onWindowFocusChanged(hasFocus: Boolean) {
        super.onWindowFocusChanged(hasFocus)
        if (hasFocus) hideSystemBars()
    }

    // ------------------------------------------------------------------ media

    private fun onMediaChanged() {
        val c = watcher.controller
        if (c == null) {
            bookText.text = if (hasNotificationAccess()) "Waiting for Audible…" else "StoryGlow"
            chapterText.text = "Start a book in Audible and it will appear here"
            authorText.text = ""
            story.setArt(null)
            story.setPalette(CoverPalette.DEFAULT)
            lastCover = null
        } else {
            bookText.text = watcher.bookTitle ?: "Untitled"
            if (watcher.bookTitle != lastBook) { lastBook = watcher.bookTitle; story.story.state.clear() }
            chapterText.text = watcher.chapterTitle ?: ""
            authorText.text = watcher.author?.let { "by $it" } ?: ""
            val cover = watcher.cover
            if (cover !== lastCover) {
                lastCover = cover
                story.setArt(cover)
                story.setPalette(CoverPalette.from(cover))
            }
        }
        chapterText.visibility = if (chapterText.text.isNullOrEmpty()) View.GONE else View.VISIBLE
        authorText.visibility = if (authorText.text.isNullOrEmpty()) View.GONE else View.VISIBLE
        tick()
    }

    private fun tick() {
        val playing = watcher.isPlaying
        story.playing = playing
        story.audioLevel = if (tap.running) tap.level else -1f
        playBtn.text = if (playing) "❚❚" else "▶"

        val dur = watcher.durationMs()
        val pos = watcher.positionMs()
        if (watcher.controller != null && dur > 0) {
            progress.visibility = View.VISIBLE
            progress.progress = ((pos * 1000) / dur).toInt().coerceIn(0, 1000)
            timeText.text = "${fmt(pos)}  /  ${fmt(dur)}   ·   ${fmt(dur - pos)} left"
        } else if (watcher.controller != null) {
            progress.visibility = View.INVISIBLE
            timeText.text = fmt(pos)
        } else {
            progress.visibility = View.INVISIBLE
            timeText.text = ""
        }

        // Story mode: listen only while the book is actually playing
        val shouldListen = storyMode && playing && hasMic()
        if (shouldListen && !speech.active) speech.start()
        if (!shouldListen && speech.active) speech.stop()
        if (subtitle.alpha > 0f && System.currentTimeMillis() - lastHeardAt > 9000) subtitle.animate().alpha(0f).setDuration(800).start()

        // auto-hide controls after 6s while listening
        if (controlsVisible && playing && System.currentTimeMillis() - lastTouch > 6000) setControls(false)
    }

    private fun fmt(ms: Long): String {
        val s = (ms.coerceAtLeast(0) / 1000)
        val h = s / 3600; val m = (s % 3600) / 60; val sec = s % 60
        return if (h > 0) "%d:%02d:%02d".format(h, m, sec) else "%d:%02d".format(m, sec)
    }

    // ------------------------------------------------------------- permissions

    private fun hasNotificationAccess(): Boolean {
        val flat = Settings.Secure.getString(contentResolver, "enabled_notification_listeners") ?: return false
        return flat.split(":").any { it.startsWith("$packageName/") }
    }

    private fun hasMic() = checkSelfPermission(Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED

    private fun startVoice(quiet: Boolean) {
        if (tap.start()) {
            if (!quiet) toast("Voice sync on – the animation follows the narrator")
        } else if (!quiet) {
            toast("This phone blocks audio capture – using the built-in rhythm instead")
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 8) {
            if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) setStoryMode(true)
            else toast("Story mode needs the microphone to hear the narration")
            return
        }
        if (requestCode == 7) {
            val ok = grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED
            prefs.edit().putBoolean("voice", ok).apply()
            if (ok) startVoice(quiet = false) else toast("Without the microphone permission the animation uses a gentle built-in rhythm")
            updateToggleLabels()
        }
    }

    // ---------------------------------------------------------------------- UI

    private fun dp(v: Float) = TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, resources.displayMetrics)
    private fun dpi(v: Float) = dp(v).toInt()

    private fun pill(label: String, big: Boolean = false, onClick: () -> Unit): TextView = TextView(this).apply {
        text = label
        setTextColor(Color.WHITE)
        textSize = if (big) 24f else 14f
        gravity = Gravity.CENTER
        val padH = if (big) 26f else 14f
        val padV = if (big) 12f else 8f
        setPadding(dpi(padH), dpi(padV), dpi(padH), dpi(padV))
        background = GradientDrawable().apply {
            cornerRadius = dp(40f)
            setColor(Color.argb(if (big) 70 else 45, 255, 255, 255))
        }
        isClickable = true
        setOnClickListener { lastTouch = System.currentTimeMillis(); onClick() }
    }

    private fun lp(w: Int = ViewGroup.LayoutParams.WRAP_CONTENT, h: Int = ViewGroup.LayoutParams.WRAP_CONTENT, margin: Float = 0f) =
        LinearLayout.LayoutParams(w, h).apply { setMargins(dpi(margin), dpi(margin), dpi(margin), dpi(margin)) }

    private fun buildUi() {
        val root = FrameLayout(this)
        root.setBackgroundColor(Color.BLACK)

        story = StoryView(this)
        story.setOnClickListener {
            lastTouch = System.currentTimeMillis()
            setControls(!controlsVisible)
        }
        story.setOnLongClickListener {
            toast(story.nextScene()); if (story.scene != StoryView.STORY) prefs.edit().putInt("scene", story.scene).apply(); true
        }
        root.addView(story, FrameLayout.LayoutParams(-1, -1))

        // ---- top: book info
        topPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dpi(24f), dpi(56f), dpi(24f), dpi(16f))
            background = GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, intArrayOf(Color.argb(150, 0, 0, 0), Color.TRANSPARENT))
        }
        bookText = TextView(this).apply {
            setTextColor(Color.WHITE); textSize = 22f; typeface = Typeface.create("serif", Typeface.BOLD)
            maxLines = 2; ellipsize = TextUtils.TruncateAt.END
        }
        chapterText = TextView(this).apply {
            setTextColor(Color.argb(220, 255, 255, 255)); textSize = 15f; maxLines = 1; ellipsize = TextUtils.TruncateAt.END
            setPadding(0, dpi(4f), 0, 0)
        }
        authorText = TextView(this).apply {
            setTextColor(Color.argb(170, 255, 255, 255)); textSize = 13f; typeface = Typeface.create("serif", Typeface.ITALIC)
            setPadding(0, dpi(2f), 0, 0)
        }
        topPanel.addView(bookText); topPanel.addView(chapterText); topPanel.addView(authorText)
        root.addView(topPanel, FrameLayout.LayoutParams(-1, -2, Gravity.TOP))

        // ---- what the narrator just said (Story mode)
        subtitle = TextView(this).apply {
            setTextColor(Color.WHITE); textSize = 15f; gravity = Gravity.CENTER
            typeface = Typeface.create("serif", Typeface.ITALIC)
            setShadowLayer(8f, 0f, 2f, Color.BLACK)
            maxLines = 3; ellipsize = TextUtils.TruncateAt.START
            setPadding(dpi(16f), dpi(8f), dpi(16f), dpi(8f))
            alpha = 0f
        }
        root.addView(subtitle, FrameLayout.LayoutParams(-1, -2, Gravity.TOP).apply { topMargin = dpi(150f) })

        // ---- bottom: progress + controls
        bottomPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            gravity = Gravity.CENTER_HORIZONTAL
            setPadding(dpi(20f), dpi(24f), dpi(20f), dpi(36f))
            background = GradientDrawable(GradientDrawable.Orientation.BOTTOM_TOP, intArrayOf(Color.argb(170, 0, 0, 0), Color.TRANSPARENT))
        }
        progress = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            max = 1000
            progressTintList = android.content.res.ColorStateList.valueOf(Color.argb(220, 255, 255, 255))
            progressBackgroundTintList = android.content.res.ColorStateList.valueOf(Color.argb(60, 255, 255, 255))
        }
        bottomPanel.addView(progress, lp(-1, dpi(6f)))
        timeText = TextView(this).apply {
            setTextColor(Color.argb(190, 255, 255, 255)); textSize = 12f; gravity = Gravity.CENTER
            setPadding(0, dpi(6f), 0, dpi(10f))
        }
        bottomPanel.addView(timeText, lp(-1))

        val transport = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER }
        transport.addView(pill("↺ 30") { watcher.skip(-30_000) }, lp(margin = 8f))
        playBtn = pill("▶", big = true) {
            if (watcher.controller == null) openAudible() else watcher.togglePlay()
        }
        transport.addView(playBtn, lp(margin = 8f))
        transport.addView(pill("30 ↻") { watcher.skip(30_000) }, lp(margin = 8f))
        bottomPanel.addView(transport)

        val extras = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL; gravity = Gravity.CENTER; setPadding(0, dpi(10f), 0, 0) }
        storyBtn = pill("Story mode") { setStoryMode(!storyMode) }
        bottomPanel.addView(storyBtn, lp(margin = 6f))
        extras.addView(pill("✦ Scene") {
            toast(story.nextScene()); prefs.edit().putInt("scene", story.scene).apply()
        }, lp(margin = 4f))
        voiceBtn = pill("Voice sync") { toggleVoice() }
        extras.addView(voiceBtn, lp(margin = 4f))
        anyBtn = pill("Audible only") { toggleAnyPlayer() }
        extras.addView(anyBtn, lp(margin = 4f))
        extras.addView(pill("Audible ↗") { openAudible() }, lp(margin = 4f))
        bottomPanel.addView(extras)
        root.addView(bottomPanel, FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM))

        // ---- first-run setup card
        setupPanel = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            setPadding(dpi(24f), dpi(24f), dpi(24f), dpi(24f))
            background = GradientDrawable().apply { cornerRadius = dp(20f); setColor(Color.argb(225, 20, 18, 40)) }
            isClickable = true
        }
        setupPanel.addView(TextView(this).apply {
            text = "Connect to Audible"
            setTextColor(Color.WHITE); textSize = 20f; typeface = Typeface.DEFAULT_BOLD
        })
        setupPanel.addView(TextView(this).apply {
            text = "StoryGlow needs Notification Access so it can see what Audible is playing " +
                "(book, chapter, cover and position) and pause or skip for you. It never reads your notifications.\n\n" +
                "1. Tap “Grant access” and switch StoryGlow on.\n" +
                "2. If Android says it's a “restricted setting”, tap “App info”, open the ⋮ menu, " +
                "choose “Allow restricted settings”, then try step 1 again."
            setTextColor(Color.argb(220, 255, 255, 255)); textSize = 14f
            setPadding(0, dpi(10f), 0, dpi(16f))
        })
        val setupBtns = LinearLayout(this).apply { orientation = LinearLayout.HORIZONTAL }
        setupBtns.addView(pill("Grant access") {
            startActivity(Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS))
        }, lp(margin = 4f))
        setupBtns.addView(pill("App info") {
            startActivity(Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:$packageName")))
        }, lp(margin = 4f))
        setupPanel.addView(setupBtns)
        root.addView(setupPanel, FrameLayout.LayoutParams(-1, -2, Gravity.CENTER).apply {
            setMargins(dpi(20f), 0, dpi(20f), 0)
        })

        setContentView(root)
        onMediaChanged()
    }

    private fun setControls(show: Boolean) {
        controlsVisible = show
        for (v in listOf(topPanel, bottomPanel)) {
            v.animate().alpha(if (show) 1f else 0f).setDuration(400).withEndAction {
                if (!show) v.visibility = View.INVISIBLE
            }.withStartAction {
                if (show) v.visibility = View.VISIBLE
            }.start()
        }
    }

    private fun toggleVoice() {
        if (tap.running) {
            tap.stop()
            prefs.edit().putBoolean("voice", false).apply()
            toast("Voice sync off")
        } else if (hasMic()) {
            prefs.edit().putBoolean("voice", true).apply()
            startVoice(quiet = false)
        } else {
            requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 7)
        }
        updateToggleLabels()
    }

    private fun toggleAnyPlayer() {
        watcher.followAnyPlayer = !watcher.followAnyPlayer
        prefs.edit().putBoolean("anyPlayer", watcher.followAnyPlayer).apply()
        watcher.refresh()
        updateToggleLabels()
    }

    private fun setStoryMode(on: Boolean) {
        if (on && !hasMic()) { requestPermissions(arrayOf(Manifest.permission.RECORD_AUDIO), 8); return }
        if (on && !speech.isAvailable()) { toast("This phone has no speech recognition service"); return }
        storyMode = on
        prefs.edit().putBoolean("storyMode", on).apply()
        if (on) {
            story.setScene(StoryView.STORY)
            toast("Story mode listens through the mic – play Audible on the phone speaker, not headphones")
        } else {
            speech.stop()
            story.setScene(prefs.getInt("scene", 0).takeIf { it != StoryView.STORY } ?: 0)
            subtitle.alpha = 0f
        }
        updateToggleLabels()
    }

    private fun onHeard(text: String) {
        story.story.onText(text, story.width.toFloat())
        val tags = story.story.state.lastKeywords
        subtitle.text = if (tags.isEmpty()) "“$text”" else "“$text”\n✦ ${tags.joinToString("  ·  ")}"
        lastHeardAt = System.currentTimeMillis()
        if (subtitle.alpha < 1f) subtitle.animate().alpha(1f).setDuration(300).start()
    }

    private fun updateToggleLabels() {
        storyBtn.text = if (storyMode) "Story mode ✓  (listening)" else "Story mode – draw what's said"
        voiceBtn.text = if (tap.running) "Voice sync ✓" else "Voice sync"
        anyBtn.text = if (watcher.followAnyPlayer) "Any player" else "Audible only"
    }

    private fun openAudible() {
        val i = packageManager.getLaunchIntentForPackage(AudibleWatcher.AUDIBLE_PACKAGE)
        if (i != null) startActivity(i) else {
            try {
                startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=${AudibleWatcher.AUDIBLE_PACKAGE}")))
            } catch (_: Exception) {
                toast("Audible isn't installed")
            }
        }
    }

    private fun toast(s: String) = Toast.makeText(this, s, Toast.LENGTH_SHORT).show()

    @Suppress("DEPRECATION")
    private fun hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            window.insetsController?.let {
                it.hide(WindowInsets.Type.systemBars())
                it.systemBarsBehavior = WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
            }
        } else {
            window.decorView.systemUiVisibility = (View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                or View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                or View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                or View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION)
        }
    }
}
