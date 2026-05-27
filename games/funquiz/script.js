// ⬇️ Paste your Google Apps Script Web App URL here
const SHEETS_URL = "https://script.google.com/macros/s/AKfycbxm7ILbwOaahd3VZ9nkeyVEnhokeOy3le-iiON5NBwY40NqtAXhwPc6512U5o5C_sXJ/exec";

let currentQuestion = 0;
let scores = {};
let quizName = "";

function getQuizName() {
  const page = location.pathname.split("/").pop() || "index.html";
  const map = {
    "index.html": "Winnie the Pooh",
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
  container.innerHTML = `<h2>${q.question}</h2>`;

  for (const [character, label] of Object.entries(q.answers)) {
    container.innerHTML += `
      <label>
        <input type="radio" name="answer" value="${character}" />
        ${label}
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
    "Smurfette": "smurfette.png",
    "Snow White": "snowwhite.png",
    "Bugs Bunny": "bugs.png"
  };

  const imageFile = imageMap[topCharacter];
  let imageHTML = "";
  if (imageFile) {
    imageHTML = `<img src="assets/${imageFile}" alt="${topCharacter}" style="max-width: 200px; margin-top: 20px;" />`;
  }

  document.getElementById('result-box').innerHTML = `
    <h2>You are: ${topCharacter}!</h2>
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
};
