# StoryGlow — ambient visuals for Audible

A small Android app that shows a calm full-screen animation while you listen to an
audiobook in Audible. It follows what Audible is playing (book, chapter, author,
cover, position), colours the animation from the book cover, and lets you
play/pause and skip ±30 s without switching apps.

## Scenes
- **Aurora** – flowing ribbons of light
- **Embers** – drifting glowing particles
- **Cover** – the book cover breathing inside orbiting halos

Motion speeds up while the book plays and settles when paused. With **Voice sync**
on, it pulses with the narrator's voice.

## Get the APK (no Android Studio needed)
1. Create a new GitHub repo and upload this folder's contents (keep `.github/`).
2. Open the repo's **Actions** tab → "Build StoryGlow APK" runs automatically
   (or click *Run workflow*). Takes ~4 minutes.
3. Open the finished run → **Artifacts** → download `StoryGlow-apk` (a zip with `app-debug.apk`).
4. Copy the APK to your phone, open it, allow "install unknown apps".

Or open the folder in Android Studio and press Run.

## First run
1. Tap **Grant access** and switch StoryGlow on in Notification Access.
   - Android 13+ may say *Restricted setting*: tap **App info** → ⋮ menu →
     **Allow restricted settings**, then grant access again.
2. Start a book in Audible, come back to StoryGlow.

## Using it
- Tap the screen: show/hide controls (they auto-hide after 6 s while playing)
- Long-press, or **✦ Scene**: switch scene
- **Voice sync**: asks for microphone permission to read the phone's audio output
  level. Nothing is recorded. Some phones block this; the app falls back to a
  built-in rhythm.
- **Audible only / Any player**: follow other apps (Spotify, podcasts) too
- Screen stays on while StoryGlow is open.

## How the Audible link works
Audible has no public SDK, so StoryGlow uses Android's standard media-session
API — the same one lock-screen and car controls use. That gives title, chapter,
author, cover art, duration, position, and play/pause/seek. It cannot see the
book's text.

## Files
- `AudibleWatcher.kt` – finds and follows Audible's media session, sends controls
- `StoryView.kt` – the three animated scenes (Canvas, no libraries)
- `AudioTap.kt` – optional voice-level reading via `Visualizer`
- `Palette.kt` – picks three colours from the cover
- `MainActivity.kt` – screen, controls, setup card

## Story mode (draws what the narrator says)
Tap **Story mode** under the play controls. While the book plays, StoryGlow listens
through the microphone, turns the narration into text on the phone, and draws a
simple animated scene from the words it recognises:
- **Places**: field, forest, sea/beach, mountains, city, desert, river, indoors
- **Things**: tree (people walk under it), house, fire, boat, castle
- **Time & weather**: day, sunset, night (moon & stars), rain, storm, snow, fog
- **Characters**: man, woman, child, old man, king, queen, soldier, dog, cat, horse, birds, wolf
- **Actions**: walk, run, sit, sleep, ride, fly, swim, fight

Play Audible through the phone speaker; with headphones the mic can't hear the book.
The last sentence heard and the words it reacted to appear on screen.
