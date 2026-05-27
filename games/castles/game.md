# Castles & Catapults: Rebuild Specification

This document describes how to recreate the current game from scratch as a standalone browser game.

## 1. Technical Shape

* Build a single `index.html` file with embedded CSS and JavaScript.
* Use one fixed internal canvas resolution: `800 x 400`.
* Make the canvas responsive with CSS while preserving its 2:1 aspect ratio and pixel-art rendering.
* Store optional splash images in `assets/`:
  * `assets/splash.jpg`
  * `assets/splash-2.jpg`
  * `assets/splash-3.jpg`
* Do not require external libraries, bundlers, package installs, or network assets.

## 2. Setup Screen

Before the match starts, show a splash/title overlay and a setup area.

Required setup controls:

* Left commander name.
* Left heraldry color.
* Right commander name.
* Right heraldry color.
* Opponent mode:
  * `Computer / CPU`
  * `Person / Local 2P`

On page load, randomly choose one available splash image. If a chosen image is missing, fall back to `assets/splash.jpg`.

## 3. Core Game State

Track these state groups:

* `terrain`: one height value per canvas x-coordinate.
* `castles`: two castles, each with breakable brick segments and static feature metadata.
* `soldiers`: individual infantry units that can be destroyed independently of castles.
* `projectile`: active shot object, or `null`.
* `particles`: short-lived rubble/fire/splash particles.
* `impactMarks`: lingering scorch, oil, tar, or crater marks.
* `currentPlayer`: `0` for left, `1` for right.
* `phase`: at least `splash`, `input`, `taunting`, `firing`, `resolving`, `gameover`.
* `wind`: randomized per turn.
* `skyMode`: randomized per battle.
* UI message state for launch quips, insults, retorts, and results.

## 4. Battlefield Generation

Generate a jagged terrain line using layered sine waves and a central hill/mound. Flatten the ground near each castle so castles and moats sit cleanly.

Each new battle should randomize:

* Time of day:
  * day
  * dawn
  * sunset
  * moonlit night
  * starry night with simple constellations
* No-man's-land scenery:
  * small lakes or puddles
  * trees
  * wooden stakes

Draw moats around each castle as shallow blue ellipses in front of the walls.

## 5. Castles

Each side has a different castle silhouette built from rectangular destructible segments.

Visual rules:

* Castle masonry is grey stone.
* Player colors appear only as heraldry: flags, pennants, shields, and army shields.
* Castles should look hollow inside, with dark interior gaps and a cobblestone lower level.
* Use thin grey outlines and subtle stone texture instead of thick heavy brick lines.
* Include medieval features by shape and placement:
  * keep or donjon
  * gatehouse
  * flanking towers
  * bartizans
  * hoardings
  * merlons
  * tower roofs
  * medieval shield/coat-of-arms
  * pennants/flags

Implementation detail:

Represent castles as destructible `bricks`. Each brick has:

* `x`, `y`, `w`, `h`
* `hp`, `maxHp`
* `zone`
* `feature`

When building large castle features, only create shell/cobblestone/structural bricks so the interiors remain hollow.

## 6. Armies

Add visible soldiers between the castles.

* Left army uses round bucklers in a looser formation.
* Right army uses rectangular/tower shields in a tighter testudo-style formation.
* Soldiers should use bright tunics and light outlines so they remain visible at night.
* Soldiers have `alive` state and can be removed by missile blast radius.
* When soldiers are hit, display a randomly selected tragic/funny soldier lament.

Use a pool of roughly 20-30 soldier remarks.

## 7. Projectiles

Players choose missile type before firing. The selected weapon is not represented as a physical siege engine on the castle; it appears as the projectile after launch.

Required missile types:

* Stone Shot
* Flaming Ball
* Clay Oil Jar
* Sealed Tar Pot
* Ballista Bolt

Each missile type should define:

* display label
* radius
* blast radius
* damage multiplier
* color/art style
* speed multiplier
* impact effect
* launch and impact sound profile

Example effects:

* Stone shot: rubble and crater.
* Flaming ball: fire particles and scorch mark.
* Oil jar: orange slick/splash mark.
* Tar pot: dark sticky splatter.
* Ballista bolt: smaller blast but higher direct damage.

## 8. Firing Flow

The active human player controls:

* angle
* power
* missile type

On Fire:

1. Freeze input.
2. Show a random funny launch comment in a speech bubble in the sky.
3. Wait long enough for the comment to be readable.
4. Spawn the projectile from the active castle's hidden launch point.
5. Start launch and flight audio.
6. Simulate the shot until it hits terrain, castle, soldiers, the opposing launch point, or leaves the screen.

Projectile physics:

* Horizontal velocity starts as `side * cos(angle) * speed`.
* Vertical velocity starts as `-sin(angle) * speed`.
* Apply gravity every frame.
* Apply wind as horizontal acceleration.
* Rotate projectile art to match velocity direction.

## 9. Collision and Damage

Collision targets:

* Terrain height map.
* Castle bricks.
* Opposing launcher/catapult hit zone.
* Soldiers.

Castle damage:

* If a projectile overlaps a live brick, apply blast damage to nearby bricks.
* Damage is based on distance from impact plus missile damage multiplier.
* Destroyed bricks visually disappear, revealing hollow interior.
* Castle HP is the sum of remaining brick HP over total brick HP.

Soldier damage:

* Any soldier within blast radius is marked dead.
* Spawn particles at removed soldiers.
* Show a randomized soldier lament.

Win conditions:

* Opponent castle HP reaches zero.
* Opponent hidden launcher/catapult is destroyed.
* A player offers surrender.
* CPU may accept a surrender request only when badly damaged.

## 10. UI and Readouts

Required readouts:

* Turn: active player name, or `Done` after game over.
* Wind direction and strength.
* Left castle HP: `current/max HP (percent%)`.
* Right castle HP: `current/max HP (percent%)`.

Controls:

* Angle slider.
* Power slider.
* Missile selector.
* Fire.
* Reset.
* Insult.
* Request Surrender.
* Offer Surrender.

Text must not overflow buttons or HUD panels on mobile. Keep the UI functional on narrow screens by stacking controls.

## 11. CPU Behavior

When opponent mode is CPU:

* The right side automatically fires after a short delay.
* The CPU's first shot should be intentionally inaccurate.
* Later shots can be more competent but still imperfect.
* The CPU chooses from available missile types, but should begin conservatively.

When opponent mode is local human:

* Both players use the same controls on their respective turns.
* The right player fires leftward using the same angle/power inputs.

## 12. Humor and Text Flavor

Include randomized text pools:

* 20+ launch quips shown before missile launch.
* 20+ insults.
* 20+ retorts.
* 20+ soldier laments.

Behavior:

* Insult button shows a player insult, then a delayed opponent retort.
* Soldier hits show a soldier lament.
* Launch quips appear in a sky speech bubble before firing.
* Status messages wrap to one or two lines inside the canvas.

## 13. Audio

Use Web Audio API only; do not require audio files.

Audio requirements:

* Missile-type-specific launch sounds.
* Missile-type-specific impact sounds.
* A continuous flight tone while a projectile is airborne.
* Flight pitch bends upward or changes as the projectile nears the opposing launcher or the ground, signaling incoming proximity.
* Stop the flight sound cleanly at impact, miss, or end of turn.

## 14. Verification Checklist

Before shipping:

* Splash screen loads even if only `assets/splash.jpg` exists.
* Random splash rotation works when all three splash files exist.
* CPU and local two-player modes both work.
* CPU does not win reliably on its first shot.
* All projectile types launch, render, collide, damage, and produce distinct effects.
* HP readouts update after damage.
* Soldiers are readable and can be destroyed.
* Castle interiors remain hollow and less visually cluttered.
* Desktop and mobile layouts do not overlap or overflow.
* Audio starts only after user interaction and does not continue after impact.
