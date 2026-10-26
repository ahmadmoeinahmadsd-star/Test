package com.storyglow.app

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Matrix
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.Shader
import android.view.View
import kotlin.math.PI
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * Full-screen ambient animation. Three scenes:
 *  0 Aurora  – flowing ribbons of light
 *  1 Embers  – drifting glowing particles
 *  2 Cover   – the book cover breathing inside orbiting halos
 *
 * Colours come from the book cover. Motion speeds up while playing and pulses
 * with the narrator's voice (real audio level if available, otherwise a soft
 * speech-like rhythm). When paused everything slows and dims.
 */
class StoryView(context: Context) : View(context) {

    companion object {
        const val SCENES = 3
        val SCENE_NAMES = arrayOf("Aurora", "Embers", "Cover")
    }

    var playing = false
    /** 0..1 from AudioTap, or -1 for "no real audio, use the built-in rhythm". */
    var audioLevel = -1f

    var scene = 0
        private set

    private val cur = FloatArray(9)
    private val tgt = FloatArray(9)

    private var art: Bitmap? = null
    private var artShader: BitmapShader? = null
    private val artMatrix = Matrix()

    private var t = 0.0          // animation time (speed varies with energy)
    private var wall = 0.0       // real time
    private var energy = 0.1f
    private var lvl = 0f
    private var lastNanos = 0L

    private val paint = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val rnd = Random(7)

    private val n = 150
    private val px = FloatArray(n)
    private val py = FloatArray(n)
    private val pv = FloatArray(n)
    private val ps = FloatArray(n)
    private val pp = FloatArray(n)
    private val pc = IntArray(n)

    init {
        setPalette(CoverPalette.DEFAULT)
        System.arraycopy(tgt, 0, cur, 0, 9)
    }

    fun setPalette(colors: IntArray) {
        for (i in 0 until 3) {
            val c = colors[i % colors.size]
            tgt[i * 3] = Color.red(c).toFloat()
            tgt[i * 3 + 1] = Color.green(c).toFloat()
            tgt[i * 3 + 2] = Color.blue(c).toFloat()
        }
    }

    fun setArt(b: Bitmap?) {
        if (b === art) return
        art = b
        artShader = b?.let { BitmapShader(it, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP) }
    }

    fun nextScene(): String {
        scene = (scene + 1) % SCENES
        return SCENE_NAMES[scene]
    }

    fun setScene(s: Int) { scene = s.coerceIn(0, SCENES - 1) }

    private fun col(i: Int, alpha: Int): Int =
        Color.argb(alpha.coerceIn(0, 255), cur[i * 3].toInt(), cur[i * 3 + 1].toInt(), cur[i * 3 + 2].toInt())

    private fun dark(i: Int, f: Float): Int =
        Color.rgb((cur[i * 3] * f).toInt(), (cur[i * 3 + 1] * f).toInt(), (cur[i * 3 + 2] * f).toInt())

    override fun onSizeChanged(w: Int, h: Int, oldw: Int, oldh: Int) {
        for (i in 0 until n) seed(i, w.toFloat(), h.toFloat(), anywhere = true)
    }

    private fun seed(i: Int, w: Float, h: Float, anywhere: Boolean) {
        px[i] = rnd.nextFloat() * w
        py[i] = if (anywhere) rnd.nextFloat() * h else h + rnd.nextFloat() * 40f
        pv[i] = 0.4f + rnd.nextFloat()
        ps[i] = 1.5f + rnd.nextFloat() * 4.5f
        pp[i] = rnd.nextFloat() * 6.283f
        pc[i] = rnd.nextInt(3)
    }

    /** Soft speech-like rhythm used when real audio isn't available. */
    private fun syntheticLevel(): Float {
        val x = wall * 6.0
        val v = (0.5 + 0.5 * sin(x * 1.7)) * (0.6 + 0.4 * sin(x * 0.37 + 1.0)) * (0.75 + 0.25 * sin(x * 5.3))
        return v.toFloat().coerceIn(0f, 1f)
    }

    override fun onDraw(c: Canvas) {
        val now = System.nanoTime()
        val dt = if (lastNanos == 0L) 0.016f else ((now - lastNanos) / 1e9f).coerceIn(0f, 0.05f)
        lastNanos = now
        wall += dt

        // ease colours toward the new cover's palette
        val k = 1f - exp(-dt * 1.5f)
        for (i in 0 until 9) cur[i] += (tgt[i] - cur[i]) * k

        val raw = when {
            !playing -> 0f
            audioLevel >= 0f -> audioLevel
            else -> syntheticLevel()
        }
        lvl += (raw - lvl) * (if (raw > lvl) 0.35f else 0.08f)
        val targetEnergy = if (playing) 0.45f + lvl * 0.8f else 0.06f
        energy += (targetEnergy - energy) * (1f - exp(-dt * 2f))
        t += dt * (0.25 + energy * 1.2)

        val w = width.toFloat()
        val h = height.toFloat()
        if (w <= 0f || h <= 0f) { postInvalidateOnAnimation(); return }

        // background
        paint.style = Paint.Style.FILL
        paint.shader = LinearGradient(0f, 0f, 0f, h, dark(0, 0.16f), dark(1, 0.05f), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint)
        paint.shader = null

        when (scene) {
            0 -> drawAurora(c, w, h)
            1 -> drawEmbers(c, w, h, dt)
            else -> drawCover(c, w, h)
        }

        postInvalidateOnAnimation()
    }

    // ---------------- Scene 0: Aurora ----------------
    private fun drawAurora(c: Canvas, w: Float, h: Float) {
        // twinkling stars
        paint.style = Paint.Style.FILL
        for (i in 0 until 60) {
            val a = (0.5 + 0.5 * sin(wall * (0.6 + pv[i]) + pp[i])).toFloat()
            paint.color = Color.argb((a * 120).toInt(), 255, 255, 255)
            c.drawCircle(px[i], py[i] * 0.55f, ps[i] * 0.35f, paint)
        }

        val tt = t.toFloat()
        for (i in 0 until 4) {
            val baseY = h * (0.38f + i * 0.11f)
            val amp = h * 0.05f * (0.6f + energy * 1.6f)
            path.reset()
            path.moveTo(0f, h)
            val step = w / 48f
            var x = 0f
            while (x <= w + step) {
                val u = x / w
                val y = baseY +
                    sin(u * PI * 2 * (1 + i * 0.3) + tt * (1 + i * 0.4) + i).toFloat() * amp +
                    sin(u * PI * 5 - tt * 1.3 + i * 2).toFloat() * amp * 0.35f
                path.lineTo(x, y)
                x += step
            }
            path.lineTo(w, h)
            path.close()
            val alpha = (70 + energy * 110).toInt().coerceAtMost(170)
            paint.shader = LinearGradient(0f, baseY - amp, 0f, h, col(i % 3, alpha), col(i % 3, 0), Shader.TileMode.CLAMP)
            c.drawPath(path, paint)
        }
        paint.shader = null
    }

    // ---------------- Scene 1: Embers ----------------
    private fun drawEmbers(c: Canvas, w: Float, h: Float, dt: Float) {
        // soft glow at the bottom
        paint.style = Paint.Style.FILL
        paint.shader = RadialGradient(w / 2, h * 1.05f, h * (0.55f + lvl * 0.15f), col(0, (60 + energy * 80).toInt()), col(0, 0), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, h, paint)
        paint.shader = null

        val rise = h * (0.02f + energy * 0.16f)
        for (i in 0 until n) {
            py[i] -= pv[i] * rise * dt
            px[i] += sin(wall * 0.8 + pp[i]).toFloat() * 12f * dt * (0.5f + energy)
            if (py[i] < -20f) seed(i, w, h, anywhere = false)
            val life = (py[i] / h).coerceIn(0f, 1f)
            val r = ps[i] * (1f + lvl * 0.6f)
            paint.color = col(pc[i], (life * 50).toInt())
            c.drawCircle(px[i], py[i], r * 3.2f, paint)
            paint.color = col(pc[i], (life * 210).toInt())
            c.drawCircle(px[i], py[i], r, paint)
        }
    }

    // ---------------- Scene 2: Cover ----------------
    private fun drawCover(c: Canvas, w: Float, h: Float) {
        val cx = w / 2
        val cy = h * 0.46f
        val base = min(w, h) * 0.24f
        val r = base * (1f + lvl * 0.10f)

        // halo
        paint.style = Paint.Style.FILL
        paint.shader = RadialGradient(cx, cy, r * 2.4f, col(0, (90 + lvl * 100).toInt()), col(1, 0), Shader.TileMode.CLAMP)
        c.drawCircle(cx, cy, r * 2.4f, paint)
        paint.shader = null

        // rings
        paint.style = Paint.Style.STROKE
        for (i in 0 until 4) {
            val rr = r * (1.18f + i * 0.2f) + sin(wall * 1.5 + i).toFloat() * r * 0.03f * (1 + lvl * 3)
            paint.strokeWidth = 2f + (3 - i)
            paint.color = col(i % 3, (110 - i * 22 + lvl * 60).toInt())
            c.drawCircle(cx, cy, rr, paint)
        }

        // orbiting dots
        paint.style = Paint.Style.FILL
        val tt = t.toFloat()
        for (i in 0 until 48) {
            val ring = 1.25f + (i % 4) * 0.22f
            val ang = pp[i] + tt * (0.6f + (i % 4) * 0.15f) * (if (i % 2 == 0) 1 else -1)
            val ox = cx + cos(ang) * r * ring
            val oy = cy + sin(ang) * r * ring
            paint.color = col(pc[i], (150 + lvl * 100).toInt())
            c.drawCircle(ox, oy, ps[i] * 0.6f * (1 + lvl * 0.5f), paint)
        }

        // cover art disc (or gradient disc if no cover)
        val shader = artShader
        val bmp = art
        if (shader != null && bmp != null) {
            val scale = (2 * r) / min(bmp.width, bmp.height).toFloat()
            artMatrix.reset()
            artMatrix.setScale(scale, scale)
            artMatrix.postTranslate(cx - bmp.width * scale / 2, cy - bmp.height * scale / 2)
            shader.setLocalMatrix(artMatrix)
            paint.shader = shader
            c.drawCircle(cx, cy, r, paint)
            paint.shader = null
        } else {
            paint.shader = LinearGradient(cx - r, cy - r, cx + r, cy + r, col(0, 255), col(2, 255), Shader.TileMode.CLAMP)
            c.drawCircle(cx, cy, r, paint)
            paint.shader = null
        }
        // dim the disc a bit when paused
        if (!playing) {
            paint.color = Color.argb(90, 0, 0, 0)
            c.drawCircle(cx, cy, r, paint)
        }
    }
}
