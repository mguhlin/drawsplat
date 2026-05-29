// ⬇️ Paste your Google Apps Script Web App URL here
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxm7ILbwOaahd3VZ9nkeyVEnhokeOy3le-iiON5NBwY40NqtAXhwPc6512U5o5C_sXJ/exec";

const t = (k, vars) => WidgetI18n.t(k, vars);

let currentQuestion = 0;
let scores = {};
let quizName = "";

function getQuizName() {
  const page = location.pathname.split("/").pop() || "index.html";
  // Quiz titles are pop-culture proper nouns kept English for the Google
  // Sheet log; the on-page heading uses t() via data-i18n on the HTML.
  const map = {
    "index.html":  "Winnie the Pooh",
    "smurfs.html": "The Smurfs",
    "dwarfs.html": "Snow White",
    "looney.html": "Looney Tunes"
  };
  return map[page] || page;
}

function nextQuestion() {
  const selected = document.querySelector('input[name="answer"]:checked');
  if (!selected) return;

  const choice = selected.value;
  scores[choice] = (scores[choice] || 0) + 1;
  currentQuestion++;

  if (currentQuestion < questions.length) {
    showQuestion();
  } else {
    showResult();
  }
}

function showQuestion() {
  const q = questions[currentQuestion];
  const container = document.getElementById('question-box');
  container.innerHTML = '<h2>' + t(q.qKey) + '</h2>';

  for (const [character, labelKey] of Object.entries(q.answers)) {
    const safeChar = String(character).replace(/"/g, '&quot;');
    container.innerHTML += `
      <label>
        <input type="radio" name="answer" value="${safeChar}" />
        ${t(labelKey)}
      </label><br/>
    `;
  }
}

function showResult() {
  document.getElementById('question-box').style.display = 'none';
  document.getElementById('next-btn').style.display = 'none';

  const topCharacter = Object.entries(scores)
    .sort((a, b) => b[1] - a[1])[0][0];

  const imageMap = {
    "Winnie the Pooh": "pooh.png",
    "Smurfette":       "smurfette.png",
    "Snow White":      "snowwhite.png",
    "Bugs Bunny":      "bugs.png"
  };

  const imageFile = imageMap[topCharacter];
  let imageHTML = "";
  if (imageFile) {
    imageHTML = `<img src="assets/${imageFile}" alt="${topCharacter}" style="max-width: 200px; margin-top: 20px;" />`;
  }

  document.getElementById('result-box').innerHTML = `
    <h2>${t('result.youAre', { name: topCharacter })}</h2>
    ${imageHTML}
  `;

  logResult(topCharacter);
}

function logResult(character) {
  if (!SHEETS_URL || SHEETS_URL === "YOUR_WEB_APP_URL_HERE") return;

  const payload = {
    timestamp: new Date().toISOString(),
    quiz: getQuizName(),
    character: character
  };

  fetch(SHEETS_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  }).catch(err => console.warn("Could not log result:", err));
}

window.onload = function () {
  quizName = getQuizName();
  showQuestion();

  // Re-render the current question (or the result heading) on language change
  // so prompts and answer text follow the picker. The radio value (character
  // name) is intentionally preserved so any pre-existing tally stays valid.
  window.addEventListener('widget-i18n:changed', () => {
    if (document.getElementById('next-btn').style.display === 'none') {
      // Result is showing — rebuild the result heading with new locale.
      const topCharacter = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])[0][0];
      const imageFile = ({
        "Winnie the Pooh": "pooh.png",
        "Smurfette":       "smurfette.png",
        "Snow White":      "snowwhite.png",
        "Bugs Bunny":      "bugs.png"
      })[topCharacter];
      const imageHTML = imageFile
        ? `<img src="assets/${imageFile}" alt="${topCharacter}" style="max-width: 200px; margin-top: 20px;" />`
        : "";
      document.getElementById('result-box').innerHTML = `
        <h2>${t('result.youAre', { name: topCharacter })}</h2>
        ${imageHTML}
      `;
    } else if (currentQuestion < questions.length) {
      // Save the user's current selection before repainting the radios.
      const selected = document.querySelector('input[name="answer"]:checked');
      const prev = selected ? selected.value : null;
      showQuestion();
      if (prev) {
        const restore = document.querySelector('input[name="answer"][value="' + prev.replace(/"/g, '\\"') + '"]');
        if (restore) restore.checked = true;
      }
    }
  });
};
