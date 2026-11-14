# civ2-game-end

How a game of Civilization II ends, as `core-turn-based-game` rules, following OpenCiv2's reconstruction of the original
(`src/auto/game.cpp` `game_check_retirement`, `src/auto/civ.cpp` `civ_create`).

## Endings

Each is a named rule, so a ruleset can disable or replace it. The first to apply ends the game, and none applies again
once it has.

- `civ2-game-end:turn/start/retirement`: as the turn whose year is 2020 starts, the leader retires and no one wins, at
  every level. Civ2 compares the year exactly; its calendars all reach 2020 (`civ2-game-year`).
- `civ2-game-end:turn/end/conquest`: one civilization is left of a game that started with others. It wins.
- `civ2-game-end:spaceship/landed/game-over`: the first spaceship to land wins. Civ2 rolls no success on arrival.
- `civ2-game-end:player/defeated/destroyed`: the human's civilization is destroyed.

`civ2-game-end:turn/start/retirement-warning` emits `game:retirement-warning` (with 2020) as the turn of 2000 starts.
`civ2-game-end:game-over/emit` emits `game:over` with the `GameResult`. With nobody playing, every client a computer
player's, `civ2-game-end:game-over/carry-on-unattended` completes the scoring at once, so the game carries on.

## Pending: a destroyed civilization coming back

Civ2 brings a destroyed computer civilization back as a new one. It isn't here yet: the site search needs Civ2's
per-square fertility from the world, and the advances it inherits need Civ2's advances. Until then a game can be
conquered sooner than in Civ2. The numbers, for when it comes (OpenCiv2 `src/auto/civ.cpp`):

- **When:** until turn 350 − 35 × level, so 350 on Chieftain down to 175 on Deity (`civ_create`, :4766).
- **As whom:** a tribe of the destroyed civilization's colour, one not yet used first (`civ_create_pick_leader`).
- **Where:** a random land square, fertile enough, far enough from cities and units, without a hut, the demands
  relaxing as the tries go on (`civ_create_find_start`). After turn 200, only on a landmass nobody has a city on.
- **Units:** a Settlers; a second after turn 20 when the square isn't seen by a human; a Phalanx too after turn 40
  (`civ_create_place_units`).
- **Advances:** each advance a human knows (unless only one human knows it and discovered it first) with chance
  level / (level + 1), none on Chieftain (`civ_create_grant_advances`).
