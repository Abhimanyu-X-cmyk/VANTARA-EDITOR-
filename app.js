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
/* =========================================================
   VANTARA EDITOR V2
   PART 5A
   AUDIO MERGE
========================================================= */

let mergeAudioFiles = [];

const mergeFilesInput =
  $("mergeFiles");

const mergeList =
  $("mergeList");

const mergeButton =
  $("mergeBtn");

const mergeStatusId =
  "mergeStatus";

const mergeDownload =
  $("mergeDownload");


/* =========================================================
   RENDER SELECTED AUDIO FILES
========================================================= */

function renderMergeFiles() {

  if (!mergeList) {
    return;
  }

  mergeList.innerHTML = "";


  if (mergeAudioFiles.length === 0) {

    const empty =
      document.createElement("div");

    empty.className =
      "empty-state";

    empty.innerHTML = `
      <p>
        No audio files selected.
      </p>
    `;

    mergeList.appendChild(
      empty
    );

    return;
  }


  mergeAudioFiles.forEach(
    (file, index) => {

      const item =
        document.createElement("div");

      item.className =
        "merge-item";


      item.innerHTML = `
        <div class="merge-file-info">

          <strong>
            ${index + 1}.
            ${escapeHTML(file.name)}
          </strong>

          <small>
            ${(file.size / 1024 / 1024).toFixed(2)} MB
          </small>

        </div>

        <button
          type="button"
          class="small-btn danger"
          data-remove-merge="${index}">
          Remove
        </button>

      `;


      mergeList.appendChild(
        item
      );

    }
  );


  /*
    Remove buttons
  */

  mergeList
    .querySelectorAll(
      "[data-remove-merge]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.removeMerge
            );


          mergeAudioFiles.splice(
            index,
            1
          );


          renderMergeFiles();


          setStatus(
            mergeStatusId,
            "Audio file removed."
          );

        }
      );

    });

}


/* =========================================================
   SELECT AUDIO FILES
========================================================= */

mergeFilesInput?.addEventListener(
  "change",
  event => {

    const files =
      Array.from(
        event.target.files || []
      );


    if (
      files.length === 0
    ) {
      return;
    }


    const audioFiles =
      files.filter(
        file =>
          file.type.startsWith(
            "audio/"
          )
      );


    if (
      audioFiles.length === 0
    ) {

      setStatus(
        mergeStatusId,
        "Please select audio files only.",
        "error"
      );

      return;

    }


    mergeAudioFiles.push(
      ...audioFiles
    );


    renderMergeFiles();


    setStatus(
      mergeStatusId,
      `${mergeAudioFiles.length} audio file${
        mergeAudioFiles.length === 1
          ? ""
          : "s"
      } selected.`,
      "success"
    );

  }
);


/* =========================================================
   DECODE AUDIO FILE
========================================================= */

async function decodeMergeAudio(
  context,
  file
) {

  const arrayBuffer =
    await file.arrayBuffer();


  return context.decodeAudioData(
    arrayBuffer.slice(0)
  );

}


/* =========================================================
   CALCULATE TOTAL DURATION
========================================================= */

function calculateTotalDuration(
  buffers
) {

  return buffers.reduce(
    (
      total,
      buffer
    ) =>
      total +
      buffer.duration,
    0
  );

}


/* =========================================================
   MERGE AUDIO
========================================================= */

async function mergeAudioFilesToWav() {

  if (
    mergeAudioFiles.length === 0
  ) {

    setStatus(
      mergeStatusId,
      "Please select audio files first.",
      "error"
    );

    return;

  }


  if (
    mergeAudioFiles.length === 1
  ) {

    setStatus(
      mergeStatusId,
      "Please select at least two audio files to merge.",
      "error"
    );

    return;

  }


  if (mergeButton) {

    mergeButton.disabled =
      true;

    mergeButton.textContent =
      "Merging...";

  }


  try {

    setStatus(
      mergeStatusId,
      "Loading audio files..."
    );


    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    if (!AudioContextClass) {

      throw new Error(
        "Web Audio API is not supported in this browser."
      );

    }


    const context =
      new AudioContextClass();


    const buffers = [];


    /* -----------------------------------------
       READ EACH AUDIO FILE
    ----------------------------------------- */

    for (
      let i = 0;
      i < mergeAudioFiles.length;
      i++
    ) {

      setStatus(
        mergeStatusId,
        `Reading file ${i + 1} of ${mergeAudioFiles.length}...`
      );


      const buffer =
        await decodeMergeAudio(
          context,
          mergeAudioFiles[i]
        );


      buffers.push(
        buffer
      );

    }


    /* -----------------------------------------
       AUDIO SETTINGS
    ----------------------------------------- */

    const sampleRate =
      buffers[0].sampleRate;


    const numberOfChannels =
      Math.max(
        ...buffers.map(
          buffer =>
            buffer.numberOfChannels
        )
      );


    const totalDuration =
      calculateTotalDuration(
        buffers
      );


    const totalLength =
      Math.ceil(
        totalDuration *
        sampleRate
      );


    /* -----------------------------------------
       CREATE MERGED BUFFER
    ----------------------------------------- */

    setStatus(
      mergeStatusId,
      "Combining audio..."
    );


    const mergedBuffer =
      new AudioBuffer({
        length:
          totalLength,

        numberOfChannels:
          numberOfChannels,

        sampleRate:
          sampleRate
      });


    let offset = 0;


    /* -----------------------------------------
       COPY AUDIO
    ----------------------------------------- */

    for (
      let fileIndex = 0;
      fileIndex < buffers.length;
      fileIndex++
    ) {

      const buffer =
        buffers[fileIndex];


      const length =
        buffer.length;


      for (
        let channel = 0;
        channel < numberOfChannels;
        channel++
      ) {

        const output =
          mergedBuffer.getChannelData(
            channel
          );


        const sourceChannel =
          Math.min(
            channel,
            buffer.numberOfChannels - 1
          );


        const input =
          buffer.getChannelData(
            sourceChannel
          );


        output.set(
          input,
          offset
        );

      }


      offset +=
        length;


      setStatus(
        mergeStatusId,
        `Merged ${fileIndex + 1} of ${buffers.length} files...`
      );

    }


    /* -----------------------------------------
       CONVERT TO WAV
    ----------------------------------------- */

    const wavBlob =
      audioBufferToWav(
        mergedBuffer
      );


    const url =
      URL.createObjectURL(
        wavBlob
      );


    /* -----------------------------------------
       DOWNLOAD LINK
    ----------------------------------------- */

    if (mergeDownload) {

      mergeDownload.href =
        url;

      mergeDownload.download =
        "vantara-merged-audio.wav";

      mergeDownload.textContent =
        "Download Merged Audio";

      mergeDownload.hidden =
        false;

    }


    setStatus(
      mergeStatusId,
      `Successfully merged ${buffers.length} audio files.`,
      "success"
    );


    await context.close();

  } catch (error) {

    console.error(
      "Audio merge error:",
      error
    );


    setStatus(
      mergeStatusId,
      error.message ||
        "Audio merge failed.",
      "error"
    );

  } finally {

    if (mergeButton) {

      mergeButton.disabled =
        false;

      mergeButton.textContent =
        "Merge Audio";

    }

  }

}


/* =========================================================
   MERGE BUTTON
========================================================= */

mergeButton?.addEventListener(
  "click",
  mergeAudioFilesToWav
);


/* =========================================================
   CLEAR MERGE LIST
========================================================= */

const clearMergeButton =
  $("clearMerge");


if (clearMergeButton) {

  clearMergeButton.addEventListener(
    "click",
    () => {

      mergeAudioFiles =
        [];


      if (mergeFilesInput) {

        mergeFilesInput.value =
          "";

      }


      if (mergeDownload) {

        mergeDownload.hidden =
          true;

        mergeDownload.removeAttribute(
          "href"
        );

      }


      renderMergeFiles();


      setStatus(
        mergeStatusId,
        "Audio list cleared."
      );

    }
  );

}


/* =========================================================
   INITIALIZE
========================================================= */

renderMergeFiles();
/* =========================================================
   VANTARA EDITOR V2
   PART 5B
   AUDIO MERGE ORDERING
========================================================= */


/* =========================================================
   MOVE FILE UP
========================================================= */

function moveMergeFileUp(index) {

  if (
    index <= 0 ||
    index >= mergeAudioFiles.length
  ) {
    return;
  }


  const temp =
    mergeAudioFiles[index];


  mergeAudioFiles[index] =
    mergeAudioFiles[index - 1];


  mergeAudioFiles[index - 1] =
    temp;


  renderMergeFilesWithOrdering();

}


/* =========================================================
   MOVE FILE DOWN
========================================================= */

function moveMergeFileDown(index) {

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
    mergeAudioFiles[index + 1];


  mergeAudioFiles[index + 1] =
    temp;


  renderMergeFilesWithOrdering();

}


/* =========================================================
   ORDERED MERGE LIST
========================================================= */

function renderMergeFilesWithOrdering() {

  if (!mergeList) {
    return;
  }


  mergeList.innerHTML =
    "";


  if (
    mergeAudioFiles.length === 0
  ) {

    mergeList.innerHTML = `
      <div class="empty-state">
        <p>
          No audio files selected.
        </p>
      </div>
    `;

    return;
  }


  mergeAudioFiles.forEach(
    (file, index) => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "merge-item";


      item.innerHTML = `
        <div class="merge-file-info">

          <strong>
            ${index + 1}.
            ${escapeHTML(file.name)}
          </strong>

          <small>
            ${(file.size / 1024 / 1024).toFixed(2)} MB
          </small>

        </div>


        <div class="merge-controls">

          <button
            type="button"
            class="small-btn"
            data-merge-up="${index}"
            ${index === 0 ? "disabled" : ""}>
            ↑
          </button>


          <button
            type="button"
            class="small-btn"
            data-merge-down="${index}"
            ${
              index ===
              mergeAudioFiles.length - 1
                ? "disabled"
                : ""
            }>
            ↓
          </button>


          <button
            type="button"
            class="small-btn danger"
            data-merge-remove="${index}">
            Remove
          </button>

        </div>
      `;


      mergeList.appendChild(
        item
      );

    }
  );


  /* -----------------------------------------
     UP BUTTONS
  ----------------------------------------- */

  mergeList
    .querySelectorAll(
      "[data-merge-up]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          moveMergeFileUp(
            Number(
              button.dataset.mergeUp
            )
          );

        }
      );

    });


  /* -----------------------------------------
     DOWN BUTTONS
  ----------------------------------------- */

  mergeList
    .querySelectorAll(
      "[data-merge-down]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          moveMergeFileDown(
            Number(
              button.dataset.mergeDown
            )
          );

        }
      );

    });


  /* -----------------------------------------
     REMOVE BUTTONS
  ----------------------------------------- */

  mergeList
    .querySelectorAll(
      "[data-merge-remove]"
    )
    .forEach(button => {

      button.addEventListener(
        "click",
        () => {

          const index =
            Number(
              button.dataset.mergeRemove
            );


          mergeAudioFiles.splice(
            index,
            1
          );


          renderMergeFilesWithOrdering();


          setStatus(
            mergeStatusId,
            "Audio file removed."
          );

        }
      );

    });

}


/* =========================================================
   REPLACE NORMAL RENDER FUNCTION
========================================================= */

renderMergeFiles =
  renderMergeFilesWithOrdering;


/* =========================================================
   DRAG AND DROP ORDERING
========================================================= */

let draggedMergeIndex =
  null;


function enableMergeDragAndDrop() {

  if (!mergeList) {
    return;
  }


  mergeList
    .querySelectorAll(
      ".merge-item"
    )
    .forEach(
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
              draggedMergeIndex === null ||
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


            renderMergeFilesWithOrdering();

            enableMergeDragAndDrop();

          }
        );

      }
    );

}


/* =========================================================
   FINAL RENDER
========================================================= */

renderMergeFilesWithOrdering();

enableMergeDragAndDrop();
/* =========================================================
   VANTARA EDITOR V2
   PART 6A
   BRAND KIT
========================================================= */

const brandNameInput =
  $("brandName");

const brandWebsiteInput =
  $("brandWebsite");

const brandTeacherInput =
  $("brandTeacher");

const brandFooterInput =
  $("brandFooter");

const saveBrandButton =
  $("saveBrand");

const brandStatusId =
  "brandStatus";


/* =========================================================
   DEFAULT VANTARA BRAND
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


/* =========================================================
   LOAD BRAND SETTINGS
========================================================= */

function loadBrandSettings() {

  let saved = null;


  try {

    saved =
      JSON.parse(
        localStorage.getItem(
          "vantaraBrandSettings"
        )
      );

  } catch (error) {

    saved =
      null;

  }


  const settings =
    saved ||
    defaultBrandSettings;


  if (brandNameInput) {

    brandNameInput.value =
      settings.name || "";

  }


  if (brandWebsiteInput) {

    brandWebsiteInput.value =
      settings.website || "";

  }


  if (brandTeacherInput) {

    brandTeacherInput.value =
      settings.teacher || "";

  }


  if (brandFooterInput) {

    brandFooterInput.value =
      settings.footer || "";

  }

}


/* =========================================================
   GET BRAND SETTINGS
========================================================= */

function getBrandSettings() {

  return {

    name:
      brandNameInput?.value.trim() ||
      defaultBrandSettings.name,

    website:
      brandWebsiteInput?.value.trim() ||
      defaultBrandSettings.website,

    teacher:
      brandTeacherInput?.value.trim() ||
      defaultBrandSettings.teacher,

    footer:
      brandFooterInput?.value.trim() ||
      defaultBrandSettings.footer

  };

}


/* =========================================================
   SAVE BRAND SETTINGS
========================================================= */

function saveBrandSettings() {

  const settings =
    getBrandSettings();


  try {

    localStorage.setItem(
      "vantaraBrandSettings",
      JSON.stringify(
        settings
      )
    );


    setStatus(
      brandStatusId,
      "Brand settings saved successfully.",
      "success"
    );


    updateVisibleBranding(
      settings
    );


    renderBrandPreview();


  } catch (error) {

    console.error(
      "Brand save error:",
      error
    );


    setStatus(
      brandStatusId,
      "Could not save brand settings.",
      "error"
    );

  }

}


saveBrandButton?.addEventListener(
  "click",
  saveBrandSettings
);


/* =========================================================
   UPDATE VISIBLE BRANDING
========================================================= */

function updateVisibleBranding(
  settings
) {

  const brandTitle =
    $("brandTitle");


  if (brandTitle) {

    brandTitle.textContent =
      settings.name;

  }


  const brandWebsiteDisplay =
    $("brandWebsiteDisplay");


  if (brandWebsiteDisplay) {

    brandWebsiteDisplay.textContent =
      settings.website;

  }


  const footerBrand =
    $("footerBrand");


  if (footerBrand) {

    footerBrand.textContent =
      settings.footer;

  }


  const teacherDisplay =
    $("teacherDisplay");


  if (teacherDisplay) {

    teacherDisplay.textContent =
      settings.teacher;

  }

}


/* =========================================================
   BRAND PREVIEW
========================================================= */

const brandPreview =
  $("brandPreview");


function renderBrandPreview() {

  if (!brandPreview) {

    return;

  }


  const settings =
    getBrandSettings();


  brandPreview.innerHTML = `

    <div class="brand-preview-card">

      <div class="brand-preview-logo">
        V
      </div>


      <div class="brand-preview-content">

        <h3>
          ${escapeHTML(
            settings.name
          )}
        </h3>


        <p>
          ${escapeHTML(
            settings.teacher
          )}
        </p>


        <small>
          ${escapeHTML(
            settings.website
          )}
        </small>

      </div>

    </div>

  `;

}


/* =========================================================
   LIVE PREVIEW
========================================================= */

[
  brandNameInput,
  brandWebsiteInput,
  brandTeacherInput,
  brandFooterInput
]
  .filter(Boolean)
  .forEach(
    input => {

      input.addEventListener(
        "input",
        renderBrandPreview
      );

    }
  );


/* =========================================================
   RESET BRAND
========================================================= */

const resetBrandButton =
  $("resetBrand");


if (resetBrandButton) {

  resetBrandButton.addEventListener(
    "click",
    () => {

      const confirmed =
        window.confirm(
          "Reset VANTARA brand settings?"
        );


      if (!confirmed) {

        return;

      }


      localStorage.removeItem(
        "vantaraBrandSettings"
      );


      loadBrandSettings();

      renderBrandPreview();


      setStatus(
        brandStatusId,
        "Brand settings reset."
      );

    }
  );

}


/* =========================================================
   INITIALIZE BRAND KIT
========================================================= */

loadBrandSettings();

renderBrandPreview();
/* =========================================================
   VANTARA EDITOR V2
   PART 6B
   SCRIPT ASSISTANT
========================================================= */

const assistantInput =
  $("assistantInput");

const assistantOutput =
  $("assistantOutput");

const assistantStatusId =
  "assistantStatus";


/* =========================================================
   GET INPUT
========================================================= */

function getAssistantInput() {

  if (!assistantInput) {
    return "";
  }

  return assistantInput.value.trim();
}


/* =========================================================
   SET OUTPUT
========================================================= */

function setAssistantOutput(text) {

  if (!assistantOutput) {
    return;
  }

  if (
    assistantOutput.tagName === "TEXTAREA" ||
    assistantOutput.tagName === "INPUT"
  ) {

    assistantOutput.value =
      text;

  } else {

    assistantOutput.textContent =
      text;

  }
}


/* =========================================================
   SIMPLE VERSION
========================================================= */

function makeSimpleScript(text) {

  return text
    .replace(/\s+/g, " ")
    .trim();

}


/* =========================================================
   CLASSROOM VERSION
========================================================= */

function makeClassroomScript(text) {

  const clean =
    makeSimpleScript(text);

  if (!clean) {
    return "";
  }

  return (
    "Students, let's understand this carefully. " +
    clean +
    " Take a moment to think about this. " +
    "Now let's move ahead and understand the next part."
  );

}


/* =========================================================
   HINGLISH VERSION
========================================================= */

function makeHinglishScript(text) {

  const clean =
    makeSimpleScript(text);

  if (!clean) {
    return "";
  }

  return (
    "Students, is concept ko carefully samajhte hain. " +
    clean +
    " Is point ko ek baar dhyan se dekhiye. " +
    "Ab chaliye next part ki taraf move karte hain."
  );

}


/* =========================================================
   SHORT VERSION
========================================================= */

function makeShortScript(text) {

  const clean =
    makeSimpleScript(text);

  if (!clean) {
    return "";
  }

  const sentences =
    clean.split(
      /(?<=[.!?])\s+/
    );

  const target =
    Math.max(
      1,
      Math.ceil(
        sentences.length / 2
      )
    );

  return sentences
    .slice(0, target)
    .join(" ");

}


/* =========================================================
   PAUSE-FRIENDLY VERSION
========================================================= */

function makePauseFriendly(text) {

  const clean =
    makeSimpleScript(text);

  if (!clean) {
    return "";
  }

  return clean
    .replace(
      /([.!?])\s+/g,
      "$1\n\n"
    );

}


/* =========================================================
   RUN ASSISTANT
========================================================= */

function runAssistantAction(action) {

  const input =
    getAssistantInput();

  if (!input) {

    setStatus(
      assistantStatusId,
      "Please enter some text first.",
      "error"
    );

    return;
  }


  let result = input;


  switch (action) {

    case "simple":

      result =
        makeSimpleScript(input);

      break;


    case "classroom":

      result =
        makeClassroomScript(input);

      break;


    case "hinglish":

      result =
        makeHinglishScript(input);

      break;


    case "short":

      result =
        makeShortScript(input);

      break;


    case "pause":

      result =
        makePauseFriendly(input);

      break;


    default:

      result =
        input;

  }


  setAssistantOutput(
    result
  );


  setStatus(
    assistantStatusId,
    "Script updated successfully.",
    "success"
  );

}


/* =========================================================
   ASSISTANT ACTION BUTTONS
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

          runAssistantAction(
            button.dataset.action
          );

        }
      );

    }
  );


/* =========================================================
   USE ASSISTANT RESULT
========================================================= */

const useAssistantButton =
  $("useAssistant");


if (useAssistantButton) {

  useAssistantButton.addEventListener(
    "click",
    () => {

      const result =
        assistantOutput?.value ||
        assistantOutput?.textContent ||
        "";


      if (!result.trim()) {

        setStatus(
          assistantStatusId,
          "Create a script first.",
          "error"
        );

        return;

      }


      if ($("script")) {

        $("script").value =
          result;


        updateCharacterCounter();


        displayChunks(
          splitText(
            result,
            1800
          )
        );

      }


      const voiceoverTab =
        document.querySelector(
          '[data-tab="voiceover"]'
        );


      if (voiceoverTab) {

        voiceoverTab.click();

      }


      setStatus(
        "voiceStatus",
        "Assistant script added to Voiceover Studio.",
        "success"
      );

    }
  );

}


/* =========================================================
   COPY RESULT
========================================================= */

const copyAssistantButton =
  $("copyAssistant");


if (copyAssistantButton) {

  copyAssistantButton.addEventListener(
    "click",
    async () => {

      const result =
        assistantOutput?.value ||
        assistantOutput?.textContent ||
        "";


      if (!result.trim()) {

        setStatus(
          assistantStatusId,
          "Nothing to copy.",
          "error"
        );

        return;

      }


      try {

        await navigator.clipboard.writeText(
          result
        );


        setStatus(
          assistantStatusId,
          "Script copied successfully.",
          "success"
        );

      } catch (error) {

        setStatus(
          assistantStatusId,
          "Copy failed.",
          "error"
        );

      }

    }
  );

}


/* =========================================================
   CLEAR ASSISTANT
========================================================= */

const clearAssistantButton =
  $("clearAssistant");


if (clearAssistantButton) {

  clearAssistantButton.addEventListener(
    "click",
    () => {

      if (assistantInput) {

        assistantInput.value =
          "";

      }


      setAssistantOutput(
        ""
      );


      setStatus(
        assistantStatusId,
        "Assistant cleared."
      );

    }
  );

}
/* =========================================================
   VANTARA EDITOR V2
   PART 7A
   PROJECT LIBRARY
========================================================= */

const PROJECT_STORAGE_KEY =
  "vantaraEditorProjects";

let vantaraProjects = [];


/* =========================================================
   LOAD PROJECTS
========================================================= */

function loadProjects() {

  try {

    const saved =
      localStorage.getItem(
        PROJECT_STORAGE_KEY
      );

    vantaraProjects =
      saved
        ? JSON.parse(saved)
        : [];

    if (!Array.isArray(vantaraProjects)) {
      vantaraProjects = [];
    }

  } catch (error) {

    vantaraProjects = [];

  }

}


/* =========================================================
   SAVE PROJECTS
========================================================= */

function saveProjects() {

  localStorage.setItem(
    PROJECT_STORAGE_KEY,
    JSON.stringify(
      vantaraProjects
    )
  );

}


/* =========================================================
   CREATE PROJECT
========================================================= */

function createProjectData(
  projectName
) {

  const script =
    $("script")?.value || "";

  const lessonName =
    $("lessonName")?.value || "";

  const slideCount =
    typeof lessonSlides !== "undefined"
      ? lessonSlides.length
      : 0;

  const assistantScript =
    assistantOutput?.value ||
    assistantOutput?.textContent ||
    "";

  return {

    id:
      Date.now().toString(),

    name:
      projectName ||
      "Untitled VANTARA Project",

    createdAt:
      new Date().toISOString(),

    lessonName:
      lessonName,

    slideCount:
      slideCount,

    script:
      script,

    assistantScript:
      assistantScript

  };

}


/* =========================================================
   ADD PROJECT
========================================================= */

function addProject(
  projectName
) {

  const project =
    createProjectData(
      projectName
    );


  vantaraProjects.unshift(
    project
  );


  saveProjects();

  renderProjectLibrary();

  updateDashboard();


  setStatus(
    "libraryStatus",
    "Project saved successfully.",
    "success"
  );

}


/* =========================================================
   OPEN PROJECT
========================================================= */

function openProject(
  projectId
) {

  const project =
    vantaraProjects.find(
      item =>
        item.id === projectId
    );


  if (!project) {

    setStatus(
      "libraryStatus",
      "Project not found.",
      "error"
    );

    return;

  }


  if ($("script")) {

    $("script").value =
      project.script || "";

    updateCharacterCounter();

    displayChunks(
      splitText(
        project.script || "",
        1800
      )
    );

  }


  if ($("lessonName")) {

    $("lessonName").value =
      project.lessonName || "";

  }


  if (
    assistantOutput
  ) {

    setAssistantOutput(
      project.assistantScript || ""
    );

  }


  const voiceoverTab =
    document.querySelector(
      '[data-tab="voiceover"]'
    );


  if (voiceoverTab) {

    voiceoverTab.click();

  }


  setStatus(
    "libraryStatus",
    "Project opened successfully.",
    "success"
  );

}


/* =========================================================
   DELETE PROJECT
========================================================= */

function deleteProject(
  projectId
) {

  const project =
    vantaraProjects.find(
      item =>
        item.id === projectId
    );


  if (!project) {
    return;
  }


  const confirmed =
    window.confirm(
      `Delete "${project.name}"?`
    );


  if (!confirmed) {
    return;
  }


  vantaraProjects =
    vantaraProjects.filter(
      item =>
        item.id !== projectId
    );


  saveProjects();

  renderProjectLibrary();

  updateDashboard();


  setStatus(
    "libraryStatus",
    "Project deleted.",
    "success"
  );

}


/* =========================================================
   FORMAT DATE
========================================================= */

function formatProjectDate(
  date
) {

  try {

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );

  } catch (error) {

    return "";

  }

}


/* =========================================================
   RENDER PROJECT LIBRARY
========================================================= */

function renderProjectLibrary(
  searchText = ""
) {

  const libraryGrid =
    $("libraryGrid");


  if (!libraryGrid) {
    return;
  }


  const query =
    String(searchText || "")
      .toLowerCase()
      .trim();


  const filtered =
    vantaraProjects.filter(
      project =>
        !query ||
        project.name
          .toLowerCase()
          .includes(query) ||
        project.lessonName
          .toLowerCase()
          .includes(query)
    );


  if (!filtered.length) {

    libraryGrid.innerHTML = `
      <div class="empty-state">
        <h3>No projects found</h3>
        <p>
          Save a project from VANTARA EDITOR
          and it will appear here.
        </p>
      </div>
    `;

    return;

  }


  libraryGrid.innerHTML =
    filtered
      .map(
        project => `
          <article class="project-card">

            <div class="project-card-top">

              <div>

                <h3>
                  ${escapeHTML(
                    project.name
                  )}
                </h3>

                <small>
                  ${escapeHTML(
                    formatProjectDate(
                      project.createdAt
                    )
                  )}
                </small>

              </div>

            </div>


            <p>
              ${
                project.lessonName
                  ? escapeHTML(
                      project.lessonName
                    )
                  : "VANTARA Education Project"
              }
            </p>


            <div class="project-meta">

              <span>
                ${project.slideCount || 0}
                slides
              </span>

              <span>
                ${(project.script || "").length}
                characters
              </span>

            </div>


            <div class="project-actions">

              <button
                class="small-btn"
                onclick="openProject('${project.id}')"
              >
                Open
              </button>

              <button
                class="small-btn danger"
                onclick="deleteProject('${project.id}')"
              >
                Delete
              </button>

            </div>

          </article>
        `
      )
      .join("");

}


/* =========================================================
   SAVE PROJECT BUTTON
========================================================= */

const saveProjectButton =
  $("saveProject");


if (saveProjectButton) {

  saveProjectButton.addEventListener(
    "click",
    () => {

      const defaultName =
        $("lessonName")?.value.trim() ||
        "VANTARA Lesson";


      const projectName =
        window.prompt(
          "Enter project name:",
          defaultName
        );


      if (
        projectName === null
      ) {
        return;
      }


      addProject(
        projectName.trim() ||
        defaultName
      );

    }
  );

}


/* =========================================================
   PROJECT SEARCH
========================================================= */

const projectSearch =
  $("projectSearch");


if (projectSearch) {

  projectSearch.addEventListener(
    "input",
    () => {

      renderProjectLibrary(
        projectSearch.value
      );

    }
  );

}


/* =========================================================
   INITIALIZE LIBRARY
========================================================= */

loadProjects();

renderProjectLibrary();
/* =========================================================
   VANTARA EDITOR V2
   PART 7B
   DASHBOARD STATISTICS
========================================================= */


/* =========================================================
   CALCULATE PROJECT STATISTICS
========================================================= */

function getProjectStatistics() {

  const totalProjects =
    vantaraProjects.length;


  const totalSlides =
    vantaraProjects.reduce(
      (total, project) =>
        total +
        Number(project.slideCount || 0),
      0
    );


  const totalCharacters =
    vantaraProjects.reduce(
      (total, project) =>
        total +
        String(project.script || "").length,
      0
    );


  return {
    totalProjects,
    totalSlides,
    totalCharacters
  };

}


/* =========================================================
   UPDATE DASHBOARD NUMBERS
========================================================= */

function updateDashboard() {

  const stats =
    getProjectStatistics();


  const projectCount =
    $("projectCount");

  const slideCount =
    $("slideCount");

  const characterCount =
    $("characterCount");


  if (projectCount) {

    projectCount.textContent =
      stats.totalProjects;

  }


  if (slideCount) {

    slideCount.textContent =
      stats.totalSlides;

  }


  if (characterCount) {

    characterCount.textContent =
      stats.totalCharacters.toLocaleString(
        "en-IN"
      );

  }


  renderRecentProjects();

}


/* =========================================================
   RECENT PROJECTS
========================================================= */

function renderRecentProjects() {

  const recentProjects =
    $("recentProjects");


  if (!recentProjects) {
    return;
  }


  const projects =
    vantaraProjects
      .slice(0, 5);


  if (!projects.length) {

    recentProjects.innerHTML = `
      <div class="empty-state">

        <h3>
          No recent projects
        </h3>

        <p>
          Your saved VANTARA projects
          will appear here.
        </p>

      </div>
    `;

    return;

  }


  recentProjects.innerHTML =
    projects
      .map(
        project => `
          <div class="recent-project">

            <div>

              <strong>
                ${escapeHTML(
                  project.name
                )}
              </strong>

              <small>
                ${escapeHTML(
                  formatProjectDate(
                    project.createdAt
                  )
                )}
              </small>

            </div>


            <button
              class="small-btn"
              onclick="openProject('${project.id}')"
            >
              Open
            </button>

          </div>
        `
      )
      .join("");

}


/* =========================================================
   REFRESH DASHBOARD
========================================================= */

function refreshDashboard() {

  updateDashboard();

  renderProjectLibrary(
    projectSearch?.value || ""
  );

}


/* =========================================================
   QUICK OPEN PROJECT
========================================================= */

const recentProjectButton =
  $("openRecentProject");


if (recentProjectButton) {

  recentProjectButton.addEventListener(
    "click",
    () => {

      if (!vantaraProjects.length) {

        setStatus(
          "dashboardStatus",
          "No saved projects yet.",
          "error"
        );

        return;

      }


      openProject(
        vantaraProjects[0].id
      );

    }
  );

}


/* =========================================================
   DASHBOARD → VOICEOVER
========================================================= */

const dashboardVoiceover =
  $("dashboardVoiceover");


if (dashboardVoiceover) {

  dashboardVoiceover.addEventListener(
    "click",
    () => {

      const tab =
        document.querySelector(
          '[data-tab="voiceover"]'
        );

      if (tab) {
        tab.click();
      }

    }
  );

}


/* =========================================================
   DASHBOARD → LESSON BUILDER
========================================================= */

const dashboardLesson =
  $("dashboardLesson");


if (dashboardLesson) {

  dashboardLesson.addEventListener(
    "click",
    () => {

      const tab =
        document.querySelector(
          '[data-tab="lesson"]'
        );

      if (tab) {
        tab.click();
      }

    }
  );

}


/* =========================================================
   DASHBOARD → PROJECT LIBRARY
========================================================= */

const dashboardLibrary =
  $("dashboardLibrary");


if (dashboardLibrary) {

  dashboardLibrary.addEventListener(
    "click",
    () => {

      const tab =
        document.querySelector(
          '[data-tab="library"]'
        );

      if (tab) {
        tab.click();
      }

    }
  );

}


/* =========================================================
   INITIAL DASHBOARD LOAD
========================================================= */

updateDashboard();


/* =========================================================
   UPDATE DASHBOARD AFTER PROJECT ACTIONS
========================================================= */

const originalAddProject =
  addProject;

addProject =
  function(projectName) {

    originalAddProject(
      projectName
    );

    updateDashboard();

  };


const originalDeleteProject =
  deleteProject;

deleteProject =
  function(projectId) {

    const before =
      vantaraProjects.length;

    const result =
      originalDeleteProject(
        projectId
      );

    if (
      vantaraProjects.length !== before
    ) {

      updateDashboard();

    }

    return result;

  };
/* =========================================================
   VANTARA EDITOR V2
   PART 8A
   VIDEO CREATOR FOUNDATION
========================================================= */

let videoSlides = [];
let videoAudioFile = null;


/* =========================================================
   ELEMENTS
========================================================= */

const videoSlideInput =
  $("videoSlideInput");

const videoAudioInput =
  $("videoAudioInput");

const videoSlideList =
  $("videoSlideList");

const videoSummary =
  $("videoSummary");

const clearVideoButton =
  $("clearVideo");

const videoStatus =
  "videoStatus";


/* =========================================================
   IMAGE FILE CHECK
========================================================= */

function isImageFile(file) {

  return (
    file &&
    file.type &&
    file.type.startsWith("image/")
  );

}


/* =========================================================
   ADD VIDEO SLIDES
========================================================= */

function addVideoSlides(files) {

  if (!files || !files.length) {
    return;
  }


  const imageFiles =
    Array.from(files)
      .filter(isImageFile);


  if (!imageFiles.length) {

    setStatus(
      videoStatus,
      "Please select image files.",
      "error"
    );

    return;

  }


  imageFiles.forEach(
    file => {

      videoSlides.push({

        id:
          Date.now().toString() +
          Math.random()
            .toString(36)
            .slice(2),

        file:
          file,

        name:
          file.name,

        duration:
          5

      });

    }
  );


  renderVideoSlides();

}


/* =========================================================
   VIDEO SLIDE INPUT
========================================================= */

if (videoSlideInput) {

  videoSlideInput.addEventListener(
    "change",
    () => {

      addVideoSlides(
        videoSlideInput.files
      );

      videoSlideInput.value = "";

    }
  );

}


/* =========================================================
   AUDIO INPUT
========================================================= */

if (videoAudioInput) {

  videoAudioInput.addEventListener(
    "change",
    () => {

      const file =
        videoAudioInput.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "audio/"
        )
      ) {

        setStatus(
          videoStatus,
          "Please select an audio file.",
          "error"
        );

        return;

      }


      videoAudioFile =
        file;


      setStatus(
        videoStatus,
        `Audio selected: ${file.name}`,
        "success"
      );

      renderVideoSummary();

    }
  );

}


/* =========================================================
   RENDER VIDEO SLIDES
========================================================= */

function renderVideoSlides() {

  if (!videoSlideList) {
    return;
  }


  if (!videoSlides.length) {

    videoSlideList.innerHTML = `
      <div class="empty-state">

        <h3>
          No video slides yet
        </h3>

        <p>
          Add images to create your lesson video.
        </p>

      </div>
    `;

    renderVideoSummary();

    return;

  }


  videoSlideList.innerHTML =
    videoSlides
      .map(
        (slide, index) => {

          const previewURL =
            URL.createObjectURL(
              slide.file
            );


          return `
            <div
              class="video-slide-item"
              data-video-id="${slide.id}"
            >

              <img
                src="${previewURL}"
                alt="Slide ${index + 1}"
              >


              <div class="video-slide-info">

                <strong>
                  Slide ${index + 1}
                </strong>

                <small>
                  ${escapeHTML(
                    slide.name
                  )}
                </small>

                <label>
                  Duration

                  <input
                    type="number"
                    min="1"
                    max="60"
                    step="1"
                    value="${slide.duration}"
                    data-duration-id="${slide.id}"
                  >

                  seconds
                </label>

              </div>


              <div class="video-slide-actions">

                <button
                  class="small-btn"
                  data-video-up="${slide.id}"
                >
                  ↑
                </button>

                <button
                  class="small-btn"
                  data-video-down="${slide.id}"
                >
                  ↓
                </button>

                <button
                  class="small-btn danger"
                  data-video-remove="${slide.id}"
                >
                  Remove
                </button>

              </div>

            </div>
          `;

        }
      )
      .join("");


  attachVideoSlideControls();

  renderVideoSummary();

}


/* =========================================================
   VIDEO SLIDE CONTROLS
========================================================= */

function attachVideoSlideControls() {

  document
    .querySelectorAll(
      "[data-duration-id]"
    )
    .forEach(
      input => {

        input.addEventListener(
          "change",
          () => {

            const slide =
              videoSlides.find(
                item =>
                  item.id ===
                  input.dataset.durationId
              );


            if (!slide) {
              return;
            }


            let value =
              Number(input.value);


            if (!Number.isFinite(value)) {
              value = 5;
            }


            value =
              Math.max(
                1,
                Math.min(
                  60,
                  value
                )
              );


            slide.duration =
              value;


            input.value =
              value;


            renderVideoSummary();

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-video-remove]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            const id =
              button.dataset.videoRemove;


            videoSlides =
              videoSlides.filter(
                slide =>
                  slide.id !== id
              );


            renderVideoSlides();

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-video-up]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveVideoSlide(
              button.dataset.videoUp,
              -1
            );

          }
        );

      }
    );


  document
    .querySelectorAll(
      "[data-video-down]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            moveVideoSlide(
              button.dataset.videoDown,
              1
            );

          }
        );

      }
    );

}


/* =========================================================
   MOVE VIDEO SLIDE
========================================================= */

function moveVideoSlide(
  slideId,
  direction
) {

  const index =
    videoSlides.findIndex(
      slide =>
        slide.id === slideId
    );


  if (index < 0) {
    return;
  }


  const newIndex =
    index + direction;


  if (
    newIndex < 0 ||
    newIndex >= videoSlides.length
  ) {

    return;

  }


  const temp =
    videoSlides[index];


  videoSlides[index] =
    videoSlides[newIndex];


  videoSlides[newIndex] =
    temp;


  renderVideoSlides();

}


/* =========================================================
   VIDEO SUMMARY
========================================================= */

function renderVideoSummary() {

  if (!videoSummary) {
    return;
  }


  const totalDuration =
    videoSlides.reduce(
      (total, slide) =>
        total +
        Number(slide.duration || 0),
      0
    );


  videoSummary.innerHTML = `
    <strong>
      ${videoSlides.length} slide${
        videoSlides.length === 1
          ? ""
          : "s"
      }
    </strong>

    <span>
      Total duration:
      ${totalDuration.toFixed(1)}
      seconds
    </span>

    <span>
      Audio:
      ${
        videoAudioFile
          ? escapeHTML(
              videoAudioFile.name
            )
          : "No audio selected"
      }
    </span>
  `;

}


/* =========================================================
   CLEAR VIDEO PROJECT
========================================================= */

if (clearVideoButton) {

  clearVideoButton.addEventListener(
    "click",
    () => {

      videoSlides = [];

      videoAudioFile =
        null;


      if (videoSlideInput) {
        videoSlideInput.value = "";
      }


      if (videoAudioInput) {
        videoAudioInput.value = "";
      }


      renderVideoSlides();


      setStatus(
        videoStatus,
        "Video project cleared.",
        "success"
      );

    }
  );

}


/* =========================================================
   INITIAL RENDER
========================================================= */

renderVideoSlides();
/* =========================================================
   VANTARA EDITOR V2
   PART 8B
   VIDEO TIMELINE + PREVIEW
========================================================= */

const videoTimeline =
  $("videoTimeline");

const videoPreview =
  $("videoPreview");

const previewVideoButton =
  $("previewVideo");


/* =========================================================
   GET TOTAL VIDEO DURATION
========================================================= */

function getVideoDuration() {

  return videoSlides.reduce(
    (total, slide) =>
      total +
      Number(slide.duration || 0),
    0
  );

}


/* =========================================================
   RENDER VIDEO TIMELINE
========================================================= */

function renderVideoTimeline() {

  if (!videoTimeline) {
    return;
  }


  if (!videoSlides.length) {

    videoTimeline.innerHTML = `
      <div class="empty-state">
        <p>
          Add slides to create a timeline.
        </p>
      </div>
    `;

    return;

  }


  let currentTime = 0;


  videoTimeline.innerHTML =
    videoSlides
      .map(
        (slide, index) => {

          const start =
            currentTime;

          const duration =
            Number(
              slide.duration || 5
            );


          currentTime +=
            duration;


          const width =
            Math.max(
              80,
              duration * 25
            );


          const previewURL =
            URL.createObjectURL(
              slide.file
            );


          return `
            <div
              class="timeline-item"
              style="width:${width}px"
              title="Slide ${index + 1}: ${duration}s"
            >

              <img
                src="${previewURL}"
                alt="Timeline slide ${index + 1}"
              >

              <div class="timeline-label">
                <strong>
                  ${index + 1}
                </strong>

                <span>
                  ${duration}s
                </span>
              </div>

            </div>
          `;

        }
      )
      .join("");


}


/* =========================================================
   UPDATE TIMELINE
========================================================= */

function updateVideoTimeline() {

  renderVideoTimeline();

  renderVideoSummary();

}


/* =========================================================
   VIDEO PREVIEW STATE
========================================================= */

let videoPreviewRunning =
  false;

let videoPreviewTimer =
  null;

let videoPreviewIndex =
  0;


/* =========================================================
   STOP VIDEO PREVIEW
========================================================= */

function stopVideoPreview() {

  videoPreviewRunning =
    false;


  if (videoPreviewTimer) {

    clearTimeout(
      videoPreviewTimer
    );

    videoPreviewTimer =
      null;

  }


  if (videoPreview) {

    videoPreview.classList.remove(
      "playing"
    );

  }

}


/* =========================================================
   PREVIEW VIDEO SLIDES
========================================================= */

function previewVideoProject() {

  if (!videoSlides.length) {

    setStatus(
      "videoStatus",
      "Add at least one image first.",
      "error"
    );

    return;

  }


  stopVideoPreview();


  videoPreviewRunning =
    true;

  videoPreviewIndex =
    0;


  if (videoPreview) {

    videoPreview.classList.add(
      "playing"
    );

  }


  showNextVideoPreviewSlide();

}


/* =========================================================
   SHOW NEXT PREVIEW SLIDE
========================================================= */

function showNextVideoPreviewSlide() {

  if (!videoPreviewRunning) {
    return;
  }


  if (
    videoPreviewIndex >=
    videoSlides.length
  ) {

    stopVideoPreview();


    setStatus(
      "videoStatus",
      "Video preview finished.",
      "success"
    );

    return;

  }


  const slide =
    videoSlides[
      videoPreviewIndex
    ];


  const imageURL =
    URL.createObjectURL(
      slide.file
    );


  if (videoPreview) {

    videoPreview.innerHTML = `
      <div class="video-preview-frame">

        <img
          src="${imageURL}"
          alt="Preview slide"
        >

        <div class="video-preview-overlay">

          <span>
            Slide
            ${videoPreviewIndex + 1}
            /
            ${videoSlides.length}
          </span>

        </div>

      </div>
    `;

  }


  setStatus(
    "videoStatus",
    `Previewing slide ${
      videoPreviewIndex + 1
    } of ${
      videoSlides.length
    }...`
  );


  const duration =
    Number(
      slide.duration || 5
    );


  videoPreviewTimer =
    setTimeout(
      () => {

        videoPreviewIndex++;

        showNextVideoPreviewSlide();

      },
      duration * 1000
    );

}


/* =========================================================
   PREVIEW BUTTON
========================================================= */

if (previewVideoButton) {

  previewVideoButton.addEventListener(
    "click",
    () => {

      previewVideoProject();

    }
  );

}


/* =========================================================
   OPTIONAL STOP BUTTON
========================================================= */

const stopVideoPreviewButton =
  $("stopVideoPreview");


if (stopVideoPreviewButton) {

  stopVideoPreviewButton.addEventListener(
    "click",
    () => {

      stopVideoPreview();

      setStatus(
        "videoStatus",
        "Video preview stopped."
      );

    }
  );

}


/* =========================================================
   REFRESH TIMELINE AFTER SLIDE CHANGES
========================================================= */

const originalRenderVideoSlides =
  renderVideoSlides;


renderVideoSlides =
  function() {

    originalRenderVideoSlides();

    updateVideoTimeline();

  };


/* =========================================================
   INITIAL TIMELINE
========================================================= */

updateVideoTimeline();
/* =========================================================
   VANTARA EDITOR V2
   PART 8C
   VIDEO EXPORT — WEBM
========================================================= */

const videoCanvas =
  $("videoCanvas");

const exportVideoButton =
  $("exportVideo");

const stopVideoExportButton =
  $("stopVideoExport");

const videoExportStatus =
  $("videoExportStatus");

const videoDownload =
  $("videoDownload");

let videoRecorder = null;
let videoExportStopped = false;


/* =========================================================
   CHECK BROWSER SUPPORT
========================================================= */

function browserSupportsVideoExport() {

  return !!(
    videoCanvas &&
    videoCanvas.captureStream &&
    window.MediaRecorder
  );

}


/* =========================================================
   DRAW IMAGE ON CANVAS
========================================================= */

function drawVideoImage(
  ctx,
  image,
  canvas
) {

  const canvasRatio =
    canvas.width /
    canvas.height;

  const imageRatio =
    image.width /
    image.height;


  let width;
  let height;
  let x;
  let y;


  if (imageRatio > canvasRatio) {

    height =
      canvas.height;

    width =
      height *
      imageRatio;

    x =
      (canvas.width - width) / 2;

    y = 0;

  } else {

    width =
      canvas.width;

    height =
      width /
      imageRatio;

    x = 0;

    y =
      (canvas.height - height) / 2;

  }


  ctx.fillStyle =
    "#000000";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.drawImage(
    image,
    x,
    y,
    width,
    height
  );

}


/* =========================================================
   LOAD IMAGE
========================================================= */

function loadVideoImage(file) {

  return new Promise(
    (resolve, reject) => {

      const image =
        new Image();

      const url =
        URL.createObjectURL(
          file
        );


      image.onload =
        () => {

          URL.revokeObjectURL(
            url
          );

          resolve(image);

        };


      image.onerror =
        () => {

          URL.revokeObjectURL(
            url
          );

          reject(
            new Error(
              "Could not load image."
            )
          );

        };


      image.src =
        url;

    }
  );

}


/* =========================================================
   WAIT
========================================================= */

function wait(ms) {

  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );

}


/* =========================================================
   EXPORT VIDEO
========================================================= */

async function exportVideoProject() {

  if (!videoSlides.length) {

    setStatus(
      "videoExportStatus",
      "Add at least one slide first.",
      "error"
    );

    return;

  }


  if (
    !browserSupportsVideoExport()
  ) {

    setStatus(
      "videoExportStatus",
      "This browser does not support video export.",
      "error"
    );

    return;

  }


  videoExportStopped =
    false;


  if (videoDownload) {

    videoDownload.hidden =
      true;

    videoDownload.removeAttribute(
      "href"
    );

  }


  const canvas =
    videoCanvas;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.fillStyle =
    "#000000";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  const stream =
    canvas.captureStream(
      30
    );


  const mimeTypes = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm"
  ];


  const supportedType =
    mimeTypes.find(
      type =>
        MediaRecorder.isTypeSupported(
          type
        )
    );


  if (!supportedType) {

    setStatus(
      "videoExportStatus",
      "WebM recording is not supported.",
      "error"
    );

    return;

  }


  const chunks = [];


  videoRecorder =
    new MediaRecorder(
      stream,
      {
        mimeType:
          supportedType
      }
    );


  videoRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        chunks.push(
          event.data
        );

      }

    };


  videoRecorder.onerror =
    () => {

      setStatus(
        "videoExportStatus",
        "Video recording failed.",
        "error"
      );

    };


  const recordingFinished =
    new Promise(
      resolve => {

        videoRecorder.onstop =
          resolve;

      }
    );


  videoRecorder.start();


  try {

    for (
      let index = 0;
      index < videoSlides.length;
      index++
    ) {

      if (
        videoExportStopped
      ) {

        break;

      }


      const slide =
        videoSlides[index];


      const image =
        await loadVideoImage(
          slide.file
        );


      drawVideoImage(
        ctx,
        image,
        canvas
      );


      setStatus(
        "videoExportStatus",
        `Exporting slide ${
          index + 1
        } of ${
          videoSlides.length
        }...`
      );


      await wait(
        Number(
          slide.duration || 5
        ) * 1000
      );

    }


  } catch (error) {

    console.error(
      error
    );


    setStatus(
      "videoExportStatus",
      "Could not export the video.",
      "error"
    );

  }


  if (
    videoRecorder.state !==
    "inactive"
  ) {

    videoRecorder.stop();

  }


  await recordingFinished;


  if (
    videoExportStopped
  ) {

    setStatus(
      "videoExportStatus",
      "Video export stopped."
    );

    videoRecorder =
      null;

    return;

  }


  const blob =
    new Blob(
      chunks,
      {
        type:
          supportedType
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  if (videoDownload) {

    videoDownload.href =
      url;

    videoDownload.download =
      "vantara-video.webm";

    videoDownload.textContent =
      "Download Video";

    videoDownload.hidden =
      false;

  }


  setStatus(
    "videoExportStatus",
    `Video exported successfully • ${
      (blob.size / 1024 / 1024).toFixed(2)
    } MB`,
    "success"
  );


  videoRecorder =
    null;

}


/* =========================================================
   EXPORT BUTTON
========================================================= */

if (exportVideoButton) {

  exportVideoButton.addEventListener(
    "click",
    () => {

      exportVideoProject();

    }
  );

}


/* =========================================================
   STOP EXPORT
========================================================= */

if (stopVideoExportButton) {

  stopVideoExportButton.addEventListener(
    "click",
    () => {

      videoExportStopped =
        true;


      if (
        videoRecorder &&
        videoRecorder.state !==
          "inactive"
      ) {

        videoRecorder.stop();

      }

    }
  );

}
<div class="video-export-tools">

  <canvas
    id="videoCanvas"
    width="1280"
    height="720"
  ></canvas>

  <button
    id="exportVideo"
    class="primary"
  >
    Export Video
  </button>

  <button
    id="stopVideoExport"
    class="small-btn"
  >
    Stop Export
  </button>

  <div
    id="videoExportStatus"
    class="status"
  ></div>

  <a
    id="videoDownload"
    class="download"
    hidden
  >
    Download Video
  </a>

</div>

/* =========================================================
   VANTARA EDITOR V2
   PART 9A
   VIDEO + AUDIO MIXING
========================================================= */

let videoAudioBuffer = null;


/* =========================================================
   LOAD VIDEO AUDIO
========================================================= */

async function loadVideoAudioBuffer() {

  if (!videoAudioFile) {
    videoAudioBuffer = null;
    return null;
  }

  try {

    const arrayBuffer =
      await videoAudioFile.arrayBuffer();

    const audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

    videoAudioBuffer =
      await audioContext.decodeAudioData(
        arrayBuffer
      );

    return videoAudioBuffer;

  } catch (error) {

    console.error(
      "Audio loading error:",
      error
    );

    videoAudioBuffer =
      null;

    return null;

  }

}


/* =========================================================
   CREATE AUDIO STREAM
========================================================= */

function createVideoAudioStream(
  audioContext,
  destination
) {

  if (!videoAudioBuffer) {
    return null;
  }


  const source =
    audioContext.createBufferSource();


  source.buffer =
    videoAudioBuffer;


  source.connect(
    destination
  );


  return source;

}


/* =========================================================
   EXPORT VIDEO WITH AUDIO
========================================================= */

async function exportVideoWithAudio() {

  if (!videoSlides.length) {

    setStatus(
      "videoExportStatus",
      "Add at least one slide first.",
      "error"
    );

    return;

  }


  if (
    !browserSupportsVideoExport()
  ) {

    setStatus(
      "videoExportStatus",
      "This browser does not support video export.",
      "error"
    );

    return;

  }


  videoExportStopped =
    false;


  if (videoDownload) {

    videoDownload.hidden =
      true;

    videoDownload.removeAttribute(
      "href"
    );

  }


  setStatus(
    "videoExportStatus",
    "Preparing video and audio..."
  );


  /* -------------------------------------------------------
     LOAD AUDIO
  ------------------------------------------------------- */

  await loadVideoAudioBuffer();


  const canvas =
    videoCanvas;


  const ctx =
    canvas.getContext(
      "2d"
    );


  ctx.fillStyle =
    "#000000";


  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  /* -------------------------------------------------------
     VIDEO STREAM
  ------------------------------------------------------- */

  const videoStream =
    canvas.captureStream(
      30
    );


  /* -------------------------------------------------------
     AUDIO STREAM
  ------------------------------------------------------- */

  let finalStream =
    videoStream;


  let audioContext =
    null;

  let audioDestination =
    null;

  let audioSource =
    null;


  if (videoAudioBuffer) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


    audioDestination =
      audioContext.createMediaStreamDestination();


    audioSource =
      createVideoAudioStream(
        audioContext,
        audioDestination
      );


    if (
      audioDestination &&
      audioDestination.stream
    ) {

      audioDestination.stream
        .getAudioTracks()
        .forEach(
          track => {

            finalStream.addTrack(
              track
            );

          }
        );

    }

  }


  /* -------------------------------------------------------
     RECORDING FORMAT
  ------------------------------------------------------- */

  const mimeTypes = [

    "video/webm;codecs=vp9,opus",

    "video/webm;codecs=vp8,opus",

    "video/webm"

  ];


  const supportedType =
    mimeTypes.find(
      type =>
        MediaRecorder.isTypeSupported(
          type
        )
    );


  if (!supportedType) {

    setStatus(
      "videoExportStatus",
      "This browser cannot create a supported WebM file.",
      "error"
    );

    return;

  }


  const chunks = [];


  videoRecorder =
    new MediaRecorder(
      finalStream,
      {
        mimeType:
          supportedType
      }
    );


  videoRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        chunks.push(
          event.data
        );

      }

    };


  const recordingFinished =
    new Promise(
      resolve => {

        videoRecorder.onstop =
          resolve;

      }
    );


  videoRecorder.start();


  /* -------------------------------------------------------
     PLAY AUDIO
  ------------------------------------------------------- */

  if (
    audioContext &&
    audioSource
  ) {

    try {

      await audioContext.resume();

      audioSource.start(0);

    } catch (error) {

      console.warn(
        "Audio playback could not start.",
        error
      );

    }

  }


  /* -------------------------------------------------------
     RENDER SLIDES
  ------------------------------------------------------- */

  try {

    for (
      let index = 0;
      index < videoSlides.length;
      index++
    ) {

      if (
        videoExportStopped
      ) {

        break;

      }


      const slide =
        videoSlides[index];


      const image =
        await loadVideoImage(
          slide.file
        );


      drawVideoImage(
        ctx,
        image,
        canvas
      );


      setStatus(
        "videoExportStatus",
        `Exporting slide ${
          index + 1
        } of ${
          videoSlides.length
        }...`
      );


      await wait(
        Number(
          slide.duration || 5
        ) * 1000
      );

    }

  } catch (error) {

    console.error(
      error
    );


    setStatus(
      "videoExportStatus",
      "Video export failed.",
      "error"
    );

  }


  /* -------------------------------------------------------
     STOP RECORDING
  ------------------------------------------------------- */

  if (
    videoRecorder &&
    videoRecorder.state !==
      "inactive"
  ) {

    videoRecorder.stop();

  }


  await recordingFinished;


  /* -------------------------------------------------------
     STOP AUDIO
  ------------------------------------------------------- */

  if (
    audioSource
  ) {

    try {

      audioSource.stop();

    } catch (error) {}

  }


  if (
    audioContext
  ) {

    try {

      await audioContext.close();

    } catch (error) {}

  }


  if (
    videoExportStopped
  ) {

    setStatus(
      "videoExportStatus",
      "Video export stopped."
    );

    videoRecorder =
      null;

    return;

  }


  /* -------------------------------------------------------
     CREATE FINAL FILE
  ------------------------------------------------------- */

  const blob =
    new Blob(
      chunks,
      {
        type:
          supportedType
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  if (videoDownload) {

    videoDownload.href =
      url;

    videoDownload.download =
      "vantara-lesson-video.webm";

    videoDownload.textContent =
      "Download Lesson Video";

    videoDownload.hidden =
      false;

  }


  setStatus(
    "videoExportStatus",
    `Lesson video created successfully • ${
      (blob.size / 1024 / 1024).toFixed(2)
    } MB`,
    "success"
  );


  videoRecorder =
    null;

}


/* =========================================================
   REPLACE EXPORT BUTTON ACTION
========================================================= */

if (exportVideoButton) {

  exportVideoButton.onclick =
    () => {

      exportVideoWithAudio();

    };

}
/* =========================================================
   VANTARA EDITOR V2
   PART 9B
   VIDEO TRANSITIONS + TITLE / END SCREEN
========================================================= */

let videoSettings = {
  titleEnabled: true,
  titleText: "VANTARA EDUCATION",
  subtitleText: "Olympiad Mathematics",
  endingEnabled: true,
  endingText: "Thank You for Learning with VANTARA EDUCATION",
  transition: "fade"
};


/* =========================================================
   LOAD SAVED VIDEO SETTINGS
========================================================= */

function loadVideoSettings() {

  try {

    const saved =
      localStorage.getItem(
        "vantaraVideoSettings"
      );

    if (saved) {

      videoSettings = {
        ...videoSettings,
        ...JSON.parse(saved)
      };

    }

  } catch (error) {

    console.warn(
      "Could not load video settings."
    );

  }

}


/* =========================================================
   SAVE VIDEO SETTINGS
========================================================= */

function saveVideoSettings() {

  localStorage.setItem(
    "vantaraVideoSettings",
    JSON.stringify(
      videoSettings
    )
  );

}


/* =========================================================
   DRAW TITLE SCREEN
========================================================= */

function drawTitleScreen(
  ctx,
  canvas
) {

  ctx.fillStyle =
    "#050505";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 64px Arial";


  ctx.fillText(
    videoSettings.titleText,
    canvas.width / 2,
    canvas.height / 2 - 45
  );


  ctx.font =
    "32px Arial";


  ctx.fillText(
    videoSettings.subtitleText,
    canvas.width / 2,
    canvas.height / 2 + 35
  );

}


/* =========================================================
   DRAW END SCREEN
========================================================= */

function drawEndingScreen(
  ctx,
  canvas
) {

  ctx.fillStyle =
    "#050505";

  ctx.fillRect(
    0,
    0,
    canvas.width,
    canvas.height
  );


  ctx.textAlign =
    "center";

  ctx.textBaseline =
    "middle";


  ctx.fillStyle =
    "#ffffff";

  ctx.font =
    "bold 48px Arial";


  ctx.fillText(
    videoSettings.endingText,
    canvas.width / 2,
    canvas.height / 2
  );

}


/* =========================================================
   FADE EFFECT
========================================================= */

async function fadeCanvas(
  ctx,
  canvas,
  fromAlpha,
  toAlpha,
  duration = 500
) {

  const steps =
    Math.max(
      1,
      Math.floor(
        duration / 40
      )
    );


  for (
    let i = 0;
    i <= steps;
    i++
  ) {

    const progress =
      i / steps;


    const alpha =
      fromAlpha +
      (
        toAlpha -
        fromAlpha
      ) *
      progress;


    ctx.fillStyle =
      `rgba(0,0,0,${alpha})`;


    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );


    await wait(40);

  }

}


/* =========================================================
   SET VIDEO TITLE
========================================================= */

const videoTitleInput =
  $("videoTitle");

if (videoTitleInput) {

  videoTitleInput.value =
    videoSettings.titleText;


  videoTitleInput.addEventListener(
    "input",
    () => {

      videoSettings.titleText =
        videoTitleInput.value;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   SET VIDEO SUBTITLE
========================================================= */

const videoSubtitleInput =
  $("videoSubtitle");

if (videoSubtitleInput) {

  videoSubtitleInput.value =
    videoSettings.subtitleText;


  videoSubtitleInput.addEventListener(
    "input",
    () => {

      videoSettings.subtitleText =
        videoSubtitleInput.value;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   SET ENDING TEXT
========================================================= */

const videoEndingInput =
  $("videoEndingText");

if (videoEndingInput) {

  videoEndingInput.value =
    videoSettings.endingText;


  videoEndingInput.addEventListener(
    "input",
    () => {

      videoSettings.endingText =
        videoEndingInput.value;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   TITLE ENABLE
========================================================= */

const titleEnabledInput =
  $("videoTitleEnabled");

if (titleEnabledInput) {

  titleEnabledInput.checked =
    videoSettings.titleEnabled;


  titleEnabledInput.addEventListener(
    "change",
    () => {

      videoSettings.titleEnabled =
        titleEnabledInput.checked;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   ENDING ENABLE
========================================================= */

const endingEnabledInput =
  $("videoEndingEnabled");

if (endingEnabledInput) {

  endingEnabledInput.checked =
    videoSettings.endingEnabled;


  endingEnabledInput.addEventListener(
    "change",
    () => {

      videoSettings.endingEnabled =
        endingEnabledInput.checked;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   TRANSITION SELECTOR
========================================================= */

const transitionSelect =
  $("videoTransition");

if (transitionSelect) {

  transitionSelect.value =
    videoSettings.transition;


  transitionSelect.addEventListener(
    "change",
    () => {

      videoSettings.transition =
        transitionSelect.value;

      saveVideoSettings();

    }
  );

}


/* =========================================================
   LOAD SETTINGS
========================================================= */

loadVideoSettings();
<div class="video-settings">

  <h3>Video Settings</h3>

  <label>
    <input
      type="checkbox"
      id="videoTitleEnabled"
      checked
    >
    Add title screen
  </label>

  <input
    id="videoTitle"
    type="text"
    placeholder="Video title"
    value="VANTARA EDUCATION"
  >

  <input
    id="videoSubtitle"
    type="text"
    placeholder="Subtitle"
    value="Olympiad Mathematics"
  >

  <label>
    <input
      type="checkbox"
      id="videoEndingEnabled"
      checked
    >
    Add ending screen
  </label>

  <input
    id="videoEndingText"
    type="text"
    placeholder="Ending message"
    value="Thank You for Learning with VANTARA EDUCATION"
  >

  <label>
    Transition
  </label>

  <select id="videoTransition">

    <option value="fade">
      Fade
    </option>

    <option value="none">
      None
    </option>

  </select>

</div>
/* =========================================================
   VANTARA EDITOR V2
   PART 9C
   PROFESSIONAL VIDEO EXPORT
========================================================= */

async function renderVideoSegment(
  ctx,
  canvas,
  slide,
  duration
) {

  const image =
    await loadVideoImage(
      slide.file
    );


  drawVideoImage(
    ctx,
    image,
    canvas
  );


  if (
    videoSettings.transition ===
    "fade"
  ) {

    ctx.fillStyle =
      "rgba(0,0,0,0.15)";

    ctx.fillRect(
      0,
      0,
      canvas.width,
      canvas.height
    );

    await wait(150);

  }


  await wait(
    duration * 1000
  );

}


/* =========================================================
   PROFESSIONAL EXPORT
========================================================= */

async function exportProfessionalVideo() {

  if (!videoSlides.length) {

    setStatus(
      "videoExportStatus",
      "Add at least one slide first.",
      "error"
    );

    return;

  }


  if (
    !browserSupportsVideoExport()
  ) {

    setStatus(
      "videoExportStatus",
      "Video export is not supported in this browser.",
      "error"
    );

    return;

  }


  videoExportStopped =
    false;


  const canvas =
    videoCanvas;

  const ctx =
    canvas.getContext(
      "2d"
    );


  /* -------------------------------------------------------
     PREPARE AUDIO
  ------------------------------------------------------- */

  await loadVideoAudioBuffer();


  /* -------------------------------------------------------
     CREATE VIDEO STREAM
  ------------------------------------------------------- */

  const videoStream =
    canvas.captureStream(
      30
    );


  let finalStream =
    videoStream;

  let audioContext =
    null;

  let audioDestination =
    null;

  let audioSource =
    null;


  if (videoAudioBuffer) {

    audioContext =
      new (
        window.AudioContext ||
        window.webkitAudioContext
      )();


    audioDestination =
      audioContext.createMediaStreamDestination();


    audioSource =
      createVideoAudioStream(
        audioContext,
        audioDestination
      );


    audioDestination
      .stream
      .getAudioTracks()
      .forEach(
        track => {

          finalStream.addTrack(
            track
          );

        }
      );

  }


  /* -------------------------------------------------------
     MEDIA RECORDER
  ------------------------------------------------------- */

  const mimeTypes = [

    "video/webm;codecs=vp9,opus",

    "video/webm;codecs=vp8,opus",

    "video/webm"

  ];


  const mimeType =
    mimeTypes.find(
      type =>
        MediaRecorder.isTypeSupported(
          type
        )
    );


  if (!mimeType) {

    setStatus(
      "videoExportStatus",
      "WebM recording is unavailable.",
      "error"
    );

    return;

  }


  const chunks = [];


  videoRecorder =
    new MediaRecorder(
      finalStream,
      {
        mimeType
      }
    );


  videoRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size
      ) {

        chunks.push(
          event.data
        );

      }

    };


  const stopped =
    new Promise(
      resolve => {

        videoRecorder.onstop =
          resolve;

      }
    );


  videoRecorder.start();


  /* -------------------------------------------------------
     START AUDIO
  ------------------------------------------------------- */

  if (
    audioContext &&
    audioSource
  ) {

    await audioContext.resume();

    audioSource.start();

  }


  /* -------------------------------------------------------
     TITLE SCREEN
  ------------------------------------------------------- */

  if (
    videoSettings.titleEnabled
  ) {

    drawTitleScreen(
      ctx,
      canvas
    );


    setStatus(
      "videoExportStatus",
      "Creating title screen..."
    );


    await wait(2500);

  }


  /* -------------------------------------------------------
     LESSON SLIDES
  ------------------------------------------------------- */

  try {

    for (
      let index = 0;
      index < videoSlides.length;
      index++
    ) {

      if (
        videoExportStopped
      ) {

        break;

      }


      const slide =
        videoSlides[index];


      setStatus(
        "videoExportStatus",
        `Rendering slide ${
          index + 1
        } of ${
          videoSlides.length
        }...`
      );


      await renderVideoSegment(
        ctx,
        canvas,
        slide,
        Number(
          slide.duration || 5
        )
      );

    }


    /* -----------------------------------------------------
       END SCREEN
    ----------------------------------------------------- */

    if (
      !videoExportStopped &&
      videoSettings.endingEnabled
    ) {

      drawEndingScreen(
        ctx,
        canvas
      );


      setStatus(
        "videoExportStatus",
        "Creating ending screen..."
      );


      await wait(3000);

    }

  } catch (error) {

    console.error(
      error
    );


    setStatus(
      "videoExportStatus",
      "An error occurred while rendering.",
      "error"
    );

  }


  /* -------------------------------------------------------
     STOP RECORDER
  ------------------------------------------------------- */

  if (
    videoRecorder &&
    videoRecorder.state !==
      "inactive"
  ) {

    videoRecorder.stop();

  }


  await stopped;


  /* -------------------------------------------------------
     STOP AUDIO
  ------------------------------------------------------- */

  if (audioSource) {

    try {
      audioSource.stop();
    } catch (error) {}

  }


  if (audioContext) {

    try {
      await audioContext.close();
    } catch (error) {}

  }


  if (
    videoExportStopped
  ) {

    setStatus(
      "videoExportStatus",
      "Video export stopped."
    );

    videoRecorder =
      null;

    return;

  }


  /* -------------------------------------------------------
     CREATE FILE
  ------------------------------------------------------- */

  const blob =
    new Blob(
      chunks,
      {
        type: mimeType
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  if (videoDownload) {

    videoDownload.href =
      url;

    videoDownload.download =
      "VANTARA_EDUCATION_Lesson.webm";

    videoDownload.textContent =
      "Download VANTARA Lesson Video";

    videoDownload.hidden =
      false;

  }


  setStatus(
    "videoExportStatus",
    `VANTARA lesson video exported successfully • ${
      (blob.size / 1024 / 1024).toFixed(2)
    } MB`,
    "success"
  );


  videoRecorder =
    null;

}


/* =========================================================
   USE PROFESSIONAL EXPORT
========================================================= */

if (exportVideoButton) {

  exportVideoButton.onclick =
    () => {

      exportProfessionalVideo();

    };

}


/* =========================================================
   STOP PROFESSIONAL EXPORT
========================================================= */

if (stopVideoExportButton) {

  stopVideoExportButton.onclick =
    () => {

      videoExportStopped =
        true;


      if (
        videoRecorder &&
        videoRecorder.state !==
          "inactive"
      ) {

        videoRecorder.stop();

      }

    };

}
/* =========================================================
   VANTARA EDITOR V2
   PART 10A
   VIDEO TEMPLATES
========================================================= */

const videoTemplates = {

  classroom: {
    name: "Classroom Lesson",
    title: "VANTARA EDUCATION",
    subtitle: "Classroom Learning",
    ending:
      "Thank You for Learning with VANTARA EDUCATION"
  },

  olympiad: {
    name: "Olympiad Class",
    title: "VANTARA OLYMPIAD HUB",
    subtitle: "Think • Solve • Explore • Excel",
    ending:
      "Keep Thinking. Keep Solving."
  },

  chapter: {
    name: "Chapter Lecture",
    title: "VANTARA EDUCATION",
    subtitle: "Chapter Lecture",
    ending:
      "Chapter Completed • Keep Learning"
  },

  revision: {
    name: "Revision Class",
    title: "VANTARA EDUCATION",
    subtitle: "Quick Revision",
    ending:
      "Revise • Practice • Improve"
  }

};


/* =========================================================
   APPLY TEMPLATE
========================================================= */

function applyVideoTemplate(
  templateKey
) {

  const template =
    videoTemplates[
      templateKey
    ];


  if (!template) {

    setStatus(
      "videoStatus",
      "Template not found.",
      "error"
    );

    return;

  }


  videoSettings.titleText =
    template.title;

  videoSettings.subtitleText =
    template.subtitle;

  videoSettings.endingText =
    template.ending;


  videoSettings.titleEnabled =
    true;

  videoSettings.endingEnabled =
    true;


  /* -------------------------------------------------------
     UPDATE INPUTS
  ------------------------------------------------------- */

  if ($("videoTitle")) {

    $("videoTitle").value =
      template.title;

  }


  if ($("videoSubtitle")) {

    $("videoSubtitle").value =
      template.subtitle;

  }


  if ($("videoEndingText")) {

    $("videoEndingText").value =
      template.ending;

  }


  if ($("videoTitleEnabled")) {

    $("videoTitleEnabled").checked =
      true;

  }


  if ($("videoEndingEnabled")) {

    $("videoEndingEnabled").checked =
      true;

  }


  saveVideoSettings();


  setStatus(
    "videoStatus",
    `${template.name} template applied.`,
    "success"
  );

}


/* =========================================================
   TEMPLATE BUTTONS
========================================================= */

document
  .querySelectorAll(
    "[data-video-template]"
  )
  .forEach(
    button => {

      button.addEventListener(
        "click",
        () => {

          applyVideoTemplate(
            button.dataset.videoTemplate
          );

        }
      );

    }
  );


/* =========================================================
   TEMPLATE PANEL
========================================================= */

const videoTemplatePanel =
  $("videoTemplatePanel");


if (videoTemplatePanel) {

  videoTemplatePanel.innerHTML = `

    <h3>
      VANTARA Video Templates
    </h3>

    <p>
      Choose a ready-made style for your lesson.
    </p>


    <div class="template-grid">

      <button
        class="template-card"
        data-video-template="classroom"
      >

        <strong>
          🎓 Classroom Lesson
        </strong>

        <small>
          General classroom teaching
        </small>

      </button>


      <button
        class="template-card"
        data-video-template="olympiad"
      >

        <strong>
          🧠 Olympiad Class
        </strong>

        <small>
          VANTARA Olympiad Hub
        </small>

      </button>


      <button
        class="template-card"
        data-video-template="chapter"
      >

        <strong>
          📚 Chapter Lecture
        </strong>

        <small>
          Full chapter teaching
        </small>

      </button>


      <button
        class="template-card"
        data-video-template="revision"
      >

        <strong>
          🔄 Revision Class
        </strong>

        <small>
          Quick revision videos
        </small>

      </button>

    </div>

  `;


  videoTemplatePanel
    .querySelectorAll(
      "[data-video-template]"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            applyVideoTemplate(
              button.dataset.videoTemplate
            );

          }
        );

      }
    );

}
/* =========================================================
   VANTARA EDITOR V2
   PART 10B
   BRANDING + WATERMARK
========================================================= */

const watermarkSettings = {

  enabled: true,

  text: "VANTARA EDUCATION",

  position: "bottom-right",

  opacity: 0.75,

  fontSize: 26

};


/* =========================================================
   DRAW WATERMARK
========================================================= */

function drawVideoWatermark(
  ctx,
  canvas
) {

  if (!watermarkSettings.enabled) {
    return;
  }


  ctx.save();


  ctx.globalAlpha =
    watermarkSettings.opacity;


  ctx.fillStyle =
    "#ffffff";


  ctx.font =
    `bold ${watermarkSettings.fontSize}px Arial`;


  ctx.textBaseline =
    "bottom";


  const padding = 30;


  let x;
  let y;


  if (
    watermarkSettings.position ===
    "bottom-left"
  ) {

    ctx.textAlign =
      "left";

    x =
      padding;

    y =
      canvas.height -
      padding;

  } else {

    ctx.textAlign =
      "right";

    x =
      canvas.width -
      padding;

    y =
      canvas.height -
      padding;

  }


  /* -------------------------------------------------------
     SMALL BACKGROUND FOR READABILITY
  ------------------------------------------------------- */

  const textWidth =
    ctx.measureText(
      watermarkSettings.text
    ).width;


  const boxPadding =
    10;


  const boxX =
    watermarkSettings.position ===
    "bottom-left"

      ? x - boxPadding

      : x -
        textWidth -
        boxPadding;


  const boxY =
    y -
    watermarkSettings.fontSize -
    boxPadding;


  ctx.fillStyle =
    "rgba(0,0,0,0.45)";


  ctx.fillRect(
    boxX,
    boxY,
    textWidth +
      boxPadding * 2,
    watermarkSettings.fontSize +
      boxPadding * 2
  );


  /* -------------------------------------------------------
     WATERMARK TEXT
  ------------------------------------------------------- */

  ctx.fillStyle =
    "#ffffff";


  ctx.fillText(
    watermarkSettings.text,
    x,
    y
  );


  ctx.restore();

}


/* =========================================================
   WATERMARK SETTINGS
========================================================= */

const watermarkEnabled =
  $("watermarkEnabled");

const watermarkText =
  $("watermarkText");

const watermarkPosition =
  $("watermarkPosition");

const watermarkOpacity =
  $("watermarkOpacity");


if (watermarkEnabled) {

  watermarkEnabled.checked =
    watermarkSettings.enabled;


  watermarkEnabled.addEventListener(
    "change",
    () => {

      watermarkSettings.enabled =
        watermarkEnabled.checked;

    }
  );

}


if (watermarkText) {

  watermarkText.value =
    watermarkSettings.text;


  watermarkText.addEventListener(
    "input",
    () => {

      watermarkSettings.text =
        watermarkText.value ||
        "VANTARA EDUCATION";

    }
  );

}


if (watermarkPosition) {

  watermarkPosition.value =
    watermarkSettings.position;


  watermarkPosition.addEventListener(
    "change",
    () => {

      watermarkSettings.position =
        watermarkPosition.value;

    }
  );

}


if (watermarkOpacity) {

  watermarkOpacity.value =
    watermarkSettings.opacity;


  watermarkOpacity.addEventListener(
    "input",
    () => {

      watermarkSettings.opacity =
        Number(
          watermarkOpacity.value
        );

    }
  );

}


/* =========================================================
   WATERMARKED SLIDE RENDER
========================================================= */

async function renderWatermarkedSlide(
  ctx,
  canvas,
  slide
) {

  const image =
    await loadVideoImage(
      slide.file
    );


  drawVideoImage(
    ctx,
    image,
    canvas
  );


  drawVideoWatermark(
    ctx,
    canvas
  );

}
/* =========================================================
   VANTARA EDITOR V2
   PART 10C
   LOGO UPLOAD + VIDEO BRANDING
========================================================= */

let vantaraLogoData =
  localStorage.getItem(
    "vantaraLogoData"
  ) || "";


/* =========================================================
   ELEMENTS
========================================================= */

const logoInput =
  $("logoInput");

const logoPreview =
  $("logoPreview");

const removeLogoButton =
  $("removeLogo");


/* =========================================================
   DISPLAY LOGO
========================================================= */

function renderLogoPreview() {

  if (!logoPreview) {
    return;
  }


  if (!vantaraLogoData) {

    logoPreview.innerHTML = `
      <div class="empty-state">
        <p>No logo selected.</p>
      </div>
    `;

    return;

  }


  logoPreview.innerHTML = `
    <img
      src="${vantaraLogoData}"
      alt="VANTARA Logo"
    >
  `;

}


/* =========================================================
   LOAD LOGO
========================================================= */

if (logoInput) {

  logoInput.addEventListener(
    "change",
    () => {

      const file =
        logoInput.files?.[0];


      if (!file) {
        return;
      }


      if (
        !file.type.startsWith(
          "image/"
        )
      ) {

        setStatus(
          "brandStatus",
          "Please select an image logo.",
          "error"
        );

        return;

      }


      const reader =
        new FileReader();


      reader.onload =
        event => {

          vantaraLogoData =
            event.target.result;


          try {

            localStorage.setItem(
              "vantaraLogoData",
              vantaraLogoData
            );

          } catch (error) {

            setStatus(
              "brandStatus",
              "Logo is too large to save in browser storage.",
              "error"
            );

            return;

          }


          renderLogoPreview();


          setStatus(
            "brandStatus",
            "VANTARA logo added successfully.",
            "success"
          );

        };


      reader.readAsDataURL(
        file
      );

    }
  );

}


/* =========================================================
   REMOVE LOGO
========================================================= */

if (removeLogoButton) {

  removeLogoButton.addEventListener(
    "click",
    () => {

      vantaraLogoData =
        "";


      localStorage.removeItem(
        "vantaraLogoData"
      );


      if (logoInput) {
        logoInput.value = "";
      }


      renderLogoPreview();


      setStatus(
        "brandStatus",
        "Logo removed.",
        "success"
      );

    }
  );

}


/* =========================================================
   DRAW LOGO ON VIDEO
========================================================= */

function drawVideoLogo(
  ctx,
  canvas
) {

  if (!vantaraLogoData) {
    return;
  }


  const image =
    new Image();


  image.src =
    vantaraLogoData;


  if (!image.complete) {
    return;
  }


  ctx.save();


  ctx.globalAlpha =
    0.9;


  const maxWidth =
    150;

  const maxHeight =
    80;


  let width =
    image.width;

  let height =
    image.height;


  const ratio =
    Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );


  width *=
    ratio;

  height *=
    ratio;


  const padding =
    25;


  const x =
    canvas.width -
    width -
    padding;


  const y =
    padding;


  ctx.drawImage(
    image,
    x,
    y,
    width,
    height
  );


  ctx.restore();

}


/* =========================================================
   INITIALIZE
========================================================= */

renderLogoPreview();
<div class="logo-upload-box">

  <h3>VANTARA Logo</h3>

  <p>
    Upload your official VANTARA EDUCATION logo.
  </p>

  <input
    id="logoInput"
    type="file"
    accept="image/*"
  >

  <div
    id="logoPreview"
    class="logo-preview"
  ></div>

  <button
    id="removeLogo"
    class="small-btn danger"
  >
    Remove Logo
  </button>

</div>
/* =========================================================
   VANTARA EDITOR V2
   PART 10D
   RELIABLE LOGO PRELOADING
========================================================= */


/* =========================================================
   LOAD LOGO IMAGE
========================================================= */

function loadVantaraLogo() {

  return new Promise(
    (resolve) => {

      if (!vantaraLogoData) {

        resolve(null);
        return;

      }


      const image =
        new Image();


      image.onload =
        () => {

          resolve(image);

        };


      image.onerror =
        () => {

          console.warn(
            "VANTARA logo could not be loaded."
          );

          resolve(null);

        };


      image.src =
        vantaraLogoData;

    }
  );

}


/* =========================================================
   DRAW PRELOADED LOGO
========================================================= */

function drawPreloadedVantaraLogo(
  ctx,
  canvas,
  logoImage
) {

  if (!logoImage) {
    return;
  }


  const maxWidth =
    150;

  const maxHeight =
    80;


  let width =
    logoImage.width;

  let height =
    logoImage.height;


  if (
    !width ||
    !height
  ) {

    return;

  }


  const scale =
    Math.min(
      maxWidth / width,
      maxHeight / height,
      1
    );


  width *=
    scale;

  height *=
    scale;


  const padding =
    25;


  const x =
    canvas.width -
    width -
    padding;


  const y =
    padding;


  ctx.save();


  ctx.globalAlpha =
    0.92;


  ctx.drawImage(
    logoImage,
    x,
    y,
    width,
    height
  );


  ctx.restore();

}


/* =========================================================
   DRAW COMPLETE VIDEO FRAME
========================================================= */

function drawBrandedVideoFrame(
  ctx,
  canvas,
  image,
  logoImage
) {

  drawVideoImage(
    ctx,
    image,
    canvas
  );


  drawPreloadedVantaraLogo(
    ctx,
    canvas,
    logoImage
  );


  drawVideoWatermark(
    ctx,
    canvas
  );

}


/* =========================================================
   BRANDED SLIDE RENDER
========================================================= */

async function renderBrandedSlide(
  ctx,
  canvas,
  slide,
  logoImage
) {

  const image =
    await loadVideoImage(
      slide.file
    );


  drawBrandedVideoFrame(
    ctx,
    canvas,
    image,
    logoImage
  );


  await wait(
    Number(
      slide.duration || 5
    ) * 1000
  );

}


/* =========================================================
   PRELOAD BRAND ASSETS
========================================================= */

async function preloadVideoBrandAssets() {

  const logoImage =
    await loadVantaraLogo();


  return {
    logoImage
  };

}


/* =========================================================
   BRAND ASSET STATUS
========================================================= */

function showBrandAssetStatus(
  logoImage
) {

  if (logoImage) {

    setStatus(
      "videoExportStatus",
      "VANTARA logo loaded. Preparing export..."
    );

  } else {

    setStatus(
      "videoExportStatus",
      "Preparing video export..."
    );

  }

}