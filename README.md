# VANTARA EDITOR — Sarvam API Voiceover Build

1. Upload `index.html`, `app.js`, and `api/tts.js` to your Vercel project.
2. In Vercel → Settings → Environment Variables add `SARVAM_API_KEY` with the Sarvam key.
3. Redeploy.
4. Paste a script, choose Hindi/Hinglish, voice and pace, then Generate.

The editor splits long scripts below Sarvam Bulbul V3's 2,500-character REST limit, generates each WAV part, and joins them into one downloadable WAV.

Never put the API key in frontend code or GitHub. A parent/guardian should manage the Sarvam account/key for a minor user.
