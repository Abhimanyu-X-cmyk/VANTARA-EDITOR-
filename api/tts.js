export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { text, language_code, speaker, pace } = req.body || {};

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "SARVAM_API_KEY is missing"
      });
    }

    const response = await fetch(
      "https://api.sarvam.ai/text-to-speech",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-subscription-key": apiKey
        },
        body: JSON.stringify({
          text,
          target_language_code: language_code || "hi-IN",
          speaker: speaker || "shubh",
          model: "bulbul:v3",
          pace: Number(pace) || 1
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({
      error: "TTS service error",
      details: error.message
    });
  }
}