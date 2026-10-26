package com.storyglow.app

import android.os.SystemClock
import kotlin.random.Random

enum class Setting { NONE, FIELD, FOREST, SEA, MOUNTAIN, CITY, DESERT, RIVER, ROOM }
enum class Prop { TREE, HOUSE, FIRE, BOAT, CASTLE }
enum class TimeOfDay { DAY, SUNSET, NIGHT }
enum class Weather { CLEAR, RAIN, STORM, SNOW, FOG }
enum class Kind(val humanoid: Boolean) {
    MAN(true), WOMAN(true), CHILD(true), OLD(true), KING(true), QUEEN(true), SOLDIER(true),
    DOG(false), CAT(false), HORSE(false), BIRD(false), WOLF(false)
}
enum class Act { STAND, WALK, RUN, SIT, SLEEP, RIDE, FLY, SWIM, FIGHT }

class Actor(val kind: Kind, var x: Float, val depth: Float) {
    var act = if (kind == Kind.BIRD) Act.FLY else Act.STAND
    var dir = if (Random.nextBoolean()) 1f else -1f
    var lastSeen = SystemClock.elapsedRealtime()
    var alpha = 0f
    var phase = Random.nextFloat() * 6.28f
    var leaving = false
    var y = 0.2f + Random.nextFloat() * 0.2f   // used by birds (fraction of height)
}

/**
 * Keeps the current scene and updates it from narration text using a word list.
 * Deliberately simple and offline: it recognises common story words, not full sentences.
 */
class SceneState {
    var setting = Setting.NONE; private set
    var time = TimeOfDay.DAY; private set
    var weather = Weather.CLEAR; private set
    val props = HashMap<Prop, Long>()
    val actors = ArrayList<Actor>()
    /** Words that changed the scene recently, shown as little tags. */
    var lastKeywords: List<String> = emptyList(); private set

    private var weatherSeen = 0L
    private var lastHumanoid: Actor? = null

    private val settingWords = mapOf(
        Setting.FOREST to "forest forests woods jungle grove thicket",
        Setting.SEA to "sea seas ocean beach shore waves coast harbor harbour sailed sailing ship ships island",
        Setting.MOUNTAIN to "mountain mountains hill hills cliff cliffs peak valley slope",
        Setting.CITY to "city town street streets market alley building buildings tower square avenue",
        Setting.DESERT to "desert sand sands dune dunes oasis",
        Setting.FIELD to "field fields meadow garden grass farm path road countryside park",
        Setting.RIVER to "river lake stream pond bridge creek riverbank",
        Setting.ROOM to "room kitchen bedroom hall office library inside indoors bed table chair corridor",
    ).toLookup()

    private val propWords = mapOf(
        Prop.TREE to "tree trees oak branch branches leaves willow pine",
        Prop.HOUSE to "house houses home cottage cabin hut village farmhouse",
        Prop.FIRE to "fire fires flames flame campfire fireplace burning burned blaze",
        Prop.BOAT to "boat boats ship ships sailed canoe",
        Prop.CASTLE to "castle palace fortress kingdom throne",
    ).toLookup()

    private val timeWords = mapOf(
        TimeOfDay.NIGHT to "night midnight dark darkness moon moonlight stars starlight tonight",
        TimeOfDay.SUNSET to "sunset dusk evening twilight dawn sunrise",
        TimeOfDay.DAY to "morning noon day daylight sunshine sunlight afternoon sunny",
    ).toLookup()

    private val weatherWords = mapOf(
        Weather.RAIN to "rain raining rained rainy drizzle wet",
        Weather.STORM to "storm stormy thunder lightning thunderstorm",
        Weather.SNOW to "snow snowing snowed snowy winter frozen frost",
        Weather.FOG to "fog foggy mist misty haze",
        Weather.CLEAR to "clear sunny",
    ).toLookup()

    private val kindWords = mapOf(
        Kind.MAN to "man men gentleman stranger guy father husband brother uncle sir mister farmer hunter",
        Kind.WOMAN to "woman women lady mother wife sister aunt madam",
        Kind.CHILD to "child children kid kids boy boys girl girls baby son daughter",
        Kind.OLD to "grandfather grandmother grandpa grandma wizard elder",
        Kind.KING to "king prince lord emperor",
        Kind.QUEEN to "queen princess",
        Kind.SOLDIER to "soldier soldiers knight knights guard guards warrior warriors army",
        Kind.DOG to "dog dogs puppy hound",
        Kind.CAT to "cat cats kitten",
        Kind.HORSE to "horse horses stallion mare",
        Kind.BIRD to "bird birds crow crows eagle owl raven sparrow",
        Kind.WOLF to "wolf wolves fox",
    ).toLookup()

    private val plurals = setOf(
        "men", "women", "children", "kids", "boys", "girls", "soldiers", "knights", "guards",
        "warriors", "army", "dogs", "cats", "horses", "birds", "crows", "wolves",
    )

    private val actWords = mapOf(
        Act.WALK to "walk walked walking walks strolled wandered stepped went came approached crossed followed headed moved marched",
        Act.RUN to "run ran running runs rushed raced fled chased hurried sprinted escaped dashed",
        Act.SIT to "sit sat sitting seated rested knelt kneeling",
        Act.SLEEP to "sleep slept sleeping asleep lay lying dreamed dreaming",
        Act.STAND to "stood standing waited stopped paused watched stared",
        Act.RIDE to "rode ride riding galloped",
        Act.FLY to "flew fly flying soared",
        Act.SWIM to "swam swim swimming",
        Act.FIGHT to "fight fought fighting struck attacked battle sword swords",
    ).toLookup()

    private fun <T> Map<T, String>.toLookup(): Map<String, T> {
        val m = HashMap<String, T>()
        for ((k, v) in this) for (w in v.split(" ")) m[w] = k
        return m
    }

    fun update(text: String, width: Float) {
        val now = SystemClock.elapsedRealtime()
        val words = text.lowercase().split(Regex("[^a-z']+")).filter { it.isNotEmpty() }
        val hits = ArrayList<String>()
        var sentenceActor: Actor? = null

        for ((i, w) in words.withIndex()) {
            settingWords[w]?.let {
                if (setting != it) { setting = it; hits.add(w) }
            }
            propWords[w]?.let {
                if (!props.containsKey(it)) hits.add(w)
                props[it] = now
                if (setting == Setting.NONE && (it == Prop.TREE || it == Prop.HOUSE)) setting = Setting.FIELD
                if (it == Prop.BOAT && setting != Setting.RIVER) setting = Setting.SEA
            }
            timeWords[w]?.let { if (time != it) { time = it; hits.add(w) } }
            weatherWords[w]?.let {
                if (weather != it) hits.add(w)
                weather = it; weatherSeen = now
            }

            var kind = kindWords[w]
            if (kind == Kind.MAN && i > 0 && words[i - 1] == "old") kind = Kind.OLD
            if (kind == Kind.WOMAN && i > 0 && words[i - 1] == "old") kind = Kind.OLD
            if (kind != null) {
                val a = mention(kind, if (w in plurals) 3 else 1, width, now, hits, w)
                sentenceActor = a
                if (a.kind.humanoid) lastHumanoid = a
            }

            val act = actWords[w]
            if (act != null) {
                if (act == Act.RIDE) mention(Kind.HORSE, 1, width, now, hits, "horse")
                val target = when {
                    act == Act.FLY -> sentenceActor?.takeIf { it.kind == Kind.BIRD }
                        ?: mention(Kind.BIRD, 3, width, now, hits, "birds")
                    sentenceActor != null && sentenceActor.kind != Kind.BIRD -> sentenceActor
                    else -> pronounActor(words, now, width, hits)
                }
                if (target.act != act) hits.add(w)
                // plural groups act together
                for (a in actors) if (a.kind == target.kind && !a.leaving) a.act = act
                target.act = act
                target.lastSeen = now
                if (act == Act.SWIM && setting != Setting.SEA && setting != Setting.RIVER) setting = Setting.RIVER
            }
        }
        if (hits.isNotEmpty()) lastKeywords = hits.distinct().takeLast(4)
    }

    /** "He walked…" → reuse the last person, or create one from the pronoun. */
    private fun pronounActor(words: List<String>, now: Long, width: Float, hits: MutableList<String>): Actor {
        lastHumanoid?.takeIf { it in actors && !it.leaving }?.let { return it }
        val kind = when {
            words.any { it == "she" || it == "her" } -> Kind.WOMAN
            words.any { it == "they" || it == "we" } -> Kind.MAN
            else -> Kind.MAN
        }
        val a = mention(kind, 1, width, now, hits, if (kind == Kind.WOMAN) "she" else "he")
        lastHumanoid = a
        return a
    }

    private fun mention(kind: Kind, count: Int, width: Float, now: Long, hits: MutableList<String>, word: String): Actor {
        val existing = actors.filter { it.kind == kind && !it.leaving }
        existing.forEach { it.lastSeen = now }
        var first = existing.firstOrNull()
        val toAdd = (count - existing.size).coerceAtLeast(0)
        if (toAdd > 0) {
            hits.add(word)
            repeat(toAdd) { n ->
                // keep the stage readable: at most 6 figures
                if (actors.count { !it.leaving } >= 6) {
                    actors.filter { !it.leaving }.minByOrNull { it.lastSeen }?.leaving = true
                }
                val x = width * (0.15f + Random.nextFloat() * 0.7f) + n * width * 0.06f
                val a = Actor(kind, x, Random.nextFloat())
                if (kind == Kind.BIRD) a.x = Random.nextFloat() * width
                actors.add(a)
                if (first == null) first = a
            }
        }
        return first!!
    }

    /** Ages out things nobody has mentioned for a while. */
    fun expire() {
        val now = SystemClock.elapsedRealtime()
        for (a in actors) if (now - a.lastSeen > 45_000) a.leaving = true
        actors.removeAll { it.leaving && it.alpha <= 0.01f }
        props.entries.removeAll { now - it.value > 120_000 }
        if (weather != Weather.CLEAR && now - weatherSeen > 90_000) weather = Weather.CLEAR
    }

    fun clear() {
        setting = Setting.NONE; time = TimeOfDay.DAY; weather = Weather.CLEAR
        props.clear(); actors.forEach { it.leaving = true }; lastKeywords = emptyList()
    }
}
