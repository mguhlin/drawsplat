# SplatBot Device Bridge

This document defines the first open architecture target for SplatBot connected-device work. The current app only includes virtual devices, but the command shape is designed so it can later route to WebSocket, MQTT, Web Serial, or Web Bluetooth bridges.

## Goals

- Keep grades 2-8 commands readable.
- Keep real device access optional and teacher-controlled.
- Use small, inspectable messages instead of vendor-specific robot APIs.
- Make every real device integration mirror a virtual device first.

## Current Virtual Devices

### Signal Light

Student commands:

- Block: `set signal light on`
- Block: `set signal light off`
- Words: `light on`
- Words: `light off`

Internal command:

```json
{ "action": "light", "value": true }
```

### Message Log

Student commands:

- Block: `send message hello`
- Words: `send hello`

Internal command:

```json
{ "action": "send", "text": "hello" }
```

### Sound

Student commands:

- Block: `play beep`
- Block: `play song success`
- Words: `play beep`
- Words: `play low beep`
- Words: `play high beep`
- Words: `play song scale`
- Words: `play song success`
- Words: `play song alert`

Internal commands:

```json
{ "action": "sound", "sound": "beep" }
```

```json
{ "action": "song", "song": "success" }
```

## Bridge Message Envelope

When SplatBot connects to an external bridge later, runtime commands should be wrapped in this envelope:

```json
{
  "source": "splatbot",
  "version": 1,
  "projectId": "local-browser-project",
  "missionId": "first-drive",
  "command": { "action": "light", "value": true }
}
```

Incoming device events should use this shape:

```json
{
  "source": "device-bridge",
  "version": 1,
  "deviceId": "button-1",
  "event": "pressed",
  "value": true
}
```

## Proposed Transports

### WebSocket

Best first target for classroom demos and local microcontroller gateways.

- Default URL: teacher-provided local bridge URL
- Direction: browser to bridge and bridge to browser
- Good for: Raspberry Pi gateway, local Node server, classroom LAN demos

### MQTT

Best for IoT concept lessons once students are older.

- Browser should connect only through a teacher-approved broker
- Topics should be classroom-scoped
- Good for: publish/subscribe lessons, dashboards, simulated smart spaces

### Web Serial

Best for advanced local device experiments.

- Requires browser permission each session
- Should remain off by default
- Good for: microcontroller serial gateways, USB classroom kits

## Safety Rules

- No external network endpoints should be hardcoded into student projects.
- Teachers should approve bridge URLs.
- Device messages should be text/JSON only.
- Runtime should cap message length and command rate.
- Virtual devices should always be available when real devices are blocked.

## Next Implementation Step

Add a teacher-only bridge settings panel with:

- Bridge enabled toggle
- Transport selector
- Local URL/broker field
- Test connection button
- Message monitor
- Reset bridge button
