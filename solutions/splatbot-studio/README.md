# SplatBot Studio

SplatBot Studio is a DrawSplat widget for students who need the learning value of classroom robots without the cost, storage, maintenance, or device-management burden of physical kits.

It is designed as a DrawSplat/SplatWorks-style static-first classroom tool: students program an on-screen robot with Scratch-style blocks or plain-language commands, run missions, save or export their work, and see movement, turns, simple sensors, obstacles, and goals in the browser.

## Run it

From `drawsplat_github/solutions/splatbot-studio`, open `index.html` in a browser, or serve the folder locally:

```bash
python3 -m http.server 4179
```

Then visit `http://127.0.0.1:4179`. In the DrawSplat site, the widget launches from `/solutions/splatbot-studio/`.

Blockly is vendored in `vendor/blockly.min.js`, with Blockly media assets in `vendor/blockly-media/`, so the app does not need a CDN at runtime.

Run the core tests with:

```bash
npm test
```

## Current Features

- DrawSplat-aligned visual palette with SplatBot branding
- Blockly drive, turn, repeat, condition, and sensor blocks
- Plain-language command mode for younger students and quick prototyping
- Sixteen starter missions total, spanning grades 2-8 with one grades 9-12-ready path-planning challenge
- Mission completion feedback
- Local browser save
- JSON export and import for project handoff
- Teacher notes, concepts, and vocabulary for each mission
- Mobile-responsive simulator and block workspace
- Vendored Blockly bundle for offline/static hosting
- Small Node test harness for command parsing and robot movement rules
- Virtual connected-device lab with a signal light and message log
- Offline sound device with simple beeps and short generated songs
- First device bridge design documented in `docs/device-bridge.md`
- JSON mission packs loaded from `missions/starter-pack.json`
- Teacher mission builder with local custom mission-pack persistence
- Student and teacher interface modes
- Thinking Lab with four computational-thinking poster concepts and 40 activities
- Original story campaign, The Signal Garden, with eight virtual robotics chapters
- Eight rewritten quest challenges inspired by physical robot tasks but rebuilt for screen-only SplatBot control
- Standards selector for TEKS, NGSS, or Common Core alignment labels
- No-AI, K-12-friendly “vibe coding” lab flow: describe, demonstrate, block, test, revise, and share
- Ghost recorder, program QR/share code, fuzzy movement, challenge constraints, and phone-sensor input experiments
- Story splash page introducing The Signal Garden before students enter the lab
- Code portability exports for Python, JavaScript, micro:bit MicroPython, Dash Robot Python, LEGO SPIKE Python, and VEXcode Python
- Basic generated-code import back into SplatLab word commands

## Product Plan

### Phase 0: Working Seed - Done

Goal: prove the core classroom loop.

- Mobile-friendly web interface
- Blockly-based drive, turn, loop, condition, and sensor blocks
- Plain-language command mode for early readers and quick prototyping
- 2D grid simulator with an on-screen robot, walls, trail, goal, and sensor readouts
- Starter missions for grades 2-8

### Phase 1: Classroom Alpha - In Progress

Goal: make SplatBot useful for a single teacher and a small group of students.

- Add 15-25 missions grouped by grade band - started with 16
- Add mission success checks and retry feedback - started
- Save projects to browser storage - done
- Export/import project files as JSON - done
- Add accessibility passes for keyboard use, color contrast, and screen-reader labels
- Vendor Blockly for offline reliability - done
- Add a test suite around command parsing and simulator rules - started
- Add teacher-facing mission notes and vocabulary - done for starter missions

### Phase 2: Curriculum Platform

Goal: support repeat classroom use.

- Mission builder for teachers - started
- Class packs by concept: sequencing, loops, conditionals, debugging, coordinates, sensors
- Student reflection prompts
- Mission pack import/export - done
- Shareable project links
- Optional local accounts or LMS-friendly project files
- Better tablet/touch editing patterns
- Teacher/student interface toggle - started
- Thinking Lab concept pack with Decomposition, Pattern Recognition, Abstraction, and Algorithm Development - started with 10 activities each
- Story-driven mission campaign and quest challenge layer - started with 8 chapters and 8 virtual quests
- Selectable standards alignment readout for TEKS, NGSS, or Common Core - started
- K-12 friendly no-AI coding lab where students shape intent in plain language, convert demonstrations into editable code, and revise through testing - started
- Splash/story entry page for the campaign - started
- Code export/import bridge for common classroom robotics platforms - started with adapter-based templates

### Phase 3: Open Architecture and IoT

Goal: connect virtual robotics to real-world systems without requiring expensive robot kits.

- WebSocket and MQTT bridge patterns
- Virtual smart devices: light, button, temperature sensor, relay, motor, display
- Event blocks for incoming messages
- Data logging and graphing missions
- Safe sandbox for HTTP requests to approved endpoints
- Example integrations with microcontrollers through open protocols
- Seed virtual device commands in place: signal light and message log
- Draft bridge message envelope and safety rules - done

### Phase 4: Advanced Pathway

Goal: extend grades 9-12 without complicating the grades 2-8 experience.

- Toggle between blocks, plain language, and JavaScript/Python-like text
- Coordinate geometry, path planning, and algorithms
- Multi-robot simulations
- Sensors with noise and uncertainty
- API, automation, and IoT security lessons
- Plugin system for community worlds, devices, and challenges

## Technical Direction

The current prototype uses plain HTML, CSS, JavaScript, and Blockly. That keeps the early project easy to inspect, remix, and host on static web services.

Likely next technical step:

- Move to Vite once the prototype needs bundling
- Split mission definitions into JSON files - done
- Expand tests for block serialization, project import/export, and mission validity - mission validity started
- Add a documented device bridge API

## Mission Packs

Mission packs are JSON files with this shape:

```json
{
  "app": "SplatBot",
  "type": "mission-pack",
  "version": 1,
  "title": "My Mission Pack",
  "missions": []
}
```

The app loads `missions/starter-pack.json` by default. Teachers can import/export mission packs from the top toolbar, or add a mission with the Mission Builder in the coach panel.

## License

SplatBot Studio uses AGPL-3.0-or-later to align with DrawSplat's public licensing direction.
