module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({
      error: "OPENAI_API_KEY is missing in Vercel."
    });
  }

  try {
    const {
      text,
      voice = "coral",
      speed = 1,
      instructions = ""
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Text is required."
      });
    }

    if (text.length > 4096) {
      return res.status(422).json({
        error: "Text chunk is too long."
      });
    }

    const response = await fetch(
      "https://api.openai.com/v1/audio/speech",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },

        body: JSON.stringify({
          model: "gpt-4o-mini-tts",
          input: text.trim(),
          voice: voice,
          response_format: "wav",
          speed: Number(speed) || 1,
          instructions: instructions || undefined
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();

      let message = errorText;

      try {
        const parsed = JSON.parse(errorText);
        message =
          parsed?.error?.message ||
          errorText;
      } catch (_) {}

      return res.status(response.status).json({
        error: message
      });
    }

    const audioBuffer =
      await response.arrayBuffer();

    const base64Audio =
      Buffer.from(audioBuffer).toString("base64");

    return res.status(200).json({
      audio: base64Audio,
      format: "wav"
    });

  } catch (error) {

    console.error(
      "OpenAI TTS Error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "OpenAI TTS generation failed."
    });
  }
};