const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  parseWordProgram,
  simulateCommands,
  normalizeMissionPack,
  normalizeSongName,
  exportProgram,
  importPortableProgram
} = require("../splatbot-core");

const openMission = {
  start: { x: 1, y: 1, dir: 1 },
  goal: { x: 4, y: 2 },
  walls: []
};

const wallMission = {
  start: { x: 1, y: 1, dir: 1 },
  goal: { x: 1, y: 2 },
  walls: [{ x: 2, y: 1 }]
};

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}

test("plain words parse move, turn, repeat, and devices", () => {
  assert.deepEqual(parseWordProgram("move 2\nturn left\nrepeat 3 move 1\nlight on\nsend arrived\nplay beep\nplay song success"), [
    { action: "move", steps: 2 },
    { action: "turn", dir: "LEFT" },
    { action: "move", steps: 1 },
    { action: "move", steps: 1 },
    { action: "move", steps: 1 },
    { action: "light", value: true },
    { action: "send", text: "arrived" },
    { action: "sound", sound: "beep" },
    { action: "song", song: "success" }
  ]);
});

test("robot reaches a goal with movement and turns", () => {
  const result = simulateCommands(openMission, parseWordProgram("move 3\nturn right\nmove 1"));
  assert.equal(result.onGoal, true);
  assert.deepEqual(result.robot, { x: 4, y: 2, dir: 2 });
});

test("wall sensor conditional turns before collision", () => {
  const result = simulateCommands(wallMission, parseWordProgram("if wall turn right\nmove 1"));
  assert.equal(result.bumped, false);
  assert.deepEqual(result.robot, { x: 1, y: 2, dir: 2 });
});

test("blocked movement reports a bump and stays in place", () => {
  const result = simulateCommands(wallMission, parseWordProgram("move 1"));
  assert.equal(result.bumped, true);
  assert.deepEqual(result.robot, { x: 1, y: 1, dir: 1 });
});

test("device commands update the virtual IoT state", () => {
  const result = simulateCommands(openMission, parseWordProgram("light on\nsend checkpoint\nplay beep\nplay song alert\nlight off"));
  assert.equal(result.devices.signalOn, false);
  assert.deepEqual(result.devices.messages, ["checkpoint"]);
  assert.deepEqual(result.devices.sounds, [
    { type: "sound", sound: "beep" },
    { type: "song", song: "alert" }
  ]);
});

test("unknown song names normalize to scale", () => {
  assert.equal(normalizeSongName("unknown"), "scale");
});

test("starter mission pack is valid", () => {
  const packPath = path.join(__dirname, "..", "missions", "starter-pack.json");
  const pack = normalizeMissionPack(JSON.parse(fs.readFileSync(packPath, "utf8")));
  assert.equal(pack.missions.length, 16);
  assert.equal(new Set(pack.missions.map(mission => mission.id)).size, 16);
});

test("thinking activity pack has four poster concepts with ten activities each", () => {
  const packPath = path.join(__dirname, "..", "activities", "thinking-pack.json");
  const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
  assert.equal(pack.concepts.length, 4);
  for (const concept of pack.concepts) {
    assert.ok(concept.id);
    assert.ok(concept.title);
    assert.ok(concept.poster);
    assert.ok(fs.existsSync(path.join(__dirname, "..", concept.poster)));
    assert.equal(concept.activities.length, 10);
    assert.deepEqual(Object.keys(concept.standards).sort(), ["commoncore", "ngss", "teks"]);
    for (const framework of Object.values(concept.standards)) {
      assert.ok(framework.length >= 3);
    }
  }
});

test("thinking activity pack includes rewritten virtual quest challenges", () => {
  const packPath = path.join(__dirname, "..", "activities", "thinking-pack.json");
  const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
  assert.equal(pack.questChallenges.length, 8);
  const titles = new Set(pack.questChallenges.map(challenge => challenge.title));
  assert.equal(titles.size, 8);
  for (const challenge of pack.questChallenges) {
    assert.ok(challenge.virtualTask);
    assert.ok(challenge.teacherNote);
    assert.ok(Array.isArray(challenge.models));
    assert.ok(challenge.models.length >= 3);
  }
});

test("story campaign maps each chapter to a quest challenge", () => {
  const packPath = path.join(__dirname, "..", "activities", "thinking-pack.json");
  const pack = JSON.parse(fs.readFileSync(packPath, "utf8"));
  const challengeIds = new Set(pack.questChallenges.map(challenge => challenge.id));
  assert.equal(pack.storyCampaign.title, "The Signal Garden");
  assert.equal(pack.storyCampaign.chapters.length, 8);
  for (const chapter of pack.storyCampaign.chapters) {
    assert.ok(chapter.story);
    assert.ok(chapter.studentGoal);
    assert.ok(challengeIds.has(chapter.challengeId));
  }
});

test("portable code exports cover classroom targets", () => {
  const commands = parseWordProgram("move 2\nturn right\nlight on\nsend done\nplay song success");
  for (const target of ["python", "javascript", "microbit", "dash", "lego", "vex"]) {
    const code = exportProgram(commands, target);
    assert.match(code, /SplatLab/);
    assert.match(code, /move/);
    assert.match(code, /turn/);
    assert.match(code, /send/);
  }
});

test("portable adapter code imports back to word commands", () => {
  const code = exportProgram(parseWordProgram("move 2\nturn left\nlight off\nsend ready"), "python");
  assert.equal(importPortableProgram(code), "move 2\nturn left\nlight off\nsend ready");
});

test("mission validation rejects walls on goals", () => {
  assert.throws(() => normalizeMissionPack({
    missions: [{
      id: "bad-wall",
      title: "Bad Wall",
      start: { x: 0, y: 0, dir: 1 },
      goal: { x: 1, y: 1 },
      walls: [{ x: 1, y: 1 }]
    }]
  }), /wall on the goal/);
});
