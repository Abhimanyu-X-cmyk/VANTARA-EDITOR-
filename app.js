"use strict";

const $ = id => document.getElementById(id);

function setStatus(id, message, type = "") {
  const el = $(id);
  if (!el) return;
  el.textContent = message;
  el.className = "status " + type;
}

function splitText(text, limit = 3800) {
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];

  const sentences =
    clean.match(/[^.!?।]+[.!?।]+|[^.!?।]+$/g) || [clean];

  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    if (s.length > limit) {
      const words = s.split(/\s+/);
      for (const word of words) {
        if (!current) current = word;
        else if (current.length + 1 + word.length <= limit) current += " " + word;
        else {
          chunks.push(current.trim());
          current = word;
        }
      }
      continue;
    }

    if (current && current.length + 1 + s.length > limit) {
      chunks.push(current.trim());
      current = "";
    }

    current += (current ? " " : "") + s;
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function readAscii(bytes, offset, length) {
  return String.fromCharCode(...bytes.slice(offset, offset + length));
}

function readU16(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint16(offset, true);
}

function readU32(bytes, offset) {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength).getUint32(offset, true);
}

function parseWav(bytes) {
  if (readAscii(bytes, 0, 4) !== "RIFF" || readAscii(bytes, 8, 4) !== "WAVE") {
    throw new Error("OpenAI returned an unsupported WAV file.");
  }

  let pos = 12, fmt = null, data = null;

  while (pos + 8 <= bytes.length) {
    const id = readAscii(bytes, pos, 4);
    const size = readU32(bytes, pos + 4);
    const start = pos + 8;

    if (id === "fmt ") {
      fmt = {
        audioFormat: readU16(bytes, start),
        channels: readU16(bytes, start + 2),
        sampleRate: readU32(bytes, start + 4),
        byteRate: readU32(bytes, start + 8),
        blockAlign: readU16(bytes, start + 12),
        bitsPerSample: readU16(bytes, start + 14)
      };
    }

    if (id === "data") data = bytes.slice(start, start + size);
    pos = start + size + (size % 2);
  }

  if (!fmt || !data) throw new Error("Invalid WAV returned by OpenAI.");
  return { fmt, data };
}

function makeWav(fmt, pcmData) {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const write = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  write(0, "RIFF");
  view.setUint32(4, 36 + pcmData.length, true);
  write(8, "WAVE");
  write(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, fmt.audioFormat, true);
  view.setUint16(22, fmt.channels, true);
  view.setUint32(24, fmt.sampleRate, true);
  view.setUint32(28, fmt.byteRate, true);
  view.setUint16(32, fmt.blockAlign, true);
  view.setUint16(34, fmt.bitsPerSample, true);
  write(36, "data");
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData], { type: "audio/wav" });
}

function mergeWavs(parts) {
  const parsed = parts.map(x => parseWav(base64ToBytes(x)));
  const first = parsed[0];

  for (const item of parsed) {
    const a = item.fmt, b = first.fmt;
    if (a.audioFormat !== b.audioFormat ||
        a.channels !== b.channels ||
        a.sampleRate !== b.sampleRate ||
        a.bitsPerSample !== b.bitsPerSample) {
      throw new Error("Audio format changed between parts; cannot safely merge.");
    }
  }

  const total = parsed.reduce((sum, item) => sum + item.data.length, 0);
  const pcm = new Uint8Array(total);
  let offset = 0;

  for (const item of parsed) {
    pcm.set(item.data, offset);
    offset += item.data.length;
  }

  return makeWav(first.fmt, pcm);
}

async function generateVoiceover() {
  const text = $("script").value.trim();

  if (!text) {
    setStatus("voiceStatus", "Please paste your script first.", "error");
    return;
  }

  const chunks = splitText(text, 3800);
  const button = $("generate");

  button.disabled = true;
  button.textContent = "Generating...";
  $("voiceAudio").hidden = true;
  $("voiceDownload").hidden = true;

  const parts = [];

  try {
    setStatus("voiceStatus", `Preparing ${chunks.length} part(s)...`);

    for (let i = 0; i < chunks.length; i++) {
      setStatus("voiceStatus", `Generating part ${i + 1} of ${chunks.length}...`);

      const response = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: chunks[i],
          voice: $("voice").value,
          speed: Number($("speed").value),
          instructions: $("instructions").value
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || `Part ${i + 1} failed.`);
      if (!data.audio) throw new Error(`No audio returned for part ${i + 1}.`);

      parts.push(data.audio);
      $("chunkStatus").textContent = `Completed ${i + 1} of ${chunks.length} part(s).`;
    }

    setStatus("voiceStatus", "All parts generated. Joining audio...");

    const blob = mergeWavs(parts);
    const url = URL.createObjectURL(blob);

    $("voiceAudio").src = url;
    $("voiceAudio").hidden = false;
    $("voiceAudio").load();

    $("voiceDownload").href = url;
    $("voiceDownload").download = "VANTARA-OpenAI-Voiceover.wav";
    $("voiceDownload").hidden = false;

    setStatus("voiceStatus", "Voiceover completed. Your WAV file is ready.", "success");
    $("chunkStatus").textContent =
      `${chunks.length} part(s) generated and merged into one WAV file.`;
  } catch (error) {
    console.error(error);
    setStatus("voiceStatus", error.message || "Voiceover generation failed.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Generate Real Voiceover";
  }
}

$("script")?.addEventListener("input", () => {
  $("count").textContent = `${$("script").value.length} characters`;
});

$("generate")?.addEventListener("click", generateVoiceover);
