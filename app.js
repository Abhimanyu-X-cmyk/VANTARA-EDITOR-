"use strict";

/* =========================================================
   VANTARA EDITOR V2
   PART 1A
   CORE SETUP + TABS + THEME + VOICE SYSTEM
========================================================= */


/* =========================================================
   BASIC SELECTOR
========================================================= */

function $(id) {
  return document.getElementById(id);
}


/* =========================================================
   STATUS MESSAGE
========================================================= */

function setStatus(
  id,
  message,
  type = ""
) {

  const element = $(id);

  if (!element) return;

  element.textContent = message;

  element.className =
    "status " + type;
}


/* =========================================================
   DOWNLOAD HELPER
========================================================= */

function downloadBlob(
  blob,
  filename
) {

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;
  link.download = filename;

  document.body.appendChild(link);

  link.click();

  link.remove();

  setTimeout(
    () => URL.revokeObjectURL(url),
    1000
  );
}


/* =========================================================
   HTML ESCAPE HELPER
========================================================= */

function escapeHTML(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}


/* =========================================================
   TAB NAVIGATION
========================================================= */

const tabs =
  document.querySelectorAll(
    ".tab"
  );

const panels =
  document.querySelectorAll(
    ".panel"
  );

tabs.forEach(
  (tab) => {

    tab.addEventListener(
      "click",
      () => {

        const target =
          tab.dataset.tab;

        tabs.forEach(
          item =>
            item.classList.remove(
              "active"
            )
        );

        panels.forEach(
          panel =>
            panel.classList.remove(
              "active"
            )
        );

        tab.classList.add(
          "active"
        );

        const panel =
          document.getElementById(
            target
          );

        if (panel) {

          panel.classList.add(
            "active"
          );

        }

      }
    );

  }
);


/* =========================================================
   DARK / LIGHT THEME
========================================================= */

const themeButton =
  $("themeToggle");

if (themeButton) {

  themeButton.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light"
      );

      const isLight =
        document.body.classList.contains(
          "light"
        );

      localStorage.setItem(
        "vantara-theme",
        isLight
          ? "light"
          : "dark"
      );

    }
  );

}


/* =========================================================
   LOAD SAVED THEME
========================================================= */

const savedTheme =
  localStorage.getItem(
    "vantara-theme"
  );

if (
  savedTheme === "light"
) {

  document.body.classList.add(
    "light"
  );

}


/* =========================================================
   BROWSER SPEECH SYNTHESIS
========================================================= */

let availableVoices = [];

let selectedBrowserVoice = null;


/* =========================================================
   LOAD BROWSER VOICES
========================================================= */

function loadBrowserVoices() {

  if (
    !("speechSynthesis" in window)
  ) {

    setStatus(
      "voiceStatus",
      "Browser voice synthesis is not supported.",
      "error"
    );

    return;

  }

  availableVoices =
    window.speechSynthesis
      .getVoices();

  updateVoiceList();

}


/* =========================================================
   VOICE GENDER DETECTION
========================================================= */

function detectVoiceGender(
  voice
) {

  const name =
    voice.name.toLowerCase();

  const femaleKeywords = [
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

  const maleKeywords = [
    "male",
    "david",
    "mark",
    "daniel",
    "james",
    "george",
    "ravi",
    "hemant",
    "madhur"
  ];

  if (
    femaleKeywords.some(
      keyword =>
        name.includes(keyword)
    )
  ) {

    return "female";

  }

  if (
    maleKeywords.some(
      keyword =>
        name.includes(keyword)
    )
  ) {

    return "male";

  }

  return "unknown";

}


/* =========================================================
   GET SELECTED GENDER
========================================================= */

function getSelectedGender() {

  return (
    $("voiceGender")?.value ||
    "male"
  );

}


/* =========================================================
   UPDATE VOICE DROPDOWN
========================================================= */

function updateVoiceList() {

  const speaker =
    $("speaker");

  if (!speaker) return;

  const gender =
    getSelectedGender();

  speaker.innerHTML = "";

  let voices =
    availableVoices;

  if (
    gender !== "all"
  ) {

    const matchingVoices =
      availableVoices.filter(
        voice =>
          detectVoiceGender(
            voice
          ) === gender
      );

    /*
      Some browsers don't expose
      gender information.

      If no matching voices are
      detected, show all voices
      instead of leaving the list empty.
    */

    if (
      matchingVoices.length > 0
    ) {

      voices =
        matchingVoices;

    }

  }


  if (
    voices.length === 0
  ) {

    const option =
      document.createElement(
        "option"
      );

    option.value = "";

    option.textContent =
      "No browser voices found";

    speaker.appendChild(
      option
    );

    return;

  }


  voices.forEach(
    (
      voice,
      index
    ) => {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        index;

      option.textContent =
        `${voice.name} — ${voice.lang}`;

      option.dataset.voiceName =
        voice.name;

      speaker.appendChild(
        option
      );

    }
  );


  selectedBrowserVoice =
    voices[0] || null;

}


/* =========================================================
   GENDER CHANGE
========================================================= */

$("voiceGender")?.addEventListener(
  "change",
  () => {

    updateVoiceList();

    const gender =
      getSelectedGender();

    let label =
      "All";

    if (
      gender === "male"
    ) {

      label =
        "Male";

    }

    if (
      gender === "female"
    ) {

      label =
        "Female";

    }

    setStatus(
      "voiceStatus",
      `${label} voices loaded.`
    );

  }
);


/* =========================================================
   VOICE SELECTION
========================================================= */

$("speaker")?.addEventListener(
  "change",
  () => {

    const index =
      Number(
        $("speaker").value
      );

    const gender =
      getSelectedGender();

    let voices =
      availableVoices;

    if (
      gender !== "all"
    ) {

      const matchingVoices =
        availableVoices.filter(
          voice =>
            detectVoiceGender(
              voice
            ) === gender
        );

      if (
        matchingVoices.length > 0
      ) {

        voices =
          matchingVoices;

      }

    }

    selectedBrowserVoice =
      voices[index] ||
      null;

    if (
      selectedBrowserVoice
    ) {

      setStatus(
        "voiceStatus",
        `Selected: ${selectedBrowserVoice.name}`
      );

    }

  }
);


/* =========================================================
   VOICES CHANGED EVENT
========================================================= */

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
/* =========================================================
   /* =========================================================
   VANTARA EDITOR V2
   PART 1B — FIXED SPEECH SYNTHESIS
========================================================= */

function getSelectedLanguage() {

  return $("language")?.value || "hi-IN";

}


function getSelectedPace() {

  return Number(
    $("pace")?.value || 1
  );

}


function getSelectedVoice() {

  const select =
    $("speaker");

  if (!select) return null;

  const voiceName =
    select.value;

  return availableVoices.find(
    voice =>
      voice.name === voiceName
  ) || null;

}


/* =========================================================
   WAIT FOR BROWSER VOICES
========================================================= */

function waitForVoices(timeout = 3000) {

  return new Promise(
    resolve => {

      const synth =
        window.speechSynthesis;

      const existing =
        synth.getVoices();

      if (existing.length > 0) {

        resolve(existing);
        return;

      }


      let finished = false;


      const finish = () => {

        if (finished) return;

        finished = true;

        synth.removeEventListener(
          "voiceschanged",
          finish
        );

        resolve(
          synth.getVoices()
        );

      };


      synth.addEventListener(
        "voiceschanged",
        finish
      );


      setTimeout(
        finish,
        timeout
      );

    }
  );

}


/* =========================================================
   SPEAK TEXT
========================================================= */

function speakText(text) {

  return new Promise(
    async (resolve, reject) => {

      if (
        !text ||
        !text.trim()
      ) {

        resolve();
        return;

      }


      if (
        !("speechSynthesis" in window)
      ) {

        reject(
          new Error(
            "Speech synthesis is not supported in this browser."
          )
        );

        return;

      }


      try {

        /*
          Make sure browser voices
          have loaded first.
        */

        await waitForVoices();


        const synth =
          window.speechSynthesis;


        /*
          Cancel any previous
          unfinished speech.
        */

        synth.cancel();


        /*
          Small delay helps some
          Android browsers restart
          speech synthesis correctly.
        */

        await new Promise(
          r =>
            setTimeout(
              r,
              100
            )
        );


        const utterance =
          new SpeechSynthesisUtterance(
            text
          );


        utterance.lang =
          getSelectedLanguage();


        utterance.rate =
          getSelectedPace();


        utterance.pitch =
          1;


        utterance.volume =
          1;


        const selectedVoice =
          getSelectedVoice();


        /*
          Only assign a voice if
          it actually exists.
        */

        if (selectedVoice) {

          utterance.voice =
            selectedVoice;

          /*
            Keep language aligned
            with selected language.
          */

          utterance.lang =
            selectedVoice.lang ||
            getSelectedLanguage();

        }


        let started = false;


        utterance.onstart =
          () => {

            started = true;

          };


        utterance.onend =
          () => {

            resolve();

          };


        utterance.onerror =
          event => {

            /*
              "interrupted" and
              "canceled" are usually
              caused by another speech
              request, so report them
              clearly.
            */

            if (
              event.error ===
                "canceled" ||
              event.error ===
                "interrupted"
            ) {

              resolve();

              return;

            }


            reject(
              new Error(
                `Speech synthesis failed: ${
                  event.error || "unknown error"
                }`
              )
            );

          };


        /*
          Android Chrome sometimes
          needs speechSynthesis.resume()
          before speaking.
        */

        synth.resume();


        synth.speak(
          utterance
        );


        /*
          Safety check.
          If speech never starts,
          retry once without a
          manually selected voice.
        */

        setTimeout(
          () => {

            if (
              !started &&
              !synth.speaking
            ) {

              synth.cancel();


              const retry =
                new SpeechSynthesisUtterance(
                  text
                );


              retry.lang =
                getSelectedLanguage();


              retry.rate =
                getSelectedPace();


              retry.pitch =
                1;


              retry.volume =
                1;


              retry.onend =
                () => resolve();


              retry.onerror =
                event => {

                  reject(
                    new Error(
                      `Speech synthesis failed: ${
                        event.error || "unknown error"
                      }`
                    )
                  );

                };


              synth.resume();


              synth.speak(
                retry
              );

            }

          },
          700
        );

      } catch (error) {

        reject(
          error
        );

      }

    }
  );

}


/* =========================================================
   SCRIPT CHARACTER COUNTER
========================================================= */

$("script")?.addEventListener(
  "input",
  () => {

    const text =
      $("script").value || "";


    if ($("charCount")) {

      $("charCount").textContent =
        `${text.length} characters`;

    }


    if ($("count")) {

      $("count").textContent =
        `${text.length} characters`;

    }

  }
);


/* =========================================================
   SPLIT LONG SCRIPT
========================================================= */

function splitText(
  text,
  maxLength = 1800
) {

  const clean =
    text.trim();


  if (!clean) {

    return [];

  }


  const words =
    clean.split(
      /\s+/
    );


  const chunks = [];

  let current = "";


  for (
    const word of words
  ) {

    if (
      (current + " " + word)
        .trim()
        .length <= maxLength
    ) {

      current =
        `${current} ${word}`.trim();

    } else {

      if (current) {

        chunks.push(
          current
        );

      }

      current =
        word;

    }

  }


  if (current) {

    chunks.push(
      current
    );

  }


  return chunks;

}


/* =========================================================
   DISPLAY CHUNKS
========================================================= */

function displayChunks(
  chunks
) {

  const container =
    $("chunkLog");


  if (!container) return;


  container.innerHTML = "";


  chunks.forEach(
    (
      chunk,
      index
    ) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "chunk-item";


      item.textContent =
        `Part ${index + 1}: ${chunk.length} characters`;


      container.appendChild(
        item
      );

    }
  );

}


/* =========================================================
   LANGUAGE CHANGE
========================================================= */

$("language")?.addEventListener(
  "change",
  () => {

    updateVoiceList();


    setStatus(
      "voiceStatus",
      "Language updated. Select a suitable browser voice."
    );

  }
);


/* =========================================================
   PACE CHANGE
========================================================= */

$("pace")?.addEventListener(
  "change",
  () => {

    setStatus(
      "voiceStatus",
      `Speaking speed set to ${getSelectedPace()}×.`
    );

  }
);


/* =========================================================
   INITIAL STATUS
========================================================= */

if ($("voiceStatus")) {

  setStatus(
    "voiceStatus",
    "Ready. Enter your script and generate the voiceover."
  );

}
   VANTARA EDITOR V2
   PART 2A
   GENERATE + PREVIEW + STOP
========================================================= */

let voiceIsRunning = false;


/* =========================================================
   GENERATE VOICEOVER
========================================================= */

$("generate")?.addEventListener(
  "click",
  async () => {

    const text =
      $("script")?.value?.trim();

    if (!text) {

      setStatus(
        "voiceStatus",
        "Please enter your teacher script first.",
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


    const chunks =
      splitText(
        text,
        1800
      );

    displayChunks(chunks);

    if (
      chunks.length === 0
    ) {

      setStatus(
        "voiceStatus",
        "No readable text found.",
        "error"
      );

      return;
    }


    voiceIsRunning = true;

    const generateButton =
      $("generate");

    if (generateButton) {

      generateButton.disabled =
        true;

      generateButton.textContent =
        "Generating...";

    }


    try {

      for (
        let i = 0;
        i < chunks.length;
        i++
      ) {

        if (!voiceIsRunning) {
          break;
        }


        setStatus(
          "voiceStatus",
          `Playing voiceover part ${i + 1} of ${chunks.length}...`,
          "warning"
        );


        await speakText(
          chunks[i]
        );

      }


      if (voiceIsRunning) {

        setStatus(
          "voiceStatus",
          "Voiceover completed successfully.",
          "success"
        );

      } else {

        setStatus(
          "voiceStatus",
          "Voiceover stopped."
        );

      }

    } catch (error) {

      setStatus(
        "voiceStatus",
        error.message ||
          "Voiceover failed.",
        "error"
      );

    } finally {

      voiceIsRunning =
        false;

      if (generateButton) {

        generateButton.disabled =
          false;

        generateButton.textContent =
          "Generate Voiceover";

      }

    }

  }
);


/* =========================================================
   PREVIEW VOICE
========================================================= */

$("previewVoice")?.addEventListener(
  "click",
  async () => {

    const text =
      $("script")?.value?.trim();

    if (!text) {

      setStatus(
        "voiceStatus",
        "Enter some text before previewing.",
        "error"
      );

      return;
    }


    const previewText =
      text.length > 500
        ? text.slice(0, 500)
        : text;


    try {

      voiceIsRunning =
        true;

      setStatus(
        "voiceStatus",
        "Playing voice preview...",
        "warning"
      );

      await speakText(
        previewText
      );

      if (voiceIsRunning) {

        setStatus(
          "voiceStatus",
          "Voice preview completed.",
          "success"
        );

      }

    } catch (error) {

      setStatus(
        "voiceStatus",
        error.message ||
          "Preview failed.",
        "error"
      );

    } finally {

      voiceIsRunning =
        false;

    }

  }
);


/* =========================================================
   STOP VOICE
========================================================= */

function stopVoice() {

  voiceIsRunning =
    false;

  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis.cancel();

  }

  const generateButton =
    $("generate");

  if (generateButton) {

    generateButton.disabled =
      false;

    generateButton.textContent =
      "Generate Voiceover";

  }

  setStatus(
    "voiceStatus",
    "Voice playback stopped."
  );

}


/* =========================================================
   STOP BUTTON
========================================================= */

$("stopVoice")?.addEventListener(
  "click",
  stopVoice
);


/* =========================================================
   ESCAPE KEY = STOP VOICE
========================================================= */

document.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Escape" &&
      voiceIsRunning
    ) {

      stopVoice();

    }

  }
);
/* =========================================================
   PART 2B
   VOICE CONTROLS
========================================================= */


/* =========================================================
   TEST SELECTED VOICE
========================================================= */

$("testVoice")?.addEventListener(
  "click",
  async () => {

    const voice =
      getSelectedVoice();

    const language =
      getSelectedLanguage();

    const gender =
      getSelectedGender();

    let sample =
      "Welcome to Vantara Education. Let's begin our learning journey.";

    if (
      language === "hi-IN"
    ) {

      sample =
        "नमस्ते विद्यार्थियों। Vantara Education में आपका स्वागत है। चलिए अपनी learning journey शुरू करते हैं।";

    }


    try {

      voiceIsRunning =
        true;

      setStatus(
        "voiceStatus",
        `Testing ${gender} voice...`,
        "warning"
      );

      await speakText(
        sample
      );

      if (voiceIsRunning) {

        setStatus(
          "voiceStatus",
          voice
            ? `Voice test completed: ${voice.name}`
            : "Voice test completed.",
          "success"
        );

      }

    } catch (error) {

      setStatus(
        "voiceStatus",
        error.message ||
          "Voice test failed.",
        "error"
      );

    } finally {

      voiceIsRunning =
        false;

    }

  }
);


/* =========================================================
   FALLBACK FOR DIFFERENT BUTTON ID
========================================================= */

$("previewVoice")?.addEventListener(
  "dblclick",
  () => {

    if ($("testVoice")) {
      return;
    }

  }
);


/* =========================================================
   LANGUAGE + VOICE INFORMATION
========================================================= */

function updateVoiceInformation() {

  const voice =
    getSelectedVoice();

  const gender =
    getSelectedGender();

  if (!voice) {

    return;

  }

  const genderText =
    gender === "male"
      ? "Male"
      : gender === "female"
        ? "Female"
        : "All";

  setStatus(
    "voiceStatus",
    `${genderText} • ${voice.name} • ${voice.lang}`
  );

}


/* =========================================================
   VOICE GENDER UPDATE
========================================================= */

$("voiceGender")?.addEventListener(
  "change",
  () => {

    setTimeout(
      updateVoiceInformation,
      50
    );

  }
);


/* =========================================================
   SPEAKER UPDATE
========================================================= */

$("speaker")?.addEventListener(
  "change",
  () => {

    setTimeout(
      updateVoiceInformation,
      50
    );

  }
);


/* =========================================================
   LANGUAGE UPDATE
========================================================= */

$("language")?.addEventListener(
  "change",
  () => {

    const language =
      getSelectedLanguage();

    if (
      language === "hi-IN"
    ) {

      setStatus(
        "voiceStatus",
        "Hindi / Hinglish voice selected."
      );

    } else {

      setStatus(
        "voiceStatus",
        "English (Indian) voice selected."
      );

    }

  }
);


/* =========================================================
   PACE UPDATE
========================================================= */

$("pace")?.addEventListener(
  "change",
  () => {

    const pace =
      getSelectedPace();

    setStatus(
      "voiceStatus",
      `Speaking speed set to ${pace}×.`
    );

  }
);


/* =========================================================
   INITIAL STATUS
========================================================= */

setTimeout(
  () => {

    if (
      availableVoices.length > 0
    ) {

      updateVoiceList();

      setStatus(
        "voiceStatus",
        "Choose Male or Female and select a voice."
      );

    }

  },
  500
);
/* =========================================================
   VANTARA EDITOR V2
   PART 3A
   LESSON BUILDER
========================================================= */

let lessonSlides = [];


/* =========================================================
   RENDER SLIDES
========================================================= */

function renderLessonSlides() {

  const container = $("slides");

  if (!container) return;

  container.innerHTML = "";

  if (lessonSlides.length === 0) {

    container.innerHTML = `
      <div class="empty-state">
        <strong>No slides added yet.</strong>
        <p>Add a slide to start building your lesson.</p>
      </div>
    `;

    return;
  }


  lessonSlides.forEach(
    (slide, index) => {

      const card =
        document.createElement("div");

      card.className =
        "slide-card";

      card.innerHTML = `
        <div class="slide-card-header">

          <strong>
            Slide ${index + 1}
          </strong>

          <button
            type="button"
            class="danger-btn"
            data-remove-slide="${index}">
            Remove
          </button>

        </div>

        <label>
          Slide Title
        </label>

        <input
          type="text"
          value="${escapeHTML(slide.title)}"
          data-slide-title="${index}"
          placeholder="Enter slide title"
        >

        <label>
          Teacher Script
        </label>

        <textarea
          data-slide-script="${index}"
          placeholder="Enter teacher narration..."
        >${escapeHTML(slide.script)}</textarea>
      `;

      container.appendChild(card);

    }
  );


  /* =======================================================
     REMOVE SLIDE
  ======================================================= */

  container
    .querySelectorAll(
      "[data-remove-slide]"
    )
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            const index =
              Number(
                button.dataset.removeSlide
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


  /* =======================================================
     UPDATE TITLES
  ======================================================= */

  container
    .querySelectorAll(
      "[data-slide-title]"
    )
    .forEach(
      (input) => {

        input.addEventListener(
          "input",
          () => {

            const index =
              Number(
                input.dataset.slideTitle
              );

            lessonSlides[index].title =
              input.value;

          }
        );

      }
    );


  /* =======================================================
     UPDATE SCRIPTS
  ======================================================= */

  container
    .querySelectorAll(
      "[data-slide-script]"
    )
    .forEach(
      (textarea) => {

        textarea.addEventListener(
          "input",
          () => {

            const index =
              Number(
                textarea.dataset.slideScript
              );

            lessonSlides[index].script =
              textarea.value;

          }
        );

      }
    );

}


/* =========================================================
   ADD SLIDE
========================================================= */

$("addSlide")?.addEventListener(
  "click",
  () => {

    lessonSlides.push({

      title:
        `Slide ${lessonSlides.length + 1}`,

      script: ""

    });

    renderLessonSlides();

  }
);


/* =========================================================
   CLEAR ALL SLIDES
========================================================= */

$("clearSlides")?.addEventListener(
  "click",
  () => {

    if (
      lessonSlides.length === 0
    ) {

      return;

    }


    if (
      !window.confirm(
        "Are you sure you want to clear all slides?"
      )
    ) {

      return;

    }


    lessonSlides = [];

    renderLessonSlides();

    setStatus(
      "lessonStatus",
      "All lesson slides cleared."
    );

  }
);


/* =========================================================
   GENERATE / PLAY LESSON
========================================================= */

$("generateLesson")?.addEventListener(
  "click",
  async () => {

    if (
      lessonSlides.length === 0
    ) {

      setStatus(
        "lessonStatus",
        "Please add at least one slide.",
        "error"
      );

      return;

    }


    const validSlides =
      lessonSlides.filter(
        slide =>
          slide.script &&
          slide.script.trim()
      );


    if (
      validSlides.length === 0
    ) {

      setStatus(
        "lessonStatus",
        "Add narration to at least one slide.",
        "error"
      );

      return;

    }


    try {

      voiceIsRunning =
        true;


      for (
        let i = 0;
        i < validSlides.length;
        i++
      ) {

        if (
          !voiceIsRunning
        ) {

          break;

        }


        setStatus(
          "lessonStatus",
          `Playing Slide ${i + 1} of ${validSlides.length}...`,
          "warning"
        );


        const chunks =
          splitText(
            validSlides[i].script,
            1800
          );


        for (
          let j = 0;
          j < chunks.length;
          j++
        ) {

          if (
            !voiceIsRunning
          ) {

            break;

          }


          await speakText(
            chunks[j]
          );

        }

      }


      if (
        voiceIsRunning
      ) {

        setStatus(
          "lessonStatus",
          "Lesson completed successfully.",
          "success"
        );

      } else {

        setStatus(
          "lessonStatus",
          "Lesson playback stopped."
        );

      }

    } catch (error) {

      setStatus(
        "lessonStatus",
        error.message ||
          "Lesson playback failed.",
        "error"
      );

    } finally {

      voiceIsRunning =
        false;

    }

  }
);


/* =========================================================
   INITIALIZE
========================================================= */

renderLessonSlides();
/* =========================================================
   VANTARA EDITOR V2
   PART 3B
   AUDIO MERGE
========================================================= */

let selectedMergeFiles = [];


/* =========================================================
   FILE SELECTION
========================================================= */

$("mergeFiles")?.addEventListener(
  "change",
  () => {

    selectedMergeFiles =
      Array.from(
        $("mergeFiles").files || []
      );

    renderMergeList();

  }
);


/* =========================================================
   SHOW SELECTED FILES
========================================================= */

function renderMergeList() {

  const container =
    $("mergeList");

  if (!container) return;

  container.innerHTML = "";


  if (
    selectedMergeFiles.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">
        <strong>No audio files selected.</strong>
        <p>Select your audio files in order.</p>
      </div>
    `;

    return;

  }


  selectedMergeFiles.forEach(
    (
      file,
      index
    ) => {

      const item =
        document.createElement(
          "div"
        );

      item.className =
        "project-card";

      item.innerHTML = `
        <strong>
          ${index + 1}. ${escapeHTML(file.name)}
        </strong>

        <p>
          ${(file.size / 1024 / 1024).toFixed(2)} MB
        </p>
      `;

      container.appendChild(item);

    }
  );

}


/* =========================================================
   MERGE BUTTON
========================================================= */

$("mergeBtn")?.addEventListener(
  "click",
  async () => {

    if (
      selectedMergeFiles.length === 0
    ) {

      setStatus(
        "mergeStatus",
        "Select audio files first.",
        "error"
      );

      return;

    }


    try {

      setStatus(
        "mergeStatus",
        "Reading audio files...",
        "warning"
      );


      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


      if (!AudioContextClass) {

        throw new Error(
          "Web Audio is not supported in this browser."
        );

      }


      const context =
        new AudioContextClass();


      const buffers = [];


      for (
        const file of selectedMergeFiles
      ) {

        setStatus(
          "mergeStatus",
          `Reading ${file.name}...`,
          "warning"
        );


        const data =
          await file.arrayBuffer();


        const decoded =
          await context.decodeAudioData(
            data
          );


        buffers.push(
          decoded
        );

      }


      setStatus(
        "mergeStatus",
        "Combining audio files...",
        "warning"
      );


      const merged =
        mergeAudioBuffers(
          context,
          buffers
        );


      const wav =
        audioBufferToWav(
          merged
        );


      const url =
        URL.createObjectURL(
          wav
        );


      const download =
        $("mergeDownload");


      if (download) {

        download.href =
          url;

        download.download =
          "vantara-merged-audio.wav";

        download.hidden =
          false;

        download.textContent =
          "Download merged audio";

      }


      setStatus(
        "mergeStatus",
        "Audio merged successfully.",
        "success"
      );


      await context.close();

    } catch (error) {

      setStatus(
        "mergeStatus",
        error.message ||
          "Audio merge failed.",
        "error"
      );

    }

  }
);


/* =========================================================
   MERGE AUDIO BUFFERS
========================================================= */

function mergeAudioBuffers(
  context,
  buffers
) {

  if (
    buffers.length === 0
  ) {

    throw new Error(
      "No audio buffers available."
    );

  }


  const sampleRate =
    context.sampleRate;


  let totalLength =
    0;


  buffers.forEach(
    buffer => {

      totalLength +=
        buffer.length;

    }
  );


  const channelCount =
    Math.max(
      ...buffers.map(
        buffer =>
          buffer.numberOfChannels
      )
    );


  const output =
    context.createBuffer(
      channelCount,
      totalLength,
      sampleRate
    );


  let offset = 0;


  buffers.forEach(
    buffer => {

      for (
        let channel = 0;
        channel < channelCount;
        channel++
      ) {

        const outputData =
          output.getChannelData(
            channel
          );


        const sourceChannel =
          Math.min(
            channel,
            buffer.numberOfChannels - 1
          );


        const inputData =
          buffer.getChannelData(
            sourceChannel
          );


        outputData.set(
          inputData,
          offset
        );

      }


      offset +=
        buffer.length;

    }
  );


  return output;

}


/* =========================================================
   INITIALIZE MERGE LIST
========================================================= */

renderMergeList();
/* =========================================================
   VANTARA EDITOR V2
   PART 4A
   AUDIO EDITOR + VOICE EFFECTS
========================================================= */

let editorAudioBuffer = null;
let editorAudioContext = null;


/* =========================================================
   AUDIO FILE LOAD
========================================================= */

$("audioFile")?.addEventListener(
  "change",
  async () => {

    const file =
      $("audioFile").files?.[0];

    if (!file) return;


    try {

      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;

      editorAudioContext =
        new AudioContextClass();


      const data =
        await file.arrayBuffer();


      editorAudioBuffer =
        await editorAudioContext.decodeAudioData(
          data
        );


      setStatus(
        "audioStatus",
        `${file.name} loaded successfully.`,
        "success"
      );


      const preview =
        $("audioPreview");

      if (preview) {

        preview.src =
          URL.createObjectURL(file);

        preview.hidden =
          false;

      }

    } catch (error) {

      setStatus(
        "audioStatus",
        "Could not read this audio file.",
        "error"
      );

    }

  }
);


/* =========================================================
   VOLUME SLIDER
========================================================= */

$("volume")?.addEventListener(
  "input",
  () => {

    const value =
      Number(
        $("volume").value
      );


    if ($("volumeValue")) {

      $("volumeValue").textContent =
        `${value}%`;

    }

  }
);


/* =========================================================
   PROCESS AUDIO
========================================================= */

$("processAudio")?.addEventListener(
  "click",
  async () => {

    if (!editorAudioBuffer) {

      setStatus(
        "audioStatus",
        "Please select an audio file first.",
        "error"
      );

      return;

    }


    try {

      setStatus(
        "audioStatus",
        "Processing audio...",
        "warning"
      );


      const volume =
        Number(
          $("volume")?.value || 100
        ) / 100;


      const fadeIn =
        Number(
          $("fadeIn")?.value || 0
        );


      const fadeOut =
        Number(
          $("fadeOut")?.value || 0
        );


      const buffer =
        editorAudioBuffer;


      const sampleRate =
        buffer.sampleRate;


      const length =
        buffer.length;


      const channels =
        buffer.numberOfChannels;


      const output =
        new AudioBuffer({
          length,
          numberOfChannels:
            channels,
          sampleRate
        });


      const fadeInSamples =
        Math.min(
          Math.floor(
            fadeIn * sampleRate
          ),
          length
        );


      const fadeOutSamples =
        Math.min(
          Math.floor(
            fadeOut * sampleRate
          ),
          length
        );


      for (
        let channel = 0;
        channel < channels;
        channel++
      ) {

        const input =
          buffer.getChannelData(
            channel
          );


        const out =
          output.getChannelData(
            channel
          );


        for (
          let i = 0;
          i < length;
          i++
        ) {

          let gain =
            volume;


          /* Fade in */

          if (
            fadeInSamples > 0 &&
            i < fadeInSamples
          ) {

            gain *=
              i / fadeInSamples;

          }


          /* Fade out */

          if (
            fadeOutSamples > 0 &&
            i >
              length -
              fadeOutSamples
          ) {

            gain *=
              (
                length - i
              ) /
              fadeOutSamples;

          }


          out[i] =
            input[i] * gain;

        }

      }


      const wav =
        audioBufferToWav(
          output
        );


      const url =
        URL.createObjectURL(
          wav
        );


      const download =
        $("audioDownload");


      if (download) {

        download.href =
          url;

        download.download =
          "vantara-edited-audio.wav";

        download.hidden =
          false;

        download.textContent =
          "Download edited audio";

      }


      setStatus(
        "audioStatus",
        "Audio processed successfully.",
        "success"
      );


    } catch (error) {

      setStatus(
        "audioStatus",
        error.message ||
          "Audio processing failed.",
        "error"
      );

    }

  }
);


/* =========================================================
   MALE / FEMALE VOICE EFFECT
========================================================= */

$("effectFile")?.addEventListener(
  "change",
  () => {

    const file =
      $("effectFile").files?.[0];

    if (!file) return;


    const audio =
      $("effectAudio");


    if (audio) {

      audio.src =
        URL.createObjectURL(
          file
        );

      audio.hidden =
        false;

    }

  }
);


$("pitch")?.addEventListener(
  "input",
  () => {

    const value =
      Number(
        $("pitch").value
      );


    if ($("pitchValue")) {

      $("pitchValue").textContent =
        `${value.toFixed(2)}×`;

    }

  }
);


/* =========================================================
   NOTE:
   Browser pitch processing is only a basic effect.
   It is NOT AI voice conversion.
========================================================= */

$("effectBtn")?.addEventListener(
  "click",
  async () => {

    const file =
      $("effectFile").files?.[0];

    if (!file) {

      setStatus(
        "effectStatus",
        "Please select an audio file first.",
        "error"
      );

      return;

    }


    try {

      setStatus(
        "effectStatus",
        "Creating voice effect...",
        "warning"
      );


      const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


      const context =
        new AudioContextClass();


      const data =
        await file.arrayBuffer();


      const input =
        await context.decodeAudioData(
          data
        );


      const pitch =
        Number(
          $("pitch")?.value || 0.82
        );


      const output =
        context.createBuffer(
          input.numberOfChannels,
          Math.floor(
            input.length / pitch
          ),
          input.sampleRate
        );


      for (
        let channel = 0;
        channel < input.numberOfChannels;
        channel++
      ) {

        const source =
          input.getChannelData(
            channel
          );


        const target =
          output.getChannelData(
            channel
          );


        for (
          let i = 0;
          i < target.length;
          i++
        ) {

          const sourceIndex =
            Math.floor(
              i * pitch
            );


          if (
            sourceIndex <
            source.length
          ) {

            target[i] =
              source[sourceIndex];

          }

        }

      }


      const wav =
        audioBufferToWav(
          output
        );


      const url =
        URL.createObjectURL(
          wav
        );


      const audio =
        $("effectAudio");


      if (audio) {

        audio.src =
          url;

        audio.hidden =
          false;

      }


      const download =
        $("effectDownload");


      if (download) {

        download.href =
          url;

        download.download =
          "vantara-voice-effect.wav";

        download.hidden =
          false;

        download.textContent =
          "Download voice effect";

      }


      setStatus(
        "effectStatus",
        "Voice effect created.",
        "success"
      );


      await context.close();

    } catch (error) {

      setStatus(
        "effectStatus",
        error.message ||
          "Voice effect failed.",
        "error"
      );

    }

  }
);
/* =========================================================
   VANTARA EDITOR V2
   PART 4B
   BRAND KIT + SCRIPT ASSISTANT + PROJECT LIBRARY
========================================================= */


/* =========================================================
   BRAND KIT
========================================================= */

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
      JSON.stringify(
        brand
      )
    );


    setStatus(
      "brandStatus",
      "Brand Kit saved on this device.",
      "success"
    );

  }
);


/* =========================================================
   LOAD BRAND KIT
========================================================= */

function loadBrandKit() {

  try {

    const saved =
      localStorage.getItem(
        "vantaraBrandKit"
      );


    if (!saved) return;


    const brand =
      JSON.parse(
        saved
      );


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

    console.warn(
      "Could not load Brand Kit.",
      error
    );

  }

}


loadBrandKit();


/* =========================================================
   SCRIPT ASSISTANT
========================================================= */

function generateAssistantScript(
  text,
  mode
) {

  const clean =
    text.trim();


  if (!clean) {

    return "";

  }


  switch (mode) {

    case "simple":

      return `
Explain this topic in a simple,
beginner-friendly way.

Topic:
${clean}
      `.trim();


    case "classroom":

      return `
Students, let's understand this
topic step by step.

${clean}

Let's look at the concept carefully
and understand why it works.
      `.trim();


    case "hinglish":

      return `
Students, aaj hum is topic ko
very simple Hinglish mein samjhenge.

${clean}

Pehle basic concept samajhte hain,
phir example ke through dekhenge.
      `.trim();


    case "short":

      return `
Explain the following topic briefly
without skipping the main concept:

${clean}
      `.trim();


    case "pause":

      return `
${clean}

Now, take a moment and think about
what we have just learned.

Let's move to the next step.
      `.trim();


    default:

      return clean;

  }

}


/* =========================================================
   ASSISTANT BUTTONS
========================================================= */

document
  .querySelectorAll(
    "[data-action]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          const text =
            $("assistantInput")?.value
              ?.trim();


          if (!text) {

            setStatus(
              "assistantStatus",
              "Enter some text first.",
              "error"
            );

            return;

          }


          const mode =
            button.dataset.action;


          const result =
            generateAssistantScript(
              text,
              mode
            );


          if ($("assistantOutput")) {

            $("assistantOutput").value =
              result;

          }


          setStatus(
            "assistantStatus",
            "Script generated.",
            "success"
          );

        }
      );

    }
  );


/* =========================================================
   USE ASSISTANT OUTPUT
========================================================= */

$("useAssistant")?.addEventListener(
  "click",
  () => {

    const output =
      $("assistantOutput")?.value
        ?.trim();


    if (!output) {

      setStatus(
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


    /* Move to Voiceover tab */

    const voiceTab =
      document.querySelector(
        '[data-tab="voiceover"]'
      );


    if (voiceTab) {

      voiceTab.click();

    }


    setStatus(
      "voiceStatus",
      "Assistant script added to Voiceover Studio.",
      "success"
    );

  }
);


/* =========================================================
   PROJECT LIBRARY
========================================================= */

let vantaraProjects =
  JSON.parse(
    localStorage.getItem(
      "vantaraProjects"
    ) || "[]"
  );


function saveProject(
  name,
  type,
  content
) {

  const project = {

    id:
      Date.now(),

    name:
      name ||
      "Untitled Project",

    type:
      type ||
      "Lesson",

    content:
      content ||
      "",

    created:
      new Date().toLocaleString()

  };


  vantaraProjects.unshift(
    project
  );


  /*
    Keep the local library
    lightweight.
  */

  if (
    vantaraProjects.length > 30
  ) {

    vantaraProjects =
      vantaraProjects.slice(
        0,
        30
      );

  }


  localStorage.setItem(
    "vantaraProjects",
    JSON.stringify(
      vantaraProjects
    )
  );


  renderProjects();

}


function renderProjects() {

  const container =
    $("projectLibrary");


  if (!container) return;


  container.innerHTML = "";


  if (
    vantaraProjects.length === 0
  ) {

    container.innerHTML = `
      <div class="empty-state">
        <strong>No projects yet.</strong>
        <p>Your saved VANTARA projects will appear here.</p>
      </div>
    `;

    return;

  }


  vantaraProjects.forEach(
    project => {

      const card =
        document.createElement(
          "div"
        );


      card.className =
        "project-card";


      card.innerHTML = `
        <strong>
          ${escapeHTML(project.name)}
        </strong>

        <span>
          ${escapeHTML(project.type)}
        </span>

        <small>
          ${escapeHTML(project.created)}
        </small>

        <button
          type="button"
          data-open-project="${project.id}">
          Open
        </button>

        <button
          type="button"
          class="danger-btn"
          data-delete-project="${project.id}">
          Delete
        </button>
      `;


      container.appendChild(
        card
      );

    }
  );


  /* =======================================================
     OPEN PROJECT
  ======================================================= */

  container
    .querySelectorAll(
      "[data-open-project]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset.openProject
              );


            const project =
              vantaraProjects.find(
                item =>
                  item.id === id
              );


            if (!project)
              return;


            if (
              $("script")
            ) {

              $("script").value =
                project.content || "";

              $("script").dispatchEvent(
                new Event("input")
              );

            }


            document
              .querySelector(
                '[data-tab="voiceover"]'
              )
              ?.click();


            setStatus(
              "voiceStatus",
              `Project "${project.name}" opened.`,
              "success"
            );

          }
        );

      }
    );


  /* =======================================================
     DELETE PROJECT
  ======================================================= */

  container
    .querySelectorAll(
      "[data-delete-project]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              Number(
                button.dataset.deleteProject
              );


            vantaraProjects =
              vantaraProjects.filter(
                item =>
                  item.id !== id
              );


            localStorage.setItem(
              "vantaraProjects",
              JSON.stringify(
                vantaraProjects
              )
            );


            renderProjects();

          }
        );

      }
    );

}


/* =========================================================
   INITIALIZE PROJECT LIBRARY
========================================================= */

renderProjects();


/* =========================================================
   SAVE CURRENT VOICEOVER AS PROJECT
========================================================= */

$("saveProject")?.addEventListener(
  "click",
  () => {

    const script =
      $("script")?.value?.trim();


    if (!script) {

      setStatus(
        "voiceStatus",
        "Enter a script before saving.",
        "error"
      );

      return;

    }


    const name =
      prompt(
        "Enter project name:",
        "VANTARA Lesson"
      );


    if (!name) return;


    saveProject(
      name,
      "Voiceover",
      script
    );


    setStatus(
      "voiceStatus",
      "Project saved successfully.",
      "success"
    );

  }
);