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
/* ================================
   REAL VOICEOVER GENERATOR
   SARVAM TTS
================================ */

function splitForTTS(text, limit = 1800) {

  const sentences =
    text
      .replace(/\s+/g, " ")
      .trim()
      .split(/(?<=[.!?।])\s+/);

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {

    if (
      current &&
      (current.length +
        sentence.length +
        1 > limit)
    ) {
      chunks.push(current);
      current = "";
    }

    current =
      current
        ? current + " " + sentence
        : sentence;
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}


/* Base64 → Uint8Array */

function base64ToBytes(base64) {

  const binary =
    atob(base64);

  const bytes =
    new Uint8Array(
      binary.length
    );

  for (
    let i = 0;
    i < binary.length;
    i++
  ) {
    bytes[i] =
      binary.charCodeAt(i);
  }

  return bytes;
}


/* Merge WAV files */

async function mergeWavFiles(
  base64Files
) {

  const context =
    new AudioContext();

  const buffers = [];

  for (const base64 of base64Files) {

    const bytes =
      base64ToBytes(base64);

    const buffer =
      await context.decodeAudioData(
        bytes.buffer
      );

    buffers.push(buffer);
  }

  if (!buffers.length) {
    throw new Error(
      "No audio generated."
    );
  }

  const sampleRate =
    buffers[0].sampleRate;

  const channels =
    Math.max(
      ...buffers.map(
        b => b.numberOfChannels
      )
    );

  let totalLength = 0;

  buffers.forEach(
    buffer => {

      totalLength +=
        Math.ceil(
          buffer.duration *
          sampleRate
        );
    }
  );

  const offline =
    new OfflineAudioContext(
      channels,
      totalLength,
      sampleRate
    );

  let position = 0;

  for (const buffer of buffers) {

    const source =
      offline.createBufferSource();

    source.buffer =
      buffer;

    source.connect(
      offline.destination
    );

    source.start(
      position /
      sampleRate
    );

    position +=
      Math.ceil(
        buffer.duration *
        sampleRate
      );
  }

  const merged =
    await offline.startRendering();

  await context.close();

  return audioBufferToWav(
    merged
  );
}


/* Generate real voiceover */

async function generateRealVoiceover() {

  const script =
    $("script");

  if (!script) return;

  const text =
    script.value.trim();

  if (!text) {

    status(
      "voiceStatus",
      "Please enter your script first.",
      "error"
    );

    return;
  }

  const chunks =
    splitForTTS(text);

  const audioParts = [];

  try {

    status(
      "voiceStatus",
      `Generating ${chunks.length} audio part(s)...`
    );

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {

      status(
        "voiceStatus",
        `Generating voiceover ${i + 1} of ${chunks.length}...`
      );

      const response =
        await fetch(
          "/api/tts",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              text:
                chunks[i],

              language_code:
                $("language")?.value ||
                "hi-IN",

              speaker:
                $("speaker")?.value ||
                "shubh",

              pace:
                Number(
                  $("pace")?.value ||
                  1
                )
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Voice generation failed."
        );
      }

      if (!data.audio) {

        throw new Error(
          "No audio was returned."
        );
      }

      audioParts.push(
        data.audio
      );
    }

    status(
      "voiceStatus",
      "Merging all voiceover parts..."
    );

    const finalWav =
      await mergeWavFiles(
        audioParts
      );

    const url =
      URL.createObjectURL(
        finalWav
      );

    if ($("voiceAudio")) {

      $("voiceAudio").src =
        url;

      $("voiceAudio").hidden =
        false;
    }

    if ($("voiceDownload")) {

      $("voiceDownload").href =
        url;

      $("voiceDownload").download =
        "VANTARA-Voiceover.wav";

      $("voiceDownload").hidden =
        false;

      $("voiceDownload").textContent =
        "Download Voiceover";
    }

    status(
      "voiceStatus",
      "Voiceover generated successfully.",
      "success"
    );

  } catch (error) {

    console.error(error);

    status(
      "voiceStatus",
      error.message ||
      "Voiceover generation failed.",
      "error"
    );
  }
}


/* Generate button */


/* ================================
   VOICE CONTROLS
================================ */

/* Default speakers */

const sarvamSpeakers = [
  ["shubh", "Shubh"],
  ["aditya", "Aditya"],
  ["rahul", "Rahul"],
  ["rohan", "Rohan"],
  ["amit", "Amit"],
  ["dev", "Dev"],
  ["ratan", "Ratan"],
  ["varun", "Varun"],
  ["manan", "Manan"],
  ["sumit", "Sumit"],
  ["kabir", "Kabir"],
  ["tarun", "Tarun"],
  ["mohit", "Mohit"],
  ["rehan", "Rehan"],
  ["soham", "Soham"]
];


/* Populate teacher voices */

function setupSarvamSpeakers() {

  const speaker =
    $("speaker");

  if (!speaker) return;

  speaker.innerHTML = "";

  sarvamSpeakers.forEach(
    ([value, name]) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        value;

      option.textContent =
        name;

      speaker.appendChild(
        option
      );
    }
  );

  speaker.value =
    "shubh";
}


/* Setup language */

function setupLanguages() {

  const language =
    $("language");

  if (!language) return;

  language.innerHTML = `
    <option value="hi-IN">
      Hindi / Hinglish
    </option>

    <option value="en-IN">
      English (Indian)
    </option>
  `;
}


/* Setup speed */

function setupPace() {

  const pace =
    $("pace");

  if (!pace) return;

  pace.innerHTML = `
    <option value="0.9">
      Slow classroom
    </option>

    <option value="1" selected>
      Normal classroom
    </option>

    <option value="1.1">
      Slightly fast
    </option>
  `;
}


/* Character counter */

$("script")?.addEventListener(
  "input",
  () => {

    const text =
      $("script").value;

    if ($("count")) {

      $("count").textContent =
        `${text.length} characters`;
    }
  }
);


/* Preview first 500 characters */

$("previewVoice")?.addEventListener(
  "click",
  async () => {

    const script =
      $("script");

    if (!script) return;

    const text =
      script.value.trim();

    if (!text) {

      status(
        "voiceStatus",
        "Enter some text first.",
        "error"
      );

      return;
    }

    const preview =
      text.substring(
        0,
        500
      );

    try {

      status(
        "voiceStatus",
        "Generating preview..."
      );

      const response =
        await fetch(
          "/api/tts",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              text:
                preview,

              language_code:
                $("language")?.value ||
                "hi-IN",

              speaker:
                $("speaker")?.value ||
                "shubh",

              pace:
                Number(
                  $("pace")?.value ||
                  1
                )
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          "Preview failed."
        );
      }

      const bytes =
        base64ToBytes(
          data.audio
        );

      const blob =
        new Blob(
          [bytes],
          {
            type:
              "audio/wav"
          }
        );

      const url =
        URL.createObjectURL(
          blob
        );

      if ($("voiceAudio")) {

        $("voiceAudio").src =
          url;

        $("voiceAudio").hidden =
          false;

        $("voiceAudio").play()
          .catch(() => {});
      }

      status(
        "voiceStatus",
        "Voice preview ready.",
        "success"
      );

    } catch (error) {

      console.error(error);

      status(
        "voiceStatus",
        error.message ||
        "Preview failed.",
        "error"
      );
    }
  }
);


/* Clear generated voiceover */

$("clearVoiceover")?.addEventListener(
  "click",
  () => {

    if ($("voiceAudio")) {

      $("voiceAudio").pause();

      $("voiceAudio").src =
        "";

      $("voiceAudio").hidden =
        true;
    }

    if ($("voiceDownload")) {

      $("voiceDownload").href =
        "";

      $("voiceDownload").hidden =
        true;
    }

    status(
      "voiceStatus",
      "Voiceover cleared."
    );
  }
);


/* Initialize controls */

setupSarvamSpeakers();
setupLanguages();
setupPace();

console.log(
  "VANTARA real voice controls loaded."
);
<button id="previewVoice" class="small-btn">
  Preview Voice
</button>

<button id="clearVoiceover" class="small-btn">
  Clear
</button>
/* ================================
   VOICEOVER UI
================================ */

/* Create download button if missing */

function setupVoiceDownload() {

  const audio =
    $("voiceAudio");

  const download =
    $("voiceDownload");

  if (!audio || !download) {
    return;
  }

  download.textContent =
    "⬇ Download Voiceover";

  download.classList.add(
    "download"
  );

  download.hidden =
    true;
}


/* Update chunk information */

function showVoiceChunks(text) {

  const chunks =
    splitForTTS(text);

  const log =
    $("chunkLog");

  if (!log) return;

  if (!chunks.length) {

    log.innerHTML =
      "";

    return;
  }

  log.innerHTML =
    chunks
      .map(
        (chunk, index) => `
          <div class="chunk-item">
            <strong>
              Part ${index + 1}
            </strong>

            <span>
              ${chunk.length} characters
            </span>
          </div>
        `
      )
      .join("");
}


/* Update chunks while typing */

$("script")?.addEventListener(
  "input",
  () => {

    showVoiceChunks(
      $("script").value
    );
  }
);


/* Download protection */

$("voiceDownload")?.addEventListener(
  "click",
  (event) => {

    const href =
      $("voiceDownload").href;

    if (
      !href ||
      href ===
      window.location.href
    ) {

      event.preventDefault();

      status(
        "voiceStatus",
        "Generate the voiceover first.",
        "error"
      );
    }
  }
);


/* Generate button loading state */

$("generate")?.addEventListener(
  "click",
  () => {

    const button =
      $("generate");

    if (!button) return;

    button.disabled =
      true;

    button.dataset.originalText =
      button.textContent;

    button.textContent =
      "Generating...";

    /*
      Re-enable after the generator
      finishes or fails.
    */

    setTimeout(
      () => {

        button.disabled =
          false;

        button.textContent =
          button.dataset
            .originalText ||
          "Generate Voiceover";

      },
      30000
    );
  }
);


/* Initialize */

setupVoiceDownload();

if ($("script")) {

  showVoiceChunks(
    $("script").value
  );
}

console.log(
  "VANTARA Voiceover UI loaded."
);
/* ================================
   FINAL VOICEOVER GENERATOR
================================ */

let voiceoverGenerating = false;

async function generateRealVoiceover() {

  if (voiceoverGenerating) {
    return;
  }

  const script =
    $("script");

  const button =
    $("generate");

  if (!script) return;

  const text =
    script.value.trim();

  if (!text) {

    status(
      "voiceStatus",
      "Please enter your script first.",
      "error"
    );

    return;
  }

  const chunks =
    splitForTTS(text);

  if (!chunks.length) {
    return;
  }

  voiceoverGenerating =
    true;

  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Generating...";
  }

  /* Hide old download */

  if ($("voiceDownload")) {

    $("voiceDownload").hidden =
      true;

    $("voiceDownload").removeAttribute(
      "href"
    );
  }

  if ($("voiceAudio")) {

    $("voiceAudio").pause();

    $("voiceAudio").hidden =
      true;

    $("voiceAudio").removeAttribute(
      "src"
    );
  }

  const audioParts = [];

  try {

    status(
      "voiceStatus",
      `Preparing ${chunks.length} part(s)...`
    );

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {

      status(
        "voiceStatus",
        `Generating part ${i + 1} of ${chunks.length}...`
      );

      const response =
        await fetch(
          "/api/tts",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body: JSON.stringify({

              text:
                chunks[i],

              language_code:
                $("language")?.value ||
                "hi-IN",

              speaker:
                $("speaker")?.value ||
                "shubh",

              pace:
                Number(
                  $("pace")?.value ||
                  1
                )
            })
          }
        );

      const data =
        await response.json();

      if (!response.ok) {

        throw new Error(
          data.error ||
          `Part ${i + 1} failed.`
        );
      }

      if (!data.audio) {

        throw new Error(
          `No audio returned for part ${i + 1}.`
        );
      }

      audioParts.push(
        data.audio
      );
    }

    /* Merge */

    status(
      "voiceStatus",
      "All parts generated. Merging audio..."
    );

    const finalWav =
      await mergeWavFiles(
        audioParts
      );

    /* Create downloadable file */

    const url =
      URL.createObjectURL(
        finalWav
      );

    if ($("voiceAudio")) {

      $("voiceAudio").src =
        url;

      $("voiceAudio").hidden =
        false;

      $("voiceAudio").load();
    }

    if ($("voiceDownload")) {

      $("voiceDownload").href =
        url;

      $("voiceDownload").download =
        "VANTARA-Voiceover.wav";

      $("voiceDownload").textContent =
        "⬇ Download Voiceover";

      $("voiceDownload").hidden =
        false;
    }

    status(
      "voiceStatus",
      "Voiceover generated successfully. Your WAV file is ready to download.",
      "success"
    );

  } catch (error) {

    console.error(
      "Voiceover error:",
      error
    );

    status(
      "voiceStatus",
      error.message ||
      "Voiceover generation failed.",
      "error"
    );

  } finally {

    voiceoverGenerating =
      false;

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Generate Voiceover";
    }
  }
}


/* One final Generate listener */

$("generate")?.addEventListener(
  "click",
  generateRealVoiceover
);

console.log(
  "Final downloadable voiceover system loaded."
);
/* One final Generate listener */

$("generate")?.addEventListener(
  "click",
  generateRealVoiceover
);

console.log(
  "Final downloadable voiceover system loaded."
);
/* ================================
   VOICEOVER ERROR HANDLING
================================ */

function showVoiceoverError(error) {

  console.error(
    "VANTARA Voiceover Error:",
    error
  );

  const message =
    error?.message ||
    "Voiceover generation failed.";

  status(
    "voiceStatus",
    "❌ " + message,
    "error"
  );
}


/* ================================
   CLEAR GENERATED VOICEOVER
================================ */

$("clearVoiceover")?.addEventListener(
  "click",
  () => {

    const audio =
      $("voiceAudio");

    const download =
      $("voiceDownload");

    if (audio) {

      audio.pause();

      audio.removeAttribute(
        "src"
      );

      audio.load();

      audio.hidden =
        true;
    }

    if (download) {

      download.removeAttribute(
        "href"
      );

      download.hidden =
        true;
    }

    status(
      "voiceStatus",
      "Voiceover cleared."
    );
  }
);


/* ================================
   DOWNLOAD BUTTON
================================ */

$("voiceDownload")?.addEventListener(
  "click",
  () => {

    const download =
      $("voiceDownload");

    if (
      !download ||
      !download.href
    ) {

      status(
        "voiceStatus",
        "Please generate the voiceover first.",
        "error"
      );

      return;
    }

    download.textContent =
      "⬇ Download Voiceover";

  }
);


/* ================================
   INTERNET STATUS
================================ */

window.addEventListener(
  "offline",
  () => {

    status(
      "voiceStatus",
      "Internet connection lost. Voiceover generation needs internet.",
      "error"
    );
  }
);

window.addEventListener(
  "online",
  () => {

    status(
      "voiceStatus",
      "Internet connection restored.",
      "success"
    );
  }
)