document.addEventListener("DOMContentLoaded", () => {

const landing = document.getElementById("landing");
const gameContainer = document.getElementById("gameContainer");
const board = document.getElementById("board");
const navbar = document.getElementById("navbar");
const leaderboardList = document.getElementById("leaderboardList");
const nextRoundBtn = document.getElementById("nextRound");

const teamPopup = document.getElementById("teamPopup");
const teamNameInput = document.getElementById("teamNameInput");

const questionView = document.getElementById("questionView");
const questionText = document.getElementById("questionText");
const pointPanel = document.getElementById("pointPanel");

let teams = [], scores = {}, round = 1, currentValue = 0, openedCount = 0;
let r3Queue = [], r3Index = 0;

const topicsRound1 = ["wikipedia","movie","sus","math","abbalove"];
const topicsRound2 = ["brain","oneword","cck","animal","indonesia"];
const pointsRound1 = [100,200,300,400,500];
const pointsRound2 = [200,400,600,800,1000];

/* ===== Burned fixed rules ===== */
function isBurnedTile(r, topic, value){
  if (r === 1 && topic === "sus" && value === 500) return true;
  if (r === 2 && topic === "cck" && value === 1000) return true;
  return false;
}

/* ===== UI ===== */

document.getElementById("addTeamBtn").onclick = () => teamPopup.classList.remove("hidden");

document.getElementById("saveTeamBtn").onclick = () => {
  const n = teamNameInput.value.trim();
  if (!n) return;
  teams.push(n);
  scores[n] = 0;
  updateLeaderboard();
  teamNameInput.value = "";
  teamPopup.classList.add("hidden");
};

document.getElementById("startBtn").onclick = () => {
  landing.classList.add("hidden");
  gameContainer.classList.remove("hidden");
  renderBoard();
};

document.getElementById("clearAllBtn").onclick = () => {
  document.querySelectorAll(".tile").forEach(t => t.classList.remove("used"));
  openedCount = 0;
  nextRoundBtn.classList.add("hidden");
};

document.getElementById("wipeAllBtn").onclick = () => {
  document.querySelectorAll(".tile").forEach(t => t.classList.add("used"));
  openedCount = 25;
  if (round === 1) nextRoundBtn.classList.remove("hidden");
  else if (round === 2) startRound3();
};

/* ===== BOARD ===== */

function renderBoard(){
  board.innerHTML = "";
  navbar.innerHTML = "";
  openedCount = 0;
  nextRoundBtn.classList.add("hidden");

  const topics = round === 1 ? topicsRound1 : topicsRound2;
  const values = round === 1 ? pointsRound1 : pointsRound2;

  topics.forEach(t => {
    const s = document.createElement("span");
    s.textContent = t.toUpperCase();
    navbar.appendChild(s);
  });

  values.forEach(v => {
    topics.forEach(topic => {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.textContent = v;
      tile.onclick = () => openQuestion(topic, v, tile, isBurnedTile(round, topic, v));
      board.appendChild(tile);
    });
  });
}

/* ===== QUESTIONS ===== */

function openQuestion(topic,value,tile,isBurned){
  if(tile.classList.contains("used")) return;
  tile.classList.add("used");
  currentValue = value;
  openedCount++;

  if(isBurned){ showBurnedBetUI(); return; }

  fetch(`topics/${topic}/${value}.html`)
    .then(r => r.text())
    .then(html => {
      questionText.innerHTML = html + `
        <div style="margin-top:18px;text-align:center">
          <button class="btn secondary" id="showAnswerBtn">SHOW ANSWER</button>
        </div>`;
      document.getElementById("showAnswerBtn").onclick = () => {
        questionText.querySelector(".answer")?.classList.toggle("show");
      };
      questionView.classList.remove("hidden");
      pointPanel.classList.add("hidden");
    });

  if(openedCount === 25 && round === 1) nextRoundBtn.classList.remove("hidden");
}

/* ===== POINTS ===== */

document.getElementById("addPointBtn").onclick = () => {
  pointPanel.innerHTML = teams.map(t => `
    <div class="point-row">
      <button class="plus" data-team="${t}">+ ${t}</button>
      <button class="minus" data-team="${t}">- ${t}</button>
    </div>
  `).join("");
  pointPanel.classList.toggle("hidden");

  document.querySelectorAll(".plus").forEach(b => b.onclick = () => {
    scores[b.dataset.team] += currentValue;
    updateLeaderboard();
    pointPanel.classList.add("hidden");
  });

  document.querySelectorAll(".minus").forEach(b => b.onclick = () => {
    scores[b.dataset.team] -= currentValue;
    updateLeaderboard();
  });
};

document.getElementById("closeQuestion").onclick = () => {
  questionView.classList.add("hidden");
  pointPanel.classList.add("hidden");
};

/* ===== BURNED ===== */

function showBurnedBetUI(){
  if(teams.length < 2) return alert("Butuh minimal 2 tim.");

  questionText.innerHTML = `
    <div class="bet-ui burned">
      <h2>🔥 Burned Tile</h2>
      <select id="bettor">${teams.map(t => `<option>${t}</option>`).join("")}</select>
      <input id="bet" type="number" placeholder="Bet per tim">
      <div class="actions"><button class="btn primary" id="betNext">NEXT</button></div>
    </div>`;
  questionView.classList.remove("hidden");

  document.getElementById("betNext").onclick = () => {
    const bettor = document.getElementById("bettor").value;
    const bet = parseInt(document.getElementById("bet").value);
    if(isNaN(bet) || bet <= 0) return alert("Bet invalid");
    showTF(bettor, bet);
  };
}

function showTF(team, bet){
  questionText.innerHTML = `
    <div class="bet-ui burned">
      <h2>${team} — TRUE or FALSE?</h2>
      <p>Bet ${bet} dari tiap tim</p>
      <div class="actions">
        <button class="btn primary" id="trueBtn">TRUE</button>
        <button class="btn secondary" id="falseBtn">FALSE</button>
      </div>
    </div>`;
  document.getElementById("trueBtn").onclick = () => resolveBurned(team, bet, true);
  document.getElementById("falseBtn").onclick = () => resolveBurned(team, bet, false);
}

function resolveBurned(team, bet, isTrue){
  teams.forEach(t => {
    if(t !== team){
      if(isTrue){ scores[t] -= bet; scores[team] += bet; }
      else { scores[t] += bet; scores[team] -= bet; }
    }
  });
  updateLeaderboard();
  questionView.classList.add("hidden");
}

/* ===== ROUND 3 ===== */

function startRound3(){
  round = 3;
  board.innerHTML = "";
  navbar.innerHTML = "<span>ALL BET ROUND</span>";
  const tile = document.createElement("div");
  tile.className = "tile bonus";
  tile.textContent = "🔥 START FINAL";
  tile.onclick = () => { r3Queue = [...teams]; r3Index = 0; openNextR3(); };
  board.appendChild(tile);
}

function openNextR3(){
  if(r3Index >= r3Queue.length) return showFinalResult();
  const team = r3Queue[r3Index];
  questionText.innerHTML = `
    <div class="bet-ui">
      <h2>${team} BET</h2>
      <input id="r3bet" type="number">
      <div class="actions"><button class="btn primary" id="r3next">NEXT</button></div>
    </div>`;
  questionView.classList.remove("hidden");

  document.getElementById("r3next").onclick = () => {
    const bet = parseInt(document.getElementById("r3bet").value);
    if(isNaN(bet) || bet <= 0) return alert("Invalid bet");
    showR3TF(team, bet);
  };
}

function showR3TF(team, bet){
  questionText.innerHTML = `
    <div class="bet-ui">
      <h2>${team} — TRUE or FALSE?</h2>
      <div class="actions">
        <button class="btn primary" id="r3true">TRUE</button>
        <button class="btn secondary" id="r3false">FALSE</button>
      </div>
    </div>`;
  document.getElementById("r3true").onclick = () => resolveR3(team, bet, true);
  document.getElementById("r3false").onclick = () => resolveR3(team, bet, false);
}

function resolveR3(team, bet, isTrue){
  teams.forEach(t => {
    if(t !== team){
      if(isTrue){ scores[t] -= bet; scores[team] += bet; }
      else { scores[t] += bet; scores[team] -= bet; }
    }
  });
  updateLeaderboard();
  r3Index++;
  openNextR3();
}

/* ===== LEADERBOARD ===== */

function updateLeaderboard(){
  leaderboardList.innerHTML = "";
  Object.keys(scores).sort((a,b)=>scores[b]-scores[a]).forEach(t=>{
    const li = document.createElement("li");
    li.innerHTML = `<span>${t}</span><strong class="score" data-team="${t}">${scores[t]}</strong>`;
    leaderboardList.appendChild(li);
  });

  document.querySelectorAll(".score").forEach(el => {
    el.onclick = () => {
      const team = el.dataset.team;
      const val = prompt(`Edit score for ${team}:`, scores[team]);
      const num = parseInt(val);
      if(!isNaN(num)){
        scores[team] = num;
        updateLeaderboard();
      }
    };
  });
}

function showFinalResult(){
  const sorted = Object.keys(scores).sort((a,b)=>scores[b]-scores[a]);
  questionText.innerHTML = `<h1>🏆 WINNER</h1><h2>${sorted[0]}</h2>`;
  questionView.classList.remove("hidden");
}

nextRoundBtn.onclick = () => { round = 2; renderBoard(); };

});
