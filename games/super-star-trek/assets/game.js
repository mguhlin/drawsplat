class SuperStarTrek {
  constructor(ui) {
    this.ui = ui;
    this.soundEnabled = ui.sound?.getAttribute("aria-pressed") === "true";
    this.audio = null;
    this.currentLogGroup = null;
    this.lastQuip = -1;
    this.quips = [
      "Plot a course. Trouble is not going to find itself.",
      "Sensors are twitchy. That usually means paperwork.",
      "The stars are quiet. The Klingons are not.",
      "Keep one hand on the phasers and one eye on the map.",
      "A calm bridge is just red alert taking a breath.",
      "If the computer sounds confident, check the shields anyway.",
      "Starbases are friends. Stars are obstacles with better lighting.",
      "A good captain saves torpedoes for persuasive moments.",
      "Warp first, explain later. Carefully.",
      "The galaxy is 8 by 8. The trouble is everywhere.",
      "Short range sensors: because surprises are overrated.",
      "Long range sensors: because ambushes need appointments.",
      "Docking is not retreat. It is tactical refueling.",
      "The helm awaits a bold number between one and eight.",
      "When in doubt, ask the computer. Then doubt the computer."
    ];
    this.sceneImages = {
      splash: "assets/SuperStarTrek_SplashImage.png",
      shortRange: "assets/short-range-sensors.png",
      longRange: "assets/long-range-sensors.png",
      computer: "assets/library-computer.png",
      damage: "assets/damage-control.png",
      tactical: "assets/tactical-alert.png",
      docking: "assets/starbase-docking.png",
      phaser: "assets/phaser-fire.png",
      torpedo: "assets/torpedo-launch.png",
      galaxyMap: "assets/galaxy-map.png",
      damaged: "assets/enterprise-damaged.png",
      victory: "assets/mission-victory.png",
      failed: "assets/mission-failed.png"
    };
    this.gridIcons = {
      enterprise: "assets/enterprise-constitution-class-starship-icon.png",
      klingon: "assets/klingon-bird-of-prey-warship-icon.png",
      romulan: "assets/romulan-warbird-starship-icon.png",
      starbase: "assets/starbase-orbital-station-icon.png"
    };
    this.starIcons = {
      yellow: "assets/yellow-main-sequence-star-icon.png",
      redGiant: "assets/red-giant-star-icon.png",
      blueGiant: "assets/blue-giant-star-icon.png",
      whiteDwarf: "assets/white-dwarf-star-icon.png",
      neutron: "assets/neutron-star-icon.png"
    };
    this.difficultyConfigs = {
      easy: {
        label: "Easy",
        maxEnergy: 3600,
        maxTorpedoes: 12,
        klingonBaseEnergy: 165,
        romulanBaseEnergy: 130,
        dayBonus: 8,
        thresholds: [0.99, 0.97, 0.86],
        romulanThreshold: 0.94,
        baseThreshold: 0.94
      },
      classic: {
        label: "Classic",
        maxEnergy: 3000,
        maxTorpedoes: 10,
        klingonBaseEnergy: 200,
        romulanBaseEnergy: 165,
        dayBonus: 0,
        thresholds: [0.98, 0.95, 0.8],
        romulanThreshold: 0.955,
        baseThreshold: 0.96
      },
      hard: {
        label: "Hard",
        maxEnergy: 2600,
        maxTorpedoes: 8,
        klingonBaseEnergy: 240,
        romulanBaseEnergy: 205,
        dayBonus: -4,
        thresholds: [0.97, 0.92, 0.72],
        romulanThreshold: 0.925,
        baseThreshold: 0.975
      }
    };
    this.deviceNames = [
      "WARP ENGINES",
      "SHORT RANGE SENSORS",
      "LONG RANGE SENSORS",
      "PHASER CONTROL",
      "PHOTON TUBES",
      "DAMAGE CONTROL",
      "SHIELD CONTROL",
      "LIBRARY-COMPUTER"
    ];
    this.courseDelta = [
      [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1],
      [1, -1], [1, 0], [1, 1], [0, 1]
    ];
    this.pending = null;
    this.newGame();
  }

  newGame() {
    this.clear();
    this.pending = null;
    this.difficulty = this.ui.difficulty?.value || "classic";
    this.config = this.difficultyConfigs[this.difficulty] || this.difficultyConfigs.classic;
    this.maxEnergy = this.config.maxEnergy;
    this.maxTorpedoes = this.config.maxTorpedoes;
    this.klingonBaseEnergy = this.config.klingonBaseEnergy;
    this.romulanBaseEnergy = this.config.romulanBaseEnergy;
    this.energy = this.maxEnergy;
    this.torpedoes = this.maxTorpedoes;
    this.shields = 0;
    this.totalStarbases = 0;
    this.totalKlingons = 0;
    this.totalRomulans = 0;
    this.shipDocked = false;
    this.gameOver = false;
    this.damage = Array(8).fill(0);
    this.galaxy = this.makeMatrix(8, 8, 0);
    this.romulanGalaxy = this.makeMatrix(8, 8, 0);
    this.explored = this.makeMatrix(8, 8, 0);
    this.klingons = this.makeMatrix(3, 3, 0);
    this.romulans = this.makeMatrix(2, 3, 0);
    this.stardate = 2000 + this.randInt(0, 1900);
    this.t0 = this.stardate;
    this.maxDays = Math.max(18, 25 + this.randInt(0, 10) + this.config.dayBonus);
    this.q1 = this.fnr();
    this.q2 = this.fnr();
    this.s1 = this.fnr();
    this.s2 = this.fnr();
    this.q4 = 0;
    this.q5 = 0;
    this.b4 = 1;
    this.b5 = 1;
    this.k3 = 0;
    this.r3 = 0;
    this.b3 = 0;
    this.s3 = 0;
    this.torpedoMarker = null;
    this.quad = this.makeMatrix(8, 8, "   ");
    this.starTypes = {};
    this.setScene("splash");
    this.rotateQuip();

    this.setupGalaxy();
    this.initialKlingons = this.totalKlingons;
    this.initialRomulans = this.totalRomulans;
    const ss = this.totalStarbases > 1 ? "S" : "";
    const ss0 = this.totalStarbases > 1 ? " ARE" : " IS";
    this.line(`MISSION: Destroy ${this.totalKlingons} Klingon${this.totalKlingons === 1 ? "" : "s"} and ${this.totalRomulans} Romulan${this.totalRomulans === 1 ? "" : "s"} by stardate ${this.round(this.t0 + this.maxDays, 1)}.`, "yellow event-start");
    this.line(`DIFFICULTY: ${this.config.label}. THERE${ss0} ${this.totalStarbases} STARBASE${ss}.`, "cyan");
    this.enterQuadrant(true);
  }

  makeMatrix(rows, cols, value) {
    return Array.from({ length: rows }, () => Array(cols).fill(value));
  }

  randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  fnr() {
    return this.randInt(1, 8);
  }

  pickStarType() {
    const roll = Math.random();
    if (roll < 0.45) return "yellow";
    if (roll < 0.63) return "redGiant";
    if (roll < 0.78) return "blueGiant";
    if (roll < 0.93) return "whiteDwarf";
    return "neutron";
  }

  formatStarType(type) {
    return {
      yellow: "Yellow main sequence",
      redGiant: "Red giant",
      blueGiant: "Blue giant",
      whiteDwarf: "White dwarf",
      neutron: "Neutron"
    }[type] || "Main sequence";
  }

  round(value, precision) {
    const factor = 10 ** precision;
    return Math.floor(value * factor) / factor;
  }

  clear() {
    this.ui.terminal.innerHTML = "";
    this.currentLogGroup = null;
    this.clearChoices();
    this.setRedAlert(false);
    if (this.ui.endBanner) this.ui.endBanner.hidden = true;
    if (this.ui.endTitle) this.ui.endTitle.textContent = "Mission ended";
  }

  line(text = "", tone = "") {
    if (tone.includes("command") || tone.includes("event-start") || !this.currentLogGroup) {
      this.currentLogGroup = document.createElement("div");
      this.currentLogGroup.className = "log-group";
      this.ui.terminal.prepend(this.currentLogGroup);
    }
    const div = document.createElement("div");
    div.className = `line ${tone}`.trim();
    div.textContent = text;
    this.currentLogGroup.append(div);
    while (this.ui.terminal.children.length > 80) {
      this.ui.terminal.lastElementChild.remove();
    }
    this.ui.terminal.scrollTop = 0;
    this.updateStatus();
  }

  richLine(html = "", tone = "") {
    if (tone.includes("command") || tone.includes("event-start") || !this.currentLogGroup) {
      this.currentLogGroup = document.createElement("div");
      this.currentLogGroup.className = "log-group";
      this.ui.terminal.prepend(this.currentLogGroup);
    }
    const div = document.createElement("div");
    div.className = `line ${tone}`.trim();
    div.innerHTML = html;
    this.currentLogGroup.append(div);
    while (this.ui.terminal.children.length > 80) {
      this.ui.terminal.lastElementChild.remove();
    }
    this.ui.terminal.scrollTop = 0;
    this.updateStatus();
  }

  raw(lines) {
    lines.split("\n").reverse().forEach((line) => this.line(line));
  }

  setPrompt(text) {
    this.ui.prompt.textContent = text;
    if (this.ui.actionHint && !this.pending) this.ui.actionHint.textContent = "Choose a command or type one below.";
    this.ui.input.focus();
  }

  setScene(scene) {
    if (!this.ui.sceneImage) return;
    const src = this.sceneImages[scene] || this.sceneImages.splash;
    this.ui.sceneImage.src = src;
  }

  rotateQuip() {
    if (!this.ui.quip || !this.quips.length) return;
    let index = this.randInt(0, this.quips.length - 1);
    if (this.quips.length > 1) {
      while (index === this.lastQuip) index = this.randInt(0, this.quips.length - 1);
    }
    this.lastQuip = index;
    this.ui.quip.textContent = this.quips[index];
  }

  setRedAlert(active) {
    if (!this.ui.app) return;
    this.ui.app.classList.toggle("red-alert", Boolean(active));
  }

  updateAlertState() {
    this.setRedAlert(!this.gameOver && !this.shipDocked && this.currentHostiles() > 0);
  }

  setHint(text) {
    if (this.ui.actionHint) this.ui.actionHint.textContent = text;
  }

  clearChoices() {
    if (this.ui.choicePanel) this.ui.choicePanel.innerHTML = "";
  }

  setChoices(choices = []) {
    this.clearChoices();
    if (!this.ui.choicePanel) return;
    choices.forEach((choice, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = choice.label;
      button.dataset.value = choice.value;
      if (choice.title) button.title = choice.title;
      if (index === 0 || choice.primary) button.classList.add("primary");
      button.addEventListener("click", () => this.submitChoice(choice.value));
      this.ui.choicePanel.append(button);
    });
  }

  submitChoice(value) {
    this.ui.input.value = value;
    this.ui.form.requestSubmit();
  }

  ensureAudio() {
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) {
      this.soundEnabled = false;
      if (this.ui.sound) {
        this.ui.sound.textContent = "Sound unavailable";
        this.ui.sound.setAttribute("aria-pressed", "false");
      }
      return null;
    }
    if (!this.audio) this.audio = new AudioCtor();
    if (this.audio.state === "suspended") {
      this.audio.resume().catch(() => {});
    }
    return this.audio;
  }

  playSound(kind, delay = 0) {
    if (!this.soundEnabled) return;
    const audio = this.ensureAudio();
    if (!audio || audio.state === "closed") return;
    const tones = {
      command: [520, 0.06, 0.2, "square"],
      scan: [740, 0.08, 0.18, "sine"],
      alert: [180, 0.2, 0.25, "sawtooth"],
      torpedo: [880, 0.14, 0.3, "square"],
      torpedoStep: [700, 0.08, 0.32, "square"],
      torpedoHit: [1180, 0.28, 0.38, "sawtooth"],
      torpedoMiss: [260, 0.22, 0.3, "triangle"],
      phaser: [480, 0.38, 0.35, "sawtooth"],
      dock: [620, 0.2, 0.22, "sine"],
      win: [660, 0.16, 0.25, "sine"],
      lose: [130, 0.26, 0.28, "sawtooth"]
    };
    const [frequency, duration, volume, wave] = tones[kind] || tones.command;
    const startAt = audio.currentTime + delay;
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.frequency.value = frequency;
    osc.type = wave;
    if (kind === "phaser") {
      osc.frequency.setValueAtTime(920, startAt);
      osc.frequency.exponentialRampToValueAtTime(180, startAt + duration);
    }
    if (kind === "torpedoStep") {
      osc.frequency.setValueAtTime(560 + Math.random() * 160, startAt);
    }
    gain.gain.setValueAtTime(0.001, startAt);
    gain.gain.exponentialRampToValueAtTime(volume, startAt + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain).connect(audio.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }

  printSplash() {
    this.raw(`

                                    ,------*------,
                    ,-------------   '---  ------'
                     '-------- --'      / /
                         ,---' '-------/ /--,
                          '----------------'
                    THE USS ENTERPRISE --- NCC-1701
`);
  }

  setupGalaxy() {
    for (let i = 1; i <= 8; i += 1) {
      for (let j = 1; j <= 8; j += 1) {
        let klingons = 0;
        const roll = Math.random();
        if (roll > this.config.thresholds[0]) klingons = 3;
        else if (roll > this.config.thresholds[1]) klingons = 2;
        else if (roll > this.config.thresholds[2]) klingons = 1;
        this.totalKlingons += klingons;

        const romulans = Math.random() > this.config.romulanThreshold ? 1 : 0;
        this.totalRomulans += romulans;

        const bases = Math.random() > this.config.baseThreshold ? 1 : 0;
        this.totalStarbases += bases;
        this.galaxy[i - 1][j - 1] = klingons * 100 + bases * 10 + this.fnr();
        this.romulanGalaxy[i - 1][j - 1] = romulans;
      }
    }

    const totalHostiles = this.totalKlingons + this.totalRomulans;
    if (totalHostiles > this.maxDays) this.maxDays = totalHostiles + 1;

    if (this.totalStarbases === 0) {
      const q1 = this.fnr();
      const q2 = this.fnr();
      if (this.galaxy[q1 - 1][q2 - 1] < 900) {
        this.galaxy[q1 - 1][q2 - 1] += 10;
        this.totalStarbases = 1;
      }
    }
  }

  addObject(symbol, row, col) {
    const r = Math.floor(row - 0.5);
    const c = Math.floor(col - 0.5);
    if (r >= 0 && r < 8 && c >= 0 && c < 8) this.quad[r][c] = symbol;
  }

  hasObject(symbol, row, col) {
    const r = Math.floor(row - 0.5);
    const c = Math.floor(col - 0.5);
    if (r < 0 || r >= 8 || c < 0 || c >= 8) return false;
    return this.quad[r][c] === symbol;
  }

  findEmpty() {
    for (let attempt = 0; attempt < 1000; attempt += 1) {
      const r = this.fnr();
      const c = this.fnr();
      if (this.hasObject("   ", r, c)) return [r, c];
    }
    this.line("WARNING: No empty space found, defaulting to 1,1", "yellow");
    return [1, 1];
  }

  checkStatus() {
    if (this.shipDocked) return "DOCKED";
    if (this.currentHostiles() > 0) return "*RED*";
    if (this.energy < this.maxEnergy / 10) return "YELLOW";
    return "GREEN";
  }

  currentHostiles() {
    return (this.k3 || 0) + (this.r3 || 0);
  }

  totalHostiles() {
    return (this.totalKlingons || 0) + (this.totalRomulans || 0);
  }

  checkDocked() {
    this.shipDocked = false;
    for (let r = this.s1 - 1; r <= this.s1 + 1; r += 1) {
      for (let c = this.s2 - 1; c <= this.s2 + 1; c += 1) {
        const rr = Math.floor(r + 0.5);
        const cc = Math.floor(c + 0.5);
        if (rr >= 1 && rr <= 8 && cc >= 1 && cc <= 8 && this.hasObject(">!<", rr, cc)) {
          this.shipDocked = true;
          this.energy = this.maxEnergy;
          this.torpedoes = this.maxTorpedoes;
          if (this.shields !== 0) this.line("SHIELDS DROPPED FOR DOCKING PURPOSES", "green");
          this.shields = 0;
          this.playSound("dock");
          this.setScene("docking");
        }
      }
    }
    this.shipCondition = this.checkStatus();
    this.updateAlertState();
    return this.shipDocked;
  }

  getQuadrantName(row, col, regionOnly = false) {
    const names = col <= 4
      ? ["ANTARES", "RIGEL", "PROCYON", "VEGA", "CANOPUS", "ALTAIR", "SAGITTARIUS", "POLLUX"]
      : ["SIRIUS", "DENEB", "CAPELLA", "BETELGEUSE", "ALDEBARAN", "REGULUS", "ARCTURUS", "SPICA"];
    let name = names[row - 1];
    if (!regionOnly) {
      const suffix = [" I", " II", " III", " IV"][(col - 1) % 4];
      name += suffix;
    }
    return name;
  }

  enterQuadrant(first = false) {
    this.k3 = Math.floor(this.galaxy[this.q1 - 1][this.q2 - 1] * 0.01);
    this.b3 = Math.floor(this.galaxy[this.q1 - 1][this.q2 - 1] * 0.1) - 10 * this.k3;
    this.s3 = this.galaxy[this.q1 - 1][this.q2 - 1] - 100 * this.k3 - 10 * this.b3;
    this.r3 = this.romulanGalaxy[this.q1 - 1][this.q2 - 1];
    this.explored[this.q1 - 1][this.q2 - 1] = this.galaxy[this.q1 - 1][this.q2 - 1];

    const name = this.getQuadrantName(this.q1, this.q2);
    if (first) {
      this.line(`START: ${name} quadrant.`, "green");
    } else {
      this.line(`NOW ENTERING '${name}' QUADRANT . . .`, "cyan event-start");
    }

    if (this.currentHostiles() > 0) {
      this.setScene("tactical");
      this.line("COMBAT AREA      CONDITION RED", "red");
      if (this.shields <= 200) {
        this.setScene("damaged");
        this.line("   SHIELDS DANGEROUSLY LOW", "yellow");
      }
    }
    this.updateAlertState();

    this.klingons = this.makeMatrix(3, 3, 0);
    this.romulans = this.makeMatrix(2, 3, 0);
    this.quad = this.makeMatrix(8, 8, "   ");
    this.starTypes = {};
    this.addObject("<*>", this.s1, this.s2);

    for (let i = 0; i < this.k3; i += 1) {
      const [r, c] = this.findEmpty();
      this.addObject("+K+", r, c);
      this.klingons[i] = [r, c, this.klingonBaseEnergy * (0.5 + Math.random())];
    }

    for (let i = 0; i < this.r3; i += 1) {
      const [r, c] = this.findEmpty();
      this.addObject(" R ", r, c);
      this.romulans[i] = [r, c, this.romulanBaseEnergy * (0.5 + Math.random())];
    }

    if (this.b3 > 0) {
      const [r, c] = this.findEmpty();
      this.addObject(">!<", r, c);
      this.b4 = r;
      this.b5 = c;
    }

    for (let i = 0; i < this.s3; i += 1) {
      const [r, c] = this.findEmpty();
      this.addObject(" * ", r, c);
      this.starTypes[`${r},${c}`] = this.pickStarType();
    }

    this.checkDocked();
    this.renderGrid();
    this.shortRangeScan();
    this.setPrompt("COMMAND?");
  }

  shortRangeScan() {
    this.playSound("scan");
    if (!this.shipDocked && this.currentHostiles() <= 0) this.setScene("shortRange");
    this.renderGrid();
    if (this.damage[1] < 0) {
      this.line("*** SHORT RANGE SENSORS ARE INOPERABLE ***", "red");
      return;
    }
    this.line(`SRS: Q${this.q1},${this.q2} S${this.s1},${this.s2} | ${this.shipCondition} | K:${this.k3} R:${this.r3} B:${this.b3} Stars:${this.s3}`);
  }

  renderGrid() {
    if (!this.ui.grid) return;
    this.ui.grid.innerHTML = "";
    for (let r = 0; r < 8; r += 1) {
      for (let c = 0; c < 8; c += 1) {
        const value = this.quad?.[r]?.[c] || "   ";
        const cell = document.createElement("div");
        cell.className = "sector-cell";
        let label = ".";
        if (this.torpedoMarker && this.torpedoMarker[0] === r + 1 && this.torpedoMarker[1] === c + 1) {
          label = "*";
          cell.classList.add("torpedo");
        } else if (value === "<*>") {
          label = "<*>";
          cell.classList.add("ship");
          if (!this.addCellIcon(cell, this.gridIcons.enterprise, "Enterprise")) cell.textContent = label;
        } else if (value === "+K+") {
          label = "+K+";
          cell.classList.add("enemy");
          if (!this.addCellIcon(cell, this.gridIcons.klingon, "Klingon battle cruiser")) cell.textContent = label;
        } else if (value === " R ") {
          label = "R";
          cell.classList.add("romulan");
          if (!this.addCellIcon(cell, this.gridIcons.romulan, "Romulan vessel")) cell.textContent = label;
        } else if (value === ">!<") {
          label = ">!<";
          cell.classList.add("base");
          if (!this.addCellIcon(cell, this.gridIcons.starbase, "Federation starbase")) cell.textContent = label;
        } else if (value === " * ") {
          label = "*";
          cell.classList.add("star");
          const starType = this.starTypes[`${r + 1},${c + 1}`] || "yellow";
          cell.classList.add(`star-${starType}`);
          if (!this.addCellIcon(cell, this.starIcons[starType], `${this.formatStarType(starType)} star`)) cell.textContent = label;
        }
        if (!cell.hasChildNodes()) cell.textContent = label;
        cell.setAttribute("aria-label", label);
        cell.title = `Sector ${r + 1},${c + 1}`;
        this.ui.grid.append(cell);
      }
    }
    if (this.ui.sectorCaption) {
      this.ui.sectorCaption.textContent = `Quadrant ${this.q1},${this.q2} | Sector ${this.s1},${this.s2} | ${this.shipCondition || ""}`;
    }
  }

  addCellIcon(cell, src, alt) {
    if (!src) return false;
    const image = document.createElement("img");
    image.className = "sector-icon";
    image.src = src;
    image.alt = alt;
    image.draggable = false;
    cell.append(image);
    return true;
  }

  sectorPoint(row, col) {
    if (!this.ui.grid || !this.ui.effects) return null;
    const gridBox = this.ui.grid.getBoundingClientRect();
    const layerBox = this.ui.effects.getBoundingClientRect();
    const cell = this.ui.grid.children[(row - 1) * 8 + (col - 1)];
    if (!cell) return null;
    const box = cell.getBoundingClientRect();
    return {
      x: box.left - layerBox.left + box.width / 2,
      y: box.top - layerBox.top + box.height / 2,
      gridX: box.left - gridBox.left + box.width / 2,
      gridY: box.top - gridBox.top + box.height / 2
    };
  }

  drawBeam(fromRow, fromCol, toRow, toCol, type = "phaser") {
    if (!this.ui.effects) return;
    const start = this.sectorPoint(fromRow, fromCol);
    const end = this.sectorPoint(toRow, toCol);
    if (!start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const beam = document.createElement("div");
    beam.className = `beam ${type}`;
    beam.style.width = `${length}px`;
    beam.style.transform = `translate(${start.x}px, ${start.y}px) rotate(${angle}deg)`;
    this.ui.effects.append(beam);
    setTimeout(() => beam.remove(), 900);
  }

  flashSector(row, col, type = "hit-flash") {
    const cell = this.ui.grid?.children[(row - 1) * 8 + (col - 1)];
    if (!cell) return;
    cell.classList.add(type);
    setTimeout(() => cell.classList.remove(type), 700);
  }

  impactBurst(row, col) {
    if (!this.ui.effects) return;
    const point = this.sectorPoint(row, col);
    if (!point) return;
    const burst = document.createElement("div");
    burst.className = "impact-burst";
    burst.style.left = `${point.x}px`;
    burst.style.top = `${point.y}px`;
    this.ui.effects.append(burst);
    setTimeout(() => burst.remove(), 800);
  }

  sparkleBurst() {
    if (!this.ui.effects) return;
    const layerBox = this.ui.effects.getBoundingClientRect();
    const centerX = layerBox.width / 2;
    const centerY = layerBox.height / 2;
    const colors = ["var(--yellow)", "var(--cyan)", "var(--green)", "var(--orange)"];
    for (let i = 0; i < 42; i += 1) {
      const sparkle = document.createElement("div");
      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 240;
      sparkle.className = "sector-sparkle";
      sparkle.style.left = `${centerX}px`;
      sparkle.style.top = `${centerY}px`;
      sparkle.style.color = colors[i % colors.length];
      sparkle.style.setProperty("--spark-x", `${Math.cos(angle) * distance}px`);
      sparkle.style.setProperty("--spark-y", `${Math.sin(angle) * distance}px`);
      sparkle.style.animationDelay = `${Math.random() * 0.16}s`;
      this.ui.effects.append(sparkle);
      setTimeout(() => sparkle.remove(), 1300);
    }
  }

  celebrateSectorClear() {
    this.playSound("command");
    this.sparkleBurst();
    this.line("CONGRATULATIONS TO THE CREW: HOSTILE FORCES IN THIS SECTOR HAVE BEEN DEFEATED.", "green event-start");
  }

  screenShake() {
    if (!this.ui.app) return;
    this.ui.app.classList.remove("screen-shake");
    void this.ui.app.offsetWidth;
    this.ui.app.classList.add("screen-shake");
    setTimeout(() => this.ui.app.classList.remove("screen-shake"), 360);
  }

  torpedoSpark(row, col) {
    if (!this.ui.effects) return;
    const point = this.sectorPoint(row, col);
    if (!point) return;
    const spark = document.createElement("div");
    spark.className = "torpedo-trail";
    spark.style.left = `${point.x}px`;
    spark.style.top = `${point.y}px`;
    this.ui.effects.append(spark);
    setTimeout(() => spark.remove(), 260);
  }

  longRangeScan() {
    this.playSound("scan");
    this.setScene("longRange");
    if (this.damage[2] < 0) {
      this.line("*** LONG RANGE SENSORS ARE INOPERABLE ***", "red");
      return;
    }
    const rows = [];
    for (let r = this.q1 - 1; r <= this.q1 + 1; r += 1) {
      const parts = [];
      for (let c = this.q2 - 1; c <= this.q2 + 1; c += 1) {
        if (r > 0 && r < 9 && c > 0 && c < 9) {
          const value = this.galaxy[r - 1][c - 1];
          this.explored[r - 1][c - 1] = value;
          parts.push({
            value: String(value + 1000).slice(1),
            current: r === this.q1 && c === this.q2
          });
        } else {
          parts.push({ value: "***", current: false });
        }
      }
      rows.push(parts);
    }
    this.line("-------------------");
    rows.slice().reverse().forEach((row) => {
      const cells = row.map((part) => {
        const klass = part.current ? "lrs-cell current" : "lrs-cell";
        return `<span class="${klass}">${part.value}</span>`;
      }).join("");
      this.richLine(`<span class="lrs-row">${cells}</span>`, "yellow");
    });
    this.line(`LONG RANGE SCAN FOR QUADRANT ${this.q1},${this.q2}`, "event-start");
  }

  printComputerRecord(galaxyMap = false) {
    this.line("       1     2     3     4     5     6     7     8");
    this.line("     ----- ----- ----- ----- ----- ----- ----- -----");
    for (let r = 1; r <= 8; r += 1) {
      if (galaxyMap) {
        const left = this.center(this.getQuadrantName(r, 1, true), 23);
        const right = this.center(this.getQuadrantName(r, 5, true), 23);
        this.line(`${r}    ${left} ${right}`);
      } else {
        const vals = [];
        for (let c = 1; c <= 8; c += 1) {
          const value = this.explored[r - 1][c - 1];
          vals.push(value === 0 ? "***" : String(value + 1000).slice(1));
        }
        this.line(`${r}     ${vals.join("   ")}`);
      }
    }
    this.line("     ----- ----- ----- ----- ----- ----- ----- -----");
  }

  center(value, width) {
    const left = Math.max(0, Math.floor((width - value.length) / 2));
    return `${" ".repeat(left)}${value}`.padEnd(width, " ");
  }

  cumulativeRecord() {
    this.setScene("galaxyMap");
    this.line(`       COMPUTER RECORD OF GALAXY FOR QUADRANT ${this.q1},${this.q2}`);
    this.printComputerRecord(false);
  }

  galaxyMap() {
    this.setScene("galaxyMap");
    this.line("                        THE GALAXY");
    this.printComputerRecord(true);
  }

  statusReport() {
    const ss = this.totalKlingons > 1 ? "S" : "";
    const rs = this.totalRomulans > 1 ? "S" : "";
    this.line("   STATUS REPORT:");
    this.line(`KLINGON${ss} LEFT: ${this.totalKlingons}`, "yellow");
    this.line(`ROMULAN${rs} LEFT: ${this.totalRomulans}`, "yellow");
    this.line(`MISSION MUST BE COMPLETED IN ${this.round(this.t0 + this.maxDays - this.stardate, 1)} STARDATES`, "yellow");
    if (this.totalStarbases < 1) {
      this.line("YOUR STUPIDITY HAS LEFT YOU ON YOUR OWN IN", "red");
      this.line("  THE GALAXY -- YOU HAVE NO STARBASES LEFT!", "red");
    } else {
      const basePlural = this.totalStarbases > 1 ? "S" : "";
      this.line(`THE FEDERATION IS MAINTAINING ${this.totalStarbases} STARBASE${basePlural} IN THE GALAXY`, "green");
    }
    this.damageControl(false);
  }

  damageControl(allowRepair = true) {
    this.setScene("damage");
    if (this.damage[5] >= 0) {
      this.line("DEVICE                     STATE OF REPAIR");
      this.deviceNames.forEach((name, index) => {
        const tone = this.damage[index] < 0 ? "red" : "green";
        this.line(`${name.padEnd(27, " ")}${this.round(this.damage[index], 2)}`, tone);
      });
    } else {
      this.line("DAMAGE CONTROL REPORT NOT AVAILABLE", "red");
    }

    if (allowRepair && this.shipDocked) {
      let repairTime = 0;
      this.damage.forEach((value) => {
        if (value < 0) repairTime += 0.1;
      });
      if (repairTime > 0) {
        repairTime = Math.min(0.9, this.round(repairTime + Math.random() * 0.5, 2));
        this.line("TECHNICIANS STANDING BY TO EFFECT REPAIRS TO YOUR SHIP;");
        this.line(`ESTIMATED TIME TO REPAIR: ${repairTime} STARDATES`, "yellow");
        this.ask("WILL YOU AUTHORIZE THE REPAIR ORDER (Y/N)?", (answer) => {
          if (answer.trim().toUpperCase().startsWith("Y")) {
            this.damage = this.damage.map((value) => (value < 0 ? 0 : value));
            this.stardate += repairTime + 0.1;
            this.line("REPAIR COMPLETED.", "green");
          }
          this.setPrompt("COMMAND?");
        }, [
          { label: "Authorize repairs", value: "Y", primary: true },
          { label: "Skip repairs", value: "N" }
        ], "Repairing consumes stardates but restores damaged systems.");
      }
    }
  }

  distance(x1, y1, x2, y2) {
    return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
  }

  directionAndDistance(x1, y1, x2, y2) {
    const hd = y1 - y2;
    const vd = x2 - x1;
    let direction = 5;
    if (hd < 0) {
      if (vd > 0) direction = this.calcDirection(vd, hd, 3);
      else direction = this.calcDirection(hd, vd, 5);
    } else if (vd < 0) {
      direction = this.calcDirection(vd, hd, 7);
    } else if (hd > 0) {
      direction = this.calcDirection(hd, vd, 1);
    } else if (vd === 0) {
      direction = 5;
    } else {
      direction = this.calcDirection(hd, vd, 1);
    }
    this.line(` DIRECTION = ${this.round(direction, 2)}`);
    this.line(` DISTANCE = ${this.round(this.distance(x1, y1, x2, y2), 2)}`);
  }

  calcDirection(m, n, start) {
    if (Math.abs(m) > Math.abs(n)) return start + Math.abs(n) / Math.abs(m);
    return start + (Math.abs(n) - Math.abs(m) + Math.abs(n)) / Math.abs(n);
  }

  torpedoData() {
    if (this.currentHostiles() <= 0) {
      this.line("SCIENCE OFFICER SPOCK REPORTS  'SENSORS SHOW NO ENEMY SHIPS");
      this.line("                                IN THIS QUADRANT'");
      return;
    }
    const ss = this.k3 > 1 ? "S" : "";
    if (this.k3 > 0) {
      this.line(`FROM ENTERPRISE TO KLINGON BATTLE CRUISER${ss}:`);
      this.klingons.forEach((k) => {
        if (k[2] > 0) this.directionAndDistance(k[0], k[1], this.s1, this.s2);
      });
    }
    const rs = this.r3 > 1 ? "S" : "";
    if (this.r3 > 0) {
      this.line(`FROM ENTERPRISE TO ROMULAN VESSEL${rs}:`);
      this.romulans.forEach((r) => {
        if (r[2] > 0) this.directionAndDistance(r[0], r[1], this.s1, this.s2);
      });
    }
  }

  starbaseNavData() {
    if (this.b3 > 0) {
      this.line("FROM ENTERPRISE TO STARBASE:");
      this.directionAndDistance(this.b4, this.b5, this.s1, this.s2);
    } else {
      this.line("MR. SPOCK REPORTS,  'SENSORS SHOW NO STARBASES IN THIS");
      this.line(" QUADRANT.'");
    }
  }

  ask(prompt, handler, choices = [], hint = "") {
    this.pending = handler;
    this.setHint(hint || "Use the suggested buttons or type a value.");
    this.setChoices(choices);
    this.setPrompt(prompt);
  }

  handleInput(input) {
    const value = input.trim();
    if (!value) return;
    this.line(`${this.ui.prompt.textContent} ${value}`, "command");
    this.rotateQuip();
    this.playSound("command");
    if (this.pending) {
      const handler = this.pending;
      this.pending = null;
      this.clearChoices();
      handler(value);
      this.updateStatus();
      return;
    }
    this.runCommand(value);
    this.updateStatus();
  }

  runCommand(value) {
    if (this.gameOver) {
      this.line("The mission has ended. Start a new game to play again.", "yellow");
      return;
    }

    const command = value.toUpperCase();
    const aliases = {
      NAVIGATION: "NAV",
      SCREEN: "SRS",
      SENSORS: "LRS",
      PHASERS: "PHA",
      TORPEDO: "TOR",
      SHIELDS: "SHE",
      DAMAGE: "DAM",
      STATUS: "STA",
      POSITION: "POS",
      COMPUTER: "COM",
      EXIT: "RESIGN",
      QUIT: "RESIGN",
      XXX: "RESIGN"
    };
    const cmd = aliases[command] || command;

    if (this.energy + this.shields <= 10 && !this.shipDocked) {
      this.line("** FATAL ERROR ** YOU'VE JUST STRANDED YOUR SHIP IN SPACE", "red");
      this.line("YOU HAVE INSUFFICIENT MANEUVERING ENERGY, AND SHIELD CONTROL", "red");
      this.line("IS PRESENTLY INCAPABLE OF CROSS-CIRCUITING TO ENGINE ROOM!!", "red");
      this.endGame();
      return;
    }

    if (cmd === "NAV") this.navigationPrompt();
    else if (cmd === "SRS") this.shortRangeScan();
    else if (cmd === "LRS") this.longRangeScan();
    else if (cmd === "PHA") this.phaserPrompt();
    else if (cmd === "TOR") this.torpedoPrompt();
    else if (cmd === "SHE") this.shieldPrompt();
    else if (cmd === "DAM") this.damageControl(true);
    else if (cmd === "COM") this.computerPrompt();
    else if (cmd === "MAP") this.cumulativeRecord();
    else if (cmd === "STA") this.statusReport();
    else if (cmd === "POS") this.torpedoData();
    else if (cmd === "RESIGN") this.resignPrompt();
    else this.help();
  }

  resignPrompt() {
    const choices = [
      { label: "Stay and fight", value: "NO", primary: true },
      { label: "Resign", value: "YES" }
    ];
    this.ask("RESIGN COMMAND? ARE YOU SURE?", (input) => {
      const answer = input.trim().toUpperCase();
      if (["Y", "YES"].includes(answer)) {
        this.line("CAPTAIN RESIGNS COMMAND. THE FEDERATION IS LEFT TO ITS ENEMIES.", "red");
        this.endGame(true, "Command resigned");
        return;
      }
      this.line("RESIGNATION CANCELLED. THE CREW REMAINS AT BATTLE STATIONS.", "green");
      this.setPrompt("COMMAND?");
    }, choices, "Are you sure you want to resign your commission and leave the Federation to its enemies?");
  }

  help() {
    this.raw(`ENTER ONE OF THE FOLLOWING:
  NAV  (TO SET COURSE)
  SRS  (FOR SHORT RANGE SENSOR SCAN)
  LRS  (FOR LONG RANGE SENSOR SCAN)
  PHA  (TO FIRE PHASERS)
  TOR  (TO FIRE PHOTON TORPEDOES)
  SHE  (TO RAISE OR LOWER SHIELDS)
  DAM  (FOR DAMAGE CONTROL REPORTS)
  COM  (TO CALL ON LIBRARY-COMPUTER)
  MAP  (FOR CUMULATIVE GALACTIC RECORD)
  RESIGN  (TO RESIGN YOUR COMMAND)`);
  }

  navigationPrompt() {
    this.raw(`
      4  3  2
       \\ | /
        \\|/
    5 ---*--- 1
        /|\\
       / | \\
      6  7  8`);
    const courseChoices = [
      { label: "1 Right", value: "1" },
      { label: "2 Up-right", value: "2" },
      { label: "3 Up", value: "3" },
      { label: "4 Up-left", value: "4" },
      { label: "5 Left", value: "5" },
      { label: "6 Down-left", value: "6" },
      { label: "7 Down", value: "7" },
      { label: "8 Down-right", value: "8" }
    ];
    this.ask("COURSE (1-9)?", (courseInput) => {
      let course = Number(courseInput);
      if (!Number.isFinite(course) || course < 1 || course >= 9) {
        this.line("LT. SULU REPORTS, 'INCORRECT COURSE DATA, SIR!'", "yellow");
        this.setPrompt("COMMAND?");
        return;
      }
      const maxWarp = this.damage[0] < 0 ? 0.2 : 8;
      const warpChoices = (maxWarp <= 0.2
        ? [{ label: "Warp 0.2", value: "0.2" }]
        : [
          { label: "Warp 0.5", value: "0.5" },
          { label: "Warp 1", value: "1", primary: true },
          { label: "Warp 2", value: "2" },
          { label: "Warp 4", value: "4" },
          { label: "Warp 8", value: "8" }
        ]);
      warpChoices.push({ label: "Cancel", value: "0" });
      this.ask(`WARP FACTOR (0-${maxWarp})?`, (warpInput) => {
        const warp = Number(warpInput);
        if (!Number.isFinite(warp)) {
          this.line("Please enter a number.", "yellow");
        } else if (warp === 0) {
          this.line("<NAVIGATION CANCELLED>");
        } else if (this.damage[0] < 0 && warp > 0.2) {
          this.line("WARP ENGINES ARE DAMAGED. MAXIMUM SPEED = WARP 0.2", "yellow");
        } else if (warp < 0 || warp > 8) {
          this.line(`CHIEF ENGINEER SCOTT REPORTS 'THE ENGINES WON'T TAKE WARP ${warp} !'`, "red");
        } else {
          this.courseControl(course, warp);
        }
        if (!this.gameOver) this.setPrompt("COMMAND?");
      }, warpChoices, "Warp 1 crosses roughly one quadrant; smaller values are safer for local movement.");
    }, courseChoices, "Choose a direction. Decimal courses can still be typed manually.");
  }

  courseControl(course, warp) {
    this.warpFactor = warp;
    this.noOfSteps = Math.floor(warp * 8 + 0.5);
    if (this.energy < this.noOfSteps) {
      this.line(`ENGINEERING REPORTS   'INSUFFICIENT ENERGY AVAILABLE`, "yellow");
      this.line(`                       FOR MANEUVERING AT WARP ${warp} !'`, "yellow");
      if (this.shields >= this.noOfSteps - this.energy && this.damage[6] >= 0) {
        this.line(`DEFLECTOR CONTROL ROOM ACKNOWLEDGES ${this.shields} UNITS OF ENERGY`);
        this.line("                         PRESENTLY DEPLOYED TO SHIELDS.");
      }
      return;
    }

    for (let i = 0; i < this.k3; i += 1) {
      if (this.klingons[i][2] > 0) {
        this.addObject("   ", this.klingons[i][0], this.klingons[i][1]);
        const [r, c] = this.findEmpty();
        this.klingons[i][0] = r;
        this.klingons[i][1] = c;
        this.addObject("+K+", r, c);
      }
    }

    for (let i = 0; i < this.r3; i += 1) {
      if (this.romulans[i][2] > 0) {
        this.addObject("   ", this.romulans[i][0], this.romulans[i][1]);
        const [r, c] = this.findEmpty();
        this.romulans[i][0] = r;
        this.romulans[i][1] = c;
        this.addObject(" R ", r, c);
      }
    }

    if (this.enemiesAttack()) return;

    const repairFactor = warp >= 1 ? 1 : warp;
    this.damage = this.damage.map((value, index) => {
      let next = value;
      if (next < 0) {
        next += repairFactor;
        if (next > -0.1 && next < 0) next = -0.1;
        else if (next >= 0) this.line(`DAMAGE CONTROL REPORT: '${this.deviceNames[index]}' REPAIR COMPLETED.`, "green");
      }
      return next;
    });

    if (Math.random() <= 0.2) {
      const index = this.fnr() - 1;
      if (Math.random() >= 0.6) {
        this.damage[index] += Math.random() * 3 + 1;
        this.line(`DAMAGE CONTROL REPORT: '${this.deviceNames[index]}' STATE OF REPAIR IMPROVED.`, "yellow");
      } else {
        this.damage[index] -= Math.random() * 5 + 1;
        this.setScene("damaged");
        this.line(`DAMAGE CONTROL REPORT: '${this.deviceNames[index]}' DAMAGED.`, "red");
      }
    }

    this.addObject("   ", Math.floor(this.s1), Math.floor(this.s2));
    const cindex = Math.floor(course) - 1;
    const stepY = this.courseDelta[cindex][0] + (this.courseDelta[cindex + 1][0] - this.courseDelta[cindex][0]) * (course - Math.floor(course));
    const stepX = this.courseDelta[cindex][1] + (this.courseDelta[cindex + 1][1] - this.courseDelta[cindex][1]) * (course - Math.floor(course));
    let x = this.s1;
    let y = this.s2;
    this.q4 = this.q1;
    this.q5 = this.q2;

    for (let i = 0; i < this.noOfSteps; i += 1) {
      this.s1 += stepY;
      this.s2 += stepX;
      if (this.s1 < 1 || this.s1 > 8 || this.s2 < 1 || this.s2 > 8) {
        x = this.s1;
        y = this.s2;
        if (this.exceededQuadrantLimits(x, y)) {
          if (!this.gameOver) this.enterQuadrant(false);
          return;
        }
        this.s1 = x;
        this.s2 = y;
        break;
      }
      if (!this.hasObject("   ", this.s1, this.s2)) {
        this.s1 = Math.floor(this.s1 - stepY + 0.5);
        this.s2 = Math.floor(this.s2 - stepX + 0.5);
        this.line("WARP ENGINES SHUT DOWN AT", "yellow");
        this.line(`SECTOR ${this.s1} , ${this.s2} DUE TO BAD NAVIGATION.`, "yellow");
        break;
      }
    }

    this.s1 = Math.floor(this.s1 + 0.5);
    this.s2 = Math.floor(this.s2 + 0.5);
    this.endMovementInQuadrant();
  }

  exceededQuadrantLimits(x, y) {
    let gx = 8 * (this.q4 - 1) + x;
    let gy = 8 * (this.q5 - 1) + y;
    this.q1 = Math.floor(gx / 8) + 1;
    this.q2 = Math.floor(gy / 8) + 1;
    this.s1 = Math.floor(gx - (this.q1 - 1) * 8);
    this.s2 = Math.floor(gy - (this.q2 - 1) * 8);
    if (this.s1 === 0) {
      this.q1 -= 1;
      this.s1 = 8;
    }
    if (this.s2 === 0) {
      this.q2 -= 1;
      this.s2 = 8;
    }

    let crossed = false;
    if (this.q1 < 1) {
      crossed = true;
      this.q1 = 1;
      this.s1 = 1;
    }
    if (this.q1 > 8) {
      crossed = true;
      this.q1 = 8;
      this.s1 = 8;
    }
    if (this.q2 < 1) {
      crossed = true;
      this.q2 = 1;
      this.s2 = 1;
    }
    if (this.q2 > 8) {
      crossed = true;
      this.q2 = 8;
      this.s2 = 8;
    }
    if (crossed) {
      this.line("LT. UHURA REPORTS MESSAGE FROM STARFLEET COMMAND:", "yellow");
      this.line("  'PERMISSION TO ATTEMPT CROSSING OF GALACTIC PERIMETER", "yellow");
      this.line("  IS HEREBY *DENIED*. SHUT DOWN YOUR ENGINES.'", "yellow");
      this.line("CHIEF ENGINEER SCOTT REPORTS  'WARP ENGINES SHUT DOWN");
      this.line(`  AT SECTOR ${this.s1} , ${this.s2} OF QUADRANT ${this.q1} , ${this.q2}'`);
    }

    if (this.q1 === this.q4 && this.q2 === this.q5) return false;
    this.stardate += 1;
    if (this.stardate > this.t0 + this.maxDays) {
      this.timeExpired();
      return true;
    }
    this.consumeEnergy();
    return true;
  }

  endMovementInQuadrant() {
    this.addObject("<*>", Math.floor(this.s1), Math.floor(this.s2));
    this.consumeEnergy();
    const increment = this.warpFactor < 1 ? this.round(this.warpFactor, 1) : 1;
    this.stardate += increment;
    if (this.stardate > this.t0 + this.maxDays) {
      this.timeExpired();
      return;
    }
    this.checkDocked();
    this.renderGrid();
    this.shortRangeScan();
  }

  consumeEnergy() {
    this.energy -= this.noOfSteps;
    if (this.energy >= 0) return;
    this.line("SHIELD CONTROL SUPPLIES ENERGY TO COMPLETE THE MANEUVER.", "yellow");
    this.shields += this.energy;
    this.energy = 0;
    if (this.shields < 0) this.shields = 0;
  }

  enemiesAttack() {
    if (this.klingonsAttack()) return true;
    return this.romulansAttack();
  }

  klingonsAttack() {
    if (this.k3 <= 0) return false;
    if (!this.shipDocked) {
      this.playSound("alert");
      this.line("KLINGON SHIPS ATTACK THE ENTERPRISE", "red");
    }
    if (this.shipDocked) {
      this.line("STARBASE SHIELDS PROTECT THE ENTERPRISE.", "green");
      return false;
    }
    for (let i = 0; i < 3; i += 1) {
      const energy = this.klingons[i][2];
      if (energy > 0) {
        const dist = this.distance(this.klingons[i][0], this.klingons[i][1], this.s1, this.s2);
        const hits = Math.floor((energy / dist) * (2 + Math.random())) + 1;
        this.shields -= hits;
        this.klingons[i][2] = energy / (3 + Math.random());
        this.drawBeam(this.klingons[i][0], this.klingons[i][1], this.s1, this.s2, "enemy-beam");
        this.flashSector(this.s1, this.s2, "shield-flash");
        this.screenShake();
        this.line(`${hits} UNIT HIT ON ENTERPRISE FROM SECTOR ${this.klingons[i][0]},${this.klingons[i][1]}`, "red");
        if (this.shields < 0) {
          this.enterpriseDestroyed();
          return true;
        }
        if (this.shields <= 200) this.setScene("damaged");
        this.line(`      <SHIELDS DOWN TO ${this.round(this.shields, 1)} UNITS>`, "yellow");
        if (hits > 19 && (this.shields === 0 || (Math.random() < 0.6 && hits / this.shields > 0.02))) {
          const system = this.fnr() - 1;
          this.damage[system] -= hits / Math.max(this.shields, 1) + 0.5 * Math.random();
          this.setScene("damaged");
          this.line(`DAMAGE CONTROL REPORTS '${this.deviceNames[system]}' DAMAGED BY THE HIT'`, "red");
        }
      }
    }
    return false;
  }

  romulansAttack() {
    if (this.r3 <= 0) return false;
    if (!this.shipDocked) {
      this.playSound("alert");
      this.line("ROMULAN SHIPS DECLOAK AND ATTACK", "red");
    }
    if (this.shipDocked) {
      this.line("STARBASE SHIELDS PROTECT THE ENTERPRISE.", "green");
      return false;
    }
    for (let i = 0; i < 2; i += 1) {
      const energy = this.romulans[i][2];
      if (energy > 0) {
        const dist = this.distance(this.romulans[i][0], this.romulans[i][1], this.s1, this.s2);
        const hits = Math.floor((energy / Math.max(dist, 0.5)) * (1.2 + Math.random() * 2.2)) + 1;
        this.shields -= hits;
        this.romulans[i][2] = energy / (2.5 + Math.random());
        this.drawBeam(this.romulans[i][0], this.romulans[i][1], this.s1, this.s2, "enemy-beam");
        this.flashSector(this.s1, this.s2, "shield-flash");
        this.screenShake();
        this.line(`${hits} UNIT HIT ON ENTERPRISE FROM ROMULAN AT SECTOR ${this.romulans[i][0]},${this.romulans[i][1]}`, "red");
        if (this.shields < 0) {
          this.enterpriseDestroyed();
          return true;
        }
        if (this.shields <= 200) this.setScene("damaged");
        this.line(`      <SHIELDS DOWN TO ${this.round(this.shields, 1)} UNITS>`, "yellow");
      }
    }
    return false;
  }

  phaserPrompt() {
    if (this.damage[3] < 0) {
      this.line("PHASERS INOPERATIVE", "red");
      return;
    }
    if (this.currentHostiles() < 1) {
      this.line("SCIENCE OFFICER SPOCK REPORTS  'SENSORS SHOW NO ENEMY SHIPS");
      this.line("                                IN THIS QUADRANT'");
      return;
    }
    if (this.damage[7] < 0) this.line("COMPUTER FAILURE HAMPERS ACCURACY", "yellow");
    this.setScene("phaser");
    this.line("PHASERS LOCKED ON TARGET;");
    this.line(`ENERGY AVAILABLE = ${Math.floor(this.energy)} UNITS`);
    const third = Math.max(1, Math.floor(this.energy / 3));
    const half = Math.max(1, Math.floor(this.energy / 2));
    const choices = [
      { label: `${third} units`, value: String(third), primary: true },
      { label: `${half} units`, value: String(half) },
      { label: "All available", value: String(Math.floor(this.energy)) },
      { label: "Cancel", value: "0" }
    ];
    this.ask("NUMBER OF UNITS TO FIRE?", (input) => {
      const units = Number(input);
      if (!Number.isFinite(units) || units < 0) {
        this.line("Invalid input.", "yellow");
      } else if (units === 0) {
        this.line("<PHASERS CANCELLED>");
      } else if (units > this.energy) {
        this.line("INSUFFICIENT ENERGY.", "yellow");
      } else {
        this.firePhasers(units);
      }
      if (!this.gameOver) this.setPrompt("COMMAND?");
    }, choices, "Phaser energy is split across visible hostiles and weakens with distance.");
  }

  firePhasers(inputUnits) {
    this.playSound("phaser");
    this.playSound("phaser", 0.09);
    this.playSound("phaser", 0.18);
    let units = inputUnits;
    this.energy -= units;
    if (this.damage[7] < 0) units *= Math.random();
    const targets = [
      ...this.klingons.map((ship, index) => ({ type: "KLINGON", index, ship })),
      ...this.romulans.map((ship, index) => ({ type: "ROMULAN", index, ship }))
    ].filter((target) => target.ship[2] > 0);
    targets.forEach((target, index) => {
      setTimeout(() => {
        this.drawBeam(this.s1, this.s2, target.ship[0], target.ship[1], "phaser");
        this.flashSector(target.ship[0], target.ship[1], "hit-flash");
      }, index * 120);
    });
    const perTarget = Math.floor(units / Math.max(targets.length, 1));
    targets.forEach((target) => {
      const energy = target.ship[2];
      if (energy > 0) {
        const dist = this.distance(target.ship[0], target.ship[1], this.s1, this.s2);
        const hitPoints = Math.floor((perTarget / dist) * (Math.random() + 2));
        if (hitPoints <= 0.15 * energy) {
          this.line(`SENSORS SHOW NO DAMAGE TO ${target.type} AT ${target.ship[0]},${target.ship[1]}`);
        } else {
          target.ship[2] -= hitPoints;
          this.line(`${hitPoints} UNITS HIT ON ${target.type} AT SECTOR ${target.ship[0]},${target.ship[1]}`, "yellow");
          if (target.ship[2] > 0) {
            this.line(`   (SENSORS SHOW ${Math.floor(target.ship[2])} UNITS REMAINING)`, "yellow");
          } else if (target.type === "KLINGON") {
            this.destroyKlingonAt(target.index);
          } else {
            this.destroyRomulanAt(target.index);
          }
        }
      }
    });
    if (!this.gameOver) this.enemiesAttack();
  }

  destroyKlingonAt(index) {
    this.line("*** KLINGON DESTROYED ***", "red");
    this.k3 -= 1;
    this.totalKlingons -= 1;
    this.addObject("   ", this.klingons[index][0], this.klingons[index][1]);
    this.klingons[index][2] = 0;
    this.galaxy[this.q1 - 1][this.q2 - 1] = this.k3 * 100 + this.b3 * 10 + this.s3;
    this.explored[this.q1 - 1][this.q2 - 1] = this.galaxy[this.q1 - 1][this.q2 - 1];
    this.shipCondition = this.checkStatus();
    this.renderGrid();
    this.updateAlertState();
    if (this.currentHostiles() <= 0) this.celebrateSectorClear();
    if (this.totalHostiles() <= 0) this.enemiesDefeated();
  }

  destroyRomulanAt(index) {
    this.line("*** ROMULAN DESTROYED ***", "red");
    this.r3 -= 1;
    this.totalRomulans -= 1;
    this.addObject("   ", this.romulans[index][0], this.romulans[index][1]);
    this.romulans[index][2] = 0;
    this.romulanGalaxy[this.q1 - 1][this.q2 - 1] = this.r3;
    this.shipCondition = this.checkStatus();
    this.renderGrid();
    this.updateAlertState();
    if (this.currentHostiles() <= 0) this.celebrateSectorClear();
    if (this.totalHostiles() <= 0) this.enemiesDefeated();
  }

  torpedoPrompt() {
    if (this.torpedoes <= 0) {
      this.line("ALL PHOTON TORPEDOES EXPENDED.", "yellow");
      return;
    }
    if (this.damage[4] < 0) {
      this.line("PHOTON TUBES ARE NOT OPERATIONAL.", "red");
      return;
    }
    const choices = [
      { label: "1 Right", value: "1" },
      { label: "2 Up-right", value: "2" },
      { label: "3 Up", value: "3", primary: true },
      { label: "4 Up-left", value: "4" },
      { label: "5 Left", value: "5" },
      { label: "6 Down-left", value: "6" },
      { label: "7 Down", value: "7" },
      { label: "8 Down-right", value: "8" }
    ];
    this.ask("PHOTON TORPEDO COURSE (1-9)?", (input) => {
      let course = Number(input);
      if (!Number.isFinite(course)) {
        this.line("ENSIGN CHEKOV REPORTS, 'INCORRECT COURSE DATA, SIR!'", "yellow");
      } else {
        if (course === 9) course = 1;
        if (course < 1 || course > 9) this.line("ENSIGN CHEKOV REPORTS, 'INCORRECT COURSE DATA, SIR!'", "yellow");
        else this.fireTorpedo(course);
      }
      if (!this.gameOver) this.setPrompt("COMMAND?");
    }, choices, "Use COM option 2 or POS to calculate enemy direction first.");
  }

  fireTorpedo(course) {
    this.playSound("torpedo");
    this.setScene("torpedo");
    this.energy -= 2;
    this.torpedoes -= 1;
    const cindex = Math.floor(course) - 1;
    const stepY = this.courseDelta[cindex][0] + (this.courseDelta[cindex + 1][0] - this.courseDelta[cindex][0]) * (course - Math.floor(course));
    const stepX = this.courseDelta[cindex][1] + (this.courseDelta[cindex + 1][1] - this.courseDelta[cindex][1]) * (course - Math.floor(course));
    let x = this.s1;
    let y = this.s2;
    let stepCount = 0;
    const torpedoPath = [];
    this.line("TORPEDO TRACK:");

    while (true) {
      x += stepY;
      y += stepX;
      stepCount += 1;
      const xr = Math.floor(x + 0.5);
      const yr = Math.floor(y + 0.5);
      if (xr < 1 || xr > 8 || yr < 1 || yr > 8) {
        this.playSound("torpedoMiss", stepCount * 0.12);
        this.animateTorpedo(torpedoPath);
        this.line("TORPEDO MISSED!");
        break;
      }
      torpedoPath.push([xr, yr]);
      this.playSound("torpedoStep", stepCount * 0.12);
      this.line(`               ${xr} , ${yr}`);
      if (this.hasObject("   ", x, y)) continue;
      if (this.hasObject("+K+", x, y)) {
        this.playSound("torpedoHit", stepCount * 0.12 + 0.05);
        this.animateTorpedo(torpedoPath);
        const index = this.klingons.findIndex((k) => xr === k[0] && yr === k[1] && k[2] > 0);
        if (index >= 0) this.destroyKlingonAt(index);
        break;
      }
      if (this.hasObject(" R ", x, y)) {
        this.playSound("torpedoHit", stepCount * 0.12 + 0.05);
        this.animateTorpedo(torpedoPath);
        const index = this.romulans.findIndex((r) => xr === r[0] && yr === r[1] && r[2] > 0);
        if (index >= 0) this.destroyRomulanAt(index);
        break;
      }
      if (this.hasObject(" * ", x, y)) {
        this.playSound("torpedoHit", stepCount * 0.12 + 0.05);
        this.animateTorpedo(torpedoPath);
        this.line(`STAR AT ${xr},${yr} ABSORBED TORPEDO ENERGY.`, "yellow");
        break;
      }
      if (this.hasObject(">!<", x, y)) {
        this.playSound("torpedoHit", stepCount * 0.12 + 0.05);
        this.animateTorpedo(torpedoPath);
        this.line("*** STARBASE DESTROYED ***", "red");
        this.b3 -= 1;
        this.totalStarbases -= 1;
        if (this.totalStarbases > 0 || this.totalHostiles() > this.stardate - this.t0 - this.maxDays) {
          this.line("STARFLEET COMMAND REVIEWING YOUR RECORD TO CONSIDER", "red");
          this.line("COURT MARTIAL!", "red");
          this.shipDocked = false;
          this.addObject("   ", x, y);
          this.galaxy[this.q1 - 1][this.q2 - 1] = this.k3 * 100 + this.b3 * 10 + this.s3;
          this.explored[this.q1 - 1][this.q2 - 1] = this.galaxy[this.q1 - 1][this.q2 - 1];
          this.renderGrid();
        } else {
          this.line("THAT DOES IT, CAPTAIN!! YOU ARE HEREBY RELIEVED OF COMMAND", "red");
          this.line("AND SENTENCED TO 99 STARDATES AT HARD LABOR ON CYGNUS 12!!", "red");
          this.endGame();
        }
        break;
      }
      this.line("An unknown object has been hit");
      this.animateTorpedo(torpedoPath);
      break;
    }
    if (!this.gameOver) this.enemiesAttack();
  }

  animateTorpedo(path) {
    if (!path.length) return;
    path.forEach((position, index) => {
      setTimeout(() => {
        this.torpedoMarker = position;
        this.torpedoSpark(position[0], position[1]);
        this.renderGrid();
      }, index * 140);
    });
    setTimeout(() => {
      const last = path[path.length - 1];
      this.impactBurst(last[0], last[1]);
      this.flashSector(last[0], last[1], "hit-flash");
      this.screenShake();
      this.torpedoMarker = null;
      this.renderGrid();
    }, path.length * 140 + 120);
  }

  shieldPrompt() {
    if (this.damage[6] < 0) {
      this.line("SHIELD CONTROL INOPERABLE", "red");
      return;
    }
    this.line(`ENERGY AVAILABLE = ${Math.floor(this.energy + this.shields)}`);
    const available = Math.floor(this.energy + this.shields);
    const choices = [
      { label: "Drop shields", value: "0" },
      { label: "500 units", value: "500", primary: true },
      { label: "1000 units", value: "1000" },
      { label: "Half energy", value: String(Math.floor(available / 2)) },
      { label: "Max shields", value: String(available) }
    ].filter((choice) => Number(choice.value) <= available);
    this.ask("NUMBER OF UNITS TO SHIELDS?", (input) => {
      const units = Number(input);
      if (!Number.isFinite(units)) this.line("WRONG VALUE", "yellow");
      else if (units < 0 || units === this.shields) this.line("<SHIELDS UNCHANGED>");
      else if (units > this.energy + this.shields) {
        this.line("SHIELD CONTROL REPORTS 'THIS IS NOT THE FEDERATION TREASURY.'", "yellow");
        this.line("<SHIELDS UNCHANGED>");
      } else {
        this.energy = this.energy + this.shields - units;
        this.shields = units;
        this.line("DEFLECTOR CONTROL ROOM REPORT:");
        this.line(`  'SHIELDS NOW AT ${this.shields} UNITS PER YOUR COMMAND.'`, "green");
      }
      this.setPrompt("COMMAND?");
    }, choices, "Shields absorb incoming fire but reduce maneuvering and phaser energy.");
  }

  computerPrompt() {
    if (this.damage[7] < 0) {
      this.line("COMPUTER DISABLED", "red");
      return;
    }
    this.setScene("computer");
    const choices = [
      { label: "0 Record", value: "0" },
      { label: "1 Status", value: "1", primary: true },
      { label: "2 Torpedo Data", value: "2" },
      { label: "3 Starbase Nav", value: "3" },
      { label: "4 D/D Calc", value: "4" },
      { label: "5 Region Map", value: "5" }
    ];
    this.ask("COMPUTER ACTIVE AND AWAITING COMMAND?", (input) => {
      this.runComputerOption(input);
      if (!this.pending) this.setPrompt("COMMAND?");
    }, choices, "Choose a library-computer function.");
  }

  runComputerOption(input) {
    if (this.gameOver) return;
    if (this.damage[7] < 0) {
      this.line("COMPUTER DISABLED", "red");
      return;
    }
    this.setScene("computer");
    const option = Number(input);
    if (option === 0) this.cumulativeRecord();
    else if (option === 1) this.statusReport();
    else if (option === 2) this.torpedoData();
    else if (option === 3) this.starbaseNavData();
    else if (option === 4) this.distanceCalculatorPrompt();
    else if (option === 5) this.galaxyMap();
    else {
      this.raw(`FUNCTIONS AVAILABLE FROM LIBRARY-COMPUTER:
   0 = CUMULATIVE GALACTIC RECORD
   1 = STATUS REPORT
   2 = PHOTON TORPEDO DATA
   3 = STARBASE NAV DATA
   4 = DIRECTION/DISTANCE CALCULATOR
   5 = GALAXY 'REGION NAME' MAP`);
    }
  }

  distanceCalculatorPrompt() {
    this.line("DIRECTION/DISTANCE CALCULATOR:");
    this.line(`YOU ARE AT QUADRANT ${this.q1},${this.q2} SECTOR ${this.s1},${this.s2}`);
    this.ask("PLEASE ENTER INITIAL COORDINATES (row,col):", (first) => {
      this.ask("FINAL COORDINATES (row,col):", (second) => {
        const a = first.match(/(\d+)\s*,\s*(\d+)/);
        const b = second.match(/(\d+)\s*,\s*(\d+)/);
        if (!a || !b) this.line("WRONG COORDINATES", "yellow");
        else this.directionAndDistance(Number(b[1]), Number(b[2]), Number(a[1]), Number(a[2]));
        this.setPrompt("COMMAND?");
      });
    });
  }

  enterpriseDestroyed() {
    this.playSound("lose");
    this.setScene("failed");
    this.line("THE ENTERPRISE HAS BEEN DESTROYED. THE FEDERATION WILL BE CONQUERED.", "red");
    this.endGame(true, "Enterprise destroyed");
  }

  enemiesDefeated() {
    this.playSound("win");
    this.setScene("victory");
    this.line("CONGRATULATIONS, CAPTAIN! THE LAST HOSTILE VESSEL", "green");
    this.line(`MENACING THE FEDERATION HAS BEEN DESTROYED IN STARDATE ${this.round(this.stardate, 1)}`, "green");
    const rating = Math.floor(1000 * ((this.initialKlingons + this.initialRomulans) / (this.stardate - this.t0)) ** 2);
    this.line(`YOUR EFFICIENCY RATING IS ${rating}`, "yellow");
    this.endGame(false, "Victory");
  }

  timeExpired() {
    this.playSound("lose");
    this.setScene("failed");
    this.line("IT'S TOO LATE, CAPTAIN! THE FEDERATION HAS BEEN CONQUERED.", "red");
    this.endGame(true, "Time expired");
  }

  endGame(showRemaining = true, title = "Mission ended") {
    this.gameOver = true;
    this.pending = null;
    this.clearChoices();
    this.setRedAlert(false);
    this.setHint("The mission has ended. Start a new game to play again.");
    if (showRemaining && this.totalHostiles() > 0) {
      this.line();
      this.line(`THERE WERE ${this.totalKlingons} KLINGONS AND ${this.totalRomulans} ROMULANS LEFT AT`);
      this.line(`THE END OF YOUR MISSION, IN STARDATE ${this.round(this.stardate, 1)}`);
    }
    this.line("Thank you for playing this game!");
    if (this.ui.endBanner) this.ui.endBanner.hidden = false;
    if (this.ui.endTitle) this.ui.endTitle.textContent = title;
    this.setPrompt("GAME OVER");
  }

  updateStatus() {
    if (!this.ui.status) return;
    const rows = [
      ["Stardate", this.round(this.stardate || 0, 1)],
      ["Condition", this.shipCondition || ""],
      ["Quadrant", `${this.q1 || "-"}, ${this.q2 || "-"}`],
      ["Sector", `${this.s1 || "-"}, ${this.s2 || "-"}`],
      ["Energy", Math.floor((this.energy || 0) + (this.shields || 0))],
      ["Shields", Math.floor(this.shields || 0)],
      ["Torpedoes", Math.floor(this.torpedoes || 0)],
      ["Klingons", Math.floor(this.totalKlingons || 0)],
      ["Romulans", Math.floor(this.totalRomulans || 0)],
      ["Starbases", Math.floor(this.totalStarbases || 0)]
    ];
    this.ui.status.innerHTML = rows.map(([key, value]) => `<dt>${key}</dt><dd>${value}</dd>`).join("");
  }
}

const ui = {
  app: document.getElementById("app"),
  quip: document.getElementById("quipText"),
  terminal: document.getElementById("terminal"),
  startScreen: document.getElementById("startScreen"),
  startGame: document.getElementById("startGameBtn"),
  sceneImage: document.getElementById("sceneImage"),
  grid: document.getElementById("sectorGrid"),
  effects: document.getElementById("effectsLayer"),
  sectorCaption: document.getElementById("sectorCaption"),
  prompt: document.getElementById("promptLabel"),
  input: document.getElementById("commandInput"),
  form: document.getElementById("commandForm"),
  status: document.getElementById("statusPanel"),
  choicePanel: document.getElementById("choicePanel"),
  actionHint: document.getElementById("actionHint"),
  difficulty: document.getElementById("difficultySelect"),
  sound: document.getElementById("soundBtn"),
  options: document.getElementById("optionsBtn"),
  optionsDialog: document.getElementById("optionsDialog"),
  closeOptions: document.getElementById("closeOptionsBtn"),
  help: document.getElementById("helpBtn"),
  helpDialog: document.getElementById("helpDialog"),
  closeHelp: document.getElementById("closeHelpBtn"),
  endBanner: document.getElementById("endBanner"),
  endTitle: document.getElementById("endTitle"),
  newGame: document.getElementById("newGameBtn"),
  endNewGame: document.getElementById("endNewGameBtn")
};

let game = null;

function beginGame() {
  if (game) return;
  if (ui.startScreen) ui.startScreen.hidden = true;
  game = new SuperStarTrek(ui);
  ui.input?.focus();
}

ui.startScreen?.addEventListener("click", beginGame);

ui.startScreen?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  beginGame();
});

ui.startGame?.addEventListener("click", (event) => {
  event.stopPropagation();
  beginGame();
});

ui.form.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!game) return;
  const value = ui.input.value;
  ui.input.value = "";
  game.handleInput(value);
});

ui.newGame.addEventListener("click", () => {
  game = new SuperStarTrek(ui);
  if (ui.optionsDialog?.open) ui.optionsDialog.close();
});

ui.endNewGame.addEventListener("click", () => {
  game = new SuperStarTrek(ui);
});

ui.difficulty.addEventListener("change", () => {
  if (game) game = new SuperStarTrek(ui);
});

ui.sound.addEventListener("click", () => {
  if (!game) return;
  game.soundEnabled = !game.soundEnabled;
  ui.sound.textContent = game.soundEnabled ? "Sound on" : "Sound off";
  ui.sound.setAttribute("aria-pressed", String(game.soundEnabled));
  if (game.soundEnabled) game.ensureAudio();
  game.playSound("command");
});

ui.options.addEventListener("click", () => {
  if (typeof ui.optionsDialog.showModal === "function") ui.optionsDialog.showModal();
  else ui.optionsDialog.setAttribute("open", "open");
});

ui.closeOptions.addEventListener("click", () => {
  ui.optionsDialog.close();
});

ui.help.addEventListener("click", () => {
  if (ui.optionsDialog?.open) ui.optionsDialog.close();
  if (typeof ui.helpDialog.showModal === "function") ui.helpDialog.showModal();
  else ui.helpDialog.setAttribute("open", "open");
});

ui.closeHelp.addEventListener("click", () => {
  ui.helpDialog.close();
});

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!game) return;
    ui.input.value = button.dataset.command;
    ui.form.requestSubmit();
  });
});

document.querySelectorAll("[data-computer]").forEach((button) => {
  button.addEventListener("click", () => {
    if (!game) return;
    if (game.pending && ui.prompt.textContent.startsWith("COMPUTER")) {
      game.submitChoice(button.dataset.computer);
      return;
    }
    if (game.pending) {
      game.setHint("Finish the current prompt before using the computer shortcuts.");
      return;
    }
    game.line(`COMPUTER SHORTCUT ${button.dataset.computer}`, "command");
    game.runComputerOption(button.dataset.computer);
    if (!game.pending && !game.gameOver) game.setPrompt("COMMAND?");
  });
});
