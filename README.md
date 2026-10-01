# VANTARA EDITOR — OpenAI API V1

Replace `index.html` and `app.js`, and put `api/tts.js` in the `api` folder.

Keep your existing `style.css`.

## Vercel
Add Environment Variable:

OPENAI_API_KEY

Never put the API key in GitHub or frontend code.

This build uses OpenAI's `gpt-4o-mini-tts` speech endpoint, generates WAV audio, automatically splits long scripts, and merges the returned WAV parts into one downloadable file.

API access/billing is separate from ChatGPT. A parent/guardian should manage the API account and billing for a minor user.
