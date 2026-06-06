# Super Star Trek - Browser Edition

A browser-playable version of the classic command-driven **Super Star Trek** game. Open `index.html` in a browser to play.

This port keeps the terminal-style command loop from the Lua-modified version while adding a browser interface, command buttons, and a live status panel. It runs as static HTML, CSS, and JavaScript, so it can be hosted on GitHub Pages or any ordinary static web host.

## Play

Open:

```text
index.html
```

No build step or server is required.

## Mission

You command the USS Enterprise. Your mission is to destroy the Klingon and Romulan warships that have invaded the galaxy before they can attack Federation headquarters.

The galaxy is divided into an 8 by 8 quadrant grid. Each quadrant contains an 8 by 8 sector grid. Your ship, Klingons, Romulans, starbases, and stars occupy sector coordinates inside the current quadrant.

## Commands

| Command | Alias | Purpose |
| --- | --- | --- |
| `NAV` | `Navigation` | Set course and warp factor |
| `SRS` | `Screen` | Short range sensor scan |
| `LRS` | `Sensors` | Long range sensor scan |
| `PHA` | `Phasers` | Fire phasers |
| `TOR` | `Torpedo` | Fire photon torpedoes |
| `SHE` | `Shields` | Raise or lower shields |
| `DAM` | `Damage` | Damage control report |
| `STA` | `Status` | Mission status report |
| `POS` | `Position` | Direction and distance to enemies |
| `COM` | `Computer` | Library computer |
| `MAP` | `Map` | Cumulative galactic record |
| `XXX` | `Exit` | Resign command |

## Symbols

| Symbol | Meaning |
| --- | --- |
| `<*>` | Enterprise |
| `+K+` | Klingon battle cruiser |
| `R` | Romulan vessel |
| `>!<` | Federation starbase |
| `*` | Star |
| `.` | Empty space |

Dock next to a starbase to refuel, repair, and reload photon torpedoes.

## Navigation

Course numbers follow the original circular direction system:

```text
      4  3  2
       \ | /
        \|/
    5 ---*--- 1
        /|\
       / | \
      6  7  8
```

Course `1` moves right. Course `3` moves up. Course `5` moves left. Course `7` moves down. Decimal values are allowed, so `1.5` is halfway between courses `1` and `2`.

One warp factor is roughly the size of one quadrant. For example, to move from quadrant `6,5` to `5,5`, use course `3` and warp factor `1`.

## Library Computer

The `COM` command accepts these options:

| Option | Function |
| --- | --- |
| `0` | Cumulative galactic record |
| `1` | Status report |
| `2` | Photon torpedo data |
| `3` | Starbase navigation data |
| `4` | Direction/distance calculator |
| `5` | Galactic region name map |

## Credits

This project is based on the classic **Super Star Trek** game lineage:

- Original Star Trek game by Mike Mayfield.
- Modified version published in David H. Ahl's *101 BASIC Computer Games*.
- Further modifications and debugging by Bob Leedom in the 1970s.
- Lua conversion by Emanuele Bolognesi, version 0.4, October 2020.
- Lua-modified version updated in June 2025 at the prompting of Miguel Guhlin, including changes such as Romulans, long range scan map behavior, aliases, and revised code.
- Browser edition created from the Lua-modified version for static online play.

Star Trek names and references belong to their respective owners. This is a fan/historical programming project.
