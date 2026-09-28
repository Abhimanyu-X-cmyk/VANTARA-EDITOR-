"use strict";

/* =========================================================
   VANTARA EDITOR V2
   PART 1A
   CORE + TABS + THEME + VOICE SETUP
========================================================= */


/* =========================================================
   BASIC HELPERS
========================================================= */

const $ = (id) =>
  document.getElementById(id);


function setStatus(
  id,
  message,
  type = ""
) {

  const el = $(id);

  if (!el) return;

  el.textContent = message;

  el.className =
    "status " + type;

}


function escapeHTML(value) {

  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* =========================================================
   TAB NAVIGATION
========================================================= */

document
  .querySelectorAll(".tab")
  .forEach(button => {

    button.addEventListener(
      "click",
      () => {

        const target =
          button.dataset.tab;


        document
          .querySelectorAll(".tab")
          .forEach(tab =>
            tab.classList.remove(
              "active"
            )
          );


        document
          .querySelectorAll(".panel")
          .forEach(panel =>
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

          window.scrollTo({
            top: 0,
            behavior: "smooth"
          });

        }

      }
    );

  });


/* =========================================================
   THEME
========================================================= */

const themeButton =
  $("themeToggle") ||
  $("themeBtn");


if (themeButton) {

  themeButton.addEventListener(
    "click",
    () => {

      document.body.classList.toggle(
        "light-mode"
      );


      const isLight =
        document.body.classList.contains(
          "light-mode"
        );


      localStorage.setItem(
        "vantaraTheme",
        isLight
          ? "light"
          : "dark"
      );

    }
  );

}


if (
  localStorage.getItem(
    "vantaraTheme"
  ) === "light"
) {

  document.body.classList.add(
    "light-mode"
  );

}


/* =========================================================
   SPEECH SYNTHESIS VARIABLES
========================================================= */

let availableVoices = [];

let voiceIsRunning = false;

let currentSpeechToken = 0;


/* =========================================================
   LOAD BROWSER VOICES
========================================================= */

function loadBrowserVoices() {

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


  availableVoices =
    window.speechSynthesis
      .getVoices();


  updateVoiceList();

}


/* =========================================================
   BROWSER VOICE EVENT
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
   VANTARA EDITOR V2
   PART 1B
   VOICE SELECTION + SPEECH SETUP
========================================================= */


/* =========================================================
   LANGUAGE
========================================================= */

function getSelectedLanguage() {

  return (
    $("language")?.value ||
    "hi-IN"
  );

}


/* =========================================================
   SPEAKING SPEED
========================================================= */

function getSelectedPace() {

  return Number(
    $("pace")?.value || 1
  );

}


/* =========================================================
   DETECT VOICE GENDER
========================================================= */

function detectVoiceGender(
  voice
) {

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
    femaleWords.some(
      word =>
        name.includes(word)
    )
  ) {

    return "female";

  }


  if (
    maleWords.some(
      word =>
        name.includes(word)
    )
  ) {

    return "male";

  }


  return "unknown";

}


/* =========================================================
   SELECTED GENDER
========================================================= */

function getSelectedGender() {

  return (
    $("voiceGender")?.value ||
    "all"
  );

}


/* =========================================================
   UPDATE TEACHER VOICE LIST
========================================================= */

function updateVoiceList() {

  const select =
    $("speaker");


  if (!select)
    return;


  const language =
    getSelectedLanguage();


  const languageCode =
    language.split("-")[0];


  const gender =
    getSelectedGender();


  let voices =
    availableVoices.filter(
      voice =>
        voice.lang &&
        voice.lang
          .toLowerCase()
          .startsWith(
            languageCode
              .toLowerCase()
          )
    );


  /*
    Filter by gender when
    possible.
  */

  if (
    gender !== "all"
  ) {

    const filtered =
      voices.filter(
        voice =>
          detectVoiceGender(
            voice
          ) === gender
      );


    /*
      If the browser does not
      provide gender-identifiable
      voices, keep the language
      voices instead of showing
      an empty dropdown.
    */

    if (
      filtered.length > 0
    ) {

      voices =
        filtered;

    }

  }


  /*
    If no voices are found
    for this language, use all
    browser voices.
  */

  if (
    voices.length === 0
  ) {

    voices =
      availableVoices;

  }


  const oldValue =
    select.value;


  select.innerHTML = "";


  voices.forEach(
    voice => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        voice.name;


      option.textContent =
        voice.name;


      select.appendChild(
        option
      );

    }
  );


  /*
    Restore previous selection
    if it still exists.
  */

  const stillExists =
    Array.from(
      select.options
    ).some(
      option =>
        option.value ===
        oldValue
    );


  if (
    stillExists
  ) {

    select.value =
      oldValue;

  }


  if (
    voices.length === 0
  ) {

    setStatus(
      "voiceStatus",
      "No browser voices found. Try Chrome or Edge.",
      "warning"
    );

  }

}


/* =========================================================
   GET SELECTED VOICE
========================================================= */

function getSelectedVoice() {

  const select =
    $("speaker");


  if (!select)
    return null;


  return (
    availableVoices.find(
      voice =>
        voice.name ===
        select.value
    ) || null
  );

}


/* =========================================================
   WAIT FOR VOICES
========================================================= */

function waitForVoices() {

  return new Promise(
    resolve => {

      if (
        !("speechSynthesis" in window)
      ) {

        resolve([]);

        return;

      }


      const existing =
        window.speechSynthesis
          .getVoices();


      if (
        existing.length > 0
      ) {

        resolve(
          existing
        );

        return;

      }


      let finished =
        false;


      const finish = () => {

        if (finished)
          return;


        finished =
          true;


        window.speechSynthesis
          .removeEventListener(
            "voiceschanged",
            finish
          );


        resolve(
          window.speechSynthesis
            .getVoices()
        );

      };


      window.speechSynthesis
        .addEventListener(
          "voiceschanged",
          finish
        );


      setTimeout(
        finish,
        3000
      );

    }
  );

}


/* =========================================================
   SPEAK TEXT
========================================================= */

function speakText(
  text
) {

  return new Promise(
    async (
      resolve,
      reject
    ) => {

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
            "Speech synthesis is not available."
          )
        );

        return;

      }


      try {

        await waitForVoices();


        const synth =
          window.speechSynthesis;


        /*
          Clear previous speech
          before starting new speech.
        */

        synth.cancel();


        await new Promise(
          delay =>
            setTimeout(
              delay,
              150
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


        if (
          selectedVoice
        ) {

          utterance.voice =
            selectedVoice;

        }


        let finished =
          false;


        const finish = () => {

          if (finished)
            return;


          finished =
            true;


          resolve();

        };


        utterance.onend =
          finish;


        utterance.onerror =
          event => {

            if (
              event.error ===
                "canceled" ||
              event.error ===
                "interrupted"
            ) {

              finish();

              return;

            }


            if (finished)
              return;


            finished =
              true;


            reject(
              new Error(
                "Speech synthesis failed: " +
                (
                  event.error ||
                  "unknown error"
                )
              )
            );

          };


        /*
          Helps Android browsers
          resume speech correctly.
        */

        synth.resume();


        synth.speak(
          utterance
        );


        /*
          Keep Android speech alive
          during long narration.
        */

        const keepAlive =
          setInterval(
            () => {

              if (
                !synth.speaking ||
                finished
              ) {

                clearInterval(
                  keepAlive
                );

                return;

              }


              synth.resume();

            },
            5000
          );


        utterance.onend =
          () => {

            clearInterval(
              keepAlive
            );

            finish();

          };


      } catch (error) {

        reject(
          error
        );

      }

    }
  );

}


/* =========================================================
   SCRIPT COUNTER
========================================================= */

$("script")?.addEventListener(
  "input",
  () => {

    const length =
      $("script").value.length;


    if (
      $("charCount")
    ) {

      $("charCount")
        .textContent =
        `${length} characters`;

    }


    if (
      $("count")
    ) {

      $("count")
        .textContent =
        `${length} characters`;

    }

  }
);


/* =========================================================
   SPLIT LONG SCRIPTS
========================================================= */

function splitText(
  text,
  maxLength = 1800
) {

  const clean =
    text.trim();


  if (!clean)
    return [];


  const words =
    clean.split(
      /\s+/
    );


  const chunks = [];

  let current = "";


  for (
    const word of words
  ) {

    const test =
      (
        current +
        " " +
        word
      ).trim();


    if (
      test.length <=
      maxLength
    ) {

      current =
        test;

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


  if (!container)
    return;


  container.innerHTML =
    "";


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
   VOICE CONTROLS
========================================================= */

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


    setStatus(
      "voiceStatus",
      "Voice type updated."
    );

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


/* =========================================================
   INITIAL VOICE LOAD
========================================================= */

setTimeout(
  () => {

    loadBrowserVoices();

  },
  500
);
/* =========================================================
   VANTARA EDITOR V2
   PART 2A
   VOICEOVER GENERATION + LONG SCRIPT PLAYBACK
========================================================= */


/* =========================================================
   STOP CURRENT SPEECH
========================================================= */

function stopVoiceover() {

  currentSpeechToken++;


  if (
    "speechSynthesis" in window
  ) {

    window.speechSynthesis.cancel();

  }


  voiceIsRunning =
    false;


  setStatus(
    "voiceStatus",
    "Voiceover stopped."
  );

}


/* =========================================================
   PLAY ALL CHUNKS
========================================================= */

async function playVoiceover(
  chunks
) {

  if (
    !chunks ||
    chunks.length === 0
  ) {

    throw new Error(
      "No script available."
    );

  }


  if (voiceIsRunning) {

    stopVoiceover();


    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          200
        )
    );

  }


  voiceIsRunning =
    true;


  const speechToken =
    ++currentSpeechToken;


  try {

    for (
      let i = 0;
      i < chunks.length;
      i++
    ) {

      /*
        Stop if the user pressed
        the Stop button.
      */

      if (
        speechToken !==
        currentSpeechToken
      ) {

        break;

      }


      const partNumber =
        i + 1;


      setStatus(
        "voiceStatus",
        `Speaking part ${partNumber} of ${chunks.length}...`
      );


      await speakText(
        chunks[i]
      );


      /*
        Small pause between
        script sections.
      */

      if (
        i <
        chunks.length - 1
      ) {

        await new Promise(
          resolve =>
            setTimeout(
              resolve,
              250
            )
        );

      }

    }


    if (
      speechToken ===
      currentSpeechToken
    ) {

      setStatus(
        "voiceStatus",
        "Voiceover completed successfully.",
        "success"
      );

    }

  } catch (error) {

    console.error(
      "Voiceover error:",
      error
    );


    setStatus(
      "voiceStatus",
      error.message ||
        "Voiceover generation failed.",
      "error"
    );

  } finally {

    voiceIsRunning =
      false;

  }

}


/* =========================================================
   GENERATE VOICEOVER
========================================================= */

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


  const button =
    $("generate");


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Preparing Voiceover...";

  }


  try {

    setStatus(
      "voiceStatus",
      "Loading browser voices..."
    );


    /*
      Make sure browser voices
      are available.
    */

    const voices =
      await waitForVoices();


    if (
      voices.length === 0
    ) {

      throw new Error(
        "No browser voices were found. Please use Chrome or Edge."
      );

    }


    availableVoices =
      voices;


    updateVoiceList();


    /*
      Split a long script into
      safe browser speech sections.
    */

    const chunks =
      splitText(
        script,
        1800
      );


    displayChunks(
      chunks
    );


    setStatus(
      "voiceStatus",
      `${chunks.length} part${chunks.length === 1 ? "" : "s"} ready. Starting voiceover...`
    );


    /*
      Start speaking.
    */

    await playVoiceover(
      chunks
    );


  } catch (error) {

    console.error(
      error
    );


    setStatus(
      "voiceStatus",
      error.message ||
        "Unable to start voiceover.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Generate Voiceover";

    }

  }

}


/* =========================================================
   GENERATE BUTTON
========================================================= */

$("generate")?.addEventListener(
  "click",
  generateVoiceover
);


/* =========================================================
   STOP BUTTON
========================================================= */

const stopButton =
  $("stopVoice") ||
  $("stopVoiceover");


if (stopButton) {

  stopButton.addEventListener(
    "click",
    stopVoiceover
  );

}


/* =========================================================
   KEYBOARD SHORTCUT
   ESC = STOP VOICEOVER
========================================================= */

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


/* =========================================================
   SCRIPT INPUT STATUS
========================================================= */

$("script")?.addEventListener(
  "input",
  () => {

    const text =
      $("script").value;


    const chunks =
      splitText(
        text,
        1800
      );


    if (
      $("chunkLog") &&
      chunks.length > 0
    ) {

      displayChunks(
        chunks
      );

    }


    if (
      $("chunkLog") &&
      !text.trim()
    ) {

      $("chunkLog").innerHTML =
        "";

    }

  }
);
/* =========================================================
   VANTARA EDITOR V2
   PART 2B
   VOICEOVER UI + PREVIEW CONTROLS
========================================================= */


/* =========================================================
   PREVIEW CURRENT SCRIPT
========================================================= */

async function previewVoice() {

  const script =
    $("script")?.value.trim();


  if (!script) {

    setStatus(
      "voiceStatus",
      "Please enter a script first.",
      "error"
    );

    return;

  }


  if (voiceIsRunning) {

    stopVoiceover();

    return;

  }


  const previewButton =
    $("previewVoice") ||
    $("preview") ||
    $("previewBtn");


  if (previewButton) {

    previewButton.disabled =
      true;

    previewButton.textContent =
      "Playing...";

  }


  try {

    const chunks =
      splitText(
        script,
        1800
      );


    /*
      Preview only the first
      section so a huge script
      does not unexpectedly play
      for a long time.
    */

    setStatus(
      "voiceStatus",
      "Playing preview..."
    );


    voiceIsRunning =
      true;


    const token =
      ++currentSpeechToken;


    await speakText(
      chunks[0]
    );


    if (
      token ===
      currentSpeechToken
    ) {

      setStatus(
        "voiceStatus",
        "Preview completed.",
        "success"
      );

    }

  } catch (error) {

    console.error(
      "Preview error:",
      error
    );


    setStatus(
      "voiceStatus",
      error.message ||
        "Preview failed.",
      "error"
    );

  } finally {

    voiceIsRunning =
      false;


    if (previewButton) {

      previewButton.disabled =
        false;

      previewButton.textContent =
        "Preview Voice";

    }

  }

}


/* =========================================================
   PREVIEW BUTTON
========================================================= */

const previewButton =
  $("previewVoice") ||
  $("preview") ||
  $("previewBtn");


if (previewButton) {

  previewButton.addEventListener(
    "click",
    previewVoice
  );

}


/* =========================================================
   STOP BUTTON — EXTRA SAFETY
========================================================= */

const stopVoiceButton =
  $("stopVoice") ||
  $("stopVoiceover") ||
  $("stop");


if (
  stopVoiceButton &&
  stopVoiceButton !==
    previewButton
) {

  stopVoiceButton.addEventListener(
    "click",
    () => {

      stopVoiceover();

    }
  );

}


/* =========================================================
   CHARACTER COUNTER
========================================================= */

function updateCharacterCounter() {

  const textarea =
    $("script");


  if (!textarea)
    return;


  const length =
    textarea.value.length;


  const counter =
    $("charCount") ||
    $("count");


  if (counter) {

    counter.textContent =
      `${length} characters`;

  }

}


$("script")?.addEventListener(
  "input",
  updateCharacterCounter
);


updateCharacterCounter();


/* =========================================================
   CLEAR SCRIPT
========================================================= */

const clearScriptButton =
  $("clearScript");


if (clearScriptButton) {

  clearScriptButton.addEventListener(
    "click",
    () => {

      const textarea =
        $("script");


      if (textarea) {

        textarea.value =
          "";

      }


      if (
        $("chunkLog")
      ) {

        $("chunkLog").innerHTML =
          "";

      }


      updateCharacterCounter();


      setStatus(
        "voiceStatus",
        "Script cleared."
      );

    }
  );

}


/* =========================================================
   TEST VOICE BUTTON
========================================================= */

const testVoiceButton =
  $("testVoice") ||
  $("testVoiceBtn");


if (testVoiceButton) {

  testVoiceButton.addEventListener(
    "click",
    async () => {

      if (voiceIsRunning) {

        stopVoiceover();

        return;

      }


      try {

        voiceIsRunning =
          true;


        setStatus(
          "voiceStatus",
          "Testing selected teacher voice..."
        );


        await speakText(
          "Good morning students. Welcome to Vantara Education."
        );


        setStatus(
          "voiceStatus",
          "Voice test completed.",
          "success"
        );

      } catch (error) {

        console.error(
          error
        );


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

}


/* =========================================================
   REFRESH VOICES
========================================================= */

const refreshVoicesButton =
  $("refreshVoices");


if (refreshVoicesButton) {

  refreshVoicesButton.addEventListener(
    "click",
    async () => {

      try {

        setStatus(
          "voiceStatus",
          "Refreshing browser voices..."
        );


        const voices =
          await waitForVoices();


        availableVoices =
          voices;


        updateVoiceList();


        setStatus(
          "voiceStatus",
          `${voices.length} browser voice${voices.length === 1 ? "" : "s"} available.`,
          "success"
        );

      } catch (error) {

        setStatus(
          "voiceStatus",
          "Could not refresh voices.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LANGUAGE CHANGE — REFRESH COUNTER
========================================================= */

$("language")?.addEventListener(
  "change",
  () => {

    setTimeout(
      () => {

        updateVoiceList();

      },
      100
    );

  }
);


/* =========================================================
   PAGE VISIBILITY SAFETY
========================================================= */

document.addEventListener(
  "visibilitychange",
  () => {

    /*
      Some Android browsers pause
      speech when the page becomes
      hidden. Do not restart speech
      automatically because that can
      cause duplicate audio.
    */

    if (
      document.hidden &&
      voiceIsRunning
    ) {

      console.log(
        "VANTARA EDITOR: page hidden while speech is running."
      );

    }

  }
);


/* =========================================================
   INITIAL VOICE UI CHECK
========================================================= */

setTimeout(
  () => {

    updateVoiceList();
    updateCharacterCounter();

  },
  1000
);
/* =========================================================
   VANTARA EDITOR V2
   PART 3A
   LESSON BUILDER + SLIDE MANAGEMENT
========================================================= */


/* =========================================================
   LESSON DATA
========================================================= */

let lessonSlides = [];

let editingSlideIndex = -1;


/* =========================================================
   LESSON ELEMENTS
========================================================= */

const lessonSlidesContainer =
  $("slidesContainer") ||
  $("lessonSlides");

const lessonNameInput =
  $("lessonName");

const lessonTypeInput =
  $("lessonType");

const lessonStatusId =
  "lessonStatus";


/* =========================================================
   RENDER LESSON SLIDES
========================================================= */

function renderLessonSlides() {

  const container =
    lessonSlidesContainer;


  if (!container)
    return;


  container.innerHTML =
    "";


  if (
    lessonSlides.length === 0
  ) {

    const empty =
      document.createElement("div");

    empty.className =
      "empty-state";


    empty.innerHTML = `
      <h3>No slides yet</h3>
      <p>
        Add your first lesson slide
        to start building the class.
      </p>
    `;


    container.appendChild(
      empty
    );


    return;

  }


  lessonSlides.forEach(
    (slide, index) => {

      const card =
        document.createElement("div");

      card.className =
        "lesson-slide";


      card.innerHTML = `
        <div class="lesson-slide-header">
          <strong>
            Slide ${index + 1}
          </strong>

          <div class="lesson-slide-actions">

            <button
              type="button"
              class="small-btn"
              data-edit-slide="${index}">
              Edit
            </button>

            <button
              type="button"
              class="small-btn danger"
              data-delete-slide="${index}">
              Delete
            </button>

          </div>
        </div>

        <h3>
          ${escapeHTML(
            slide.title || "Untitled Slide"
          )}
        </h3>

        <p>
          ${escapeHTML(
            slide.content || "No content"
          )}
        </p>

        ${
          slide.notes
            ? `
              <small>
                Teacher Notes:
                ${escapeHTML(slide.notes)}
              </small>
            `
            : ""
        }
      `;


      container.appendChild(
        card
      );

    }
  );


  /*
    EDIT BUTTONS
  */

  container
    .querySelectorAll(
      "[data-edit-slide]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.editSlide
            );


          editLessonSlide(
            index
          );

        }
      );

    });


  /*
    DELETE BUTTONS
  */

  container
    .querySelectorAll(
      "[data-delete-slide]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.deleteSlide
            );


          deleteLessonSlide(
            index
          );

        }
      );

    });

}


/* =========================================================
   ADD LESSON SLIDE
========================================================= */

function addLessonSlide() {

  const title =
    prompt(
      "Enter slide title:"
    );


  if (
    title === null
  ) {

    return;

  }


  const content =
    prompt(
      "Enter slide content:"
    );


  if (
    content === null
  ) {

    return;

  }


  const notes =
    prompt(
      "Optional teacher notes:"
    ) || "";


  lessonSlides.push({

    title:
      title.trim(),

    content:
      content.trim(),

    notes:
      notes.trim()

  });


  renderLessonSlides();


  setStatus(
    lessonStatusId,
    `Slide ${lessonSlides.length} added.`,
    "success"
  );

}


/* =========================================================
   ADD SLIDE BUTTON
========================================================= */

const addSlideButton =
  $("addSlide");


if (addSlideButton) {

  addSlideButton.addEventListener(
    "click",
    addLessonSlide
  );

}


/* =========================================================
   EDIT LESSON SLIDE
========================================================= */

function editLessonSlide(
  index
) {

  if (
    !lessonSlides[index]
  ) {

    return;

  }


  const slide =
    lessonSlides[index];


  const title =
    prompt(
      "Edit slide title:",
      slide.title
    );


  if (
    title === null
  ) {

    return;

  }


  const content =
    prompt(
      "Edit slide content:",
      slide.content
    );


  if (
    content === null
  ) {

    return;

  }


  const notes =
    prompt(
      "Edit teacher notes:",
      slide.notes || ""
    );


  if (
    notes === null
  ) {

    return;

  }


  lessonSlides[index] = {

    title:
      title.trim(),

    content:
      content.trim(),

    notes:
      notes.trim()

  };


  renderLessonSlides();


  setStatus(
    lessonStatusId,
    `Slide ${index + 1} updated.`,
    "success"
  );

}


/* =========================================================
   DELETE LESSON SLIDE
========================================================= */

function deleteLessonSlide(
  index
) {

  if (
    !lessonSlides[index]
  ) {

    return;

  }


  const confirmed =
    window.confirm(
      `Delete Slide ${index + 1}?`
    );


  if (!confirmed) {

    return;

  }


  lessonSlides.splice(
    index,
    1
  );


  renderLessonSlides();


  setStatus(
    lessonStatusId,
    "Slide deleted."
  );

}


/* =========================================================
   CLEAR ALL LESSON SLIDES
========================================================= */

const clearSlidesButton =
  $("clearSlides");


if (clearSlidesButton) {

  clearSlidesButton.addEventListener(
    "click",
    () => {

      if (
        lessonSlides.length === 0
      ) {

        setStatus(
          lessonStatusId,
          "There are no slides to clear."
        );

        return;

      }


      const confirmed =
        window.confirm(
          "Delete all lesson slides?"
        );


      if (!confirmed) {

        return;

      }


      lessonSlides = [];


      renderLessonSlides();


      setStatus(
        lessonStatusId,
        "All slides cleared."
      );

    }
  );

}


/* =========================================================
   LESSON NAME
========================================================= */

lessonNameInput?.addEventListener(
  "input",
  () => {

    const name =
      lessonNameInput.value.trim();


    if (name) {

      setStatus(
        lessonStatusId,
        `Building lesson: ${name}`
      );

    }

  }
);


/* =========================================================
   LESSON TYPE
========================================================= */

lessonTypeInput?.addEventListener(
  "change",
  () => {

    if (!lessonTypeInput)
      return;


    setStatus(
      lessonStatusId,
      `Lesson type: ${lessonTypeInput.value}`
    );

  }
);


/* =========================================================
   INITIAL LESSON STATE
========================================================= */

renderLessonSlides();
/* =========================================================
   VANTARA EDITOR V2
   PART 3B
   LESSON BUILDER NARRATION
========================================================= */


/* =========================================================
   BUILD COMPLETE LESSON SCRIPT
========================================================= */

function buildLessonScript() {

  if (
    lessonSlides.length === 0
  ) {

    return "";

  }


  const lessonName =
    lessonNameInput?.value.trim() ||
    "Vantara Education Lesson";


  let script =
    `Welcome to VANTARA EDUCATION. `;

  script +=
    `Today we are going to learn ${lessonName}. `;


  lessonSlides.forEach(
    (slide, index) => {

      script +=
        `Slide ${index + 1}. `;


      if (slide.title) {

        script +=
          `${slide.title}. `;

      }


      if (slide.content) {

        script +=
          `${slide.content}. `;

      }


      if (slide.notes) {

        script +=
          `${slide.notes}. `;

      }


      /*
        Small natural transition
        between slides.
      */

      if (
        index <
        lessonSlides.length - 1
      ) {

        script +=
          `Now let's move to the next slide. `;

      }

    });


  script +=
    `Thank you for learning with VANTARA EDUCATION. `;


  return script.trim();

}


/* =========================================================
   SHOW GENERATED LESSON SCRIPT
========================================================= */

function showLessonScript(
  script
) {

  /*
    If a dedicated preview box
    exists, use it.
  */

  const preview =
    $("lessonScriptPreview");


  if (preview) {

    preview.value =
      script;


    preview.hidden =
      false;

    return;

  }


  /*
    Otherwise show the script
    in a simple dialog.
  */

  window.alert(
    script
  );

}


/* =========================================================
   GENERATE LESSON
========================================================= */

async function generateLesson() {

  if (
    lessonSlides.length === 0
  ) {

    setStatus(
      lessonStatusId,
      "Please add at least one slide first.",
      "error"
    );

    return;

  }


  const lessonName =
    lessonNameInput?.value.trim();


  if (!lessonName) {

    setStatus(
      lessonStatusId,
      "Please enter a lesson name.",
      "error"
    );

    return;

  }


  const generateButton =
    $("generateLesson");


  if (generateButton) {

    generateButton.disabled =
      true;

    generateButton.textContent =
      "Preparing Lesson...";

  }


  try {

    const script =
      buildLessonScript();


    if (!script) {

      throw new Error(
        "Unable to create lesson script."
      );

    }


    /*
      Put the generated script
      into the main Voiceover
      Studio as well.
    */

    if ($("script")) {

      $("script").value =
        script;


      updateCharacterCounter();


      displayChunks(
        splitText(
          script,
          1800
        )
      );

    }


    showLessonScript(
      script
    );


    setStatus(
      lessonStatusId,
      "Lesson script created successfully.",
      "success"
    );


    /*
      Switch to Voiceover Studio
      so the teacher can generate
      the actual narration.
    */

    const voiceoverTab =
      document.querySelector(
        '[data-tab="voiceover"]'
      );


    if (voiceoverTab) {

      setTimeout(
        () => {

          voiceoverTab.click();

        },
        700
      );

    }

  } catch (error) {

    console.error(
      "Lesson generation error:",
      error
    );


    setStatus(
      lessonStatusId,
      error.message ||
        "Could not generate lesson.",
      "error"
    );

  } finally {

    if (generateButton) {

      generateButton.disabled =
        false;

      generateButton.textContent =
        "Generate Lesson";

    }

  }

}


/* =========================================================
   GENERATE LESSON BUTTON
========================================================= */

$("generateLesson")?.addEventListener(
  "click",
  generateLesson
);


/* =========================================================
   EXPORT LESSON SCRIPT
========================================================= */

const exportLessonButton =
  $("exportLesson");


if (exportLessonButton) {

  exportLessonButton.addEventListener(
    "click",
    () => {

      const script =
        buildLessonScript();


      if (!script) {

        setStatus(
          lessonStatusId,
          "Create some slides first.",
          "error"
        );

        return;

      }


      const blob =
        new Blob(
          [script],
          {
            type:
              "text/plain;charset=utf-8"
          }
        );


      downloadBlob(
        blob,
        "vantara-lesson-script.txt"
      );


      setStatus(
        lessonStatusId,
        "Lesson script exported.",
        "success"
      );

    }
  );

}


/* =========================================================
   COPY LESSON SCRIPT
========================================================= */

const copyLessonButton =
  $("copyLesson");


if (copyLessonButton) {

  copyLessonButton.addEventListener(
    "click",
    async () => {

      const script =
        buildLessonScript();


      if (!script) {

        setStatus(
          lessonStatusId,
          "Create some slides first.",
          "error"
        );

        return;

      }


      try {

        await navigator.clipboard.writeText(
          script
        );


        setStatus(
          lessonStatusId,
          "Lesson script copied.",
          "success"
        );

      } catch (error) {

        console.error(
          error
        );


        setStatus(
          lessonStatusId,
          "Copy failed. Please use Export instead.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   LESSON PREVIEW
========================================================= */

const previewLessonButton =
  $("previewLesson");


if (previewLessonButton) {

  previewLessonButton.addEventListener(
    "click",
    async () => {

      const script =
        buildLessonScript();


      if (!script) {

        setStatus(
          lessonStatusId,
          "Create slides first.",
          "error"
        );

        return;

      }


      /*
        Use the same browser
        voice system as Voiceover
        Studio.
      */

      try {

        setStatus(
          lessonStatusId,
          "Playing lesson preview..."
        );


        const chunks =
          splitText(
            script,
            1800
          );


        await playVoiceover(
          chunks
        );


        setStatus(
          lessonStatusId,
          "Lesson preview completed.",
          "success"
        );

      } catch (error) {

        console.error(
          error
        );


        setStatus(
          lessonStatusId,
          error.message ||
            "Lesson preview failed.",
          "error"
        );

      }

    }
  );

}
/* =========================================================
   VANTARA EDITOR V2
   PART 4A
   AUDIO EDITOR
========================================================= */


/* =========================================================
   AUDIO EDITOR STATE
========================================================= */

let editorAudio =
  null;

let editorAudioContext =
  null;

let editorAudioBuffer =
  null;


/* =========================================================
   AUDIO ELEMENTS
========================================================= */

const audioFileInput =
  $("audioFile");

const audioPreview =
  $("audioPreview");

const volumeControl =
  $("volume");

const volumeValue =
  $("volumeValue");

const fadeInControl =
  $("fadeIn");

const fadeOutControl =
  $("fadeOut");

const processAudioButton =
  $("processAudio");

const audioStatusId =
  "audioStatus";


/* =========================================================
   UPDATE VOLUME DISPLAY
========================================================= */

function updateVolumeDisplay() {

  if (
    !volumeControl ||
    !volumeValue
  ) {

    return;

  }


  volumeValue.textContent =
    `${volumeControl.value}%`;

}


volumeControl?.addEventListener(
  "input",
  updateVolumeDisplay
);


updateVolumeDisplay();


/* =========================================================
   LOAD AUDIO FILE
========================================================= */

audioFileInput?.addEventListener(
  "change",
  async event => {

    const file =
      event.target.files?.[0];


    if (!file) {

      return;

    }


    try {

      setStatus(
        audioStatusId,
        "Loading audio..."
      );


      editorAudio =
        file;


      /*
        Show the original audio
        immediately in the preview.
      */

      if (audioPreview) {

        const url =
          URL.createObjectURL(
            file
          );


        audioPreview.src =
          url;


        audioPreview.hidden =
          false;

      }


      /*
        Decode audio for
        processing.
      */

      if (
        !editorAudioContext
      ) {

        editorAudioContext =
          new (
            window.AudioContext ||
            window.webkitAudioContext
          )();

      }


      const arrayBuffer =
        await file.arrayBuffer();


      editorAudioBuffer =
        await editorAudioContext.decodeAudioData(
          arrayBuffer.slice(0)
        );


      const duration =
        editorAudioBuffer.duration;


      setStatus(
        audioStatusId,
        `Audio loaded • ${duration.toFixed(1)} seconds`,
        "success"
      );

    } catch (error) {

      console.error(
        "Audio loading error:",
        error
      );


      setStatus(
        audioStatusId,
        "This audio file could not be processed.",
        "error"
      );

    }

  }
);


/* =========================================================
   FADE INPUT VALIDATION
========================================================= */

function getFadeSeconds(
  control
) {

  if (!control) {

    return 0;

  }


  const value =
    Number(
      control.value
    );


  if (
    !Number.isFinite(value) ||
    value < 0
  ) {

    return 0;

  }


  return value;

}


/* =========================================================
   PROCESS AUDIO
========================================================= */

async function processAudio() {

  if (
    !editorAudioBuffer
  ) {

    setStatus(
      audioStatusId,
      "Please upload an audio file first.",
      "error"
    );

    return;

  }


  const button =
    processAudioButton;


  if (button) {

    button.disabled =
      true;

    button.textContent =
      "Processing...";

  }


  try {

    const input =
      editorAudioBuffer;


    const duration =
      input.duration;


    const sampleRate =
      input.sampleRate;


    const numberOfChannels =
      input.numberOfChannels;


    /*
      Volume is represented as
      a percentage.
    */

    const volume =
      Math.max(
        0,
        Math.min(
          2,
          Number(
            volumeControl?.value || 100
          ) / 100
        )
      );


    let fadeIn =
      getFadeSeconds(
        fadeInControl
      );


    let fadeOut =
      getFadeSeconds(
        fadeOutControl
      );


    /*
      Prevent fades from being
      longer than the audio itself.
    */

    fadeIn =
      Math.min(
        fadeIn,
        duration
      );


    fadeOut =
      Math.min(
        fadeOut,
        duration
      );


    /*
      Create an OfflineAudioContext
      so the processed result can
      be rendered.
    */

    const offlineContext =
      new OfflineAudioContext(
        numberOfChannels,
        Math.ceil(
          duration *
          sampleRate
        ),
        sampleRate
      );


    const source =
      offlineContext.createBufferSource();


    source.buffer =
      input;


    const gainNode =
      offlineContext.createGain();


    /*
      Start with volume zero
      when fade-in is enabled.
    */

    if (
      fadeIn > 0
    ) {

      gainNode.gain.setValueAtTime(
        0,
        0
      );

      gainNode.gain.linearRampToValueAtTime(
        volume,
        fadeIn
      );

    } else {

      gainNode.gain.setValueAtTime(
        volume,
        0
      );

    }


    /*
      Fade-out.
    */

    if (
      fadeOut > 0
    ) {

      const fadeStart =
        Math.max(
          0,
          duration - fadeOut
        );


      gainNode.gain.setValueAtTime(
        volume,
        fadeStart
      );


      gainNode.gain.linearRampToValueAtTime(
        0,
        duration
      );

    }


    source
      .connect(
        gainNode
      )
      .connect(
        offlineContext.destination
      );


    source.start(
      0
    );


    const rendered =
      await offlineContext.startRendering();


    /*
      Convert rendered audio
      into WAV.
    */

    const wavBlob =
      audioBufferToWav(
        rendered
      );


    const outputUrl =
      URL.createObjectURL(
        wavBlob
      );


    if (audioPreview) {

      audioPreview.src =
        outputUrl;

      audioPreview.hidden =
        false;

    }


    /*
      Download button.
    */

    const download =
      $("audioDownload");


    if (download) {

      download.href =
        outputUrl;

      download.download =
        "vantara-edited-audio.wav";

      download.hidden =
        false;

      download.textContent =
        "Download Edited Audio";

    }


    setStatus(
      audioStatusId,
      "Audio processed successfully.",
      "success"
    );

  } catch (error) {

    console.error(
      "Audio processing error:",
      error
    );


    setStatus(
      audioStatusId,
      "Audio processing failed.",
      "error"
    );

  } finally {

    if (button) {

      button.disabled =
        false;

      button.textContent =
        "Process Audio";

    }

  }

}


/* =========================================================
   PROCESS BUTTON
========================================================= */

processAudioButton?.addEventListener(
  "click",
  processAudio
);
/* =========================================================
   VANTARA EDITOR V2
   PART 4B
   WAV ENCODER + AUDIO DOWNLOAD
========================================================= */


/* =========================================================
   AUDIO BUFFER → WAV
========================================================= */

function audioBufferToWav(buffer) {

  const numberOfChannels =
    buffer.numberOfChannels;

  const sampleRate =
    buffer.sampleRate;

  const bitDepth =
    16;

  const samples =
    buffer.length;

  const blockAlign =
    numberOfChannels *
    (bitDepth / 8);

  const byteRate =
    sampleRate *
    blockAlign;

  const dataSize =
    samples *
    blockAlign;

  const totalSize =
    44 +
    dataSize;


  const arrayBuffer =
    new ArrayBuffer(
      totalSize
    );

  const view =
    new DataView(
      arrayBuffer
    );


  /* -----------------------------------------------------
     WRITE STRING
  ----------------------------------------------------- */

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


  /* -----------------------------------------------------
     WAV HEADER
  ----------------------------------------------------- */

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
    byteRate,
    true
  );

  view.setUint16(
    32,
    blockAlign,
    true
  );

  view.setUint16(
    34,
    bitDepth,
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


  /* -----------------------------------------------------
     AUDIO DATA
  ----------------------------------------------------- */

  const channels = [];

  for (
    let channel = 0;
    channel < numberOfChannels;
    channel++
  ) {

    channels.push(
      buffer.getChannelData(
        channel
      )
    );

  }


  let offset =
    44;


  for (
    let sample = 0;
    sample < samples;
    sample++
  ) {

    for (
      let channel = 0;
      channel < numberOfChannels;
      channel++
    ) {

      let value =
        channels[channel][sample];


      /*
        Prevent clipping.
      */

      value =
        Math.max(
          -1,
          Math.min(
            1,
            value
          )
        );


      /*
        Convert Float32
        to signed 16-bit PCM.
      */

      const pcm =
        value < 0
          ? value * 0x8000
          : value * 0x7FFF;


      view.setInt16(
        offset,
        pcm,
        true
      );


      offset += 2;

    }

  }


  return new Blob(
    [arrayBuffer],
    {
      type:
        "audio/wav"
    }
  );

}


/* =========================================================
   DOWNLOAD EDITED AUDIO
========================================================= */

const audioDownload =
  $("audioDownload");


if (audioDownload) {

  audioDownload.addEventListener(
    "click",
    event => {

      /*
        The actual download URL
        is already assigned by
        processAudio().
      */

      if (
        !audioDownload.href ||
        audioDownload.href ===
          "#" ||
        audioDownload.href ===
          window.location.href
      ) {

        event.preventDefault();


        setStatus(
          "audioStatus",
          "Please process the audio first.",
          "error"
        );

        return;

      }

    }
  );

}


/* =========================================================
   AUDIO EDITOR RESET
========================================================= */

const resetAudioButton =
  $("resetAudio");


if (resetAudioButton) {

  resetAudioButton.addEventListener(
    "click",
    () => {

      editorAudio =
        null;

      editorAudioBuffer =
        null;


      if (audioFileInput) {

        audioFileInput.value =
          "";

      }


      if (audioPreview) {

        audioPreview.pause();

        audioPreview.removeAttribute(
          "src"
        );

        audioPreview.load();

        audioPreview.hidden =
          true;

      }


      if (audioDownload) {

        audioDownload.hidden =
          true;

        audioDownload.removeAttribute(
          "href"
        );

      }


      if (volumeControl) {

        volumeControl.value =
          100;

      }


      if (fadeInControl) {

        fadeInControl.value =
          0;

      }


      if (fadeOutControl) {

        fadeOutControl.value =
          0;

      }


      updateVolumeDisplay();


      setStatus(
        "audioStatus",
        "Audio editor reset."
      );

    }
  );

}


/* =========================================================
   AUDIO FILE INFORMATION
========================================================= */

audioFileInput?.addEventListener(
  "change",
  () => {

    const file =
      audioFileInput.files?.[0];


    if (!file) {

      return;

    }


    const sizeMB =
      file.size /
      (1024 * 1024);


    setStatus(
      "audioStatus",
      `${file.name} • ${sizeMB.toFixed(2)} MB`
    );

  }
);