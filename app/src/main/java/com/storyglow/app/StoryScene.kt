package com.storyglow.app

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.RadialGradient
import android.graphics.RectF
import android.graphics.Shader
import kotlin.math.abs
import kotlin.math.cos
import kotlin.math.exp
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sin
import kotlin.random.Random

/**
 * Draws a simple animated picture of what the narrator is describing:
 * a backdrop (field, forest, sea, city…), props (tree, house, fire…),
 * time of day, weather, and characters that walk, run, sit, sleep, ride, swim or fight.
 */
class StoryScene {

    val state = SceneState()

    private val p = Paint(Paint.ANTI_ALIAS_FLAG)
    private val path = Path()
    private val rect = RectF()
    private val rnd = Random(11)

    private var t = 0f
    private var light = 1f
    private var skyTop = DAY_TOP
    private var skyBot = DAY_BOT

    private var shown = Setting.NONE
    private var previous = Setting.NONE
    private var fade = 1f
    private val propAlpha = FloatArray(Prop.values().size)
    private var flash = 0f
    private var nextFlash = 4f
    private var expireTimer = 0f

    private val stars = Array(80) { floatArrayOf(rnd.nextFloat(), rnd.nextFloat() * 0.5f, rnd.nextFloat() * 6f) }
    private val drops = Array(170) { floatArrayOf(rnd.nextFloat(), rnd.nextFloat(), 0.7f + rnd.nextFloat() * 0.6f) }
    private val buildings = Array(14) { floatArrayOf(0.05f + rnd.nextFloat() * 0.05f, 0.12f + rnd.nextFloat() * 0.28f, rnd.nextFloat()) }
    private val pines = Array(11) { i -> floatArrayOf(i / 10f + (rnd.nextFloat() - 0.5f) * 0.06f, 0.7f + rnd.nextFloat() * 0.5f, rnd.nextFloat()) }
    private val tufts = Array(45) { floatArrayOf(rnd.nextFloat(), rnd.nextFloat(), rnd.nextFloat()) }

    companion object {
        val DAY_TOP = Color.rgb(74, 144, 217); val DAY_BOT = Color.rgb(191, 227, 245)
        val SUN_TOP = Color.rgb(43, 45, 110); val SUN_BOT = Color.rgb(245, 158, 91)
        val NIGHT_TOP = Color.rgb(7, 11, 31); val NIGHT_BOT = Color.rgb(28, 35, 71)
        val GREY_TOP = Color.rgb(74, 82, 96); val GREY_BOT = Color.rgb(138, 145, 156)
    }

    fun onText(text: String, width: Float) = state.update(text, width)

    // ------------------------------------------------------------ helpers

    private fun shade(c: Int, f: Float): Int = Color.argb(
        Color.alpha(c),
        (Color.red(c) * f).toInt().coerceIn(0, 255),
        (Color.green(c) * f).toInt().coerceIn(0, 255),
        (Color.blue(c) * f).toInt().coerceIn(0, 255),
    )

    private fun mix(a: Int, b: Int, k: Float): Int = Color.argb(
        (Color.alpha(a) + (Color.alpha(b) - Color.alpha(a)) * k).toInt(),
        (Color.red(a) + (Color.red(b) - Color.red(a)) * k).toInt(),
        (Color.green(a) + (Color.green(b) - Color.green(a)) * k).toInt(),
        (Color.blue(a) + (Color.blue(b) - Color.blue(a)) * k).toInt(),
    )

    private fun withAlpha(c: Int, a: Int) = Color.argb(a.coerceIn(0, 255), Color.red(c), Color.green(c), Color.blue(c))

    private fun fill(c: Int) { p.shader = null; p.style = Paint.Style.FILL; p.color = c }
    private fun stroke(c: Int, wdt: Float) {
        p.shader = null; p.style = Paint.Style.STROKE; p.color = c; p.strokeWidth = wdt
        p.strokeCap = Paint.Cap.ROUND; p.strokeJoin = Paint.Join.ROUND
    }

    private fun horizon(h: Float) = h * 0.62f
    private fun ground(h: Float) = h * 0.80f

    // ------------------------------------------------------------ main draw

    fun draw(c: Canvas, w: Float, h: Float, dt: Float, playing: Boolean) {
        t += dt
        val k = 1f - exp(-dt * 1.2f)

        // time of day & weather → sky colours and light level
        var top = when (state.time) { TimeOfDay.DAY -> DAY_TOP; TimeOfDay.SUNSET -> SUN_TOP; TimeOfDay.NIGHT -> NIGHT_TOP }
        var bot = when (state.time) { TimeOfDay.DAY -> DAY_BOT; TimeOfDay.SUNSET -> SUN_BOT; TimeOfDay.NIGHT -> NIGHT_BOT }
        var lightTarget = when (state.time) { TimeOfDay.DAY -> 1f; TimeOfDay.SUNSET -> 0.8f; TimeOfDay.NIGHT -> 0.42f }
        when (state.weather) {
            Weather.RAIN, Weather.STORM, Weather.SNOW -> {
                val g = if (state.time == TimeOfDay.NIGHT) 0.25f else 0.6f
                top = mix(top, shade(GREY_TOP, if (state.time == TimeOfDay.NIGHT) 0.4f else 1f), g)
                bot = mix(bot, shade(GREY_BOT, if (state.time == TimeOfDay.NIGHT) 0.4f else 1f), g)
                lightTarget *= if (state.weather == Weather.STORM) 0.72f else 0.85f
            }
            Weather.FOG -> { top = mix(top, Color.rgb(201, 206, 214), 0.4f); bot = mix(bot, Color.rgb(220, 224, 230), 0.45f) }
            Weather.CLEAR -> {}
        }
        skyTop = mix(skyTop, top, k); skyBot = mix(skyBot, bot, k)
        light += (lightTarget - light) * k

        // setting cross-fade
        if (state.setting != shown) { previous = shown; shown = state.setting; fade = 0f }
        fade = min(1f, fade + dt / 1.6f)

        for (pr in Prop.values()) {
            val target = if (state.props.containsKey(pr) && propFits(pr)) 1f else 0f
            propAlpha[pr.ordinal] += (target - propAlpha[pr.ordinal]) * (1f - exp(-dt * 2f))
        }

        expireTimer += dt
        if (expireTimer > 1f) { expireTimer = 0f; state.expire() }
        updateActors(w, h, if (playing) dt else 0f, dt)

        // --- environment
        if (fade < 1f) {
            drawEnvironment(c, w, h, previous)
            val save = c.saveLayerAlpha(0f, 0f, w, h, (fade * 255).toInt())
            drawEnvironment(c, w, h, shown)
            c.restoreToCount(save)
        } else drawEnvironment(c, w, h, shown)

        // --- birds in the sky
        for (a in state.actors) if (a.kind == Kind.BIRD) withActorAlpha(c, a, w, h) { drawBird(c, a, w, h) }

        // --- props behind characters
        if (shown != Setting.ROOM) {
            propLayer(c, w, h, Prop.CASTLE) { drawCastle(c, w, h) }
            propLayer(c, w, h, Prop.BOAT) { drawBoat(c, w, h) }
            propLayer(c, w, h, Prop.HOUSE) { drawHouse(c, w, h) }
            propLayer(c, w, h, Prop.TREE) { drawTreeBase(c, w, h) }
        }
        propLayer(c, w, h, Prop.FIRE) { if (shown == Setting.ROOM) drawFireplace(c, w, h) else drawFire(c, w, h) }

        // --- characters, back to front
        val riders = state.actors.any { it.kind.humanoid && it.act == Act.RIDE && !it.leaving }
        val people = state.actors.filter { it.kind != Kind.BIRD && !(riders && it.kind == Kind.HORSE) }.sortedBy { it.depth }
        for (a in people) withActorAlpha(c, a, w, h) { drawActor(c, a, w, h) }

        // --- tree canopy in front, so people walk *under* the tree
        if (shown != Setting.ROOM) propLayer(c, w, h, Prop.TREE) { drawTreeCanopy(c, w, h) }

        // --- weather
        if (shown == Setting.ROOM) {
            c.save(); c.clipRect(w * 0.6f, h * 0.16f, w * 0.9f, h * 0.46f)
            drawWeather(c, w, h, dt); c.restore()
        } else drawWeather(c, w, h, dt)

        // gentle vignette
        p.shader = RadialGradient(w / 2, h * 0.5f, max(w, h) * 0.75f, Color.TRANSPARENT, Color.argb(110, 0, 0, 0), Shader.TileMode.CLAMP)
        p.style = Paint.Style.FILL
        c.drawRect(0f, 0f, w, h, p)
        p.shader = null
    }

    private fun propFits(pr: Prop): Boolean = when (pr) {
        Prop.BOAT -> shown == Setting.SEA || shown == Setting.RIVER
        Prop.FIRE -> true
        else -> shown != Setting.ROOM
    }

    private inline fun propLayer(c: Canvas, w: Float, h: Float, pr: Prop, block: () -> Unit) {
        val a = propAlpha[pr.ordinal]
        if (a < 0.01f) return
        if (a > 0.99f) { block(); return }
        val s = c.saveLayerAlpha(0f, 0f, w, h, (a * 255).toInt())
        block()
        c.restoreToCount(s)
    }

    private inline fun withActorAlpha(c: Canvas, a: Actor, w: Float, h: Float, block: () -> Unit) {
        if (a.alpha < 0.01f) return
        if (a.alpha > 0.99f) { block(); return }
        val s = c.saveLayerAlpha(0f, 0f, w, h, (a.alpha * 255).toInt())
        block()
        c.restoreToCount(s)
    }

    // ------------------------------------------------------------ environment

    private fun drawEnvironment(c: Canvas, w: Float, h: Float, s: Setting) {
        if (s == Setting.ROOM) { drawRoom(c, w, h); return }
        drawSky(c, 0f, 0f, w, h)
        drawCelestial(c, w, h)
        drawClouds(c, w, h)
        when (s) {
            Setting.MOUNTAIN -> drawMountains(c, w, h)
            Setting.CITY -> drawCity(c, w, h)
            Setting.FOREST -> drawPines(c, w, h)
            Setting.DESERT -> drawDunes(c, w, h)
            else -> {}
        }
        drawGround(c, w, h, s)
    }

    private fun drawSky(c: Canvas, l: Float, tp: Float, r: Float, b: Float) {
        p.style = Paint.Style.FILL
        p.shader = LinearGradient(0f, tp, 0f, b * 0.7f, skyTop, skyBot, Shader.TileMode.CLAMP)
        c.drawRect(l, tp, r, b, p)
        p.shader = null
    }

    private fun drawCelestial(c: Canvas, w: Float, h: Float) {
        val cloudy = state.weather != Weather.CLEAR
        when (state.time) {
            TimeOfDay.NIGHT -> {
                if (!cloudy) for (s in stars) {
                    val a = (0.5f + 0.5f * sin(t * 1.3f + s[2])) * 200
                    fill(Color.argb(a.toInt(), 255, 255, 240))
                    c.drawCircle(s[0] * w, s[1] * h, 1.5f + s[2] * 0.25f, p)
                }
                val mx = w * 0.78f; val my = h * 0.16f; val mr = h * 0.045f
                p.shader = RadialGradient(mx, my, mr * 3.5f, Color.argb(if (cloudy) 30 else 70, 230, 235, 255), Color.TRANSPARENT, Shader.TileMode.CLAMP)
                c.drawCircle(mx, my, mr * 3.5f, p); p.shader = null
                fill(Color.argb(if (cloudy) 120 else 255, 240, 238, 220)); c.drawCircle(mx, my, mr, p)
                fill(skyTop); c.drawCircle(mx + mr * 0.45f, my - mr * 0.25f, mr * 0.85f, p)
            }
            TimeOfDay.SUNSET -> {
                val sx = w * 0.25f; val sy = horizon(h) - h * 0.03f; val sr = h * 0.07f
                p.shader = RadialGradient(sx, sy, sr * 4f, Color.argb(120, 255, 170, 90), Color.TRANSPARENT, Shader.TileMode.CLAMP)
                p.style = Paint.Style.FILL
                c.drawCircle(sx, sy, sr * 4f, p); p.shader = null
                fill(Color.argb(if (cloudy) 120 else 255, 255, 140, 70)); c.drawCircle(sx, sy, sr, p)
            }
            TimeOfDay.DAY -> if (!cloudy) {
                val sx = w * 0.8f; val sy = h * 0.14f; val sr = h * 0.05f
                p.shader = RadialGradient(sx, sy, sr * 4f, Color.argb(110, 255, 245, 200), Color.TRANSPARENT, Shader.TileMode.CLAMP)
                p.style = Paint.Style.FILL
                c.drawCircle(sx, sy, sr * 4f, p); p.shader = null
                fill(Color.rgb(255, 236, 150)); c.drawCircle(sx, sy, sr, p)
            }
        }
    }

    private fun drawClouds(c: Canvas, w: Float, h: Float) {
        val heavy = state.weather == Weather.RAIN || state.weather == Weather.STORM || state.weather == Weather.SNOW
        val n = if (heavy) 6 else 3
        val base = if (heavy) shade(Color.rgb(120, 126, 138), light) else Color.argb(170, 255, 255, 255)
        if (!heavy && state.time == TimeOfDay.NIGHT) return
        for (i in 0 until n) {
            val speed = 0.006f + i * 0.002f
            val x = ((i * 0.37f + t * speed) % 1.3f - 0.15f) * w
            val y = h * (0.08f + (i % 3) * 0.07f)
            val s = h * (if (heavy) 0.07f else 0.045f) * (1f + (i % 2) * 0.3f)
            fill(withAlpha(base, if (heavy) 235 else 160))
            c.drawCircle(x, y, s, p); c.drawCircle(x + s * 1.1f, y + s * 0.2f, s * 0.85f, p)
            c.drawCircle(x - s * 1.0f, y + s * 0.25f, s * 0.75f, p); c.drawCircle(x + s * 0.3f, y - s * 0.5f, s * 0.8f, p)
        }
    }

    private fun drawMountains(c: Canvas, w: Float, h: Float) {
        val hz = horizon(h)
        for (layer in 0..1) {
            path.reset(); path.moveTo(0f, hz + 2)
            var x = 0f
            while (x <= w + 10) {
                val u = x / w
                val y = if (layer == 0) hz - h * (0.16f + 0.08f * sin(u * 7f + 1f) + 0.04f * sin(u * 17f))
                else hz - h * (0.07f + 0.05f * sin(u * 5f + 2.5f) + 0.02f * sin(u * 23f))
                path.lineTo(x, y); x += w / 40f
            }
            path.lineTo(w, hz + 2); path.close()
            fill(shade(if (layer == 0) Color.rgb(120, 136, 168) else Color.rgb(84, 104, 120), light))
            c.drawPath(path, p)
        }
    }

    private fun drawCity(c: Canvas, w: Float, h: Float) {
        val hz = horizon(h)
        var x = -w * 0.02f
        var i = 0
        while (x < w) {
            val b = buildings[i % buildings.size]
            val bw = b[0] * w * 1.6f; val bh = b[1] * h
            fill(shade(Color.rgb(96, 104, 122), light * (0.85f + b[2] * 0.25f)))
            c.drawRect(x, hz - bh, x + bw - 3, hz + 2, p)
            val night = state.time != TimeOfDay.DAY
            var wy = hz - bh + h * 0.02f
            var row = 0
            while (wy < hz - h * 0.02f) {
                var wx = x + bw * 0.15f
                var col = 0
                while (wx < x + bw - bw * 0.2f) {
                    val lit = night && ((i * 7 + row * 3 + col * 5) % 4 != 0)
                    fill(if (lit) Color.rgb(255, 214, 120) else shade(Color.rgb(160, 180, 200), light * 0.8f))
                    c.drawRect(wx, wy, wx + bw * 0.14f, wy + h * 0.012f, p)
                    wx += bw * 0.26f; col++
                }
                wy += h * 0.03f; row++
            }
            x += bw; i++
        }
    }

    private fun drawPine(c: Canvas, x: Float, base: Float, size: Float, color: Int) {
        fill(shade(Color.rgb(90, 62, 40), light)); c.drawRect(x - size * 0.06f, base - size * 0.25f, x + size * 0.06f, base, p)
        fill(color)
        for (k in 0..2) {
            val top = base - size * (0.45f + k * 0.28f) - size * 0.2f
            val bw = size * (0.42f - k * 0.1f)
            val by = base - size * (0.18f + k * 0.28f)
            path.reset(); path.moveTo(x, top); path.lineTo(x - bw, by); path.lineTo(x + bw, by); path.close()
            c.drawPath(path, p)
        }
    }

    private fun drawPines(c: Canvas, w: Float, h: Float) {
        val hz = horizon(h)
        for (pt in pines) drawPine(c, pt[0] * w, hz + h * 0.02f, h * 0.22f * pt[1], shade(Color.rgb(34, 94, 58), light * (0.7f + pt[2] * 0.3f)))
    }

    private fun drawDunes(c: Canvas, w: Float, h: Float) {
        val hz = horizon(h)
        path.reset(); path.moveTo(0f, hz + 2)
        var x = 0f
        while (x <= w + 10) { path.lineTo(x, hz - h * (0.04f + 0.035f * sin(x / w * 6f + 1f))); x += w / 40f }
        path.lineTo(w, hz + 2); path.close()
        fill(shade(Color.rgb(222, 184, 120), light * 0.9f)); c.drawPath(path, p)
    }

    private fun drawGround(c: Canvas, w: Float, h: Float, s: Setting) {
        val hz = horizon(h)
        val (top, bot) = when (s) {
            Setting.FOREST -> Color.rgb(94, 140, 69) to Color.rgb(47, 90, 42)
            Setting.MOUNTAIN -> Color.rgb(138, 174, 106) to Color.rgb(87, 125, 69)
            Setting.CITY -> Color.rgb(154, 158, 166) to Color.rgb(110, 115, 124)
            Setting.DESERT -> Color.rgb(232, 201, 135) to Color.rgb(201, 161, 94)
            Setting.SEA -> Color.rgb(235, 214, 162) to Color.rgb(217, 185, 122)
            Setting.NONE -> Color.rgb(143, 168, 138) to Color.rgb(95, 122, 92)
            else -> Color.rgb(127, 181, 90) to Color.rgb(78, 138, 58)
        }
        p.style = Paint.Style.FILL
        p.shader = LinearGradient(0f, hz, 0f, h, shade(top, light), shade(bot, light), Shader.TileMode.CLAMP)
        c.drawRect(0f, hz, w, h, p); p.shader = null

        when (s) {
            Setting.SEA -> {
                val shore = h * 0.735f
                p.shader = LinearGradient(0f, hz, 0f, shore, shade(Color.rgb(60, 141, 188), light), shade(Color.rgb(36, 100, 150), light), Shader.TileMode.CLAMP)
                path.reset(); path.moveTo(0f, hz)
                path.lineTo(w, hz)
                var x = w
                while (x >= -10) { path.lineTo(x, shore + sin(x / w * 9f + t * 1.4f) * h * 0.006f); x -= w / 40f }
                path.close(); c.drawPath(path, p); p.shader = null
                stroke(Color.argb(150, 255, 255, 255), h * 0.004f)
                for (i in 0 until 4) {
                    val y = hz + (shore - hz) * (0.2f + i * 0.22f)
                    path.reset(); var xx = 0f; path.moveTo(0f, y)
                    while (xx <= w) { path.lineTo(xx, y + sin(xx / w * 14f + t * (1.2f + i * 0.3f) + i) * h * 0.004f); xx += w / 30f }
                    p.alpha = 70 + i * 20
                    c.drawPath(path, p)
                }
            }
            Setting.RIVER -> {
                val r1 = h * 0.655f; val r2 = h * 0.715f
                fill(shade(Color.rgb(66, 140, 190), light)); c.drawRect(0f, r1, w, r2, p)
                stroke(Color.argb(110, 255, 255, 255), h * 0.003f)
                for (i in 0 until 5) {
                    val x = ((i * 0.23f + t * 0.03f) % 1f) * w
                    val y = r1 + (r2 - r1) * (0.2f + (i % 3) * 0.3f)
                    c.drawLine(x, y, x + w * 0.06f, y, p)
                }
            }
            Setting.CITY -> {
                fill(shade(Color.rgb(70, 74, 82), light)); c.drawRect(0f, h * 0.86f, w, h, p)
                fill(shade(Color.rgb(220, 210, 120), light))
                var x = ((t * 0.0f) % 1f) * w
                while (x < w) { c.drawRect(x, h * 0.925f, x + w * 0.06f, h * 0.932f, p); x += w * 0.12f }
            }
            Setting.FIELD, Setting.FOREST, Setting.MOUNTAIN -> {
                stroke(shade(Color.rgb(60, 110, 45), light), h * 0.004f)
                for (tf in tufts) {
                    val x = tf[0] * w; val y = hz + (h - hz) * (0.1f + tf[1] * 0.9f)
                    val sz = h * 0.012f * (0.6f + tf[1])
                    val sway = sin(t * 1.5f + tf[2] * 6f) * sz * 0.3f
                    c.drawLine(x, y, x - sz * 0.4f + sway, y - sz, p)
                    c.drawLine(x, y, x + sway, y - sz * 1.3f, p)
                    c.drawLine(x, y, x + sz * 0.4f + sway, y - sz, p)
                    if (s == Setting.FIELD && tf[2] > 0.75f) {
                        fill(shade(if (tf[2] > 0.88f) Color.rgb(250, 210, 80) else Color.rgb(240, 120, 150), light))
                        c.drawCircle(x + sway, y - sz * 1.4f, sz * 0.3f, p)
                        stroke(shade(Color.rgb(60, 110, 45), light), h * 0.004f)
                    }
                }
            }
            else -> {}
        }
    }

    private fun drawRoom(c: Canvas, w: Float, h: Float) {
        val floor = h * 0.72f
        p.style = Paint.Style.FILL
        p.shader = LinearGradient(0f, 0f, 0f, floor, shade(Color.rgb(196, 168, 132), light * 0.95f), shade(Color.rgb(160, 130, 96), light * 0.9f), Shader.TileMode.CLAMP)
        c.drawRect(0f, 0f, w, floor, p); p.shader = null
        // window
        val l = w * 0.6f; val tp = h * 0.16f; val r = w * 0.9f; val b = h * 0.46f
        c.save(); c.clipRect(l, tp, r, b)
        drawSky(c, l, tp, r, b); drawCelestial(c, w, h)
        c.restore()
        stroke(shade(Color.rgb(110, 80, 52), light), h * 0.012f)
        c.drawRect(l, tp, r, b, p); c.drawLine((l + r) / 2, tp, (l + r) / 2, b, p); c.drawLine(l, (tp + b) / 2, r, (tp + b) / 2, p)
        // floor boards
        fill(shade(Color.rgb(122, 86, 56), light)); c.drawRect(0f, floor, w, h, p)
        stroke(shade(Color.rgb(96, 66, 42), light), 2f)
        var y = floor + h * 0.04f
        while (y < h) { c.drawLine(0f, y, w, y, p); y += h * 0.05f }
        // lamp glow at night
        if (state.time != TimeOfDay.DAY) {
            val lx = w * 0.42f; val ly = h * 0.12f
            p.style = Paint.Style.FILL
            p.shader = RadialGradient(lx, ly, h * 0.45f, Color.argb(110, 255, 200, 120), Color.TRANSPARENT, Shader.TileMode.CLAMP)
            c.drawCircle(lx, ly, h * 0.45f, p); p.shader = null
            stroke(Color.rgb(60, 50, 40), 3f); c.drawLine(lx, 0f, lx, ly - h * 0.02f, p)
            fill(Color.rgb(255, 220, 150)); c.drawCircle(lx, ly, h * 0.018f, p)
        }
    }

    // ------------------------------------------------------------ props

    private fun treeX(w: Float) = w * 0.5f
    private fun treeBase(h: Float) = h * 0.79f

    private fun drawTreeBase(c: Canvas, w: Float, h: Float) {
        val x = treeX(w); val base = treeBase(h)
        // shadow on the ground
        val shadowA = ((light - 0.45f) * 160).toInt().coerceIn(0, 90)
        fill(Color.argb(shadowA, 0, 0, 0))
        rect.set(x - h * 0.2f, base - h * 0.012f, x + h * 0.2f, base + h * 0.04f)
        c.drawOval(rect, p)
        // trunk
        fill(shade(Color.rgb(104, 72, 44), light))
        path.reset()
        path.moveTo(x - h * 0.025f, base); path.lineTo(x - h * 0.014f, base - h * 0.3f)
        path.lineTo(x + h * 0.014f, base - h * 0.3f); path.lineTo(x + h * 0.025f, base); path.close()
        c.drawPath(path, p)
        stroke(shade(Color.rgb(104, 72, 44), light), h * 0.012f)
        c.drawLine(x, base - h * 0.2f, x - h * 0.07f, base - h * 0.29f, p)
        c.drawLine(x, base - h * 0.22f, x + h * 0.08f, base - h * 0.3f, p)
    }

    private fun drawTreeCanopy(c: Canvas, w: Float, h: Float) {
        val x = treeX(w); val cy = treeBase(h) - h * 0.36f
        val wind = if (state.weather == Weather.STORM) 3f else 1f
        val sway = sin(t * 0.9f * wind) * h * 0.006f * wind
        val r = h * 0.1f
        val dark = shade(Color.rgb(46, 110, 52), light)
        val mid = shade(Color.rgb(64, 140, 66), light)
        fill(dark)
        c.drawCircle(x - r * 0.9f + sway, cy + r * 0.3f, r * 0.85f, p)
        c.drawCircle(x + r * 0.95f + sway, cy + r * 0.3f, r * 0.85f, p)
        c.drawCircle(x + sway, cy + r * 0.45f, r, p)
        fill(mid)
        c.drawCircle(x - r * 0.45f + sway * 1.3f, cy - r * 0.35f, r * 0.9f, p)
        c.drawCircle(x + r * 0.5f + sway * 1.3f, cy - r * 0.3f, r * 0.85f, p)
        c.drawCircle(x + sway * 1.5f, cy - r * 0.85f, r * 0.75f, p)
    }

    private fun drawHouse(c: Canvas, w: Float, h: Float) {
        val x = w * 0.2f; val base = h * 0.75f; val s = h * 0.17f
        fill(shade(Color.rgb(214, 190, 150), light)); c.drawRect(x - s * 0.6f, base - s, x + s * 0.6f, base, p)
        fill(shade(Color.rgb(150, 60, 50), light))
        path.reset(); path.moveTo(x - s * 0.75f, base - s); path.lineTo(x, base - s * 1.6f); path.lineTo(x + s * 0.75f, base - s); path.close()
        c.drawPath(path, p)
        fill(shade(Color.rgb(100, 66, 40), light)); c.drawRect(x - s * 0.13f, base - s * 0.5f, x + s * 0.13f, base, p)
        val lit = state.time != TimeOfDay.DAY
        fill(if (lit) Color.rgb(255, 210, 110) else shade(Color.rgb(150, 190, 220), light))
        c.drawRect(x + s * 0.22f, base - s * 0.75f, x + s * 0.48f, base - s * 0.5f, p)
        c.drawRect(x - s * 0.48f, base - s * 0.75f, x - s * 0.22f, base - s * 0.5f, p)
        if (lit) {
            p.shader = RadialGradient(x, base - s * 0.6f, s, Color.argb(60, 255, 200, 100), Color.TRANSPARENT, Shader.TileMode.CLAMP)
            c.drawCircle(x, base - s * 0.6f, s, p); p.shader = null
        }
    }

    private fun drawFlames(c: Canvas, x: Float, base: Float, s: Float) {
        val glowR = s * (if (state.time == TimeOfDay.DAY) 2.5f else 5f)
        p.style = Paint.Style.FILL
        p.shader = RadialGradient(x, base - s * 0.4f, glowR, Color.argb(120, 255, 150, 60), Color.TRANSPARENT, Shader.TileMode.CLAMP)
        c.drawCircle(x, base - s * 0.4f, glowR, p); p.shader = null
        val colors = intArrayOf(Color.rgb(230, 70, 30), Color.rgb(255, 150, 40), Color.rgb(255, 230, 120))
        for (k in 0..2) {
            val fh = s * (1.3f - k * 0.35f) * (1f + 0.15f * sin(t * (9f + k * 3f) + k))
            val fw = s * (0.55f - k * 0.13f)
            val lean = sin(t * 5f + k) * s * 0.08f
            path.reset()
            path.moveTo(x - fw, base)
            path.quadTo(x - fw * 0.9f, base - fh * 0.5f, x + lean, base - fh)
            path.quadTo(x + fw * 0.9f, base - fh * 0.5f, x + fw, base)
            path.close()
            fill(colors[k]); c.drawPath(path, p)
        }
    }

    private fun drawFire(c: Canvas, w: Float, h: Float) {
        val x = w * 0.74f; val base = h * 0.8f; val s = h * 0.05f
        stroke(shade(Color.rgb(90, 58, 34), light), s * 0.25f)
        c.drawLine(x - s * 0.8f, base, x + s * 0.8f, base - s * 0.2f, p)
        c.drawLine(x - s * 0.8f, base - s * 0.2f, x + s * 0.8f, base, p)
        drawFlames(c, x, base - s * 0.1f, s)
    }

    private fun drawFireplace(c: Canvas, w: Float, h: Float) {
        val x = w * 0.22f; val floor = h * 0.72f; val s = h * 0.16f
        fill(shade(Color.rgb(140, 110, 100), light)); c.drawRect(x - s * 0.8f, floor - s * 1.1f, x + s * 0.8f, floor, p)
        fill(Color.rgb(30, 22, 20)); c.drawRect(x - s * 0.5f, floor - s * 0.7f, x + s * 0.5f, floor, p)
        drawFlames(c, x, floor - s * 0.05f, s * 0.35f)
    }

    private fun drawBoat(c: Canvas, w: Float, h: Float) {
        val x = w * 0.72f + sin(t * 0.2f) * w * 0.05f
        val y = if (shown == Setting.RIVER) h * 0.69f else h * 0.67f
        val bob = sin(t * 1.6f) * h * 0.005f
        val s = h * 0.08f
        fill(shade(Color.rgb(120, 70, 40), light))
        path.reset(); path.moveTo(x - s, y + bob - s * 0.15f); path.lineTo(x + s, y + bob - s * 0.15f)
        path.lineTo(x + s * 0.7f, y + bob + s * 0.2f); path.lineTo(x - s * 0.7f, y + bob + s * 0.2f); path.close()
        c.drawPath(path, p)
        stroke(shade(Color.rgb(80, 50, 30), light), s * 0.05f); c.drawLine(x, y + bob - s * 0.15f, x, y + bob - s * 1.3f, p)
        fill(shade(Color.rgb(240, 236, 220), light))
        path.reset(); path.moveTo(x + s * 0.05f, y + bob - s * 1.25f); path.lineTo(x + s * 0.75f, y + bob - s * 0.25f); path.lineTo(x + s * 0.05f, y + bob - s * 0.25f); path.close()
        c.drawPath(path, p)
    }

    private fun drawCastle(c: Canvas, w: Float, h: Float) {
        val x = w * 0.8f; val base = horizon(h) + h * 0.01f; val s = h * 0.14f
        val stone = shade(Color.rgb(150, 150, 160), light * 0.9f)
        fill(stone)
        c.drawRect(x - s * 0.8f, base - s * 0.7f, x + s * 0.8f, base, p)
        c.drawRect(x - s * 1.05f, base - s * 1.1f, x - s * 0.65f, base, p)
        c.drawRect(x + s * 0.65f, base - s * 1.1f, x + s * 1.05f, base, p)
        c.drawRect(x - s * 0.2f, base - s * 1.4f, x + s * 0.2f, base, p)
        for (tx in floatArrayOf(-1.05f, -0.89f, -0.73f, 0.65f, 0.81f, 0.97f)) c.drawRect(x + tx * s, base - s * 1.2f, x + (tx + 0.08f) * s, base - s * 1.1f, p)
        fill(shade(Color.rgb(60, 50, 50), light)); c.drawRect(x - s * 0.12f, base - s * 0.35f, x + s * 0.12f, base, p)
        stroke(Color.rgb(60, 60, 60), 2f); c.drawLine(x, base - s * 1.4f, x, base - s * 1.75f, p)
        fill(Color.rgb(200, 50, 50))
        val flap = sin(t * 4f) * s * 0.03f
        path.reset(); path.moveTo(x, base - s * 1.75f); path.lineTo(x + s * 0.25f, base - s * 1.68f + flap); path.lineTo(x, base - s * 1.6f); path.close()
        c.drawPath(path, p)
    }

    // ------------------------------------------------------------ weather

    private fun drawWeather(c: Canvas, w: Float, h: Float, dt: Float) {
        when (state.weather) {
            Weather.RAIN, Weather.STORM -> {
                val storm = state.weather == Weather.STORM
                stroke(Color.argb(if (storm) 160 else 120, 200, 215, 235), max(1.5f, h * 0.0022f))
                for (d in drops) {
                    val y = ((d[1] + t * 1.1f * d[2]) % 1f) * h
                    val x = (d[0] * w + y * (if (storm) 0.25f else 0.1f)) % w
                    c.drawLine(x, y, x - h * (if (storm) 0.012f else 0.004f), y + h * 0.03f, p)
                }
                if (storm) {
                    nextFlash -= dt
                    if (nextFlash <= 0f) { flash = 1f; nextFlash = 4f + Random.nextFloat() * 6f }
                    if (flash > 0.01f) {
                        fill(Color.argb((flash * 170).toInt(), 235, 240, 255)); c.drawRect(0f, 0f, w, h, p)
                        flash *= exp(-dt * 6f)
                    }
                }
            }
            Weather.SNOW -> {
                fill(Color.argb(220, 255, 255, 255))
                for (d in drops) {
                    val y = ((d[1] + t * 0.07f * d[2]) % 1f) * h
                    val x = d[0] * w + sin(t * 0.8f + d[2] * 6f) * w * 0.015f
                    c.drawCircle(x, y, h * 0.003f * d[2] + 1.5f, p)
                }
            }
            Weather.FOG -> {
                p.style = Paint.Style.FILL
                for (i in 0 until 3) {
                    val y = h * (0.45f + i * 0.15f)
                    val shift = sin(t * 0.1f + i) * w * 0.1f
                    p.shader = LinearGradient(shift, 0f, w + shift, 0f,
                        intArrayOf(Color.argb(0, 230, 232, 236), Color.argb(130, 230, 232, 236), Color.argb(0, 230, 232, 236)),
                        null, Shader.TileMode.CLAMP)
                    c.drawRect(0f, y - h * 0.08f, w, y + h * 0.08f, p)
                }
                p.shader = null
            }
            Weather.CLEAR -> {}
        }
    }

    // ------------------------------------------------------------ characters

    private fun figureHeight(h: Float, a: Actor) = h * 0.17f * (0.88f + a.depth * 0.22f)
    private fun baseline(h: Float, a: Actor) = ground(h) + a.depth * h * 0.07f

    private fun updateActors(w: Float, h: Float, dt: Float, realDt: Float) {
        for (a in state.actors) {
            val target = if (a.leaving) 0f else 1f
            a.alpha += (target - a.alpha) * (1f - exp(-realDt * 1.8f))

            val walkSpeed = when (a.kind) {
                Kind.OLD -> 0.045f; Kind.CHILD -> 0.065f; Kind.CAT -> 0.05f; Kind.HORSE -> 0.08f; else -> 0.07f
            }
            val speed = when (a.act) {
                Act.WALK -> walkSpeed; Act.RUN -> walkSpeed * 2.8f; Act.RIDE -> 0.17f
                Act.FLY -> if (a.kind == Kind.BIRD) 0.08f else 0f
                Act.SWIM -> 0.025f; else -> 0f
            } * w
            val cadence = when (a.act) { Act.WALK -> 7f; Act.RUN -> 13f; Act.RIDE -> 11f; Act.FLY -> 10f; Act.FIGHT -> 5f; else -> 2f }
            a.phase += dt * cadence

            if (a.act == Act.FIGHT) {
                val foe = state.actors.filter { it !== a && it.act == Act.FIGHT && !it.leaving }.minByOrNull { abs(it.x - a.x) }
                if (foe != null) {
                    a.dir = if (foe.x > a.x) 1f else -1f
                    if (abs(foe.x - a.x) > figureHeight(h, a) * 0.7f) a.x += a.dir * w * 0.05f * dt
                }
            }

            a.x += a.dir * speed * dt
            if (a.kind == Kind.BIRD) {
                if (a.x > w * 1.1f) a.x = -w * 0.1f
                if (a.x < -w * 0.1f) a.x = w * 1.1f
            } else {
                if (a.x > w * 0.93f) { a.x = w * 0.93f; a.dir = -1f }
                if (a.x < w * 0.07f) { a.x = w * 0.07f; a.dir = 1f }
            }
        }
    }

    private fun personColor(k: Kind) = when (k) {
        Kind.WOMAN -> Color.rgb(142, 59, 94)
        Kind.CHILD -> Color.rgb(63, 125, 90)
        Kind.OLD -> Color.rgb(94, 90, 85)
        Kind.KING -> Color.rgb(106, 61, 154)
        Kind.QUEEN -> Color.rgb(162, 59, 114)
        Kind.SOLDIER -> Color.rgb(85, 95, 107)
        else -> Color.rgb(47, 58, 79)
    }

    private fun drawActor(c: Canvas, a: Actor, w: Float, h: Float) {
        val swimming = a.act == Act.SWIM && (shown == Setting.SEA || shown == Setting.RIVER)
        val by = when {
            swimming && shown == Setting.SEA -> h * 0.69f
            swimming -> h * 0.69f
            else -> baseline(h, a)
        }
        val H = figureHeight(h, a)
        c.save()
        c.translate(a.x, by)
        if (a.dir < 0) c.scale(-1f, 1f)
        if (!swimming && a.act != Act.SLEEP) {
            fill(Color.argb(((light - 0.3f) * 90).toInt().coerceIn(0, 60), 0, 0, 0))
            rect.set(-H * 0.2f, -H * 0.02f, H * 0.2f, H * 0.03f); c.drawOval(rect, p)
        }
        if (a.kind.humanoid) {
            when {
                swimming -> drawSwimmer(c, a, H)
                a.act == Act.RIDE -> { drawQuadruped(c, Kind.HORSE, H, a.phase, true); drawRider(c, a, H) }
                a.act == Act.SIT -> drawSitter(c, a, H)
                a.act == Act.SLEEP -> drawSleeper(c, a, H)
                else -> drawPerson(c, a, H)
            }
        } else {
            val moving = a.act == Act.WALK || a.act == Act.RUN
            drawQuadruped(c, a.kind, H, a.phase, moving)
        }
        c.restore()
    }

    private fun kindScale(k: Kind) = when (k) { Kind.CHILD -> 0.62f; Kind.OLD -> 0.93f; else -> 1f }

    private fun limb(c: Canvas, x: Float, y: Float, a1: Float, l1: Float, a2: Float, l2: Float) {
        val kx = x + sin(a1) * l1; val ky = y + cos(a1) * l1
        c.drawLine(x, y, kx, ky, p)
        c.drawLine(kx, ky, kx + sin(a2) * l2, ky + cos(a2) * l2, p)
    }

    private fun accessories(c: Canvas, k: Kind, hx: Float, hy: Float, hr: Float, H: Float, handX: Float, handY: Float) {
        when (k) {
            Kind.KING, Kind.QUEEN -> {
                fill(Color.rgb(240, 196, 60))
                path.reset()
                path.moveTo(hx - hr * 0.8f, hy - hr * 0.7f); path.lineTo(hx - hr * 0.8f, hy - hr * 1.5f)
                path.lineTo(hx - hr * 0.4f, hy - hr * 1.1f); path.lineTo(hx, hy - hr * 1.7f)
                path.lineTo(hx + hr * 0.4f, hy - hr * 1.1f); path.lineTo(hx + hr * 0.8f, hy - hr * 1.5f)
                path.lineTo(hx + hr * 0.8f, hy - hr * 0.7f); path.close()
                c.drawPath(path, p)
            }
            Kind.SOLDIER -> {
                fill(shade(Color.rgb(160, 165, 172), light))
                rect.set(hx - hr * 1.1f, hy - hr * 1.2f, hx + hr * 1.1f, hy + hr * 0.4f)
                c.drawArc(rect, 180f, 180f, true, p)
                stroke(shade(Color.rgb(110, 80, 50), light), H * 0.025f)
                c.drawLine(handX, handY + H * 0.25f, handX, handY - H * 0.55f, p)
                fill(shade(Color.rgb(190, 190, 200), light))
                path.reset(); path.moveTo(handX, handY - H * 0.7f); path.lineTo(handX - H * 0.03f, handY - H * 0.55f); path.lineTo(handX + H * 0.03f, handY - H * 0.55f); path.close()
                c.drawPath(path, p)
            }
            Kind.OLD -> {
                stroke(shade(Color.rgb(110, 80, 50), light), H * 0.025f)
                c.drawLine(handX, handY, handX + H * 0.04f, 0f, p)
            }
            else -> {}
        }
    }

    private fun drawPerson(c: Canvas, a: Actor, H0: Float) {
        val k = a.kind
        val H = H0 * kindScale(k)
        val col = shade(personColor(k), 0.55f + 0.45f * light)
        val walking = a.act == Act.WALK || a.act == Act.RUN
        val run = a.act == Act.RUN
        val ph = a.phase
        val swing = when { run -> sin(ph) * 0.9f; walking -> sin(ph) * (if (k == Kind.OLD) 0.3f else 0.5f); else -> 0f }
        val bob = if (walking) -abs(cos(ph)) * H * (if (run) 0.04f else 0.02f) else sin(ph * 0.5f) * H * 0.006f
        val lean = when { run -> H * 0.08f; k == Kind.OLD -> H * 0.07f; else -> 0f }
        val hipY = -H * 0.47f + bob
        val shX = lean; val shY = -H * 0.8f + bob
        val seg = H * 0.24f

        stroke(col, H * 0.075f)
        // legs (back leg bends at the knee)
        limb(c, 0f, hipY, swing, seg, if (swing < 0) swing * 1.8f else swing * 0.3f, seg)
        limb(c, 0f, hipY, -swing, seg, if (-swing < 0) -swing * 1.8f else -swing * 0.3f, seg)

        if (k == Kind.WOMAN || k == Kind.QUEEN) {
            fill(col)
            path.reset()
            path.moveTo(shX - H * 0.06f, shY + H * 0.02f); path.lineTo(shX + H * 0.06f, shY + H * 0.02f)
            path.lineTo(H * 0.17f, hipY + H * 0.14f); path.lineTo(-H * 0.17f, hipY + H * 0.14f); path.close()
            c.drawPath(path, p)
            stroke(col, H * 0.075f)
        } else {
            c.drawLine(0f, hipY, shX, shY, p)
        }

        val arm = H * 0.17f
        var handX: Float; var handY: Float
        if (a.act == Act.FIGHT) {
            val up = -2.2f + (sin(ph * 2f) * 0.5f + 0.5f) * 1.9f   // swinging the sword
            limb(c, shX, shY, -0.4f, arm, -0.2f, arm)
            val ex = shX + sin(up) * arm; val ey = shY + cos(up) * arm
            c.drawLine(shX, shY, ex, ey, p)
            handX = ex + sin(up + 0.4f) * arm; handY = ey + cos(up + 0.4f) * arm
            c.drawLine(ex, ey, handX, handY, p)
            stroke(Color.rgb(210, 214, 222), H * 0.03f)
            c.drawLine(handX, handY, handX + sin(up + 0.6f) * H * 0.4f, handY + cos(up + 0.6f) * H * 0.4f, p)
            stroke(col, H * 0.075f)
        } else {
            val armA = -swing * 0.8f
            limb(c, shX, shY, -armA, arm, -armA + 0.35f, arm)
            limb(c, shX, shY, armA, arm, armA + 0.35f, arm)
            handX = shX + sin(armA) * arm + sin(armA + 0.35f) * arm
            handY = shY + cos(armA) * arm + cos(armA + 0.35f) * arm
            if (k == Kind.OLD) { handX = shX + H * 0.14f; handY = shY + H * 0.3f; c.drawLine(shX, shY, handX, handY, p) }
        }

        val hr = H * 0.095f
        val hx = shX + lean * 0.4f; val hy = shY - H * 0.12f
        fill(col); c.drawCircle(hx, hy, hr, p)
        if (k == Kind.WOMAN || k == Kind.QUEEN) {   // hair
            rect.set(hx - hr * 1.15f, hy - hr * 1.1f, hx + hr * 0.9f, hy + hr * 1.6f)
            c.drawArc(rect, 90f, 180f, true, p)
        }
        accessories(c, k, hx, hy, hr, H, handX, handY)
    }

    private fun drawSitter(c: Canvas, a: Actor, H0: Float) {
        val H = H0 * kindScale(a.kind)
        val col = shade(personColor(a.kind), 0.55f + 0.45f * light)
        // a log / stone to sit on
        fill(shade(Color.rgb(110, 84, 60), light))
        rect.set(-H * 0.18f, -H * 0.22f, H * 0.12f, 0f); c.drawRoundRect(rect, H * 0.04f, H * 0.04f, p)
        stroke(col, H * 0.075f)
        val hipY = -H * 0.25f
        c.drawLine(0f, hipY, H * 0.22f, hipY, p); c.drawLine(H * 0.22f, hipY, H * 0.24f, 0f, p)
        val breathe = sin(a.phase) * H * 0.006f
        val shY = -H * 0.58f + breathe
        c.drawLine(0f, hipY, 0f, shY, p)
        limb(c, 0f, shY, 0.3f, H * 0.17f, 1.4f, H * 0.15f)
        val hr = H * 0.095f
        fill(col); c.drawCircle(H * 0.01f, shY - H * 0.12f, hr, p)
        accessories(c, a.kind, H * 0.01f, shY - H * 0.12f, hr, H, H * 0.25f, hipY)
    }

    private fun drawSleeper(c: Canvas, a: Actor, H0: Float) {
        val H = H0 * kindScale(a.kind)
        val col = shade(personColor(a.kind), 0.55f + 0.45f * light)
        fill(shade(Color.rgb(170, 90, 80), light))   // blanket
        rect.set(-H * 0.45f, -H * 0.13f, H * 0.32f, 0f); c.drawRoundRect(rect, H * 0.06f, H * 0.06f, p)
        fill(col); c.drawCircle(H * 0.42f, -H * 0.08f, H * 0.09f, p)
        p.textSize = H * 0.13f
        for (i in 0..2) {
            val f = ((a.phase * 0.25f + i / 3f) % 1f)
            fill(Color.argb(((1f - f) * 220).toInt(), 255, 255, 255))
            c.drawText("z", H * 0.5f + f * H * 0.25f, -H * 0.2f - f * H * 0.45f, p)
        }
    }

    private fun drawSwimmer(c: Canvas, a: Actor, H0: Float) {
        val H = H0 * kindScale(a.kind)
        val col = shade(personColor(a.kind), 0.55f + 0.45f * light)
        stroke(Color.argb(140, 255, 255, 255), H * 0.02f)
        rect.set(-H * 0.25f, -H * 0.03f, H * 0.25f, H * 0.04f); c.drawOval(rect, p)
        stroke(col, H * 0.07f)
        val s = a.phase
        c.drawLine(0f, 0f, sin(s) * H * 0.25f, -abs(cos(s)) * H * 0.2f, p)
        fill(col); c.drawCircle(H * 0.06f, -H * 0.07f, H * 0.09f, p)
    }

    private fun drawRider(c: Canvas, a: Actor, H0: Float) {
        val H = H0 * kindScale(a.kind)
        val col = shade(personColor(a.kind), 0.55f + 0.45f * light)
        val bounce = -abs(sin(a.phase)) * H * 0.03f
        val hipY = -H * 0.66f + bounce
        stroke(col, H * 0.075f)
        c.drawLine(0f, hipY, H * 0.08f, hipY + H * 0.2f, p); c.drawLine(H * 0.08f, hipY + H * 0.2f, H * 0.02f, hipY + H * 0.33f, p)
        val shX = H * 0.06f; val shY = hipY - H * 0.33f
        c.drawLine(0f, hipY, shX, shY, p)
        limb(c, shX, shY, 0.7f, H * 0.16f, 1.6f, H * 0.14f)
        val hr = H * 0.095f
        fill(col); c.drawCircle(shX + H * 0.02f, shY - H * 0.12f, hr, p)
        accessories(c, a.kind, shX + H * 0.02f, shY - H * 0.12f, hr, H, shX + H * 0.28f, shY + H * 0.1f)
    }

    private fun drawQuadruped(c: Canvas, k: Kind, H: Float, ph: Float, moving: Boolean) {
        val (len, legLen, color) = when (k) {
            Kind.HORSE -> Triple(H * 0.8f, H * 0.42f, Color.rgb(110, 75, 42))
            Kind.WOLF -> Triple(H * 0.48f, H * 0.2f, Color.rgb(107, 111, 120))
            Kind.CAT -> Triple(H * 0.28f, H * 0.12f, Color.rgb(70, 70, 76))
            else -> Triple(H * 0.4f, H * 0.17f, Color.rgb(139, 90, 43))
        }
        val col = shade(color, 0.55f + 0.45f * light)
        val bodyH = len * (if (k == Kind.HORSE) 0.32f else 0.36f)
        val by = -legLen - bodyH * 0.35f + (if (moving) -abs(sin(ph)) * H * 0.012f else 0f)
        val sw = if (moving) sin(ph) * 0.55f else 0f

        stroke(col, len * (if (k == Kind.HORSE) 0.07f else 0.09f))
        val legTop = by + bodyH * 0.2f
        for ((i, lx) in floatArrayOf(-len * 0.34f, -len * 0.24f, len * 0.26f, len * 0.36f).withIndex()) {
            val ang = if (i % 2 == 0) sw else -sw
            val lt = -legTop
            c.drawLine(lx, legTop, lx + sin(ang) * lt, legTop + cos(ang) * lt, p)
        }
        // tail
        val wag = sin(ph * (if (moving) 1f else 3f)) * len * 0.06f
        c.drawLine(-len * 0.48f, by - bodyH * 0.1f, -len * 0.68f, by + (if (k == Kind.HORSE) bodyH * 0.6f else -bodyH * 0.8f) + wag, p)

        fill(col)
        rect.set(-len * 0.5f, by - bodyH / 2, len * 0.5f, by + bodyH / 2); c.drawOval(rect, p)
        if (k == Kind.HORSE) {
            stroke(col, len * 0.13f)
            c.drawLine(len * 0.4f, by - bodyH * 0.2f, len * 0.56f, by - bodyH * 1.3f, p)
            fill(col)
            rect.set(len * 0.5f, by - bodyH * 1.55f, len * 0.78f, by - bodyH * 1.1f); c.drawOval(rect, p)
            stroke(shade(Color.rgb(50, 32, 20), light), len * 0.04f)
            c.drawLine(len * 0.42f, by - bodyH * 0.5f, len * 0.53f, by - bodyH * 1.4f, p)
        } else {
            val hr = bodyH * 0.55f
            val hx = len * 0.55f; val hy = by - bodyH * 0.55f
            c.drawCircle(hx, hy, hr, p)
            rect.set(hx, hy - hr * 0.2f, hx + hr * 1.3f, hy + hr * 0.5f); c.drawOval(rect, p)
            path.reset(); path.moveTo(hx - hr * 0.6f, hy - hr * 0.5f); path.lineTo(hx - hr * 0.2f, hy - hr * 1.6f); path.lineTo(hx + hr * 0.2f, hy - hr * 0.6f); path.close()
            c.drawPath(path, p)
        }
    }

    private fun drawBird(c: Canvas, a: Actor, w: Float, h: Float) {
        val x = a.x; val y = a.y * h + sin(a.phase * 0.3f) * h * 0.01f
        val s = h * 0.022f
        val flap = sin(a.phase) * 0.8f
        stroke(shade(Color.rgb(40, 40, 50), max(light, 0.7f)), max(2f, s * 0.18f))
        val d = a.dir
        path.reset()
        path.moveTo(x - s * d, y - flap * s)
        path.quadTo(x - s * 0.4f * d, y - flap * s * 0.3f - s * 0.2f, x, y)
        path.quadTo(x + s * 0.4f * d, y - flap * s * 0.3f - s * 0.2f, x + s * d, y - flap * s)
        c.drawPath(path, p)
    }
}
