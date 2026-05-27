# Castles & Catapults

A standalone retro artillery siege game built as a single-page browser app. Two grey medieval castles face off across randomized terrain, armies, moats, lakes, trees, and shifting skies. Players choose angle, power, and missile type, then trade shots that damage castle HP, scatter soldiers, and trigger battlefield jokes.

## Play

Open [index.html](index.html) in a browser.

If your browser blocks local assets, run a tiny local server from this folder:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://127.0.0.1:8000/index.html
```

## Features

- CPU or local two-player mode.
- Player names and heraldry colors.
- Random splash image on reload.
- Randomized time of day, constellations, terrain details, lakes, trees, and stakes.
- Hollow grey castles with flags, shields, moats, and destructible HP.
- Soldier armies with bucklers/testudo shields.
- Missile types: stone shot, flaming ball, clay oil jar, sealed tar pot, and ballista bolt.
- Projectile-specific sounds, impact effects, launch quips, insults, retorts, and soldier laments.

## Files

- [README.md](README.md) - this overview.
- [index.html](index.html) - the complete standalone game.
- [vibes.md](vibes.md) - project vision and design priorities.
- [game.md](game.md) - detailed rebuild specification.
- [assets/splash.jpg](assets/splash.jpg) - splash image option 1.
- [assets/splash-2.jpg](assets/splash-2.jpg) - splash image option 2.
- [assets/splash-3.jpg](assets/splash-3.jpg) - splash image option 3.

## Notes

The game has no external dependencies. All rendering, physics, UI, procedural sound, and gameplay logic live in [index.html](index.html).
