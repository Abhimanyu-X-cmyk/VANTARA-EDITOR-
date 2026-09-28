"use strict";

/* =========================================================
   VANTARA EDITOR V2
   COMPLETE CORRECTED app.js
   No API key required
   ========================================================= */


/* =========================================================
   BASIC HELPERS
   ========================================================= */

const $ = (id) => document.getElementById(id);

function setStatus(id, message, type = "") {
  const el = $(id);
  if (!el) return;

  el.textContent = message;
  el.className = "status " + type;
}

function escapeHTML(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


/* =========================================================
   TAB NAVIGATION
   IMPORTANT: THIS FIXES THE "OPTIONS NOT OPENING" ISSUE
   ========================================================= */

function activateTab(target) {
  if (!target) return;

  const tabs = document.querySelectorAll(".tab");
  const panels = document.querySelectorAll(".panel");

  tabs.forEach(tab => {
    tab.classList.toggle(
      "active",
      tab.dataset.tab === target
    );
  });

  panels.forEach(panel => {
    panel.classList.toggle(
      "active",
      panel.id === target
    );
  });

  const panel = $(target);

  if (panel) {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach(button => {
    button.addEventListener("click", function () {
      activateTab(this.dataset.tab);
    });
  });
}


/* =========================================================
   THEME
   ========================================================= */

function setupTheme() {
  const themeButton =
    $("themeToggle") ||
    $("themeBtn");

  if (!themeButton) return;

  themeButton.addEventListener("click", () => {
    document.body.classList.toggle("light-mode");

    const light =
      document.body.classList.contains("light-mode");

    localStorage.setItem(
      "vantaraTheme",
      light ? "light" : "dark"
    );
  });

  if (
    localStorage.getItem("vantaraTheme") === "light"
  ) {
    document.body.classList.add("light-mode");
  }
}


/* =========================================================
   SPEECH SYNTHESIS
   ========================================================= */

let availableVoices = [];
let voiceIsRunning = false;
let currentSpeechToken = 0;

function getSelectedLanguage() {
  return $("language")?.value || "hi-IN";
}

function getSelectedPace() {
  return Number($("pace")?.value || 1);
}

function detectVoiceGender(voice) {
  const name = (
    voice.name +
    " " +
    voice.voiceURI
  ).toLowerCase();

  const femaleWords = [
    "female",
    "zira",
    "samantha",
    "karen",
    "susan",
    "hazel",
    "heera",
    "priya",
    "neerja",
    "raveena",
    "veena",
    "swara"
  ];

  const maleWords = [
    "male",
    "david",
    "mark",
    "daniel",
    "james",
    "george",
    "ravi",
    "hemant",
    "madhur",
    "raj"
  ];

  if (
    femaleWords.some(word => name.includes(word))
  ) {
    return "female";
  }

  if (
    maleWords.some(word => name.includes(word))
  ) {
    return "male";
  }

  return "unknown";
}

function getSelectedGender() {
  return $("voiceGender")?.value || "all";
}

function updateVoiceList() {
  const select = $("speaker");

  if (!select) return;

  const language = getSelectedLanguage();
  const languageCode =
    language.split("-")[0].toLowerCase();

  const gender = getSelectedGender();

  let voices = availableVoices.filter(voice => {
    if (!voice.lang) return false;

    return voice.lang
      .toLowerCase()
      .startsWith(languageCode);
  });

  if (gender !== "all") {
    const filtered = voices.filter(
      voice =>
        detectVoiceGender(voice) === gender
    );

    if (filtered.length > 0) {
      voices = filtered;
    }
  }

  if (voices.length === 0) {
    voices = availableVoices;
  }

  const oldValue = select.value;

  select.innerHTML = "";

  voices.forEach(voice => {
    const option =
      document.createElement("option");

    option.value = voice.name;
    option.textContent =
      `${voice.name} (${voice.lang})`;

    select.appendChild(option);
  });

  if (
    Array.from(select.options)
      .some(option => option.value === oldValue)
  ) {
    select.value = oldValue;
  }

  if (voices.length === 0) {
    setStatus(
      "voiceStatus",
      "No browser voices found. Try Chrome.",
      "warning"
    );
  }
}

function loadBrowserVoices() {
  if (!("speechSynthesis" in window)) {
    setStatus(
      "voiceStatus",
      "Speech synthesis is not supported in this browser.",
      "error"
    );
    return;
  }

  availableVoices =
    window.speechSynthesis.getVoices();

  updateVoiceList();
}

function waitForVoices() {
  return new Promise(resolve => {
    if (!("speechSynthesis" in window)) {
      resolve([]);
      return;
    }

    const existing =
      window.speechSynthesis.getVoices();

    if (existing.length > 0) {
      resolve(existing);
      return;
    }

    let done = false;

    const finish = () => {
      if (done) return;

      done = true;

      window.speechSynthesis
        .removeEventListener(
          "voiceschanged",
          finish
        );

      resolve(
        window.speechSynthesis.getVoices()
      );
    };

    window.speechSynthesis
      .addEventListener(
        "voiceschanged",
        finish
      );

    setTimeout(finish, 3000);
  });
}

function getSelectedVoice() {
  const select = $("speaker");

  if (!select) return null;

  return (
    availableVoices.find(
      voice =>
        voice.name === select.value
    ) || null
  );
}

function speakText(text) {
  return new Promise(async (resolve, reject) => {
    if (!text || !text.trim()) {
      resolve();
      return;
    }

    if (!("speechSynthesis" in window)) {
      reject(
        new Error(
          "Speech synthesis is not available."
        )
      );
      return;
    }

    try {
      await waitForVoices();

      const synth =
        window.speechSynthesis;

      synth.cancel();

      await wait(120);

      const utterance =
        new SpeechSynthesisUtterance(text);

      utterance.lang =
        getSelectedLanguage();

      utterance.rate =
        getSelectedPace();

      utterance.pitch = 1;
      utterance.volume = 1;

      const voice =
        getSelectedVoice();

      if (voice) {
        utterance.voice = voice;
      }

      let finished = false;

      const finish = () => {
        if (finished) return;

        finished = true;
        resolve();
      };

      utterance.onend = finish;

      utterance.onerror = event => {
        if (
          event.error === "canceled" ||
          event.error === "interrupted"
        ) {
          finish();
          return;
        }

        if (finished) return;

        finished = true;

        reject(
          new Error(
            "Speech synthesis failed."
          )
        );
      };

      synth.resume();
      synth.speak(utterance);

      const keepAlive =
        setInterval(() => {
          if (
            !synth.speaking ||
            finished
          ) {
            clearInterval(keepAlive);
            return;
          }

          synth.resume();
        }, 4000);

      utterance.addEventListener(
        "end",
        () => {
          clearInterval(keepAlive);
        }
      );

    } catch (error) {
      reject(error);
    }
  });
}


/* =========================================================
   LONG SCRIPT SUPPORT
   ========================================================= */

function splitText(text, maxLength = 1800) {
  const clean = text.trim();

  if (!clean) return [];

  const words =
    clean.split(/\s+/);

  const chunks = [];
  let current = "";

  for (const word of words) {
    const test =
      (current + " " + word).trim();

    if (test.length <= maxLength) {
      current = test;
    } else {
      if (current) {
        chunks.push(current);
      }

      current = word;
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

function displayChunks(chunks) {
  const container = $("chunkLog");

  if (!container) return;

  container.innerHTML = "";

  chunks.forEach((chunk, index) => {
    const item =
      document.createElement("div");

    item.className = "chunk-item";

    item.textContent =
      `Part ${index + 1}: ${chunk.length} characters`;

    container.appendChild(item);
  });
}


/* =========================================================
   VOICEOVER CONTROLS
   ========================================================= */

async function playVoiceover(chunks) {
  if (!chunks.length) {
    throw new Error(
      "No script available."
    );
  }

  voiceIsRunning = true;

  const token =
    ++currentSpeechToken;

  try {
    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {
      if (
        token !== currentSpeechToken
      ) {
        break;
      }

      setStatus(
        "voiceStatus",
        `Speaking part ${i + 1} of ${chunks.length}...`
      );

      await speakText(chunks[i]);

      if (
        i < chunks.length - 1
      ) {
        await wait(250);
      }
    }

    if (
      token === currentSpeechToken
    ) {
      setStatus(
        "voiceStatus",
        "Voiceover completed successfully.",
        "success"
      );
    }

  } catch (error) {
    console.error(error);

    setStatus(
      "voiceStatus",
      error.message ||
        "Voiceover failed.",
      "error"
    );

  } finally {
    voiceIsRunning = false;
  }
}

function stopVoiceover() {
  currentSpeechToken++;

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }

  voiceIsRunning = false;

  setStatus(
    "voiceStatus",
    "Voiceover stopped."
  );
}

async function generateVoiceover() {
  const script =
    $("script")?.value.trim();

  if (!script) {
    setStatus(
      "voiceStatus",
      "Please paste your script first.",
      "error"
    );
    return;
  }

  if (
    !("speechSynthesis" in window)
  ) {
    setStatus(
      "voiceStatus",
      "Speech synthesis is not supported in this browser.",
      "error"
    );
    return;
  }

  const button = $("generate");

  if (button) {
    button.disabled = true;
    button.textContent =
      "Preparing Voiceover...";
  }

  try {
    const voices =
      await waitForVoices();

    availableVoices = voices;

    updateVoiceList();

    const chunks =
      splitText(script, 1800);

    displayChunks(chunks);

    setStatus(
      "voiceStatus",
      `${chunks.length} part${chunks.length === 1 ? "" : "s"} ready.`
    );

    await playVoiceover(chunks);

  } catch (error) {
    setStatus(
      "voiceStatus",
      error.message ||
        "Unable to start voiceover.",
      "error"
    );

  } finally {
    if (button) {
      button.disabled = false;
      button.textContent =
        "Generate Voiceover";
    }
  }
}

function previewVoice() {
  const script =
    $("script")?.value.trim();

  if (!script) {
    setStatus(
      "voiceStatus",
      "Enter some text first.",
      "error"
    );
    return;
  }

  stopVoiceover();

  speakText(
    splitText(script, 700)[0]
  ).catch(error => {
    setStatus(
      "voiceStatus",
      error.message,
      "error"
    );
  });
}


/* =========================================================
   VOICE EVENT SETUP
   ========================================================= */

function setupVoiceover() {
  if (
    "speechSynthesis" in window
  ) {
    window.speechSynthesis
      .addEventListener(
        "voiceschanged",
        loadBrowserVoices
      );

    loadBrowserVoices();
  }

  $("language")?.addEventListener(
    "change",
    () => {
      updateVoiceList();

      setStatus(
        "voiceStatus",
        "Language updated."
      );
    }
  );

  $("voiceGender")?.addEventListener(
    "change",
    () => {
      updateVoiceList();
    }
  );

  $("speaker")?.addEventListener(
    "change",
    () => {
      setStatus(
        "voiceStatus",
        "Teacher voice selected."
      );
    }
  );

  $("pace")?.addEventListener(
    "change",
    () => {
      setStatus(
        "voiceStatus",
        "Speaking speed updated."
      );
    }
  );

  $("generate")?.addEventListener(
    "click",
    generateVoiceover
  );

  $("previewVoice")?.addEventListener(
    "click",
    previewVoice
  );

  const stop =
    $("stopVoice") ||
    $("stopVoiceover");

  stop?.addEventListener(
    "click",
    stopVoiceover
  );

  $("clearScript")?.addEventListener(
    "click",
    () => {
      if ($("script")) {
        $("script").value = "";
      }

      updateCharacterCounter();
      displayChunks([]);

      setStatus(
        "voiceStatus",
        "Script cleared."
      );
    }
  );

  $("script")?.addEventListener(
    "input",
    () => {
      updateCharacterCounter();

      const chunks =
        splitText(
          $("script").value,
          1800
        );

      displayChunks(chunks);
    }
  );

  document.addEventListener(
    "keydown",
    event => {
      if (
        event.key === "Escape" &&
        voiceIsRunning
      ) {
        stopVoiceover();
      }
    }
  );

  setTimeout(
    loadBrowserVoices,
    500
  );
}

function updateCharacterCounter() {
  const text =
    $("script")?.value || "";

  const length =
    text.length;

  if ($("charCount")) {
    $("charCount").textContent =
      `${length} characters`;
  }

  if ($("count")) {
    $("count").textContent =
      `${length} characters`;
  }
}


/* =========================================================
   LESSON BUILDER
   ========================================================= */

let lessonSlides = [];

function renderLessonSlides() {
  const container =
    $("slidesContainer");

  if (!container) return;

  container.innerHTML = "";

  if (lessonSlides.length === 0) {
    container.innerHTML =
      `<div class="empty-state">
        No slides added yet.
      </div>`;
    return;
  }

  lessonSlides.forEach(
    (slide, index) => {

      const card =
        document.createElement("div");

      card.className =
        "slide-card";

      card.innerHTML = `
        <strong>Slide ${index + 1}</strong>

        <input
          class="slide-title"
          data-index="${index}"
          value="${escapeHTML(slide.title)}"
          placeholder="Slide title"
        >

        <textarea
          class="slide-script"
          data-index="${index}"
          placeholder="Slide narration..."
        >${escapeHTML(slide.script)}</textarea>

        <div class="slide-actions">
          <button
            class="small-btn"
            data-slide-up="${index}"
          >↑</button>

          <button
            class="small-btn"
            data-slide-down="${index}"
          >↓</button>

          <button
            class="small-btn"
            data-slide-delete="${index}"
          >Delete</button>
        </div>
      `;

      container.appendChild(card);
    }
  );

  container
    .querySelectorAll(".slide-title")
    .forEach(input => {
      input.addEventListener(
        "input",
        event => {
          const index =
            Number(
              event.target.dataset.index
            );

          lessonSlides[index].title =
            event.target.value;
        }
      );
    });

  container
    .querySelectorAll(".slide-script")
    .forEach(input => {
      input.addEventListener(
        "input",
        event => {
          const index =
            Number(
              event.target.dataset.index
            );

          lessonSlides[index].script =
            event.target.value;
        }
      );
    });

  container
    .querySelectorAll(
      "[data-slide-delete]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const index =
            Number(
              button.dataset.slideDelete
            );

          lessonSlides.splice(
            index,
            1
          );

          renderLessonSlides();
        }
      );
    });

  container
    .querySelectorAll(
      "[data-slide-up]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const index =
            Number(
              button.dataset.slideUp
            );

          if (index > 0) {
            [
              lessonSlides[index - 1],
              lessonSlides[index]
            ] = [
              lessonSlides[index],
              lessonSlides[index - 1]
            ];

            renderLessonSlides();
          }
        }
      );
    });

  container
    .querySelectorAll(
      "[data-slide-down]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => {
          const index =
            Number(
              button.dataset.slideDown
            );

          if (
            index <
            lessonSlides.length - 1
          ) {
            [
              lessonSlides[index],
              lessonSlides[index + 1]
            ] = [
              lessonSlides[index + 1],
              lessonSlides[index]
            ];

            renderLessonSlides();
          }
        }
      );
    });
}

function addLessonSlide() {
  lessonSlides.push({
    title:
      `Slide ${lessonSlides.length + 1}`,
    script: ""
  });

  renderLessonSlides();
}

function clearLessonSlides() {
  lessonSlides = [];
  renderLessonSlides();

  setStatus(
    "lessonStatus",
    "Lesson cleared."
  );
}

function buildLessonScript() {
  return lessonSlides
    .map((slide, index) => {
      return (
        `Slide ${index + 1}. ` +
        `${slide.title}. ` +
        `${slide.script}`
      );
    })
    .join("\n\n");
}

function generateLesson() {
  const script =
    buildLessonScript();

  if (!script.trim()) {
    setStatus(
      "lessonStatus",
      "Add some slide content first.",
      "error"
    );
    return;
  }

  if ($("script")) {
    $("script").value =
      script;

    updateCharacterCounter();

    displayChunks(
      splitText(script, 1800)
    );
  }

  activateTab("voiceover");

  setStatus(
    "voiceStatus",
    "Lesson script added to Voiceover Studio.",
    "success"
  );
}

function setupLessonBuilder() {
  $("addSlide")?.addEventListener(
    "click",
    addLessonSlide
  );

  $("clearSlides")?.addEventListener(
    "click",
    clearLessonSlides
  );

  $("generateLesson")?.addEventListener(
    "click",
    generateLesson
  );

  renderLessonSlides();
}


/* =========================================================
   AUDIO MERGE
   ========================================================= */

let mergeAudioFiles = [];

function renderMergeFiles() {
  const container =
    $("mergeList");

  if (!container) return;

  container.innerHTML = "";

  mergeAudioFiles.forEach(
    (file, index) => {

      const item =
        document.createElement("div");

      item.className =
        "merge-item";

      item.innerHTML = `
        <strong>${index + 1}. ${escapeHTML(file.name)}</strong>
        <button
          class="small-btn"
          data-remove-merge="${index}"
        >
          Remove
        </button>
      `;

      container.appendChild(item);
    }
  );

  container
    .querySelectorAll(
      "[data-remove-merge]"
    )
    .forEach(button => {
      button.addEventListener(
        "click",
        () => 
        {
          const index =
            Number(
              button.dataset.removeMerge
            );

          mergeAudioFiles.splice(
            index,
            1
          );

          renderMergeFiles();
        }
      );
    });
}


/* =========================================================
   AUDIO MERGE — FILE SELECTION
========================================================= */

mergeFilesInput?.addEventListener(
  "change",
  event => {

    const files =
      Array.from(
        event.target.files || []
      );

    if (!files.length) {
      return;
    }

    /*
      Add selected files to the
      existing merge list.
    */

    files.forEach(file => {

      if (
        !file.type.startsWith(
          "audio/"
        )
      ) {
        return;
      }

      const alreadyAdded =
        mergeAudioFiles.some(
          existing =>
            existing.name === file.name &&
            existing.size === file.size
        );

      if (!alreadyAdded) {
        mergeAudioFiles.push(file);
      }

    });

    renderMergeFiles();

    setStatus(
      "mergeStatus",
      `${mergeAudioFiles.length} audio file${
        mergeAudioFiles.length === 1
          ? ""
          : "s"
      } selected.`
    );

    /*
      Allow the same file to be
      selected again later.
    */

    event.target.value = "";
  }
);


/* =========================================================
   DECODE AUDIO FILE
========================================================= */

async function decodeAudioFile(
  file,
  audioContext
) {

  const arrayBuffer =
    await file.arrayBuffer();

  return await audioContext.decodeAudioData(
    arrayBuffer
  );
}


/* =========================================================
   CALCULATE TOTAL DURATION
========================================================= */

async function calculateMergeDuration() {

  if (
    mergeAudioFiles.length === 0
  ) {
    return 0;
  }

  const audioContext =
    new (
      window.AudioContext ||
      window.webkitAudioContext
    )();

  let totalDuration = 0;

  try {

    for (
      const file of mergeAudioFiles
    ) {

      const buffer =
        await decodeAudioFile(
          file,
          audioContext
        );

      totalDuration +=
        buffer.duration;
    }

  } finally {

    await audioContext.close();

  }

  return totalDuration;
}


/* =========================================================
   MERGE AUDIO FILES
========================================================= */

async function mergeAudioFilesIntoOne() {

  if (
    mergeAudioFiles.length === 0
  ) {

    setStatus(
      "mergeStatus",
      "Please select at least one audio file.",
      "error"
    );

    return;

  }


  const button =
    $("mergeBtn");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Merging...";

  }


  try {

    setStatus(
      "mergeStatus",
      "Loading audio files..."
    );


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContextClass) {

      throw new Error(
        "Web Audio is not supported in this browser."
      );

    }


    const audioContext =
      new AudioContextClass();


    const buffers = [];


    /*
      Decode every selected file.
    */

    for (
      let i = 0;
      i < mergeAudioFiles.length;
      i++
    ) {

      const file =
        mergeAudioFiles[i];


      setStatus(
        "mergeStatus",
        `Reading ${i + 1} of ${mergeAudioFiles.length}: ${file.name}`
      );


      const buffer =
        await decodeAudioFile(
          file,
          audioContext
        );


      buffers.push(
        buffer
      );

    }


    /*
      Find the maximum number
      of channels.
    */

    const numberOfChannels =
      Math.max(
        ...buffers.map(
          buffer =>
            buffer.numberOfChannels
        )
      );


    /*
      Use the first buffer's
      sample rate.
    */

    const sampleRate =
      buffers[0].sampleRate;


    /*
      Calculate total samples.
    */

    const totalLength =
      buffers.reduce(
        (
          total,
          buffer
        ) =>
          total +
          Math.ceil(
            buffer.duration *
            sampleRate
          ),
        0
      );


    /*
      Create the final merged
      AudioBuffer.
    */

    const mergedBuffer =
      audioContext.createBuffer(
        numberOfChannels,
        totalLength,
        sampleRate
      );


    let offset =
      0;


    /*
      Copy each audio file
      one after another.
    */

    for (
      const buffer of buffers
    ) {

      const length =
        buffer.length;


      for (
        let channel = 0;
        channel <
          numberOfChannels;
        channel++
      ) {

        const destination =
          mergedBuffer.getChannelData(
            channel
          );


        if (
          channel <
          buffer.numberOfChannels
        ) {

          const source =
            buffer.getChannelData(
              channel
            );


          destination.set(
            source,
            offset
          );

        } else {

          /*
            If the current file
            has fewer channels,
            duplicate channel 0.
          */

          const source =
            buffer.getChannelData(
              0
            );


          destination.set(
            source,
            offset
          );

        }

      }


      offset +=
        length;

    }


    /*
      Convert merged AudioBuffer
      into WAV.
    */

    const wavBlob =
      audioBufferToWav(
        mergedBuffer
      );


    /*
      Release AudioContext.
    */

    await audioContext.close();


    /*
      Create download URL.
    */

    if (
      mergeDownload?.href
    ) {

      URL.revokeObjectURL(
        mergeDownload.href
      );

    }


    const url =
      URL.createObjectURL(
        wavBlob
      );


    if (mergeDownload) {

      mergeDownload.href =
        url;

      mergeDownload.download =
        "VANTARA_Merged_Audio.wav";

      mergeDownload.hidden =
        false;

      mergeDownload.textContent =
        "Download Merged Audio";

    }


    setStatus(
      "mergeStatus",
      `Successfully merged ${mergeAudioFiles.length} audio files.`,
      "success"
    );


  } catch (error) {

    console.error(
      "Audio merge error:",
      error
    );


    setStatus(
      "mergeStatus",
      error.message ||
        "Unable to merge audio files.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Merge Audio";

    }

  }

}


/* =========================================================
   MERGE BUTTON
========================================================= */

$("mergeBtn")?.addEventListener(
  "click",
  mergeAudioFilesIntoOne
);


/* =========================================================
   CLEAR MERGE LIST
========================================================= */

function clearMergeFiles() {

  mergeAudioFiles.length =
    0;

  renderMergeFiles();

  if (mergeDownload) {

    mergeDownload.hidden =
      true;

    mergeDownload.removeAttribute(
      "href"
    );

  }

  setStatus(
    "mergeStatus",
    "Merge list cleared."
  );

}


/*
  Optional clear button.
  Works if your HTML contains:
  id="clearMerge"
*/

$("clearMerge")?.addEventListener(
  "click",
  clearMergeFiles
);


/* =========================================================
   MOVE MERGE FILE UP
========================================================= */

function moveMergeFileUp(
  index
) {

  if (
    index <= 0 ||
    index >=
      mergeAudioFiles.length
  ) {
    return;
  }


  const temp =
    mergeAudioFiles[index];


  mergeAudioFiles[index] =
    mergeAudioFiles[
      index - 1
    ];


  mergeAudioFiles[
    index - 1
  ] =
    temp;


  renderMergeFiles();

}


/* =========================================================
   MOVE MERGE FILE DOWN
========================================================= */

function moveMergeFileDown(
  index
) {

  if (
    index < 0 ||
    index >=
      mergeAudioFiles.length - 1
  ) {
    return;
  }


  const temp =
    mergeAudioFiles[index];


  mergeAudioFiles[index] =
    mergeAudioFiles[
      index + 1
    ];


  mergeAudioFiles[
    index + 1
  ] =
    temp;


  renderMergeFiles();

}


/* =========================================================
   OPTIONAL UP / DOWN BUTTONS
========================================================= */

mergeList?.addEventListener(
  "click",
  event => {

    const upButton =
      event.target.closest(
        "[data-move-up]"
      );


    const downButton =
      event.target.closest(
        "[data-move-down]"
      );


    if (upButton) {

      moveMergeFileUp(
        Number(
          upButton.dataset.moveUp
        )
      );

    }


    if (downButton) {

      moveMergeFileDown(
        Number(
          downButton.dataset.moveDown
        )
      );

    }

  }
);


/* =========================================================
   DRAG & DROP MERGE ORDER
========================================================= */

let draggedMergeIndex =
  null;


function enableMergeDragOrdering() {

  if (!mergeList) {
    return;
  }


  const items =
    mergeList.querySelectorAll(
      ".merge-item"
    );


  items.forEach(
    (item, index) => {

      item.draggable =
        true;


      item.addEventListener(
        "dragstart",
        () => {

          draggedMergeIndex =
            index;

          item.classList.add(
            "dragging"
          );

        }
      );


      item.addEventListener(
        "dragend",
        () => {

          draggedMergeIndex =
            null;

          item.classList.remove(
            "dragging"
          );

        }
      );


      item.addEventListener(
        "dragover",
        event => {

          event.preventDefault();

        }
      );


      item.addEventListener(
        "drop",
        event => {

          event.preventDefault();


          const targetIndex =
            index;


          if (
            draggedMergeIndex ===
              null ||
            draggedMergeIndex ===
              targetIndex
          ) {
            return;
          }


          const movedFile =
            mergeAudioFiles.splice(
              draggedMergeIndex,
              1
            )[0];


          mergeAudioFiles.splice(
            targetIndex,
            0,
            movedFile
          );


          renderMergeFiles();

        }
      );

    }
  );

}


/*
  Re-enable drag ordering
  whenever the list changes.
*/

const originalRenderMergeFiles =
  renderMergeFiles;


renderMergeFiles =
  function () {

    originalRenderMergeFiles();

    enableMergeDragOrdering();

  };


renderMergeFiles();


/* =========================================================
   BRAND KIT
========================================================= */

const defaultBrandSettings = {

  name:
    "VANTARA EDUCATION",

  website:
    "https://vantara-education.vercel.app/",

  teacher:
    "VANTARA EDUCATION",

  footer:
    "VANTARA EDUCATION • OLYMPIAD HUB"

};


let brandSettings = {

  ...defaultBrandSettings

};


try {

  const savedBrand =
    localStorage.getItem(
      "vantaraBrandSettings"
    );


  if (savedBrand) {

    brandSettings =
      {
        ...defaultBrandSettings,
        ...JSON.parse(
          savedBrand
        )
      };

  }

} catch (error) {

  console.warn(
    "Unable to load brand settings.",
    error
  );

}


/* =========================================================
   APPLY BRAND SETTINGS
========================================================= */

function applyBrandSettings() {

  const brandName =
    $("brandName");


  const brandWebsite =
    $("brandWebsite");


  const brandTeacher =
    $("brandTeacher");


  const brandFooter =
    $("brandFooter");


  if (brandName) {

    brandName.value =
      brandSettings.name;

  }


  if (brandWebsite) {

    brandWebsite.value =
      brandSettings.website;

  }


  if (brandTeacher) {

    brandTeacher.value =
      brandSettings.teacher;

  }


  if (brandFooter) {

    brandFooter.value =
      brandSettings.footer;

  }


  /*
    Update visible footer.
  */

  const footer =
    document.querySelector(
      "footer"
    );


  if (footer) {

    footer.textContent =
      brandSettings.footer;

  }

}


/* =========================================================
   SAVE BRAND SETTINGS
========================================================= */

$("saveBrand")?.addEventListener(
  "click",
  () => {

    brandSettings = {

      name:
        $("brandName")?.value.trim() ||
        defaultBrandSettings.name,

      website:
        $("brandWebsite")?.value.trim() ||
        defaultBrandSettings.website,

      teacher:
        $("brandTeacher")?.value.trim() ||
        defaultBrandSettings.teacher,

      footer:
        $("brandFooter")?.value.trim() ||
        defaultBrandSettings.footer

    };


    localStorage.setItem(
      "vantaraBrandSettings",
      JSON.stringify(
        brandSettings
      )
    );


    applyBrandSettings();


    setStatus(
      "brandStatus",
      "Brand settings saved successfully.",
      "success"
    );

  }
);


/* =========================================================
   RESET BRAND SETTINGS
========================================================= */

$("resetBrand")?.addEventListener(
  "click",
  () => {

    brandSettings =
      {
        ...defaultBrandSettings
      };


    localStorage.setItem(
      "vantaraBrandSettings",
      JSON.stringify(
        brandSettings
      )
    );


    applyBrandSettings();


    setStatus(
      "brandStatus",
      "Brand settings restored."
    );

  }
);


applyBrandSettings();


/* =========================================================
   FINAL STARTUP
========================================================= */

console.log(
  "VANTARA EDITOR V2 loaded successfully."
);