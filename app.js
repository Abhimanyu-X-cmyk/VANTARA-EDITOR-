"use strict";

/* ================================
   VANTARA EDITOR V2
   CORE SYSTEM
================================ */

const $ = (id) =>
  document.getElementById(id);

function status(id, message, type = "") {
  const el = $(id);

  if (!el) return;

  el.textContent = message;
  el.className = "status " + type;
}

/* ================================
   TABS
================================ */

document
  .querySelectorAll(".tab")
  .forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.tab;

        document
          .querySelectorAll(".tab")
          .forEach((tab) =>
            tab.classList.remove(
              "active"
            )
          );

        document
          .querySelectorAll(".panel")
          .forEach((panel) =>
            panel.classList.remove(
              "active"
            )
          );

        button.classList.add(
          "active"
        );

        const panel =
          $(target);

        if (panel) {
          panel.classList.add(
            "active"
          );
        }

        window.scrollTo({
          top: 0,
          behavior: "smooth"
        });
      }
    );
  });

/* ================================
   THEME
================================ */

const themeButton =
  $("themeToggle") ||
  $("themeBtn");

if (
  localStorage.getItem(
    "vantaraTheme"
  ) === "light"
) {
  document.body.classList.add(
    "light-mode"
  );
}

if (themeButton) {

  themeButton.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light-mode"
      );

      localStorage.setItem(
        "vantaraTheme",
        document.body.classList.contains(
          "light-mode"
        )
          ? "light"
          : "dark"
      );
    }
  );
}

/* ================================
   BASIC HTML ESCAPE
================================ */

function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );
}

console.log(
  "VANTARA EDITOR core loaded."
);
/* ================================
   VOICEOVER STUDIO
   NO API KEY
================================ */

let voices = [];
let stopped = false;

function loadVoices() {

  if (!("speechSynthesis" in window)) {
    status(
      "voiceStatus",
      "Voice synthesis is not supported.",
      "error"
    );
    return;
  }

  voices =
    window.speechSynthesis.getVoices();

  const speaker =
    $("speaker");

  if (!speaker) return;

  speaker.innerHTML = "";

  voices.forEach(
    (voice, index) => {

      const option =
        document.createElement(
          "option"
        );

      option.value = index;

      option.textContent =
        `${voice.name} (${voice.lang})`;

      speaker.appendChild(
        option
      );
    }
  );
}

if ("speechSynthesis" in window) {

  loadVoices();

  window.speechSynthesis
    .addEventListener(
      "voiceschanged",
      loadVoices
    );
}

/* Split long scripts */

function splitScript(
  text,
  limit = 1800
) {

  const words =
    text.trim().split(/\s+/);

  const chunks = [];
  let current = "";

  words.forEach((word) => {

    if (
      (current + " " + word)
        .trim()
        .length > limit
    ) {

      if (current) {
        chunks.push(
          current.trim()
        );
      }

      current = word;

    } else {

      current =
        (current + " " + word)
          .trim();
    }
  });

  if (current) {
    chunks.push(
      current.trim()
    );
  }

  return chunks;
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

/* Speak one part */

function speakPart(
  text,
  number,
  total
) {

  return new Promise(
    (resolve) => {

      const utterance =
        new SpeechSynthesisUtterance(
          text
        );

      utterance.lang =
        $("language")?.value ||
        "hi-IN";

      utterance.rate =
        Number(
          $("pace")?.value ||
          1
        );

      const speaker =
        $("speaker");

      if (
        speaker &&
        voices[speaker.value]
      ) {

        utterance.voice =
          voices[
            speaker.value
          ];
      }

      utterance.onstart =
        () => {

          status(
            "voiceStatus",
            `Speaking part ${number} of ${total}...`,
            "success"
          );
        };

      utterance.onend =
        resolve;

      utterance.onerror =
        resolve;

      window.speechSynthesis
        .speak(
          utterance
        );
    }
  );
}

/* Generate voiceover */

async function generateVoiceover() {

  const script =
    $("script");

  if (!script) return;

  const text =
    script.value.trim();

  if (!text) {

    status(
      "voiceStatus",
      "Please enter your script.",
      "error"
    );

    return;
  }

  window.speechSynthesis.cancel();

  stopped = false;

  const chunks =
    splitScript(text);

  for (
    let i = 0;
    i < chunks.length;
    i++
  ) {

    if (stopped) break;

    await speakPart(
      chunks[i],
      i + 1,
      chunks.length
    );
  }

  if (stopped) {

    status(
      "voiceStatus",
      "Voiceover stopped."
    );

  } else {

    status(
      "voiceStatus",
      "Voiceover completed.",
      "success"
    );
  }
}

/* Generate button */

$("generate")?.addEventListener(
  "click",
  generateVoiceover
);

/* Stop button if present */

$("stopVoiceover")?.addEventListener(
  "click",
  () => {

    stopped = true;

    window.speechSynthesis.cancel();

    status(
      "voiceStatus",
      "Voiceover stopped."
    );
  }
);

/* Preview */

$("previewVoice")?.addEventListener(
  "click",
  () => {

    const text =
      $("script")?.value.trim();

    if (!text) {

      status(
        "voiceStatus",
        "Enter some text first.",
        "error"
      );

      return;
    }

    window.speechSynthesis.cancel();

    const utterance =
      new SpeechSynthesisUtterance(
        text.substring(0, 500)
      );

    utterance.lang =
      $("language")?.value ||
      "hi-IN";

    utterance.rate =
      Number(
        $("pace")?.value ||
        1
      );

    const speaker =
      $("speaker");

    if (
      speaker &&
      voices[speaker.value]
    ) {

      utterance.voice =
        voices[
          speaker.value
        ];
    }

    window.speechSynthesis.speak(
      utterance
    );
  }
);

/* Refresh voice list */

$("refreshVoices")?.addEventListener(
  "click",
  loadVoices
);

console.log(
  "VANTARA Voiceover loaded."
);
/* ================================
   LESSON BUILDER
================================ */

let lessonSlides = [];

/* Render slides */

function renderLessonSlides() {

  const box =
    $("slides");

  if (!box) return;

  if (!lessonSlides.length) {

    box.innerHTML =
      `<div class="empty-state">
        No slides added yet.
       </div>`;

    return;
  }

  box.innerHTML =
    lessonSlides.map(
      (slide, index) => `

      <div class="lesson-slide">

        <h3>
          Slide ${index + 1}
        </h3>

        <input
          type="text"
          value="${escapeHTML(
            slide.title
          )}"
          data-title="${index}"
          placeholder="Slide title"
        >

        <textarea
          data-script="${index}"
          placeholder="Teacher narration..."
        >${escapeHTML(
          slide.script
        )}</textarea>

        <div class="slide-actions">

          <button
            class="small-btn"
            data-up="${index}">
            ↑
          </button>

          <button
            class="small-btn"
            data-down="${index}">
            ↓
          </button>

          <button
            class="small-btn"
            data-delete="${index}">
            Delete
          </button>

        </div>

      </div>
    `
    ).join("");

  /* Title editing */

  box
    .querySelectorAll(
      "[data-title]"
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "input",
          () => {

            const index =
              Number(
                input.dataset.title
              );

            lessonSlides[index]
              .title =
              input.value;
          }
        );
      }
    );

  /* Script editing */

  box
    .querySelectorAll(
      "[data-script]"
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "input",
          () => {

            const index =
              Number(
                input.dataset.script
              );

            lessonSlides[index]
              .script =
              input.value;
          }
        );
      }
    );

  /* Delete */

  box
    .querySelectorAll(
      "[data-delete]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.delete
              );

            lessonSlides.splice(
              index,
              1
            );

            renderLessonSlides();
          }
        );
      }
    );

  /* Move up */

  box
    .querySelectorAll(
      "[data-up]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.up
              );

            if (index === 0)
              return;

            [
              lessonSlides[index - 1],
              lessonSlides[index]
            ] = [
              lessonSlides[index],
              lessonSlides[index - 1]
            ];

            renderLessonSlides();
          }
        );
      }
    );

  /* Move down */

  box
    .querySelectorAll(
      "[data-down]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.down
              );

            if (
              index ===
              lessonSlides.length - 1
            ) return;

            [
              lessonSlides[index],
              lessonSlides[index + 1]
            ] = [
              lessonSlides[index + 1],
              lessonSlides[index]
            ];

            renderLessonSlides();
          }
        );
      }
    );
}

/* Add slide */

$("addSlide")?.addEventListener(
  "click",
  () => {

    lessonSlides.push({
      title:
        `Slide ${
          lessonSlides.length + 1
        }`,

      script: ""
    });

    renderLessonSlides();
  }
);

/* Clear lesson */

$("clearSlides")?.addEventListener(
  "click",
  () => {

    lessonSlides = [];

    renderLessonSlides();

    status(
      "lessonStatus",
      "All slides cleared."
    );
  }
);

/* Generate lesson */

$("generateLesson")?.addEventListener(
  "click",
  () => {

    if (!lessonSlides.length) {

      status(
        "lessonStatus",
        "Add at least one slide.",
        "error"
      );

      return;
    }

    const completeScript =
      lessonSlides
        .map(
          (slide, index) =>
            `Slide ${
              index + 1
            }: ${slide.title}\n${
              slide.script
            }`
        )
        .join("\n\n");

    if ($("script")) {

      $("script").value =
        completeScript;

      $("script").dispatchEvent(
        new Event("input")
      );
    }

    status(
      "lessonStatus",
      "Lesson sent to Voiceover Studio.",
      "success"
    );

    /* Open Voiceover tab */

    document
      .querySelector(
        '[data-tab="voiceover"]'
      )
      ?.click();
  }
);

/* Initial display */

renderLessonSlides();

console.log(
  "VANTARA Lesson Builder loaded."
);
/* ================================
   AUDIO EDITOR
================================ */

let editorBuffer = null;

/* Load audio file */

$("audioFile")?.addEventListener(
  "change",
  async () => {

    const file =
      $("audioFile").files?.[0];

    if (!file) return;

    try {

      const data =
        await file.arrayBuffer();

      const context =
        new AudioContext();

      editorBuffer =
        await context.decodeAudioData(
          data
        );

      await context.close();

      status(
        "audioStatus",
        `${file.name} loaded successfully.`,
        "success"
      );

    } catch (error) {

      console.error(error);

      status(
        "audioStatus",
        "Could not load this audio file.",
        "error"
      );
    }
  }
);

/* Volume display */

$("volume")?.addEventListener(
  "input",
  () => {

    if ($("volumeValue")) {

      $("volumeValue").textContent =
        `${$("volume").value}%`;
    }
  }
);

/* WAV encoder */

function bufferToWav(buffer) {

  const channels =
    buffer.numberOfChannels;

  const sampleRate =
    buffer.sampleRate;

  const samples =
    buffer.length;

  const dataSize =
    samples *
    channels *
    2;

  const arrayBuffer =
    new ArrayBuffer(
      44 + dataSize
    );

  const view =
    new DataView(
      arrayBuffer
    );

  function writeText(
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

  writeText(0, "RIFF");

  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeText(8, "WAVE");

  writeText(12, "fmt ");

  view.setUint32(
    16,
    16,
    true
  );

  view.setUint16(
    20,
    1,
    true
  );

  view.setUint16(
    22,
    channels,
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
      channels *
      2,
    true
  );

  view.setUint16(
    32,
    channels * 2,
    true
  );

  view.setUint16(
    34,
    16,
    true
  );

  writeText(
    36,
    "data"
  );

  view.setUint32(
    40,
    dataSize,
    true
  );

  const channelData = [];

  for (
    let c = 0;
    c < channels;
    c++
  ) {

    channelData.push(
      buffer.getChannelData(c)
    );
  }

  let offset = 44;

  for (
    let i = 0;
    i < samples;
    i++
  ) {

    for (
      let c = 0;
      c < channels;
      c++
    ) {

      let sample =
        channelData[c][i];

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
          ? sample * 32768
          : sample * 32767;

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

/* Process audio */

$("processAudio")?.addEventListener(
  "click",
  async () => {

    if (!editorBuffer) {

      status(
        "audioStatus",
        "Please select an audio file first.",
        "error"
      );

      return;
    }

    try {

      const volume =
        Number(
          $("volume")?.value ||
          100
        ) / 100;

      const fadeIn =
        Number(
          $("fadeIn")?.value ||
          0
        );

      const fadeOut =
        Number(
          $("fadeOut")?.value ||
          0
        );

      const context =
        new OfflineAudioContext(
          editorBuffer.numberOfChannels,
          editorBuffer.length,
          editorBuffer.sampleRate
        );

      const source =
        context.createBufferSource();

      source.buffer =
        editorBuffer;

      const gain =
        context.createGain();

      gain.gain.setValueAtTime(
        0,
        0
      );

      gain.gain.linearRampToValueAtTime(
        volume,
        Math.min(
          fadeIn,
          editorBuffer.duration
        )
      );

      const fadeStart =
        Math.max(
          0,
          editorBuffer.duration -
            fadeOut
        );

      gain.gain.setValueAtTime(
        volume,
        fadeStart
      );

      gain.gain.linearRampToValueAtTime(
        0,
        editorBuffer.duration
      );

      source.connect(gain);

      gain.connect(
        context.destination
      );

      source.start();

      const result =
        await context.startRendering();

      const blob =
        bufferToWav(result);

      const url =
        URL.createObjectURL(
          blob
        );

      if ($("audioPreview")) {

        $("audioPreview").src =
          url;

        $("audioPreview").hidden =
          false;
      }

      if ($("audioDownload")) {

        $("audioDownload").href =
          url;

        $("audioDownload").download =
          "vantara-edited-audio.wav";

        $("audioDownload").hidden =
          false;
      }

      status(
        "audioStatus",
        "Audio processed successfully.",
        "success"
      );

    } catch (error) {

      console.error(error);

      status(
        "audioStatus",
        "Audio processing failed.",
        "error"
      );
    }
  }
);

console.log(
  "VANTARA Audio Editor loaded."
);
/* ================================
   AUDIO MERGE
================================ */

let mergeAudioFiles = [];

/* Select audio files */

$("mergeFiles")?.addEventListener(
  "change",
  () => {

    mergeAudioFiles =
      Array.from(
        $("mergeFiles").files || []
      );

    renderMergeList();
  }
);

/* Show selected files */

function renderMergeList() {

  const box =
    $("mergeList");

  if (!box) return;

  if (!mergeAudioFiles.length) {

    box.innerHTML =
      `<div class="empty-state">
        No audio files selected.
       </div>`;

    return;
  }

  box.innerHTML =
    mergeAudioFiles
      .map(
        (file, index) => `
          <div class="merge-item">
            <span>
              ${index + 1}.
              ${escapeHTML(file.name)}
            </span>
          </div>
        `
      )
      .join("");
}

/* Convert AudioBuffer to WAV */

function audioBufferToWav(buffer) {

  const channels =
    buffer.numberOfChannels;

  const sampleRate =
    buffer.sampleRate;

  const length =
    buffer.length;

  const dataSize =
    length *
    channels *
    2;

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

  writeString(
    0,
    "RIFF"
  );

  view.setUint32(
    4,
    36 + dataSize,
    true
  );

  writeString(
    8,
    "WAVE"
  );

  writeString(
    12,
    "fmt "
  );

  view.setUint32(
    16,
    16,
    true
  );

  view.setUint16(
    20,
    1,
    true
  );

  view.setUint16(
    22,
    channels,
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
      channels *
      2,
    true
  );

  view.setUint16(
    32,
    channels * 2,
    true
  );

  view.setUint16(
    34,
    16,
    true
  );

  writeString(
    36,
    "data"
  );

  view.setUint32(
    40,
    dataSize,
    true
  );

  let offset = 44;

  for (
    let i = 0;
    i < length;
    i++
  ) {

    for (
      let c = 0;
      c < channels;
      c++
    ) {

      let sample =
        buffer.getChannelData(c)[i];

      sample =
        Math.max(
          -1,
          Math.min(
            1,
            sample
          )
        );

      view.setInt16(
        offset,
        sample < 0
          ? sample * 32768
          : sample * 32767,
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

/* Merge audio */

$("mergeBtn")?.addEventListener(
  "click",
  async () => {

    if (
      !mergeAudioFiles.length
    ) {

      status(
        "mergeStatus",
        "Please select audio files first.",
        "error"
      );

      return;
    }

    try {

      status(
        "mergeStatus",
        "Preparing audio files..."
      );

      const audioContext =
        new AudioContext();

      const buffers = [];

      for (
        let i = 0;
        i < mergeAudioFiles.length;
        i++
      ) {

        status(
          "mergeStatus",
          `Loading audio ${i + 1} of ${mergeAudioFiles.length}...`
        );

        const data =
          await mergeAudioFiles[i]
            .arrayBuffer();

        const buffer =
          await audioContext
            .decodeAudioData(
              data
            );

        buffers.push(buffer);
      }

      await audioContext.close();

      /* Find longest sample rate */

      const sampleRate =
        buffers[0].sampleRate;

      const channels =
        Math.max(
          ...buffers.map(
            (buffer) =>
              buffer.numberOfChannels
          )
        );

      /* Calculate total length */

      let totalLength = 0;

      buffers.forEach(
        (buffer) => {

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

      buffers.forEach(
        (buffer) => {

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
      );

      status(
        "mergeStatus",
        "Merging audio..."
      );

      const merged =
        await offline.startRendering();

      const blob =
        audioBufferToWav(
          merged
        );

      const url =
        URL.createObjectURL(
          blob
        );

      if ($("mergeDownload")) {

        $("mergeDownload").href =
          url;

        $("mergeDownload").download =
          "VANTARA-Merged-Audio.wav";

        $("mergeDownload").hidden =
          false;
      }

      status(
        "mergeStatus",
        "All audio files merged successfully.",
        "success"
      );

    } catch (error) {

      console.error(error);

      status(
        "mergeStatus",
        "Could not merge the audio files.",
        "error"
      );
    }
  }
);

renderMergeList();

console.log(
  "VANTARA Audio Merge loaded."
);
/* ================================
   BRAND KIT
================================ */

function loadBrandKit() {

  const saved =
    localStorage.getItem(
      "vantaraBrandKit"
    );

  if (!saved) return;

  try {

    const brand =
      JSON.parse(saved);

    if ($("brandName"))
      $("brandName").value =
        brand.name || "";

    if ($("brandWebsite"))
      $("brandWebsite").value =
        brand.website || "";

    if ($("brandTeacher"))
      $("brandTeacher").value =
        brand.teacher || "";

    if ($("brandFooter"))
      $("brandFooter").value =
        brand.footer || "";

  } catch (error) {

    console.error(
      "Brand data error:",
      error
    );
  }
}

/* Save brand */

$("saveBrand")?.addEventListener(
  "click",
  () => {

    const brand = {

      name:
        $("brandName")?.value ||
        "VANTARA EDUCATION",

      website:
        $("brandWebsite")?.value ||
        "",

      teacher:
        $("brandTeacher")?.value ||
        "",

      footer:
        $("brandFooter")?.value ||
        ""
    };

    localStorage.setItem(
      "vantaraBrandKit",
      JSON.stringify(brand)
    );

    status(
      "brandStatus",
      "Brand Kit saved successfully.",
      "success"
    );
  }
);

loadBrandKit();


/* ================================
   PROJECT LIBRARY
================================ */

let vantaraProjects =
  JSON.parse(
    localStorage.getItem(
      "vantaraProjects"
    ) || "[]"
  );

/* Save project */

$("saveProject")?.addEventListener(
  "click",
  () => {

    const name =
      $("projectName")?.value.trim();

    if (!name) {

      status(
        "projectStatus",
        "Enter a project name.",
        "error"
      );

      return;
    }

    const project = {

      id:
        Date.now(),

      name:
        name,

      created:
        new Date()
          .toLocaleString(),

      lesson:
        lessonSlides
          .map(
            (slide) => ({
              title:
                slide.title,

              script:
                slide.script
            })
          ),

      brand:
        localStorage.getItem(
          "vantaraBrandKit"
        )
    };

    vantaraProjects.unshift(
      project
    );

    localStorage.setItem(
      "vantaraProjects",
      JSON.stringify(
        vantaraProjects
      )
    );

    renderProjects();

    status(
      "projectStatus",
      "Project saved successfully.",
      "success"
    );

    if ($("projectName")) {
      $("projectName").value = "";
    }
  }
);


/* Render projects */

function renderProjects(
  search = ""
) {

  const box =
    $("projectList");

  if (!box) return;

  const query =
    search
      .trim()
      .toLowerCase();

  const filtered =
    vantaraProjects.filter(
      (project) =>
        project.name
          .toLowerCase()
          .includes(query)
    );

  if (!filtered.length) {

    box.innerHTML =
      `<div class="empty-state">
        No projects found.
       </div>`;

    updateProjectCount();

    return;
  }

  box.innerHTML =
    filtered
      .map(
        (project) => `

        <div
          class="project-card"
          data-project="${project.id}"
        >

          <div>
            <h3>
              ${escapeHTML(
                project.name
              )}
            </h3>

            <small>
              ${escapeHTML(
                project.created
              )}
            </small>
          </div>

          <div class="project-actions">

            <button
              class="small-btn"
              data-open-project="${project.id}">
              Open
            </button>

            <button
              class="small-btn"
              data-delete-project="${project.id}">
              Delete
            </button>

          </div>

        </div>
      `
      )
      .join("");

  /* Open project */

  box
    .querySelectorAll(
      "[data-open-project]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset
                  .openProject
              );

            openProject(id);
          }
        );
      }
    );

  /* Delete project */

  box
    .querySelectorAll(
      "[data-delete-project]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset
                  .deleteProject
              );

            deleteProject(id);
          }
        );
      }
    );

  updateProjectCount();
}


/* Open project */

function openProject(id) {

  const project =
    vantaraProjects.find(
      (item) =>
        item.id === id
    );

  if (!project) return;

  lessonSlides =
    project.lesson || [];

  renderLessonSlides();

  if ($("projectStatus")) {

    status(
      "projectStatus",
      `Opened "${project.name}".`,
      "success"
    );
  }

  document
    .querySelector(
      '[data-tab="lesson"]'
    )
    ?.click();
}


/* Delete project */

function deleteProject(id) {

  const project =
    vantaraProjects.find(
      (item) =>
        item.id === id
    );

  if (!project) return;

  const confirmed =
    window.confirm(
      `Delete "${project.name}"?`
    );

  if (!confirmed) return;

  vantaraProjects =
    vantaraProjects.filter(
      (item) =>
        item.id !== id
    );

  localStorage.setItem(
    "vantaraProjects",
    JSON.stringify(
      vantaraProjects
    )
  );

  renderProjects();

  status(
    "projectStatus",
    "Project deleted."
  );
}


/* Search */

$("projectSearch")?.addEventListener(
  "input",
  () => {

    renderProjects(
      $("projectSearch").value
    );
  }
);


/* Dashboard count */

function updateProjectCount() {

  const count =
    $("projectCount");

  if (count) {

    count.textContent =
      vantaraProjects.length;
  }
}


/* Initial library */

renderProjects();

updateProjectCount();

console.log(
  "VANTARA Brand Kit + Project Library loaded."
);
/* ================================
   SCRIPT ASSISTANT
   NO API KEY
================================ */

let assistantOriginalText = "";

/* Generate classroom-style script */

function generateAssistantScript(
  text,
  action
) {

  const clean =
    text.trim();

  if (!clean) return "";

  switch (action) {

    case "simple":

      return `Let's understand this topic in a simple way.

${clean}

The main idea to remember is this: understand the concept first, and then apply it to the problem.`;

    case "classroom":

      return `Students, let's understand this topic step by step.

${clean}

Take a moment to think about the concept. Don't focus only on the final answer. Try to understand why the method works.

Once the concept is clear, solving questions becomes much easier.`;

    case "hinglish":

      return `Students, chaliye is concept ko very simple way mein samajhte hain.

${clean}

Sabse important baat ye hai ki hum sirf answer yaad nahi karenge. Hum ye samjhenge ki concept actually work kaise karta hai.

Once the concept is clear, questions solve karna much easier ho jata hai.`;

    case "short":

      return `Students, remember the key idea:

${clean}

Understand the concept first, then solve the problem.`;

    case "pause":

      return `Students, let's pause here for a moment.

${clean}

Ab ek baar is concept ko mentally recall kijiye.

Think about it, and then let's move ahead.`;

    default:

      return clean;
  }
}


/* Assistant buttons */

document
  .querySelectorAll(
    "[data-action]"
  )
  .forEach(
    (button) => {

      button.addEventListener(
        "click",
        () => {

          const input =
            $("assistantInput");

          if (!input) return;

          const text =
            input.value.trim();

          if (!text) {

            status(
              "assistantStatus",
              "Enter some text first.",
              "error"
            );

            return;
          }

          assistantOriginalText =
            text;

          const action =
            button.dataset.action;

          const result =
            generateAssistantScript(
              text,
              action
            );

          if ($("assistantOutput")) {

            $("assistantOutput").value =
              result;
          }

          status(
            "assistantStatus",
            "Script generated successfully.",
            "success"
          );
        }
      );
    }
  );


/* Use generated script */

$("useAssistant")?.addEventListener(
  "click",
  () => {

    const output =
      $("assistantOutput")?.value
        .trim();

    if (!output) {

      status(
        "assistantStatus",
        "Generate a script first.",
        "error"
      );

      return;
    }

    if ($("script")) {

      $("script").value =
        output;

      $("script").dispatchEvent(
        new Event("input")
      );
    }

    status(
      "assistantStatus",
      "Script sent to Voiceover Studio.",
      "success"
    );

    document
      .querySelector(
        '[data-tab="voiceover"]'
      )
      ?.click();
  }
);


/* Copy script */

$("copyAssistant")?.addEventListener(
  "click",
  async () => {

    const output =
      $("assistantOutput")?.value ||
      "";

    if (!output) {

      status(
        "assistantStatus",
        "Nothing to copy.",
        "error"
      );

      return;
    }

    try {

      await navigator.clipboard
        .writeText(output);

      status(
        "assistantStatus",
        "Script copied.",
        "success"
      );

    } catch (error) {

      console.error(error);

      status(
        "assistantStatus",
        "Copy failed. Please copy manually."
      );
    }
  }
);


/* Clear assistant */

$("clearAssistant")?.addEventListener(
  "click",
  () => {

    if ($("assistantInput"))
      $("assistantInput").value = "";

    if ($("assistantOutput"))
      $("assistantOutput").value = "";

    assistantOriginalText =
      "";

    status(
      "assistantStatus",
      "Assistant cleared."
    );
  }
);


/* Character counter */

$("assistantInput")?.addEventListener(
  "input",
  () => {

    const count =
      $("assistantInput")
        .value.length;

    if ($("assistantCount")) {

      $("assistantCount")
        .textContent =
        `${count} characters`;
    }
  }
);

console.log(
  "VANTARA Script Assistant loaded."
);
/* ================================
   VIDEO CREATOR
   BROWSER ONLY
================================ */

let videoImages = [];
let videoExportStopped = false;

/* Image selection */

$("videoImages")?.addEventListener(
  "change",
  () => {

    videoImages =
      Array.from(
        $("videoImages").files || []
      );

    renderVideoSlides();

    status(
      "videoExportStatus",
      `${videoImages.length} image(s) selected.`
    );
  }
);


/* Render image list */

function renderVideoSlides() {

  const box =
    $("videoSlides");

  if (!box) return;

  if (!videoImages.length) {

    box.innerHTML =
      `<div class="empty-state">
        No images selected.
       </div>`;

    return;
  }

  box.innerHTML =
    videoImages
      .map(
        (file, index) => `

        <div class="video-slide">

          <span>
            ${index + 1}.
            ${escapeHTML(file.name)}
          </span>

          <button
            class="small-btn"
            data-remove-video="${index}">
            Remove
          </button>

        </div>
      `
      )
      .join("");

  box
    .querySelectorAll(
      "[data-remove-video]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset
                  .removeVideo
              );

            videoImages.splice(
              index,
              1
            );

            renderVideoSlides();
          }
        );
      }
    );
}


/* Clear images */

$("clearVideo")?.addEventListener(
  "click",
  () => {

    videoImages = [];

    if ($("videoImages")) {
      $("videoImages").value = "";
    }

    renderVideoSlides();

    status(
      "videoExportStatus",
      "Video images cleared."
    );
  }
);


/* Template controls */

$("videoTemplate")?.addEventListener(
  "change",
  () => {

    const template =
      $("videoTemplate").value;

    if ($("videoTemplatePanel")) {

      $("videoTemplatePanel")
        .dataset.template =
        template;
    }
  }
);


/* Enable / disable title */

$("videoTitleEnabled")?.addEventListener(
  "change",
  () => {

    const title =
      $("videoTitle");

    if (title) {

      title.disabled =
        !$("videoTitleEnabled")
          .checked;
    }
  }
);


/* Enable / disable ending */

$("videoEndingEnabled")?.addEventListener(
  "change",
  () => {

    const ending =
      $("videoEndingText");

    if (ending) {

      ending.disabled =
        !$("videoEndingEnabled")
          .checked;
    }
  }
);


/* Duration display */

$("videoDuration")?.addEventListener(
  "input",
  () => {

    if ($("videoDurationValue")) {

      $("videoDurationValue")
        .textContent =
        `${$("videoDuration").value}s`;
    }
  }
);


/* Browser video preview */

async function createVideoPreview() {

  const canvas =
    $("videoCanvas");

  if (!canvas) return;

  const ctx =
    canvas.getContext("2d");

  const duration =
    Number(
      $("videoDuration")?.value ||
      3
    );

  const title =
    $("videoTitle")?.value ||
    "VANTARA EDUCATION";

  const subtitle =
    $("videoSubtitle")?.value ||
    "";

  canvas.width =
    1280;

  canvas.height =
    720;

  ctx.clearRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /* Background */

  ctx.fillStyle =
    "#050505";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );

  /* Title */

  ctx.textAlign =
    "center";

  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 64px Arial";

  ctx.fillText(
    title,
    canvas.width / 2,
    310
  );

  /* Subtitle */

  if (subtitle) {

    ctx.font =
      "32px Arial";

    ctx.fillText(
      subtitle,
      canvas.width / 2,
      375
    );
  }

  /* Footer */

  ctx.font =
    "24px Arial";

  ctx.fillText(
    "VANTARA EDUCATION",
    canvas.width / 2,
    650
  );

  canvas.hidden =
    false;

  status(
    "videoExportStatus",
    `Preview created for ${duration} seconds.`,
    "success"
  );
}


/* Export / preview button */

$("exportVideo")?.addEventListener(
  "click",
  async () => {

    if (!videoImages.length) {

      await createVideoPreview();

      status(
        "videoExportStatus",
        "Add images to create a full video. A title preview has been created."
      );

      return;
    }

    /*
      Full MP4 export requires a video encoder.
      This browser-only V1/V2 version creates
      a preview without requiring an API key.
    */

    await createVideoPreview();

    status(
      "videoExportStatus",
      "Video preview created. Full MP4 export will be added in a future version.",
      "success"
    );
  }
);


/* Stop export */

$("stopVideoExport")?.addEventListener(
  "click",
  () => {

    videoExportStopped =
      true;

    status(
      "videoExportStatus",
      "Video export stopped."
    );
  }
);


/* ================================
   DASHBOARD CONNECTIONS
================================ */

function updateDashboard() {

  /* Project count */

  if ($("projectCount")) {

    $("projectCount")
      .textContent =
      vantaraProjects.length;
  }

  /* Character count */

  if (
    $("characterCount") &&
    $("script")
  ) {

    $("characterCount")
      .textContent =
      $("script")
        .value.length;
  }

  /* Recent projects */

  const recent =
    $("recentProjects");

  if (!recent) return;

  if (!vantaraProjects.length) {

    recent.innerHTML =
      `<div class="empty-state">
        No recent projects.
       </div>`;

    return;
  }

  recent.innerHTML =
    vantaraProjects
      .slice(0, 5)
      .map(
        (project) => `
          <div class="recent-project">

            <strong>
              ${escapeHTML(
                project.name
              )}
            </strong>

            <small>
              ${escapeHTML(
                project.created
              )}
            </small>

          </div>
        `
      )
      .join("");
}


/* Refresh dashboard periodically */

setInterval(
  updateDashboard,
  1000
);

updateDashboard();

renderVideoSlides();

console.log(
  "VANTARA Video Creator + Dashboard loaded."
);


/* ================================
   FINAL APP STATUS
================================ */

console.log(
  "================================"
);

console.log(
  "VANTARA EDITOR V2 READY"
);

console.log(
  "No API key required for browser tools."
);

console.log(
  "Voiceover • Lesson Builder • Audio Editor"
);

console.log(
  "Audio Merge • Brand Kit • Script Assistant"
);

console.log(
  "Video Preview • Project Library"
);

console.log(
  "================================"
);