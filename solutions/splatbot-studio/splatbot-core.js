(function initSplatBotCore(root) {
  const DIRECTIONS = [
    { name: "North", dx: 0, dy: -1 },
    { name: "East", dx: 1, dy: 0 },
    { name: "South", dx: 0, dy: 1 },
    { name: "West", dx: -1, dy: 0 }
  ];

  const SONGS = {
    scale: [
      { frequency: 262, duration: 140 },
      { frequency: 294, duration: 140 },
      { frequency: 330, duration: 140 },
      { frequency: 349, duration: 140 },
      { frequency: 392, duration: 220 }
    ],
    success: [
      { frequency: 330, duration: 130 },
      { frequency: 392, duration: 130 },
      { frequency: 523, duration: 260 }
    ],
    alert: [
      { frequency: 392, duration: 120 },
      { frequency: 294, duration: 120 },
      { frequency: 392, duration: 120 },
      { frequency: 294, duration: 180 }
    ]
  };

  function parseWordProgram(source) {
    return String(source || "")
      .split("\n")
      .map(line => line.trim().toLowerCase())
      .filter(Boolean)
      .flatMap(line => {
        const move = line.match(/^move\s+(\d+)/);
        const moveRoughly = line.match(/^move roughly\s+(\d+)/);
        const turn = line.match(/^turn\s+(left|right)/);
        const turnRoughly = line.match(/^turn roughly\s+(left|right)/);
        const repeat = line.match(/^repeat\s+(\d+)\s+move\s+(\d+)/);
        if (repeat) {
          const times = Math.min(Number(repeat[1]), 20);
          return Array.from({ length: times }, () => ({ action: "move", steps: Number(repeat[2]) }));
        }
        if (line === "if wall turn right") {
          return [{ action: "if", condition: "splatbot_wall_ahead", commands: [{ action: "turn", dir: "RIGHT" }] }];
        }
        if (line === "if wall turn left") {
          return [{ action: "if", condition: "splatbot_wall_ahead", commands: [{ action: "turn", dir: "LEFT" }] }];
        }
        if (line === "light on") return [{ action: "light", value: true }];
        if (line === "light off") return [{ action: "light", value: false }];
        if (line === "play beep") return [{ action: "sound", sound: "beep" }];
        if (line === "play low beep") return [{ action: "sound", sound: "low" }];
        if (line === "play high beep") return [{ action: "sound", sound: "high" }];
        if (line.startsWith("play song ")) return [{ action: "song", song: normalizeSongName(line.slice(10)) }];
        if (line.startsWith("send ")) return [{ action: "send", text: line.slice(5).trim().slice(0, 40) }];
        if (moveRoughly) return [{ action: "moveRoughly", steps: Number(moveRoughly[1]) }];
        if (turnRoughly) return [{ action: "turnRoughly", dir: turnRoughly[1].toUpperCase() }];
        if (move) return [{ action: "move", steps: Number(move[1]) }];
        if (turn) return [{ action: "turn", dir: turn[1].toUpperCase() }];
        return [];
      })
      .slice(0, 200);
  }

  function isWall(mission, x, y) {
    return mission.walls.some(wall => wall.x === x && wall.y === y);
  }

  function isBlocked(mission, x, y, gridSize = 8) {
    return x < 0 || y < 0 || x >= gridSize || y >= gridSize || isWall(mission, x, y);
  }

  function nextCell(robot) {
    const dir = DIRECTIONS[robot.dir];
    return { x: robot.x + dir.dx, y: robot.y + dir.dy };
  }

  function onGoal(mission, robot) {
    return robot.x === mission.goal.x && robot.y === mission.goal.y;
  }

  function simulateCommands(mission, commands, gridSize = 8) {
    const robot = { ...mission.start };
    const trail = [{ x: robot.x, y: robot.y }];
    const devices = { signalOn: false, messages: [], sounds: [] };
    let bumped = false;

    function wallAhead() {
      const cell = nextCell(robot);
      return isBlocked(mission, cell.x, cell.y, gridSize);
    }

    function jitterAmount(rng) {
      const value = rng();
      if (value < 0.33) return -1;
      if (value > 0.66) return 1;
      return 0;
    }

    function runCommand(command, rng = Math.random) {
      if (command.action === "turn") {
        robot.dir += command.dir === "LEFT" ? -1 : 1;
        robot.dir = (robot.dir + DIRECTIONS.length) % DIRECTIONS.length;
      }
      if (command.action === "turnRoughly") {
        if (rng() > 0.15) {
          robot.dir += command.dir === "LEFT" ? -1 : 1;
          robot.dir = (robot.dir + DIRECTIONS.length) % DIRECTIONS.length;
        }
      }
      if (command.action === "move" || command.action === "moveRoughly") {
        const steps = command.action === "moveRoughly" ? Math.max(1, command.steps + jitterAmount(rng)) : command.steps;
        for (let i = 0; i < steps; i += 1) {
          const cell = nextCell(robot);
          if (isBlocked(mission, cell.x, cell.y, gridSize)) {
            bumped = true;
            break;
          }
          robot.x = cell.x;
          robot.y = cell.y;
          trail.push({ x: cell.x, y: cell.y });
        }
      }
      if (command.action === "if") {
        const pass = command.condition === "splatbot_wall_ahead" ? wallAhead() : onGoal(mission, robot);
        if (pass) command.commands.forEach(runCommand);
      }
      if (command.action === "light") {
        devices.signalOn = Boolean(command.value);
      }
      if (command.action === "send") {
        devices.messages.push(String(command.text || "message").slice(0, 40));
        devices.messages = devices.messages.slice(-5);
      }
      if (command.action === "sound") {
        devices.sounds.push({ type: "sound", sound: command.sound || "beep" });
        devices.sounds = devices.sounds.slice(-8);
      }
      if (command.action === "song") {
        devices.sounds.push({ type: "song", song: normalizeSongName(command.song || "scale") });
        devices.sounds = devices.sounds.slice(-8);
      }
    }

    commands.slice(0, 200).forEach(runCommand);
    return { robot, trail, devices, bumped, onGoal: onGoal(mission, robot) };
  }

  function normalizeSongName(value) {
    const song = String(value || "scale").trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(SONGS, song) ? song : "scale";
  }

  function isPoint(value, gridSize = 8, includeDir = false) {
    if (!value || !Number.isInteger(value.x) || !Number.isInteger(value.y)) return false;
    if (value.x < 0 || value.y < 0 || value.x >= gridSize || value.y >= gridSize) return false;
    return !includeDir || (Number.isInteger(value.dir) && value.dir >= 0 && value.dir < DIRECTIONS.length);
  }

  function normalizeMission(raw, gridSize = 8) {
    const mission = {
      id: String(raw.id || raw.title || "custom-mission").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "custom-mission",
      title: String(raw.title || "Custom Mission").slice(0, 80),
      band: String(raw.band || "Custom").slice(0, 40),
      prompt: String(raw.prompt || "Program SplatBot to reach the goal.").slice(0, 240),
      concept: String(raw.concept || "Programming").slice(0, 60),
      vocabulary: Array.isArray(raw.vocabulary) ? raw.vocabulary.map(item => String(item).slice(0, 30)).slice(0, 8) : [],
      teacherNote: String(raw.teacherNote || "Use prediction, testing, and revision.").slice(0, 280),
      start: raw.start,
      goal: raw.goal,
      walls: Array.isArray(raw.walls) ? raw.walls : [],
      steps: Array.isArray(raw.steps) ? raw.steps.map(item => String(item).slice(0, 80)).slice(0, 5) : ["Plan", "Run", "Revise"],
      starter: Array.isArray(raw.starter) ? raw.starter.slice(0, 12) : []
    };
    if (!isPoint(mission.start, gridSize, true)) throw new Error(`Mission ${mission.id} has an invalid start.`);
    if (!isPoint(mission.goal, gridSize)) throw new Error(`Mission ${mission.id} has an invalid goal.`);
    mission.walls.forEach(wall => {
      if (!isPoint(wall, gridSize)) throw new Error(`Mission ${mission.id} has an invalid wall.`);
      if (wall.x === mission.start.x && wall.y === mission.start.y) throw new Error(`Mission ${mission.id} has a wall on the start.`);
      if (wall.x === mission.goal.x && wall.y === mission.goal.y) throw new Error(`Mission ${mission.id} has a wall on the goal.`);
    });
    mission.starter = mission.starter
      .filter(command => command && (command.type === "move" || command.type === "turn"))
      .map(command => command.type === "move"
        ? { type: "move", steps: Math.min(Math.max(Number(command.steps) || 1, 1), gridSize) }
        : { type: "turn", dir: command.dir === "LEFT" ? "LEFT" : "RIGHT" });
    return mission;
  }

  function normalizeMissionPack(pack, gridSize = 8) {
    const source = Array.isArray(pack) ? { missions: pack } : pack;
    if (!source || !Array.isArray(source.missions)) throw new Error("Mission pack must contain a missions array.");
    const seen = new Set();
    const missions = source.missions.map(mission => normalizeMission(mission, gridSize)).filter(mission => {
      if (seen.has(mission.id)) return false;
      seen.add(mission.id);
      return true;
    });
    if (!missions.length) throw new Error("Mission pack does not contain any valid missions.");
    return {
      app: "SplatBot",
      type: "mission-pack",
      version: 1,
      title: String(source.title || "Custom Mission Pack").slice(0, 80),
      description: String(source.description || "").slice(0, 240),
      missions
    };
  }

  function commandLabel(command) {
    if (command.action === "move" || command.action === "moveRoughly") return `${command.action} ${command.steps}`;
    if (command.action === "turn" || command.action === "turnRoughly") return `${command.action} ${String(command.dir || "RIGHT").toLowerCase()}`;
    if (command.action === "light") return command.value ? "light on" : "light off";
    if (command.action === "send") return `send ${command.text || "message"}`;
    if (command.action === "sound") return `play ${command.sound || "beep"}`;
    if (command.action === "song") return `play song ${normalizeSongName(command.song)}`;
    if (command.action === "if") return `if ${command.condition || "condition"}`;
    return command.action || "command";
  }

  function portableCall(command, target, indent = "  ") {
    const dir = String(command.dir || "RIGHT").toLowerCase();
    const steps = Math.max(1, Number(command.steps) || 1);
    if (command.action === "move" || command.action === "moveRoughly") {
      const rough = command.action === "moveRoughly" ? ", rough=True" : "";
      if (target === "javascript") return `${indent}await robot.move(${steps}${command.action === "moveRoughly" ? ", { rough: true }" : ""});`;
      return `${indent}robot.move(${steps}${rough})`;
    }
    if (command.action === "turn" || command.action === "turnRoughly") {
      const rough = command.action === "turnRoughly" ? ", rough=True" : "";
      if (target === "javascript") return `${indent}await robot.turn("${dir}"${command.action === "turnRoughly" ? ", { rough: true }" : ""});`;
      return `${indent}robot.turn("${dir}"${rough})`;
    }
    if (command.action === "light") {
      if (target === "javascript") return `${indent}robot.light(${command.value ? "true" : "false"});`;
      return `${indent}robot.light(${command.value ? "True" : "False"})`;
    }
    if (command.action === "send") {
      const text = JSON.stringify(String(command.text || "message"));
      return target === "javascript" ? `${indent}robot.send(${text});` : `${indent}robot.send(${text})`;
    }
    if (command.action === "sound") {
      const sound = JSON.stringify(command.sound || "beep");
      return target === "javascript" ? `${indent}await robot.sound(${sound});` : `${indent}robot.sound(${sound})`;
    }
    if (command.action === "song") {
      const song = JSON.stringify(normalizeSongName(command.song));
      return target === "javascript" ? `${indent}await robot.song(${song});` : `${indent}robot.song(${song})`;
    }
    return target === "javascript" ? `${indent}// ${commandLabel(command)}` : `${indent}# ${commandLabel(command)}`;
  }

  function flattenForExport(commands, target, indent = "  ") {
    return commands.flatMap(command => {
      if (command.action === "if") {
        const condition = command.condition === "splatbot_wall_ahead" ? "robot.wall_ahead()" : "robot.on_goal()";
        if (target === "javascript") {
          const body = flattenForExport(command.commands || [], target, `${indent}  `);
          return [`${indent}if (${condition}) {`, ...body, `${indent}}`];
        }
        const body = flattenForExport(command.commands || [], target, `${indent}    `);
        return [`${indent}if ${condition}:`, ...(body.length ? body : [`${indent}    pass`])];
      }
      return [portableCall(command, target, indent)];
    });
  }

  function exportProgram(commands, target = "python") {
    const program = Array.isArray(commands) ? commands.slice(0, 200) : [];
    const supported = ["python", "javascript", "microbit", "dash", "lego", "vex"];
    const kind = supported.includes(target) ? target : "python";
    const labels = program.map(commandLabel);
    if (kind === "javascript") {
      return [
        "// SplatLab JavaScript export",
        "// Replace the robot adapter with your browser, Node, or device bridge implementation.",
        "async function run(robot) {",
        ...flattenForExport(program, "javascript", "  "),
        "}",
        "",
        `// Original SplatLab steps: ${labels.join(" | ")}`
      ].join("\n");
    }
    if (kind === "microbit") {
      return [
        "# SplatLab micro:bit MicroPython export",
        "# Connect these adapter functions to motors, servos, radio, or classroom bridge code.",
        "from microbit import *",
        "",
        "class RobotAdapter:",
        "    def move(self, steps, rough=False): display.scroll('M' + str(steps))",
        "    def turn(self, direction, rough=False): display.scroll('L' if direction == 'left' else 'R')",
        "    def light(self, on): display.show(Image.YES if on else Image.NO)",
        "    def send(self, text): display.scroll(text)",
        "    def sound(self, name): display.scroll(name)",
        "    def song(self, name): display.scroll(name)",
        "    def wall_ahead(self): return False",
        "    def on_goal(self): return False",
        "",
        "robot = RobotAdapter()",
        ...flattenForExport(program, "python", ""),
        "",
        `# Original SplatLab steps: ${labels.join(" | ")}`
      ].join("\n");
    }
    const title = {
      python: "Python",
      dash: "Dash Robot Python",
      lego: "LEGO SPIKE Python",
      vex: "VEXcode Python"
    }[kind];
    const notes = {
      python: "Replace RobotAdapter with turtle, gpiozero, MQTT, WebSocket, or your own device bridge.",
      dash: "Map RobotAdapter methods to the Dash SDK used in your classroom.",
      lego: "Map RobotAdapter methods to LEGO SPIKE Prime movement, light, and sound APIs.",
      vex: "Map RobotAdapter methods to drivetrain, bumper, brain screen, and sound APIs."
    };
    return [
      `# SplatLab ${title} export`,
      `# ${notes[kind]}`,
      "",
      "class RobotAdapter:",
      "    def move(self, steps, rough=False): print('move', steps, 'rough' if rough else '')",
      "    def turn(self, direction, rough=False): print('turn', direction, 'rough' if rough else '')",
      "    def light(self, on): print('light', on)",
      "    def send(self, text): print('send', text)",
      "    def sound(self, name): print('sound', name)",
      "    def song(self, name): print('song', name)",
      "    def wall_ahead(self): return False",
      "    def on_goal(self): return False",
      "",
      "robot = RobotAdapter()",
      ...flattenForExport(program, "python", ""),
      "",
      `# Original SplatLab steps: ${labels.join(" | ")}`
    ].join("\n");
  }

  function importPortableProgram(source) {
    const text = String(source || "");
    const commands = [];
    const patterns = [
      { regex: /robot\.move\((\d+)/g, build: match => `move ${match[1]}` },
      { regex: /robot\.turn\(["'](left|right)["']/g, build: match => `turn ${match[1]}` },
      { regex: /robot\.light\((True|False|true|false)\)/g, build: match => `light ${String(match[1]).toLowerCase() === "true" ? "on" : "off"}` },
      { regex: /robot\.send\(["']([^"']{1,40})["']\)/g, build: match => `send ${match[1]}` },
      { regex: /robot\.sound\(["']([^"']{1,20})["']\)/g, build: match => `play ${match[1]}` },
      { regex: /robot\.song\(["']([^"']{1,20})["']\)/g, build: match => `play song ${match[1]}` }
    ];
    patterns.forEach(pattern => {
      let match = pattern.regex.exec(text);
      while (match) {
        commands.push({ index: match.index, line: pattern.build(match) });
        match = pattern.regex.exec(text);
      }
    });
    return commands.sort((a, b) => a.index - b.index).map(item => item.line).join("\n");
  }

  const api = {
    DIRECTIONS,
    SONGS,
    parseWordProgram,
    isBlocked,
    simulateCommands,
    normalizeMission,
    normalizeMissionPack,
    normalizeSongName,
    exportProgram,
    importPortableProgram
  };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.SplatBotCore = api;
})(typeof window !== "undefined" ? window : globalThis);
