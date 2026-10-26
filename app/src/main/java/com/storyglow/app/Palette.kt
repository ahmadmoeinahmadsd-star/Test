package com.storyglow.app

import android.graphics.Bitmap
import android.graphics.Color

/** Pulls three vivid colours out of a book cover (no library needed). */
object CoverPalette {

    val DEFAULT = intArrayOf(
        Color.rgb(108, 92, 231),  // violet
        Color.rgb(46, 196, 182),  // teal
        Color.rgb(255, 184, 107), // amber
    )

    fun from(src: Bitmap?): IntArray {
        if (src == null) return DEFAULT
        return try {
            val bmp = if (src.config == Bitmap.Config.HARDWARE) src.copy(Bitmap.Config.ARGB_8888, false) else src
            val small = Bitmap.createScaledBitmap(bmp, 24, 24, true)
            val buckets = 12
            val weight = FloatArray(buckets)
            val r = FloatArray(buckets); val g = FloatArray(buckets); val b = FloatArray(buckets)
            val hsv = FloatArray(3)
            for (y in 0 until small.height) for (x in 0 until small.width) {
                val p = small.getPixel(x, y)
                Color.colorToHSV(p, hsv)
                if (hsv[1] < 0.18f || hsv[2] < 0.15f) continue
                val i = (hsv[0] / (360f / buckets)).toInt().coerceIn(0, buckets - 1)
                val w = hsv[1] * hsv[2]
                weight[i] += w
                r[i] += Color.red(p) * w; g[i] += Color.green(p) * w; b[i] += Color.blue(p) * w
            }
            val order = (0 until buckets).filter { weight[it] > 0f }.sortedByDescending { weight[it] }
            val picked = order.take(3).map { i ->
                vivid(Color.rgb((r[i] / weight[i]).toInt(), (g[i] / weight[i]).toInt(), (b[i] / weight[i]).toInt()))
            }.toMutableList()

            if (picked.isEmpty()) {
                // Black & white cover: use a soft monochrome-blue scheme
                return intArrayOf(Color.rgb(120, 140, 200), Color.rgb(180, 190, 220), Color.rgb(90, 100, 160))
            }
            while (picked.size < 3) picked.add(shiftHue(picked[0], 40f * picked.size))
            picked.toIntArray()
        } catch (_: Throwable) {
            DEFAULT
        }
    }

    private fun vivid(c: Int): Int {
        val hsv = FloatArray(3)
        Color.colorToHSV(c, hsv)
        hsv[1] = hsv[1].coerceAtLeast(0.45f)
        hsv[2] = hsv[2].coerceAtLeast(0.8f)
        return Color.HSVToColor(hsv)
    }

    private fun shiftHue(c: Int, deg: Float): Int {
        val hsv = FloatArray(3)
        Color.colorToHSV(c, hsv)
        hsv[0] = (hsv[0] + deg) % 360f
        return Color.HSVToColor(hsv)
    }
}
