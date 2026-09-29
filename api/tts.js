export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {
    const apiKey =
      process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return res.status(500).json({
        error: "SARVAM_API_KEY is missing"
      });
    }

    const {
      text,
      language_code = "hi-IN",
      speaker = "shubh",
      pace = 1
    } = req.body || {};

    if (!text || !text.trim()) {
      return res.status(400).json({
        error: "Text is required"
      });
    }

    const response =
      await fetch(
        "https://api.sarvam.ai/text-to-speech",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            "api-subscription-key":
              apiKey
          },

          body: JSON.stringify({
            inputs: [
              text.trim()
            ],

            target_language_code:
              language_code,

            speaker:
              speaker,

            pace:
              Number(pace),

            model:
              "bulbul:v3"
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      return res.status(
        response.status
      ).json({
        error:
          data?.error ||
          "TTS generation failed",
        details:
          data
      });
    }

    return res.status(200).json({
      audio:
        data.audios?.[0] || null
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error:
        "Voiceover generation failed",
      details:
        error.message
    });
  }
}