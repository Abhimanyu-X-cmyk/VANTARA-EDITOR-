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
        error:
          "SARVAM_API_KEY is missing in Vercel."
      });
    }

    const body =
      req.body || {};

    const text =
      String(body.text || "").trim();

    const language =
      body.language_code ||
      "hi-IN";

    const speaker =
      body.speaker ||
      "shubh";

    const pace =
      Number(body.pace || 1);

    if (!text) {
      return res.status(400).json({
        error:
          "Please enter some text."
      });
    }

    if (text.length > 2500) {
      return res.status(400).json({
        error:
          "This part is longer than 2500 characters."
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

            text: text,

            target_language_code:
              language,

            speaker:
              speaker,

            pace:
              pace,

            model:
              "bulbul:v3",

            output_audio_codec:
              "wav",

            speech_sample_rate:
              24000
          })
        }
      );

    const data =
      await response.json();

    if (!response.ok) {

      console.error(
        "Sarvam error:",
        data
      );

      return res.status(
        response.status
      ).json({
        error:
          data?.error?.message ||
          data?.error ||
          "Sarvam TTS generation failed."
      });
    }

    const audio =
      data?.audios?.[0];

    if (!audio) {

      return res.status(500).json({
        error:
          "Sarvam returned no audio."
      });
    }

    return res.status(200).json({
      audio: audio,
      format: "wav"
    });

  } catch (error) {

    console.error(
      "VANTARA TTS error:",
      error
    );

    return res.status(500).json({
      error:
        error?.message ||
        "Voiceover generation failed."
    });
  }
}
/* =================================
   VANTARA REAL VOICEOVER — PART 2
================================= */

function splitForTTS(text, limit = 2400) {

  const clean =
    String(text || "")
      .replace(/\r/g, "")
      .trim();

  if (!clean) return [];

  const paragraphs =
    clean.split(/\n+/);

  const chunks = [];
  let current = "";

  for (const paragraph of paragraphs) {

    const part = paragraph.trim();

    if (!part) continue;

    if (
      (current + " " + part).trim().length
      <= limit
    ) {
      current =
        (current + " " + part).trim();
    } else {

      if (current) {
        chunks.push(current);
      }

      /* Split very long paragraph by sentences */

      const sentences =
        part.match(
          /[^.!?।]+[.!?।]*/g
        ) || [part];

      current = "";

      for (const sentence of sentences) {

        const s = sentence.trim();

        if (!s) continue;

        if (
          (current + " " + s).trim().length
          <= limit
        ) {
          current =
            (current + " " + s).trim();
        } else {

          if (current) {
            chunks.push(current);
          }

          current = s;
        }
      }
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}


/* =================================
   BASE64 → WAV BLOB
================================= */

function base64ToBlob(
  base64,
  mimeType = "audio/wav"
) {

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

  return new Blob(
    [bytes],
    { type: mimeType }
  );
}


/* =================================
   GENERATE COMPLETE VOICEOVER
================================= */

async function generateRealVoiceover() {

  const script =
    $("script");

  const button =
    $("generate");

  if (!script) return;

  const text =
    script.value.trim();

  if (!text) {

    setStatus(
      "voiceStatus",
      "Please enter your script first.",
      "error"
    );

    return;
  }

  const chunks =
    splitForTTS(text);

  if (!chunks.length) {

    setStatus(
      "voiceStatus",
      "No usable text found.",
      "error"
    );

    return;
  }

  if (button) {
    button.disabled = true;
    button.textContent =
      "Generating Voiceover...";
  }

  const audioParts = [];

  try {

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {

      setStatus(
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
          data?.error ||
          `Part ${i + 1} failed.`
        );
      }

      if (!data.audio) {

        throw new Error(
          `No audio received for part ${i + 1}.`
        );
      }

      audioParts.push(
        base64ToBlob(
          data.audio
        )
      );
    }


    /* =================================
       MERGE ALL WAV PARTS
    ================================= */

    setStatus(
      "voiceStatus",
      "All parts generated. Preparing final WAV..."
    );

    const audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    const decodedParts = [];

    for (
      const blob of audioParts
    ) {

      const arrayBuffer =
        await blob.arrayBuffer();

      const audioBuffer =
        await audioContext.decodeAudioData(
          arrayBuffer
        );

      decodedParts.push(
        audioBuffer
      );
    }


    /* Calculate total duration */

    let totalLength = 0;

    for (
      const buffer of decodedParts
    ) {
      totalLength +=
        buffer.length;
    }


    const sampleRate =
      decodedParts[0]
        .sampleRate;

    const channels =
      decodedParts[0]
        .numberOfChannels;


    const finalBuffer =
      audioContext.createBuffer(
        channels,
        totalLength,
        sampleRate
      );


    /* Copy audio */

    let offset = 0;

    for (
      const buffer of decodedParts
    ) {

      for (
        let channel = 0;
        channel < channels;
        channel++
      ) {

        finalBuffer
          .getChannelData(channel)
          .set(
            buffer.getChannelData(
              Math.min(
                channel,
                buffer.numberOfChannels - 1
              )
            ),
            offset
          );
      }

      offset +=
        buffer.length;
    }


    /* =================================
       AUDIOBUFFER → WAV
    ================================= */

    const wavBlob =
      audioBufferToWav(
        finalBuffer
      );


    const downloadURL =
      URL.createObjectURL(
        wavBlob
      );


    /* Audio player */

    const audio =
      $("voiceAudio");

    if (audio) {

      audio.pause();

      audio.src =
        downloadURL;

      audio.hidden =
        false;

      audio.load();
    }


    /* Download */

    const download =
      $("voiceDownload");

    if (download) {

      download.href =
        downloadURL;

      download.download =
        "VANTARA-Voiceover.wav";

      download.textContent =
        "⬇ Download Voiceover";

      download.hidden =
        false;

      download.style.display =
        "inline-block";
    }


    setStatus(
      "voiceStatus",
      "Voiceover completed. Your WAV file is ready.",
      "success"
    );


    await audioContext.close();

  } catch (error) {

    console.error(
      "VANTARA voiceover error:",
      error
    );

    setStatus(
      "voiceStatus",
      error.message ||
      "Voiceover generation failed.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "🎙️ Generate Complete Voiceover";
    }
  }
}


/* =================================
   ONLY ONE GENERATE LISTENER
================================= */

$("generate")?.addEventListener(
  "click",
  generateRealVoiceover
);

/* =================================
   VANTARA SARVAM VOICE CONTROLS
================================= */

const sarvamMaleVoices = [
  ["shubh", "Shubh — Male"],
  ["aditya", "Aditya — Male"],
  ["rahul", "Rahul — Male"],
  ["rohan", "Rohan — Male"],
  ["amit", "Amit — Male"],
  ["dev", "Dev — Male"],
  ["ratan", "Ratan — Male"],
  ["varun", "Varun — Male"],
  ["manan", "Manan — Male"],
  ["sumit", "Sumit — Male"],
  ["kabir", "Kabir — Male"],
  ["aayan", "Aayan — Male"],
  ["ashutosh", "Ashutosh — Male"],
  ["advait", "Advait — Male"],
  ["anand", "Anand — Male"],
  ["tarun", "Tarun — Male"],
  ["sunny", "Sunny — Male"],
  ["mani", "Mani — Male"],
  ["gokul", "Gokul — Male"],
  ["vijay", "Vijay — Male"],
  ["mohit", "Mohit — Male"],
  ["rehan", "Rehan — Male"],
  ["soham", "Soham — Male"]
];

function setupSarvamVoices() {

  const speaker =
    $("speaker");

  if (!speaker) return;

  speaker.innerHTML = "";

  sarvamMaleVoices.forEach(
    ([value, label]) => {

      const option =
        document.createElement(
          "option"
        );

      option.value = value;
      option.textContent = label;

      speaker.appendChild(
        option
      );
    }
  );

  speaker.value = "shubh";
}


/* =================================
   SPEED CONTROL
================================= */

const pace =
  $("pace");

if (pace) {

  pace.innerHTML = `
    <option value="0.8">
      Slow Classroom
    </option>

    <option value="0.9">
      Gentle Classroom
    </option>

    <option value="1" selected>
      Normal Classroom
    </option>

    <option value="1.1">
      Slightly Fast
    </option>
  `;
}


/* =================================
   INITIALIZE
================================= */

setupSarvamVoices();

console.log(
  "VANTARA Sarvam voice controls loaded."
);

/* =================================
   PART 4 — WAV FILE CONVERTER
================================= */

function audioBufferToWav(buffer) {

  const numberOfChannels =
    buffer.numberOfChannels;

  const sampleRate =
    buffer.sampleRate;

  const format = 1; // PCM
  const bitDepth = 16;

  const samples =
    buffer.length *
    numberOfChannels;

  const dataSize =
    samples *
    (bitDepth / 8);

  const arrayBuffer =
    new ArrayBuffer(
      44 + dataSize
    );

  const view =
    new DataView(
      arrayBuffer
    );

  function writeString(
    offset,
    text
  ) {
    for (
      let i = 0;
      i < text.length;
      i++
    ) {
      view.setUint8(
        offset + i,
        text.charCodeAt(i)
      );
    }
  }

  /* RIFF header */

  writeString(0, "RIFF");

  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeString(8, "WAVE");

  /* fmt chunk */

  writeString(12, "fmt ");

  view.setUint32(
    16,
    16,
    true
  );

  view.setUint16(
    20,
    format,
    true
  );

  view.setUint16(
    22,
    numberOfChannels,
    true
  );

  view.setUint32(
    24,
    sampleRate,
    true
  );

  view.setUint32(
    28,
    sampleRate *
      numberOfChannels *
      (bitDepth / 8),
    true
  );

  view.setUint16(
    32,
    numberOfChannels *
      (bitDepth / 8),
    true
  );

  view.setUint16(
    34,
    bitDepth,
    true
  );

  /* data chunk */

  writeString(36, "data");

  view.setUint32(
    40,
    dataSize,
    true
  );

  /* Audio samples */

  const channelData = [];

  for (
    let channel = 0;
    channel < numberOfChannels;
    channel++
  ) {
    channelData.push(
      buffer.getChannelData(
        channel
      )
    );
  }

  let offset = 44;

  for (
    let i = 0;
    i < buffer.length;
    i++
  ) {

    for (
      let channel = 0;
      channel < numberOfChannels;
      channel++
    ) {

      let sample =
        channelData[channel][i];

      sample =
        Math.max(
          -1,
          Math.min(
            1,
            sample
          )
        );

      const value =
        sample < 0
          ? sample * 0x8000
          : sample * 0x7FFF;

      view.setInt16(
        offset,
        value,
        true
      );

      offset += 2;
    }
  }

  return new Blob(
    [arrayBuffer],
    {
      type: "audio/wav"
    }
  );
}


/* =================================
   DOWNLOAD HELPER
================================= */

function prepareVoiceDownload(
  blob
) {

  const download =
    $("voiceDownload");

  const audio =
    $("voiceAudio");

  if (!download || !blob) {
    return;
  }

  const url =
    URL.createObjectURL(blob);

  if (audio) {

    audio.src =
      url;

    audio.hidden =
      false;

    audio.load();
  }

  download.href =
    url;

  download.download =
    "VANTARA-Voiceover.wav";

  download.textContent =
    "⬇ Download Voiceover";

  download.hidden =
    false;

  download.style.display =
    "inline-block";
}


/* =================================
   DOWNLOAD BUTTON CHECK
================================= */

$("voiceDownload")?.addEventListener(
  "click",
  function () {

    if (!this.href) {

      setStatus(
        "voiceStatus",
        "Please generate the voiceover first.",
        "error"
      );

      return;
    }

    this.download =
      "VANTARA-Voiceover.wav";
  }
);


console.log(
  "VANTARA WAV converter loaded."
);