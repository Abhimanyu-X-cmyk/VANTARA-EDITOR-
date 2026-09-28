/* =========================================================
   VANTARA EDITOR V2
   TTS API BACKEND
   File: api/tts.js
========================================================= */


/* =========================================================
   CONFIGURATION
========================================================= */

const SARVAM_API_URL =
  "https://api.sarvam.ai/text-to-speech";

const DEFAULT_LANGUAGE =
  "hi-IN";

const DEFAULT_SPEAKER =
  "shubh";

const DEFAULT_PACE =
  1;


/* =========================================================
   ALLOWED LANGUAGES
========================================================= */

const ALLOWED_LANGUAGES = [
  "hi-IN",
  "en-IN"
];


/* =========================================================
   ALLOWED SPEAKERS
========================================================= */

const ALLOWED_SPEAKERS = [

  "shubh",
  "aditya",
  "rahul",
  "rohan",
  "amit",
  "dev",
  "ratan",
  "varun",
  "manan",
  "sumit",
  "kabir",
  "tarun",
  "mohit",
  "rehan",
  "soham"

];


/* =========================================================
   UTILITY
========================================================= */

function sendJSON(
  res,
  status,
  data
) {

  return res
    .status(status)
    .json(data);

}


/* =========================================================
   METHOD CHECK
========================================================= */

function checkMethod(req, res) {

  if (req.method !== "POST") {

    sendJSON(
      res,
      405,
      {
        error:
          "Method not allowed. Use POST."
      }
    );

    return false;

  }

  return true;

}


/* =========================================================
   API KEY CHECK
========================================================= */

function getAPIKey() {

  return process.env.SARVAM_API_KEY;

}


/* =========================================================
   REQUEST VALIDATION
========================================================= */

function validateRequest(
  body
) {

  if (!body) {

    return {
      valid: false,
      error: "Request body is missing."
    };

  }


  const text =
    typeof body.text === "string"
      ? body.text.trim()
      : "";


  if (!text) {

    return {
      valid: false,
      error: "Text is required."
    };

  }


  const language =
    body.language_code ||
    DEFAULT_LANGUAGE;


  const speaker =
    body.speaker ||
    DEFAULT_SPEAKER;


  let pace =
    Number(
      body.pace
    );


  if (!Number.isFinite(pace)) {

    pace =
      DEFAULT_PACE;

  }


  if (
    !ALLOWED_LANGUAGES.includes(
      language
    )
  ) {

    return {
      valid: false,
      error:
        "Unsupported language."
    };

  }


  if (
    !ALLOWED_SPEAKERS.includes(
      speaker
    )
  ) {

    return {
      valid: false,
      error:
        "Unsupported speaker."
    };

  }


  /*
    Keep the backend request within
    a reasonable size.

    Long scripts are automatically
    divided by app.js before they
    reach this endpoint.
  */

  if (text.length > 5000) {

    return {
      valid: false,
      error:
        "Text chunk is too long. Please use smaller chunks."
    };

  }


  /*
    Keep pace within a safe range.
  */

  pace =
    Math.max(
      0.5,
      Math.min(
        2,
        pace
      )
    );


  return {

    valid: true,

    text,

    language,

    speaker,

    pace

  };

}


/* =========================================================
   REQUEST SARVAM TTS
========================================================= */

async function requestSarvamTTS({
  text,
  language,
  speaker,
  pace,
  apiKey
}) {

  const response =
    await fetch(
      SARVAM_API_URL,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "application/json",

          "api-subscription-key":
            apiKey

        },

        body: JSON.stringify({

          text,

          target_language_code:
            language,

          speaker,

          model:
            "bulbul:v3",

          pace

        })

      }
    );


  /*
    Try to read the response
    even when Sarvam returns an error.
  */

  let data;

  try {

    data =
      await response.json();

  }

  catch {

    data = null;

  }


  if (!response.ok) {

    const message =
      data?.error ||
      data?.message ||
      data?.detail ||
      `Sarvam API returned status ${response.status}.`;


    const error =
      new Error(message);


    error.status =
      response.status;


    error.providerResponse =
      data;


    throw error;

  }


  return data;

}


/* =========================================================
   FIND AUDIO IN SARVAM RESPONSE
========================================================= */

function extractAudio(data) {

  /*
    Standard response format:
    {
      audios: [
        "BASE64_AUDIO..."
      ]
    }
  */

  if (
    Array.isArray(
      data?.audios
    ) &&
    data.audios.length > 0
  ) {

    return data.audios[0];

  }


  /*
    Fallback formats
  */

  if (
    typeof data?.audio === "string"
  ) {

    return data.audio;

  }


  if (
    typeof data?.audio_base64 === "string"
  ) {

    return data.audio_base64;

  }


  return null;

}


/* =========================================================
   MAIN VERCEL HANDLER
========================================================= */

export default async function handler(
  req,
  res
) {

  /*
    CORS headers
  */

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );


  /*
    Browser preflight request
  */

  if (
    req.method === "OPTIONS"
  ) {

    return res
      .status(200)
      .end();

  }


  /*
    Check HTTP method
  */

  if (
    !checkMethod(
      req,
      res
    )
  ) {

    return;

  }


  /*
    Check API key
  */

  const apiKey =
    getAPIKey();


  if (!apiKey) {

    return sendJSON(
      res,
      500,
      {
        error:
          "SARVAM_API_KEY is missing. Add it to Vercel Environment Variables."
      }
    );

  }


  /*
    Validate request
  */

  const validation =
    validateRequest(
      req.body
    );


  if (!validation.valid) {

    return sendJSON(
      res,
      400,
      {
        error:
          validation.error
      }
    );

  }


  const {
    text,
    language,
    speaker,
    pace
  } = validation;


  try {

    /*
      Send request to Sarvam
    */

    const data =
      await requestSarvamTTS({

        text,

        language,

        speaker,

        pace,

        apiKey

      });


    /*
      Extract generated audio
    */

    const audio =
      extractAudio(
        data
      );


    if (!audio) {

      return sendJSON(
        res,
        502,
        {
          error:
            "Sarvam returned a successful response, but no audio was found.",
          provider:
            data
        }
      );

    }


    /*
      Return only the useful
      information to frontend.
    */

    return sendJSON(
      res,
      200,
      {

        success: true,

        audios: [
          audio
        ],

        language,

        speaker,

        pace

      }
    );

  }


  catch (error) {

    console.error(
      "VANTARA TTS ERROR:",
      error
    );


    const status =
      Number.isInteger(
        error?.status
      )
        ? error.status
        : 500;


    return sendJSON(
      res,
      status >= 400 && status < 600
        ? status
        : 500,
      {

        error:
          error?.message ||
          "TTS service error.",

        success: false

      }
    );

  }

}
/* =========================================================
   VANTARA EDITOR BACKEND INFORMATION
========================================================= */

/*
  IMPORTANT SECURITY NOTES

  1. SARVAM_API_KEY must NEVER be written
     directly inside this file.

  2. The key must be stored in:

     Vercel
     → Project
     → Settings
     → Environment Variables

     Variable name:

     SARVAM_API_KEY


  3. Frontend JavaScript must call:

     /api/tts

     and must NEVER contain the
     actual Sarvam API key.


  4. Long scripts are handled by
     app.js using automatic chunking.

  5. This backend generates AI voiceover.
     It does not perform identity
     impersonation or claim that an
     AI-generated voice is a particular
     real person.
*/


/* =========================================================
   HEALTH / DEVELOPMENT NOTE
========================================================= */

/*
  Vercel automatically loads this file
  as a serverless function.

  Endpoint:

  POST /api/tts


  Example request:

  {
    "text": "Good morning students!",
    "language_code": "hi-IN",
    "speaker": "shubh",
    "pace": 1
  }


  Successful response:

  {
    "success": true,
    "audios": [
      "BASE64_AUDIO_DATA"
    ],
    "language": "hi-IN",
    "speaker": "shubh",
    "pace": 1
  }
*/


/* =========================================================
   VANTARA EDITOR V2
   END OF BACKEND FILE
========================================================= */