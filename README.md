# civ2-game-end

How a game of Civilization II ends, as `core-turn-based-game` rules, following OpenCiv2's reconstruction of the original
(`src/auto/game.cpp` `game_check_retirement`, `src/auto/civ.cpp` `civ_create`, richardpenman/civ2@49f26ec).

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

## A destroyed civilization coming back (`Rules/Player/respawn`)

Civ2 brings a destroyed computer civilization back as a new one (OpenCiv2 `src/auto/civ.cpp` `civ_create`), through
base-game-end's `respawn`:

- **When** (`civ2-game-end:player/respawns/last-turn`, a `Respawns` rule): until turn 350 − 35 × level, so 350 on
  Chieftain down to 175 on Deity.
- **As whom** (`lib/comebacks`, `civ_create_pick_leader`): a civilization not yet in the game while any is left, with
  no roll. Once every civilization has played, one that has played and isn't in the game is drawn and comes back with
  chance 1 in (times it has been used + 1); the use is counted either way, per civilization, and saved
  (`civ2-game-end:civilization-uses`, a `PendingEffect`).
- **Where** (`lib/respawnSite`, `civ_create_find_start`): Civ2's 2,000 tries, each relaxation in turn: land, fertile
  (civ2-world's `fertility`, 12 at first, 1 less every 32 tries; none in a city's radius, 8 at most near a city), at
  least 16 from a city (1 less every 128 tries, never under 2), on a land mass with 32 − turn / 16 fertile squares (1
  less every 64 tries), after turn 200 one with no city, with no hut, city or unit. A square within 3 rows of a pole
  is refused, and the civilization stays destroyed.
- **What it gets:** one Settlers (civ2-player's `Spawn`); after turn 20 a second, where no person sees it; after turn 40
  a Phalanx too, with Bronze Working. Each advance a person knows, unless only one other civilization knows it and a
  person discovered it first, with chance level / (level + 1), none on Chieftain. The barbarians' units within 8
  squares are removed.
- **The New Game setting:** `civ2-game-end:comebacks`, a set holding `civ2-game-end:player/defeated/respawn`, on by
  default. Switched off, no civilization comes back, and the conquest bonus counts a turn before 251 as 250
  (civ2-score).
- `player:respawned` is emitted with the new player and the destroyed one (base-game-end).

Not as the original: there are no colours or fixed slots (Dom), so a civilization comes back as any unused
civilization rather than an unused tribe of its colour, and the reuse roll starts once every civilization has played
rather than once every tribe of the colour has. Who discovered an advance first isn't
kept, so an advance a computer player also knows counts as one a computer player discovered. Its science and tax rates
are its `Added` rules'.

## The spaceship's landing

civ2-spaceship lands the first ship to arrive as a turn starts, and `civ2-game-end:spaceship/landed/game-over` ends
the game for it.
