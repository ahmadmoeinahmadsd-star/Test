package com.storyglow.app

import android.content.ComponentName
import android.content.Context
import android.graphics.Bitmap
import android.media.MediaMetadata
import android.media.session.MediaController
import android.media.session.MediaSessionManager
import android.media.session.PlaybackState
import android.os.Handler
import android.os.Looper
import android.os.SystemClock

/**
 * Finds Audible's media session and follows it: book / chapter / author / cover,
 * play state and position. Also sends play/pause/seek back to Audible.
 */
class AudibleWatcher(context: Context, private val onChange: () -> Unit) {

    companion object {
        const val AUDIBLE_PACKAGE = "com.audible.application"
    }

    /** When true and Audible isn't running, follow whatever player is active. */
    var followAnyPlayer = false

    var controller: MediaController? = null
        private set

    private val appContext = context.applicationContext
    private val msm = appContext.getSystemService(MediaSessionManager::class.java)
    private val component = ComponentName(appContext, MediaListenerService::class.java)
    private val handler = Handler(Looper.getMainLooper())

    private val sessionsListener =
        MediaSessionManager.OnActiveSessionsChangedListener { list -> pick(list ?: emptyList()) }

    private val callback = object : MediaController.Callback() {
        override fun onMetadataChanged(metadata: MediaMetadata?) = onChange()
        override fun onPlaybackStateChanged(state: PlaybackState?) = onChange()
        override fun onSessionDestroyed() {
            attach(null)
            refresh()
        }
    }

    /** Returns false if Notification Access hasn't been granted yet. */
    fun start(): Boolean = try {
        msm.addOnActiveSessionsChangedListener(sessionsListener, component, handler)
        pick(msm.getActiveSessions(component))
        true
    } catch (e: SecurityException) {
        false
    }

    fun stop() {
        try { msm.removeOnActiveSessionsChangedListener(sessionsListener) } catch (_: Exception) {}
        attach(null)
    }

    fun refresh() {
        try { pick(msm.getActiveSessions(component)) } catch (_: SecurityException) {}
    }

    private fun pick(list: List<MediaController>) {
        val audible = list.firstOrNull { it.packageName == AUDIBLE_PACKAGE }
        val chosen = audible ?: if (followAnyPlayer) {
            list.firstOrNull { it.playbackState?.state == PlaybackState.STATE_PLAYING } ?: list.firstOrNull()
        } else null
        if (chosen?.sessionToken != controller?.sessionToken) attach(chosen) else onChange()
    }

    private fun attach(c: MediaController?) {
        controller?.unregisterCallback(callback)
        controller = c
        c?.registerCallback(callback, handler)
        onChange()
    }

    // ---- state ----

    val isAudible get() = controller?.packageName == AUDIBLE_PACKAGE
    val isPlaying get() = controller?.playbackState?.state == PlaybackState.STATE_PLAYING

    private fun meta(key: String): String? =
        controller?.metadata?.getString(key)?.takeIf { it.isNotBlank() }

    /** Audible usually puts the book in ALBUM and the chapter in TITLE. */
    val bookTitle: String?
        get() = meta(MediaMetadata.METADATA_KEY_ALBUM) ?: meta(MediaMetadata.METADATA_KEY_TITLE)

    val chapterTitle: String?
        get() {
            val album = meta(MediaMetadata.METADATA_KEY_ALBUM) ?: return meta(MediaMetadata.METADATA_KEY_DISPLAY_SUBTITLE)
            val title = meta(MediaMetadata.METADATA_KEY_TITLE)
            return if (title != null && title != album) title else null
        }

    val author: String?
        get() = meta(MediaMetadata.METADATA_KEY_ARTIST)
            ?: meta(MediaMetadata.METADATA_KEY_AUTHOR)
            ?: meta(MediaMetadata.METADATA_KEY_ALBUM_ARTIST)

    val cover: Bitmap?
        get() {
            val m = controller?.metadata ?: return null
            return m.getBitmap(MediaMetadata.METADATA_KEY_ART)
                ?: m.getBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART)
                ?: m.getBitmap(MediaMetadata.METADATA_KEY_DISPLAY_ICON)
        }

    fun durationMs(): Long = controller?.metadata?.getLong(MediaMetadata.METADATA_KEY_DURATION) ?: 0L

    fun positionMs(): Long {
        val s = controller?.playbackState ?: return 0L
        if (s.state != PlaybackState.STATE_PLAYING) return s.position
        val elapsed = SystemClock.elapsedRealtime() - s.lastPositionUpdateTime
        return s.position + (elapsed * s.playbackSpeed).toLong()
    }

    // ---- controls (sent to Audible) ----

    fun togglePlay() {
        val tc = controller?.transportControls ?: return
        if (isPlaying) tc.pause() else tc.play()
    }

    fun skip(deltaMs: Long) {
        val c = controller ?: return
        val dur = durationMs()
        var target = positionMs() + deltaMs
        if (target < 0) target = 0
        if (dur > 0 && target > dur) target = dur
        c.transportControls.seekTo(target)
    }
}
