const GRID_SIZE = 8;
const DIRECTIONS = [
  { name: "North", dx: 0, dy: -1 },
  { name: "East", dx: 1, dy: 0 },
  { name: "South", dx: 0, dy: 1 },
  { name: "West", dx: -1, dy: 0 }
];

const STORAGE_KEY = "splatbot.project.v1";
const CUSTOM_MISSIONS_KEY = "splatbot.customMissions.v1";
const STARTER_PACK_URL = "missions/starter-pack.json";
const ACTIVITY_PACK_URL = "activities/thinking-pack.json";
const FRAMEWORK_LABELS = {
  teks: "TEKS",
  ngss: "NGSS",
  commoncore: "Common Core"
};
const CONSTRAINTS = [
  { id: "no-move", label: "No exact move blocks", blocked: ["move"] },
  { id: "no-turn", label: "No exact turn blocks", blocked: ["turn"] },
  { id: "no-devices", label: "No light/message/sound devices", blocked: ["light", "send", "sound", "song"] },
  { id: "rough-only", label: "Rough movement only", blocked: ["move", "turn"] }
];
const COLORS = {
  field: "#fafbff",
  grid: "#d7dce8",
  trail: "rgba(37, 99, 235, 0.22)",
  goal: "#faa634",
  wall: "#334155",
  robot: "#7c3aed",
  bump: "#b42318",
  ink: "#172033"
};

let missions = [];
let activityPack = { concepts: [] };
const fallbackMission = {
  id: "fallback-drive",
  title: "Fallback Drive",
  band: "Grades 2-3",
  prompt: "Move SplatBot to the goal.",
  concept: "Sequencing",
  vocabulary: ["move", "goal"],
  teacherNote: "The starter mission pack did not load, so this simple local mission is available.",
  start: { x: 1, y: 5, dir: 1 },
  goal: { x: 5, y: 5 },
  walls: [],
  steps: ["Move forward", "Reach the goal"],
  starter: [{ type: "move", steps: 4 }]
};

const state = {
  robot: { x: 1, y: 5, dir: 1 },
  mission: fallbackMission,
  running: false,
  trail: [],
  devices: {
    signalOn: false,
    messages: [],
    sounds: []
  },
  ghostCommands: [],
  trace: [],
  constraint: null,
  role: "student",
  standardsFramework: "teks",
  activeConceptId: "decomposition",
  sensorInputs: {
    tilt: 0,
    loud: false,
    enabled: false
  }
};

const els = {
  roleSelect: document.querySelector("#roleSelect"),
  standardsSelect: document.querySelector("#standardsSelect"),
  canvas: document.querySelector("#robotCanvas"),
  missionSelect: document.querySelector("#missionSelect"),
  missionBand: document.querySelector("#missionBand"),
  missionTitle: document.querySelector("#missionTitle"),
  missionPrompt: document.querySelector("#missionPrompt"),
  missionConcept: document.querySelector("#missionConcept"),
  missionVocabulary: document.querySelector("#missionVocabulary"),
  missionTeacherNote: document.querySelector("#missionTeacherNote"),
  missionSteps: document.querySelector("#missionSteps"),
  position: document.querySelector("#positionReadout"),
  direction: document.querySelector("#directionReadout"),
  sensor: document.querySelector("#sensorReadout"),
  goal: document.querySelector("#goalReadout"),
  run: document.querySelector("#runBtn"),
  stop: document.querySelector("#stopBtn"),
  reset: document.querySelector("#resetBtn"),
  constraint: document.querySelector("#constraintBtn"),
  save: document.querySelector("#saveBtn"),
  export: document.querySelector("#exportBtn"),
  import: document.querySelector("#importBtn"),
  importFile: document.querySelector("#importFile"),
  importMissions: document.querySelector("#importMissionsBtn"),
  exportMissions: document.querySelector("#exportMissionsBtn"),
  missionFile: document.querySelector("#missionFile"),
  saveReadout: document.querySelector("#saveReadout"),
  runMessage: document.querySelector("#runMessage"),
  signalLight: document.querySelector("#signalLight"),
  signalReadout: document.querySelector("#signalReadout"),
  messageLog: document.querySelector("#messageLog"),
  soundReadout: document.querySelector("#soundReadout"),
  builderTitle: document.querySelector("#builderTitle"),
  builderBand: document.querySelector("#builderBand"),
  builderConcept: document.querySelector("#builderConcept"),
  builderStartX: document.querySelector("#builderStartX"),
  builderStartY: document.querySelector("#builderStartY"),
  builderDir: document.querySelector("#builderDir"),
  builderGoalX: document.querySelector("#builderGoalX"),
  builderGoalY: document.querySelector("#builderGoalY"),
  builderPrompt: document.querySelector("#builderPrompt"),
  builderWalls: document.querySelector("#builderWalls"),
  builderVocabulary: document.querySelector("#builderVocabulary"),
  builderTeacherNote: document.querySelector("#builderTeacherNote"),
  addMission: document.querySelector("#addMissionBtn"),
  clearCustomMissions: document.querySelector("#clearCustomMissionsBtn"),
  loadStarter: document.querySelector("#loadStarterBtn"),
  blocksTab: document.querySelector("#blocksTab"),
  wordsTab: document.querySelector("#wordsTab"),
  blocksPane: document.querySelector("#blocksPane"),
  wordsPane: document.querySelector("#wordsPane"),
  wordProgram: document.querySelector("#wordProgram"),
  ghostForward: document.querySelector("#ghostForwardBtn"),
  ghostLeft: document.querySelector("#ghostLeftBtn"),
  ghostRight: document.querySelector("#ghostRightBtn"),
  ghostClear: document.querySelector("#ghostClearBtn"),
  ghostToWords: document.querySelector("#ghostToWordsBtn"),
  ghostReadout: document.querySelector("#ghostReadout"),
  makeQr: document.querySelector("#makeQrBtn"),
  loadShare: document.querySelector("#loadShareBtn"),
  qrOutput: document.querySelector("#qrOutput"),
  shareCode: document.querySelector("#shareCode"),
  enableSensors: document.querySelector("#enableSensorsBtn"),
  sensorInputReadout: document.querySelector("#sensorInputReadout"),
  constraintReadout: document.querySelector("#constraintReadout"),
  thinkingConceptSelect: document.querySelector("#thinkingConceptSelect"),
  thinkingPoster: document.querySelector("#thinkingPoster"),
  thinkingTagline: document.querySelector("#thinkingTagline"),
  thinkingActivities: document.querySelector("#thinkingActivities"),
  standardsReadout: document.querySelector("#standardsReadout"),
  questChallenges: document.querySelector("#questChallenges"),
  storyTitle: document.querySelector("#storyTitle"),
  storyPremise: document.querySelector("#storyPremise"),
  storyChapters: document.querySelector("#storyChapters"),
  splashPage: document.querySelector("#splashPage"),
  startLab: document.querySelector("#startLabBtn"),
  skipStory: document.querySelector("#skipStoryBtn"),
  story: document.querySelector("#storyBtn"),
  codeTarget: document.querySelector("#codeTargetSelect"),
  generateCode: document.querySelector("#generateCodeBtn"),
  copyCode: document.querySelector("#copyCodeBtn"),
  downloadCode: document.querySelector("#downloadCodeBtn"),
  importCode: document.querySelector("#importCodeBtn"),
  portableCode: document.querySelector("#portableCode")
};

const ctx = els.canvas.getContext("2d");
let workspace;
let audioContext;

function defineBlocks() {
  Blockly.Blocks.splatbot_move = {
    init() {
      this.appendDummyInput()
        .appendField("move")
        .appendField(new Blockly.FieldNumber(1, 1, 8, 1), "STEPS")
        .appendField("spaces");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#7c3aed");
    }
  };

  Blockly.Blocks.splatbot_move_roughly = {
    init() {
      this.appendDummyInput()
        .appendField("move roughly")
        .appendField(new Blockly.FieldNumber(2, 1, 8, 1), "STEPS")
        .appendField("spaces");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#9333ea");
    }
  };

  Blockly.Blocks.splatbot_turn = {
    init() {
      this.appendDummyInput()
        .appendField("turn")
        .appendField(new Blockly.FieldDropdown([["left", "LEFT"], ["right", "RIGHT"]]), "DIR");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#7c3aed");
    }
  };

  Blockly.Blocks.splatbot_turn_roughly = {
    init() {
      this.appendDummyInput()
        .appendField("turn roughly")
        .appendField(new Blockly.FieldDropdown([["left", "LEFT"], ["right", "RIGHT"]]), "DIR");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#9333ea");
    }
  };

  Blockly.Blocks.splatbot_wall_ahead = {
    init() {
      this.appendDummyInput().appendField("wall ahead?");
      this.setOutput(true, "Boolean");
      this.setColour("#0f766e");
    }
  };

  Blockly.Blocks.splatbot_on_goal = {
    init() {
      this.appendDummyInput().appendField("on goal?");
      this.setOutput(true, "Boolean");
      this.setColour("#0f766e");
    }
  };

  Blockly.Blocks.splatbot_phone_tilted = {
    init() {
      this.appendDummyInput()
        .appendField("phone tilted")
        .appendField(new Blockly.FieldDropdown([["right", "RIGHT"], ["left", "LEFT"]]), "DIR")
        .appendField("?");
      this.setOutput(true, "Boolean");
      this.setColour("#0f766e");
    }
  };

  Blockly.Blocks.splatbot_room_loud = {
    init() {
      this.appendDummyInput().appendField("room loud?");
      this.setOutput(true, "Boolean");
      this.setColour("#0f766e");
    }
  };

  Blockly.Blocks.splatbot_light = {
    init() {
      this.appendDummyInput()
        .appendField("set signal light")
        .appendField(new Blockly.FieldDropdown([["on", "ON"], ["off", "OFF"]]), "VALUE");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#2563eb");
    }
  };

  Blockly.Blocks.splatbot_send = {
    init() {
      this.appendDummyInput()
        .appendField("send message")
        .appendField(new Blockly.FieldTextInput("hello"), "TEXT");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#2563eb");
    }
  };

  Blockly.Blocks.splatbot_sound = {
    init() {
      this.appendDummyInput()
        .appendField("play")
        .appendField(new Blockly.FieldDropdown([["beep", "beep"], ["low beep", "low"], ["high beep", "high"]]), "SOUND");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#2563eb");
    }
  };

  Blockly.Blocks.splatbot_song = {
    init() {
      this.appendDummyInput()
        .appendField("play song")
        .appendField(new Blockly.FieldDropdown([["scale", "scale"], ["success", "success"], ["alert", "alert"]]), "SONG");
      this.setPreviousStatement(true);
      this.setNextStatement(true);
      this.setColour("#2563eb");
    }
  };
}

function initBlockly() {
  defineBlocks();
  workspace = Blockly.inject("blocklyDiv", {
    toolbox: document.querySelector("#toolbox"),
    media: "vendor/blockly-media/",
    sounds: false,
    trashcan: true,
    scrollbars: true,
    zoom: {
      controls: true,
      wheel: false,
      startScale: window.innerWidth < 760 ? 0.78 : 0.9,
      maxScale: 1.3,
      minScale: 0.55,
      scaleSpeed: 1.1
    }
  });
  loadStarterBlocks();
}

function blockToCommands(block) {
  const commands = [];
  let current = block;
  while (current) {
    if (current.type === "splatbot_move") {
      commands.push({ action: "move", steps: Number(current.getFieldValue("STEPS")) || 1 });
    }
    if (current.type === "splatbot_move_roughly") {
      commands.push({ action: "moveRoughly", steps: Number(current.getFieldValue("STEPS")) || 1 });
    }
    if (current.type === "splatbot_turn") {
      commands.push({ action: "turn", dir: current.getFieldValue("DIR") });
    }
    if (current.type === "splatbot_turn_roughly") {
      commands.push({ action: "turnRoughly", dir: current.getFieldValue("DIR") });
    }
    if (current.type === "controls_repeat_ext") {
      const timesBlock = current.getInputTargetBlock("TIMES");
      const times = timesBlock ? Number(timesBlock.getFieldValue("NUM")) : 1;
      const child = current.getInputTargetBlock("DO");
      const childCommands = child ? blockToCommands(child) : [];
      for (let i = 0; i < Math.min(times, 20); i += 1) {
        commands.push(...childCommands);
      }
    }
    if (current.type === "controls_if") {
      const condition = current.getInputTargetBlock("IF0");
      const child = current.getInputTargetBlock("DO0");
      commands.push({
        action: "if",
        condition: condition ? condition.type : "",
        commands: child ? blockToCommands(child) : []
      });
    }
    if (current.type === "splatbot_light") {
      commands.push({ action: "light", value: current.getFieldValue("VALUE") === "ON" });
    }
    if (current.type === "splatbot_send") {
      commands.push({ action: "send", text: current.getFieldValue("TEXT").slice(0, 40) });
    }
    if (current.type === "splatbot_sound") {
      commands.push({ action: "sound", sound: current.getFieldValue("SOUND") });
    }
    if (current.type === "splatbot_song") {
      commands.push({ action: "song", song: current.getFieldValue("SONG") });
    }
    current = current.getNextBlock();
  }
  return commands;
}

function getBlockProgram() {
  const topBlocks = workspace.getTopBlocks(true);
  return topBlocks.flatMap(blockToCommands).slice(0, 200);
}

function getWordProgram() {
  return SplatBotCore.parseWordProgram(els.wordProgram.value);
}

function currentProgram() {
  return els.blocksPane.classList.contains("is-active") ? getBlockProgram() : getWordProgram();
}

function showSplash() {
  els.splashPage.classList.remove("is-hidden");
  document.body.classList.add("splash-open");
}

function hideSplash() {
  els.splashPage.classList.add("is-hidden");
  document.body.classList.remove("splash-open");
}

function resetRobot() {
  state.running = false;
  state.robot = { ...state.mission.start };
  state.trail = [{ x: state.robot.x, y: state.robot.y }];
  resetDevices();
  setRunMessage("Ready to code.");
  draw();
}

function resetDevices() {
  state.devices.signalOn = false;
  state.devices.messages = [];
  state.devices.sounds = [];
  updateDevices();
}

function nextCell() {
  const dir = DIRECTIONS[state.robot.dir];
  return { x: state.robot.x + dir.dx, y: state.robot.y + dir.dy };
}

function isWall(x, y) {
  return state.mission.walls.some(wall => wall.x === x && wall.y === y);
}

function isBlocked(x, y) {
  return x < 0 || y < 0 || x >= GRID_SIZE || y >= GRID_SIZE || isWall(x, y);
}

function wallAhead() {
  const cell = nextCell();
  return isBlocked(cell.x, cell.y);
}

function onGoal() {
  return state.robot.x === state.mission.goal.x && state.robot.y === state.mission.goal.y;
}

function conditionIsTrue(condition) {
  if (condition === "splatbot_wall_ahead") return wallAhead();
  if (condition === "splatbot_on_goal") return onGoal();
  if (condition === "splatbot_phone_tilted") return Math.abs(state.sensorInputs.tilt) > 18;
  if (condition === "splatbot_room_loud") return state.sensorInputs.loud;
  return false;
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function roughSteps(steps) {
  const roll = Math.random();
  const jitter = roll < 0.33 ? -1 : roll > 0.66 ? 1 : 0;
  return Math.max(1, steps + jitter);
}

function isCommandBlocked(command) {
  return state.constraint && state.constraint.blocked.includes(command.action);
}

function validateCommands(commands) {
  const blocked = commands.find(isCommandBlocked);
  if (!blocked) return true;
  setRunMessage(`Challenge constraint blocked "${blocked.action}". Try another strategy.`, "error");
  return false;
}

function recordTrace(command, note = "") {
  state.trace.push({
    command: command.action,
    note,
    x: state.robot.x,
    y: state.robot.y,
    dir: state.robot.dir,
    sensor: wallAhead() ? "wall" : "clear",
    goal: onGoal()
  });
  state.trace = state.trace.slice(-80);
}

async function runProgram() {
  if (state.running) return;
  state.running = true;
  setRunMessage("Running program...");
  const commands = currentProgram();
  if (commands.length === 0) {
    state.running = false;
    setRunMessage("Add at least one command before running.", "warn");
    return;
  }
  if (!validateCommands(commands)) {
    state.running = false;
    return;
  }
  state.trace = [];
  for (const command of commands) {
    if (!state.running) break;
    if (command.action === "move" || command.action === "moveRoughly") {
      const steps = command.action === "moveRoughly" ? roughSteps(command.steps) : command.steps;
      for (let i = 0; i < steps; i += 1) {
        if (!state.running) break;
        const cell = nextCell();
        if (isBlocked(cell.x, cell.y)) {
          draw(true);
          recordTrace(command, "bump");
          await wait(260);
          break;
        }
        state.robot.x = cell.x;
        state.robot.y = cell.y;
        state.trail.push({ x: cell.x, y: cell.y });
        recordTrace(command);
        draw();
        await wait(360);
      }
    }
    if (command.action === "turn" || command.action === "turnRoughly") {
      if (command.action === "turnRoughly" && Math.random() < 0.15) {
        recordTrace(command, "missed rough turn");
        await wait(220);
        continue;
      }
      state.robot.dir += command.dir === "LEFT" ? -1 : 1;
      state.robot.dir = (state.robot.dir + DIRECTIONS.length) % DIRECTIONS.length;
      recordTrace(command);
      draw();
      await wait(260);
    }
    if (command.action === "if" && conditionIsTrue(command.condition)) {
      await runInline(command.commands);
    }
    if (command.action === "light") {
      state.devices.signalOn = Boolean(command.value);
      updateDevices();
      await wait(180);
    }
    if (command.action === "send") {
      addMessage(command.text);
      await wait(180);
    }
    if (command.action === "sound") {
      await playSound(command.sound);
    }
    if (command.action === "song") {
      await playSong(command.song);
    }
  }
  state.running = false;
  draw();
  setRunMessage(
    onGoal() ? "Mission complete. SplatBot reached the goal." : "Program finished. SplatBot is not on the goal yet.",
    onGoal() ? "success" : "warn"
  );
}

async function runInline(commands) {
  for (const command of commands) {
    if (!state.running) break;
    if (isCommandBlocked(command)) {
      setRunMessage(`Challenge constraint blocked "${command.action}".`, "error");
      state.running = false;
      break;
    }
    if (command.action === "turn" || command.action === "turnRoughly") {
      if (command.action === "turnRoughly" && Math.random() < 0.15) {
        recordTrace(command, "missed rough turn");
        await wait(200);
        continue;
      }
      state.robot.dir += command.dir === "LEFT" ? -1 : 1;
      state.robot.dir = (state.robot.dir + DIRECTIONS.length) % DIRECTIONS.length;
      recordTrace(command);
      draw();
      await wait(240);
    }
    if (command.action === "move" || command.action === "moveRoughly") {
      const steps = command.action === "moveRoughly" ? roughSteps(command.steps) : command.steps;
      for (let i = 0; i < steps; i += 1) {
        const cell = nextCell();
        if (!isBlocked(cell.x, cell.y)) {
          state.robot.x = cell.x;
          state.robot.y = cell.y;
          state.trail.push({ x: cell.x, y: cell.y });
          recordTrace(command);
          draw();
        }
        await wait(240);
      }
    }
    if (command.action === "light") {
      state.devices.signalOn = Boolean(command.value);
      updateDevices();
      await wait(160);
    }
    if (command.action === "send") {
      addMessage(command.text);
      await wait(160);
    }
    if (command.action === "sound") {
      await playSound(command.sound);
    }
    if (command.action === "song") {
      await playSong(command.song);
    }
  }
}

function draw(bump = false) {
  const size = els.canvas.width;
  const cell = size / GRID_SIZE;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = COLORS.field;
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      ctx.strokeStyle = COLORS.grid;
      ctx.lineWidth = 2;
      ctx.strokeRect(x * cell, y * cell, cell, cell);
    }
  }

  ctx.fillStyle = COLORS.trail;
  state.trail.forEach(point => {
    ctx.fillRect(point.x * cell + cell * 0.2, point.y * cell + cell * 0.2, cell * 0.6, cell * 0.6);
  });

  ctx.fillStyle = COLORS.goal;
  roundedRect(state.mission.goal.x * cell + 8, state.mission.goal.y * cell + 8, cell - 16, cell - 16, 12);
  ctx.fill();

  ctx.fillStyle = COLORS.wall;
  state.mission.walls.forEach(wall => {
    roundedRect(wall.x * cell + 7, wall.y * cell + 7, cell - 14, cell - 14, 7);
    ctx.fill();
  });

  drawRobot(cell, bump);
  updateReadouts();
}

function roundedRect(x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function drawRobot(cell, bump) {
  const cx = state.robot.x * cell + cell / 2;
  const cy = state.robot.y * cell + cell / 2;
  const angle = state.robot.dir * Math.PI / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.fillStyle = bump ? COLORS.bump : COLORS.robot;
  roundedRect(-cell * 0.28, -cell * 0.28, cell * 0.56, cell * 0.56, 14);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(cell * 0.32, 0);
  ctx.lineTo(cell * 0.08, -cell * 0.13);
  ctx.lineTo(cell * 0.08, cell * 0.13);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(-cell * 0.18, -cell * 0.18, cell * 0.12, cell * 0.12);
  ctx.fillRect(-cell * 0.18, cell * 0.06, cell * 0.12, cell * 0.12);
  ctx.restore();
}

function updateReadouts() {
  els.position.textContent = `${state.robot.x + 1}, ${state.robot.y + 1}`;
  els.direction.textContent = DIRECTIONS[state.robot.dir].name;
  els.sensor.textContent = wallAhead() ? "Wall ahead" : "Clear";
  els.goal.textContent = onGoal() ? "Reached" : "Not yet";
  [...els.missionSteps.children].forEach((item, index) => {
    item.classList.toggle("done", index === 0 || (index === 1 && state.trail.length > 1) || (index === 2 && onGoal()));
  });
}

function addMessage(text) {
  const message = String(text || "message").trim().slice(0, 40) || "message";
  state.devices.messages.push(message);
  state.devices.messages = state.devices.messages.slice(-5);
  updateDevices();
}

function getAudioContext() {
  if (!audioContext) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    audioContext = new AudioCtx();
  }
  if (audioContext.state === "suspended") audioContext.resume();
  return audioContext;
}

function toneFrequency(sound) {
  if (sound === "low") return 220;
  if (sound === "high") return 660;
  return 440;
}

async function playTone(frequency, duration = 180) {
  const audio = getAudioContext();
  if (!audio) {
    await wait(duration);
    return;
  }
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.001, audio.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration / 1000);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start();
  oscillator.stop(audio.currentTime + duration / 1000);
  await wait(duration + 25);
}

async function playSound(sound = "beep") {
  const label = sound === "low" ? "Low beep" : sound === "high" ? "High beep" : "Beep";
  state.devices.sounds.push(label);
  state.devices.sounds = state.devices.sounds.slice(-5);
  updateDevices(label);
  await playTone(toneFrequency(sound), 180);
}

async function playSong(song = "scale") {
  const songName = SplatBotCore.normalizeSongName(song);
  const label = `Song: ${songName}`;
  state.devices.sounds.push(label);
  state.devices.sounds = state.devices.sounds.slice(-5);
  updateDevices(label);
  for (const note of SplatBotCore.SONGS[songName]) {
    if (!state.running) break;
    await playTone(note.frequency, note.duration);
  }
}

function updateDevices(soundLabel) {
  els.signalLight.classList.toggle("is-on", state.devices.signalOn);
  els.signalReadout.textContent = state.devices.signalOn ? "On" : "Off";
  els.soundReadout.textContent = soundLabel || state.devices.sounds[state.devices.sounds.length - 1] || "Silent";
  els.messageLog.innerHTML = "";
  const messages = state.devices.messages.length ? state.devices.messages : ["No messages yet"];
  messages.forEach(message => {
    const item = document.createElement("li");
    item.textContent = message;
    els.messageLog.append(item);
  });
}

function commandToWord(command) {
  if (command.action === "move") return `move ${command.steps}`;
  if (command.action === "moveRoughly") return `move roughly ${command.steps}`;
  if (command.action === "turn") return `turn ${command.dir.toLowerCase()}`;
  if (command.action === "turnRoughly") return `turn roughly ${command.dir.toLowerCase()}`;
  if (command.action === "light") return command.value ? "light on" : "light off";
  if (command.action === "send") return `send ${command.text || "done"}`;
  if (command.action === "sound") return command.sound === "low" ? "play low beep" : command.sound === "high" ? "play high beep" : "play beep";
  if (command.action === "song") return `play song ${command.song || "scale"}`;
  return "";
}

function jogGhost(command) {
  if (command.action === "move") {
    const cell = nextCell();
    if (isBlocked(cell.x, cell.y)) {
      draw(true);
      setRunMessage("Ghost recorder hit a wall. Turn or reset.", "warn");
      return;
    }
    state.robot.x = cell.x;
    state.robot.y = cell.y;
    state.trail.push({ x: cell.x, y: cell.y });
  }
  if (command.action === "turn") {
    state.robot.dir += command.dir === "LEFT" ? -1 : 1;
    state.robot.dir = (state.robot.dir + DIRECTIONS.length) % DIRECTIONS.length;
  }
  state.ghostCommands.push(command);
  updateGhostReadout();
  draw();
}

function updateGhostReadout() {
  els.ghostReadout.textContent = `${state.ghostCommands.length} moves`;
}

function useGhostRecording() {
  if (!state.ghostCommands.length) {
    setRunMessage("Record a ghost path first.", "warn");
    return;
  }
  els.wordProgram.value = state.ghostCommands.map(commandToWord).filter(Boolean).join("\n");
  switchMode("words");
  setRunMessage("Ghost recording converted to editable word code.", "success");
}

function clearGhostRecording() {
  state.ghostCommands = [];
  updateGhostReadout();
  resetRobot();
}

function createSharePayload() {
  return {
    app: "SplatBot",
    type: "program-share",
    version: 1,
    missionId: state.mission.id,
    mode: els.wordsPane.classList.contains("is-active") ? "words" : "blocks",
    words: els.wordProgram.value,
    workspace: getWorkspaceSnapshot()
  };
}

function encodeSharePayload(payload) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

function decodeSharePayload(code) {
  return JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
}

function renderQr() {
  const code = encodeSharePayload(createSharePayload());
  els.shareCode.value = code;
  els.qrOutput.innerHTML = "";
  try {
    const qr = qrcode(0, "M");
    qr.addData(code);
    qr.make();
    els.qrOutput.innerHTML = qr.createTableTag(4, 0);
    setRunMessage("Program QR generated.", "success");
  } catch (error) {
    els.qrOutput.textContent = "Program is too large for this QR. Use the share code.";
    setRunMessage("Program code generated. QR was too dense.", "warn");
  }
}

function loadShareCode() {
  try {
    const payload = decodeSharePayload(els.shareCode.value);
    if (payload.app !== "SplatBot" || payload.type !== "program-share") throw new Error("Invalid share code.");
    applyProjectData(payload);
    setRunMessage("Shared program loaded.", "success");
  } catch (error) {
    setRunMessage("Share code could not be loaded.", "error");
  }
}

function randomConstraint() {
  state.constraint = CONSTRAINTS[Math.floor(Math.random() * CONSTRAINTS.length)];
  els.constraintReadout.textContent = state.constraint.label;
  setRunMessage(`Challenge mode: ${state.constraint.label}.`, "warn");
}

function updatePhoneSensorReadout() {
  const tilt = Math.round(state.sensorInputs.tilt);
  els.sensorInputReadout.textContent = state.sensorInputs.enabled
    ? `Tilt ${tilt} deg${state.sensorInputs.loud ? ", loud" : ""}`
    : "Not enabled";
}

async function enablePhoneSensors() {
  state.sensorInputs.enabled = true;
  if (window.DeviceOrientationEvent && typeof DeviceOrientationEvent.requestPermission === "function") {
    try {
      await DeviceOrientationEvent.requestPermission();
    } catch (error) {
      setRunMessage("Device orientation permission was not granted.", "warn");
    }
  }
  window.addEventListener("deviceorientation", event => {
    state.sensorInputs.tilt = Number(event.gamma || 0);
    updatePhoneSensorReadout();
  });
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audio = getAudioContext();
      if (audio) {
        const source = audio.createMediaStreamSource(stream);
        const analyser = audio.createAnalyser();
        const data = new Uint8Array(analyser.frequencyBinCount);
        source.connect(analyser);
        const readVolume = () => {
          analyser.getByteFrequencyData(data);
          const average = data.reduce((sum, value) => sum + value, 0) / data.length;
          state.sensorInputs.loud = average > 28;
          updatePhoneSensorReadout();
          if (state.sensorInputs.enabled) requestAnimationFrame(readVolume);
        };
        readVolume();
      }
    } catch (error) {
      setRunMessage("Tilt enabled. Microphone loudness was not enabled.", "warn");
    }
  }
  updatePhoneSensorReadout();
  setRunMessage("Phone sensor input is listening for tilt when available.", "success");
}

function setRunMessage(message, tone = "") {
  els.runMessage.textContent = message;
  els.runMessage.className = `run-message${tone ? ` ${tone}` : ""}`;
}

function getWorkspaceSnapshot() {
  if (Blockly.serialization && Blockly.serialization.workspaces) {
    return {
      format: "serialization",
      data: Blockly.serialization.workspaces.save(workspace)
    };
  }
  const dom = Blockly.Xml.workspaceToDom(workspace);
  return {
    format: "xml",
    data: Blockly.Xml.domToText(dom)
  };
}

function loadWorkspaceSnapshot(snapshot) {
  workspace.clear();
  if (!snapshot) return;
  if (snapshot.format === "serialization" && Blockly.serialization && Blockly.serialization.workspaces) {
    Blockly.serialization.workspaces.load(snapshot.data, workspace);
    return;
  }
  if (snapshot.format === "xml") {
    const dom = Blockly.Xml.textToDom(snapshot.data);
    Blockly.Xml.domToWorkspace(dom, workspace);
  }
}

function createProjectData() {
  return {
    app: "SplatBot",
    version: 1,
    savedAt: new Date().toISOString(),
    missionId: state.mission.id,
    mode: els.wordsPane.classList.contains("is-active") ? "words" : "blocks",
    words: els.wordProgram.value,
    devices: state.devices,
    workspace: getWorkspaceSnapshot()
  };
}

function applyProjectData(project) {
  const mission = missions.find(item => item.id === project.missionId) || missions[0];
  state.mission = mission;
  els.missionSelect.value = mission.id;
  renderMission();
  els.wordProgram.value = project.words || "";
  state.devices = {
    signalOn: Boolean(project.devices && project.devices.signalOn),
    messages: project.devices && Array.isArray(project.devices.messages) ? project.devices.messages.slice(-5) : [],
    sounds: project.devices && Array.isArray(project.devices.sounds) ? project.devices.sounds.slice(-5) : []
  };
  if (project.workspace) loadWorkspaceSnapshot(project.workspace);
  switchMode(project.mode === "words" ? "words" : "blocks");
  resetRobot();
  els.saveReadout.textContent = project.savedAt ? "Loaded" : "Imported";
}

function saveProject() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(createProjectData()));
    els.saveReadout.textContent = "Saved";
    setRunMessage("Project saved in this browser.", "success");
  } catch (error) {
    els.saveReadout.textContent = "Save failed";
    setRunMessage("Browser storage is not available for this project.", "error");
  }
}

function restoreProject() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  try {
    applyProjectData(JSON.parse(raw));
    setRunMessage("Saved project restored.", "success");
  } catch (error) {
    localStorage.removeItem(STORAGE_KEY);
    setRunMessage("Saved project could not be restored.", "warn");
  }
}

function exportProject() {
  const project = createProjectData();
  const blob = new Blob([JSON.stringify(project, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `splatbot-${state.mission.id}.json`;
  link.click();
  URL.revokeObjectURL(url);
  els.saveReadout.textContent = "Exported";
  setRunMessage("Project exported as a JSON file.", "success");
}

function codeFileExtension(target) {
  if (target === "javascript") return "js";
  return "py";
}

function generatePortableCode() {
  const target = els.codeTarget.value;
  const code = SplatBotCore.exportProgram(currentProgram(), target);
  els.portableCode.value = code;
  setRunMessage(`Generated ${els.codeTarget.selectedOptions[0].textContent} starter code.`, "success");
}

async function copyPortableCode() {
  if (!els.portableCode.value.trim()) generatePortableCode();
  try {
    await navigator.clipboard.writeText(els.portableCode.value);
    setRunMessage("Generated code copied.", "success");
  } catch (error) {
    els.portableCode.select();
    setRunMessage("Code is selected. Use your browser copy command.", "warn");
  }
}

function downloadPortableCode() {
  if (!els.portableCode.value.trim()) generatePortableCode();
  const target = els.codeTarget.value;
  const blob = new Blob([els.portableCode.value], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `splatlab-${target}.${codeFileExtension(target)}`;
  link.click();
  URL.revokeObjectURL(url);
  setRunMessage("Generated code downloaded.", "success");
}

function importPortableCode() {
  const words = SplatBotCore.importPortableProgram(els.portableCode.value);
  if (!words) {
    setRunMessage("No SplatLab adapter calls found to import.", "warn");
    return;
  }
  els.wordProgram.value = words;
  switchMode("words");
  setRunMessage("Imported generated code back into word commands.", "success");
}

function importProject(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const project = JSON.parse(String(reader.result));
      if (project.app !== "SplatBot") throw new Error("Not a SplatBot project");
      applyProjectData(project);
      saveProject();
      setRunMessage("Project imported.", "success");
    } catch (error) {
      setRunMessage("That file is not a valid SplatBot project.", "error");
    }
  });
  reader.readAsText(file);
}

async function loadMissionPack() {
  const custom = localStorage.getItem(CUSTOM_MISSIONS_KEY);
  if (custom) {
    try {
      applyMissionPack(JSON.parse(custom), "Custom mission pack loaded.");
      return;
    } catch (error) {
      localStorage.removeItem(CUSTOM_MISSIONS_KEY);
    }
  }

  try {
    const response = await fetch(STARTER_PACK_URL);
    if (!response.ok) throw new Error("Mission pack request failed.");
    applyMissionPack(await response.json(), "Starter mission pack loaded.");
  } catch (error) {
    missions = [fallbackMission];
    state.mission = fallbackMission;
    setRunMessage("Starter mission pack could not load. Fallback mission is ready.", "warn");
  }
}

async function loadActivityPack() {
  try {
    const response = await fetch(ACTIVITY_PACK_URL);
    if (!response.ok) throw new Error("Activity pack request failed.");
    const pack = await response.json();
    activityPack = {
      ...pack,
      concepts: Array.isArray(pack.concepts) ? pack.concepts : []
    };
    if (activityPack.concepts[0]) state.activeConceptId = activityPack.concepts[0].id;
  } catch (error) {
    activityPack = { concepts: [] };
    setRunMessage("Thinking Lab activity pack could not load.", "warn");
  }
}

function applyMissionPack(pack, message) {
  const normalized = SplatBotCore.normalizeMissionPack(pack, GRID_SIZE);
  missions = normalized.missions;
  state.mission = missions[0];
  renderMissionOptions();
  if (message) setRunMessage(message, "success");
}

function renderMissionOptions() {
  els.missionSelect.innerHTML = "";
  missions.forEach(mission => {
    const option = document.createElement("option");
    option.value = mission.id;
    option.textContent = mission.title;
    els.missionSelect.append(option);
  });
  els.missionSelect.value = state.mission.id;
}

function renderThinkingOptions() {
  els.thinkingConceptSelect.innerHTML = "";
  activityPack.concepts.forEach(concept => {
    const option = document.createElement("option");
    option.value = concept.id;
    option.textContent = concept.title;
    els.thinkingConceptSelect.append(option);
  });
  els.thinkingConceptSelect.value = state.activeConceptId;
}

function selectedThinkingConcept() {
  return activityPack.concepts.find(concept => concept.id === state.activeConceptId) || activityPack.concepts[0];
}

function renderThinkingLab() {
  renderThinkingOptions();
  renderQuestChallenges();
  renderStoryCampaign();
  const concept = selectedThinkingConcept();
  if (!concept) {
    els.thinkingPoster.removeAttribute("src");
    els.thinkingPoster.alt = "";
    els.thinkingTagline.textContent = "Thinking Lab activities are not loaded.";
    els.thinkingActivities.innerHTML = "";
    els.standardsReadout.textContent = "";
    return;
  }

  els.thinkingPoster.src = concept.poster;
  els.thinkingPoster.alt = `${concept.title} poster`;
  els.thinkingTagline.textContent = concept.tagline;
  els.thinkingActivities.innerHTML = "";
  (concept.activities || []).forEach((activity, index) => {
    const card = document.createElement("article");
    card.className = "activity-card";

    const heading = document.createElement("h3");
    heading.textContent = `${index + 1}. ${activity.title}`;
    card.append(heading);

    const prompt = document.createElement("p");
    prompt.textContent = state.role === "teacher" ? activity.model : activity.prompt;
    card.append(prompt);

    if (state.role === "teacher") {
      const teacherPrompt = document.createElement("em");
      teacherPrompt.textContent = activity.prompt;
      card.append(teacherPrompt);
    }
    els.thinkingActivities.append(card);
  });

  const framework = state.standardsFramework;
  const standards = concept.standards && Array.isArray(concept.standards[framework]) ? concept.standards[framework] : [];
  els.standardsReadout.innerHTML = "";
  const title = document.createElement("strong");
  title.textContent = `${FRAMEWORK_LABELS[framework] || "Standards"} alignment`;
  els.standardsReadout.append(title);
  standards.forEach(label => {
    const item = document.createElement("span");
    item.textContent = label;
    els.standardsReadout.append(item);
  });
}

function renderQuestChallenges() {
  els.questChallenges.innerHTML = "";
  const challenges = Array.isArray(activityPack.questChallenges) ? activityPack.questChallenges : [];
  challenges.forEach((challenge, index) => {
    const card = document.createElement("article");
    card.className = "quest-card";

    const heading = document.createElement("h4");
    heading.textContent = `${index + 1}. ${challenge.title}`;
    card.append(heading);

    const tagline = document.createElement("p");
    tagline.textContent = challenge.tagline;
    card.append(tagline);

    const task = document.createElement("em");
    task.textContent = state.role === "teacher" ? challenge.teacherNote : challenge.virtualTask;
    card.append(task);

    if (state.role === "teacher") {
      const models = document.createElement("span");
      models.textContent = `Models: ${(challenge.models || []).join(", ")}`;
      card.append(models);
    }

    els.questChallenges.append(card);
  });
}

function renderStoryCampaign() {
  const campaign = activityPack.storyCampaign;
  if (!campaign) {
    els.storyTitle.textContent = "Story Campaign";
    els.storyPremise.textContent = "Story chapters are not loaded.";
    els.storyChapters.innerHTML = "";
    return;
  }

  els.storyTitle.textContent = campaign.title;
  els.storyPremise.textContent = campaign.premise;
  els.storyChapters.innerHTML = "";
  (campaign.chapters || []).forEach((chapter, index) => {
    const card = document.createElement("article");
    card.className = "story-card";

    const heading = document.createElement("h4");
    heading.textContent = `${index + 1}. ${chapter.title}`;
    card.append(heading);

    const story = document.createElement("p");
    story.textContent = chapter.story;
    card.append(story);

    const goal = document.createElement("em");
    goal.textContent = chapter.studentGoal;
    card.append(goal);

    if (state.role === "teacher") {
      const link = document.createElement("span");
      link.textContent = `Quest link: ${chapter.challengeId}`;
      card.append(link);
    }

    els.storyChapters.append(card);
  });
}

function createMissionPackData() {
  return {
    app: "SplatBot",
    type: "mission-pack",
    version: 1,
    title: "SplatBot Mission Pack",
    description: "Exported from SplatBot Studio.",
    exportedAt: new Date().toISOString(),
    missions
  };
}

function exportMissionPack() {
  const blob = new Blob([JSON.stringify(createMissionPackData(), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "splatbot-mission-pack.json";
  link.click();
  URL.revokeObjectURL(url);
  setRunMessage("Mission pack exported.", "success");
}

function importMissionPack(file) {
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    try {
      const pack = SplatBotCore.normalizeMissionPack(JSON.parse(String(reader.result)), GRID_SIZE);
      localStorage.setItem(CUSTOM_MISSIONS_KEY, JSON.stringify(pack));
      applyMissionPack(pack, "Mission pack imported.");
      renderMission();
      resetRobot();
      loadStarterBlocks();
    } catch (error) {
      setRunMessage(error.message || "That file is not a valid SplatBot mission pack.", "error");
    }
  });
  reader.readAsText(file);
}

function toGridNumber(value) {
  return Math.min(Math.max(Number(value) || 1, 1), GRID_SIZE) - 1;
}

function parseWallList(value) {
  return String(value || "")
    .split(";")
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [x, y] = item.split(",").map(part => toGridNumber(part.trim()));
      return { x, y };
    });
}

function createMissionFromBuilder() {
  const title = els.builderTitle.value.trim() || "Custom Mission";
  const mission = {
    id: `custom-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`,
    title,
    band: els.builderBand.value.trim() || "Custom",
    prompt: els.builderPrompt.value.trim() || "Program SplatBot to reach the goal.",
    concept: els.builderConcept.value.trim() || "Programming",
    vocabulary: els.builderVocabulary.value.split(",").map(item => item.trim()).filter(Boolean),
    teacherNote: els.builderTeacherNote.value.trim() || "Ask students to predict, test, and revise.",
    start: {
      x: toGridNumber(els.builderStartX.value),
      y: toGridNumber(els.builderStartY.value),
      dir: Number(els.builderDir.value) || 0
    },
    goal: {
      x: toGridNumber(els.builderGoalX.value),
      y: toGridNumber(els.builderGoalY.value)
    },
    walls: parseWallList(els.builderWalls.value),
    steps: ["Plan the route", "Run the program", "Revise if needed"],
    starter: [{ type: "move", steps: 1 }]
  };
  return SplatBotCore.normalizeMission(mission, GRID_SIZE);
}

function persistCurrentMissionPack() {
  localStorage.setItem(CUSTOM_MISSIONS_KEY, JSON.stringify(createMissionPackData()));
}

function addMissionFromBuilder() {
  try {
    const mission = createMissionFromBuilder();
    missions = [...missions.filter(item => item.id !== mission.id), mission];
    state.mission = mission;
    persistCurrentMissionPack();
    renderMissionOptions();
    renderMission();
    resetRobot();
    loadStarterBlocks();
    setRunMessage("Custom mission added to this browser's mission pack.", "success");
  } catch (error) {
    setRunMessage(error.message || "Mission could not be added.", "error");
  }
}

async function clearCustomMissionPack() {
  localStorage.removeItem(CUSTOM_MISSIONS_KEY);
  await loadMissionPack();
  renderMission();
  resetRobot();
  loadStarterBlocks();
  setRunMessage("Starter mission pack restored.", "success");
}

function renderMission() {
  els.missionBand.textContent = state.mission.band;
  els.missionTitle.textContent = state.mission.title;
  els.missionPrompt.textContent = state.mission.prompt;
  els.missionConcept.textContent = state.mission.concept || "Programming";
  els.missionVocabulary.textContent = (state.mission.vocabulary || []).join(", ");
  els.missionTeacherNote.textContent = state.mission.teacherNote || "Use prediction, testing, and revision.";
  els.missionSteps.innerHTML = "";
  state.mission.steps.forEach(step => {
    const item = document.createElement("div");
    item.textContent = step;
    els.missionSteps.append(item);
  });
}

function loadStarterBlocks() {
  workspace.clear();
  let previous = null;
  state.mission.starter.forEach(command => {
    const block = workspace.newBlock(command.type === "move" ? "splatbot_move" : "splatbot_turn");
    if (command.type === "move") block.setFieldValue(String(command.steps), "STEPS");
    if (command.type === "turn") block.setFieldValue(command.dir, "DIR");
    block.initSvg();
    block.render();
    if (previous) previous.nextConnection.connect(block.previousConnection);
    previous = block;
  });
  const top = workspace.getTopBlocks(false)[0];
  if (top) top.moveBy(40, 40);
}

function switchMode(mode) {
  const words = mode === "words";
  els.wordsTab.classList.toggle("is-active", words);
  els.blocksTab.classList.toggle("is-active", !words);
  els.wordsPane.classList.toggle("is-active", words);
  els.blocksPane.classList.toggle("is-active", !words);
  els.wordsTab.setAttribute("aria-selected", String(words));
  els.blocksTab.setAttribute("aria-selected", String(!words));
  setTimeout(() => Blockly.svgResize(workspace), 0);
}

function setInterfaceRole(role) {
  state.role = role === "teacher" ? "teacher" : "student";
  document.body.dataset.role = state.role;
  els.roleSelect.value = state.role;
  renderThinkingLab();
}

function initMissions() {
  els.missionSelect.addEventListener("change", event => {
    state.mission = missions.find(mission => mission.id === event.target.value) || missions[0] || fallbackMission;
    renderMission();
    resetRobot();
    loadStarterBlocks();
    els.saveReadout.textContent = "Not saved";
  });
}

function initEvents() {
  els.startLab.addEventListener("click", hideSplash);
  els.skipStory.addEventListener("click", hideSplash);
  els.story.addEventListener("click", showSplash);
  els.roleSelect.addEventListener("change", event => {
    setInterfaceRole(event.target.value);
  });
  els.standardsSelect.addEventListener("change", event => {
    state.standardsFramework = event.target.value;
    renderThinkingLab();
  });
  els.thinkingConceptSelect.addEventListener("change", event => {
    state.activeConceptId = event.target.value;
    renderThinkingLab();
  });
  els.run.addEventListener("click", runProgram);
  els.stop.addEventListener("click", () => {
    state.running = false;
  });
  els.reset.addEventListener("click", resetRobot);
  els.save.addEventListener("click", saveProject);
  els.export.addEventListener("click", exportProject);
  els.import.addEventListener("click", () => els.importFile.click());
  els.importFile.addEventListener("change", event => {
    const [file] = event.target.files;
    if (file) importProject(file);
    event.target.value = "";
  });
  els.importMissions.addEventListener("click", () => els.missionFile.click());
  els.exportMissions.addEventListener("click", exportMissionPack);
  els.missionFile.addEventListener("change", event => {
    const [file] = event.target.files;
    if (file) importMissionPack(file);
    event.target.value = "";
  });
  els.addMission.addEventListener("click", addMissionFromBuilder);
  els.clearCustomMissions.addEventListener("click", () => {
    clearCustomMissionPack();
  });
  els.ghostForward.addEventListener("click", () => jogGhost({ action: "move", steps: 1 }));
  els.ghostLeft.addEventListener("click", () => jogGhost({ action: "turn", dir: "LEFT" }));
  els.ghostRight.addEventListener("click", () => jogGhost({ action: "turn", dir: "RIGHT" }));
  els.ghostClear.addEventListener("click", clearGhostRecording);
  els.ghostToWords.addEventListener("click", useGhostRecording);
  els.makeQr.addEventListener("click", renderQr);
  els.loadShare.addEventListener("click", loadShareCode);
  els.constraint.addEventListener("click", randomConstraint);
  els.enableSensors.addEventListener("click", enablePhoneSensors);
  els.generateCode.addEventListener("click", generatePortableCode);
  els.copyCode.addEventListener("click", copyPortableCode);
  els.downloadCode.addEventListener("click", downloadPortableCode);
  els.importCode.addEventListener("click", importPortableCode);
  els.codeTarget.addEventListener("change", generatePortableCode);
  els.loadStarter.addEventListener("click", loadStarterBlocks);
  els.blocksTab.addEventListener("click", () => switchMode("blocks"));
  els.wordsTab.addEventListener("click", () => switchMode("words"));
  window.addEventListener("resize", () => Blockly.svgResize(workspace));
}

async function start() {
  initMissions();
  await loadMissionPack();
  await loadActivityPack();
  initBlockly();
  initEvents();
  renderMission();
  setInterfaceRole(state.role);
  els.standardsSelect.value = state.standardsFramework;
  renderThinkingLab();
  generatePortableCode();
  resetRobot();
  restoreProject();
  showSplash();
}

start();
