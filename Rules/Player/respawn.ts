import { COMEBACKS_RULE_SET, RESPAWN_RULE, RESPAWNS_RULE } from '../../RuleIds';
import {
  comebacksOf,
  comesBackAgain,
  recordComeback,
} from '../../lib/comebacks';
import respawn, { respawns } from '@civ-clone/base-game-end/lib/respawn';
import Advance from '@civ-clone/core-science/Advance';
import { AddPlayerGame } from '@civ-clone/base-player/lib/addPlayer';
import BronzeWorking from '@civ-clone/base-science-advance-bronzeworking/BronzeWorking';
import Criterion from '@civ-clone/core-rule/Criterion';
import Defeated from '@civ-clone/core-player/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game';
import Low from '@civ-clone/core-rule/Priorities/Low';
import Player from '@civ-clone/core-player/Player';
import Respawns from '@civ-clone/base-game-end/Rules/Respawns';
import RuleSet from '@civ-clone/core-rule/RuleSet';
import Settlers from '@civ-clone/base-unit-settlers/Settlers';
import Spearman from '@civ-clone/base-unit-spearman/Spearman';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
import byLevel from '@civ-clone/base-game-end/lib/byLevel';
import fertility from '@civ-clone/civ2-world/lib/fertility';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';
import isHuman from '@civ-clone/base-difficulty/lib/isHuman';
import { levelOf } from '@civ-clone/civ2-difficulty/level';
import respawnSite from '../../lib/respawnSite';
import spawnUnits from '@civ-clone/base-player/lib/spawnUnits';

export type RespawnGame = AddPlayerGame &
  Pick<
    Game,
    | 'cities'
    | 'clients'
    | 'difficulty'
    | 'goodyHuts'
    | 'landMasses'
    | 'pendingEffects'
    | 'playerResearch'
    | 'playerWorlds'
    | 'ruleSets'
    | 'turn'
    | 'units'
  >;

// Civilization II brings a destroyed computer civilization back as a new one (OpenCiv2 `src/auto/civ.cpp` `civ_create`
//  ~4710, richardpenman/civ2@49f26ec).

/** The last turn a destroyed civilization comes back on: 350 on Chieftain, 35 fewer each level up, 175 on Deity. */
export const lastRespawnTurn: (level: number) => number = byLevel(350, -35);

const steps = (from: Tile, to: Tile): number =>
  from.map().topology().steps(from.x(), from.y(), to.x(), to.y());

/**
 * What a civilization coming back may inherit (`civ_create_grant_advances`): each advance a person knows, unless only
 *  one other civilization knows it and a person discovered it first. Who discovered an advance first isn't kept, so
 *  an advance a computer player also knows is taken as one a computer player discovered. Barbarians aside.
 */
export const inheritable = (
  others: Player[],
  human: (player: Player) => boolean,
  completed: (player: Player) => (typeof Advance)[]
): (typeof Advance)[] => {
  const civilizations = others.filter((other) => !isBarbarian(other)),
    knownBy = new Map<typeof Advance, Player[]>();

  civilizations.forEach((player: Player) =>
    completed(player).forEach((AdvanceType: typeof Advance) =>
      knownBy.set(AdvanceType, [...(knownBy.get(AdvanceType) ?? []), player])
    )
  );

  return [...knownBy.entries()]
    .filter(
      ([, players]) =>
        players.some(human) &&
        (players.length > 2 || players.some((player) => !human(player)))
    )
    .map(([AdvanceType]) => AdvanceType);
};

export const getRules = (game: RespawnGame): (Defeated | Respawns)[] => {
  const human = (player: Player): boolean => isHuman(player, game.clients),
    level = (): number => levelOf(game.difficulty),
    completed = (player: Player): (typeof Advance)[] => {
      try {
        return game.playerResearch
          .getByPlayer(player)
          .complete()
          .map((advance: Advance) => advance.sourceClass<typeof Advance>());
      } catch (e) {
        return [];
      }
    };

  // On by default; a New Game setting switches the rule that brings civilizations back off (base-game-end).
  game.ruleSets.register(new RuleSet(COMEBACKS_RULE_SET, RESPAWN_RULE));

  return [
    // Until turn 350 − 35 × level (`civ_create`: `game.turn <= difficulty * -35 + 350`).
    new Respawns(
      RESPAWNS_RULE,
      new Effect((): boolean => game.turn.value() <= lastRespawnTurn(level()))
    ),
    // A computer civilization destroyed comes back, as a new civilization with a Settlers somewhere empty. `Low`, after
    //  the player has left the game.
    new Defeated(
      RESPAWN_RULE,
      new Low(),
      new Criterion(
        (player: Player): boolean => !human(player) && !isBarbarian(player)
      ),
      new Criterion((player: Player): boolean => respawns(player, game.rules)),
      new Criterion((): boolean => game.civilizations.length > 0),
      new Effect((defeated: Player): void => {
        const comebacks = comebacksOf(defeated, game.pendingEffects);

        if (!comesBackAgain(comebacks, game.rng)) {
          return;
        }

        let site: Tile | null = null;

        const player = respawn(game, defeated, {
          site: (): Tile | null =>
            (site = respawnSite({
              cities: game.cities.entries(),
              distance: steps,
              fertility: (tile: Tile): number => fertility(tile),
              goodyHuts: game.goodyHuts,
              landMasses: game.landMasses.entries(),
              randomNumberGenerator: game.rng,
              turn: game.turn.value(),
              units: game.units.entries(),
            })),
          // Civ2 has no starting advances to hold off: every civilization starts knowing nothing.
          heldOff: [],
          isHuman: human,
          advances: (others: Player[]): (typeof Advance)[] =>
            inheritable(others, human, completed),
          // Each with chance level / (level + 1), none on Chieftain (`rand() % (difficulty + 1) != 0`).
          inherits: (): boolean =>
            level() > 0 && Math.floor(game.rng() * (level() + 1)) !== 0,
        });

        if (player === null || site === null) {
          return;
        }

        const tile: Tile = site;

        recordComeback(player, comebacks + 1, game.pendingEffects);

        // The barbarians' units within 8 squares are removed (`civ_create_place_units` ~4532).
        game.units
          .entries()
          .filter(
            (unit: Unit): boolean =>
              isBarbarian(unit.player()) && steps(unit.tile(), tile) < 9
          )
          .forEach((unit: Unit): void => unit.destroy(player));

        // After turn 20 a second Settlers, where no person sees it; after turn 40, a Phalanx too, if it can build one.
        if (
          game.turn.value() > 20 &&
          !game.playerWorlds
            .entries()
            .some(
              (playerWorld) =>
                human(playerWorld.player()) && playerWorld.includes(tile)
            )
        ) {
          spawnUnits(player, tile, [Settlers], game.rules);

          if (
            game.turn.value() > 40 &&
            game.playerResearch
              .getByPlayer(player)
              .completed(BronzeWorking as typeof Advance)
          ) {
            spawnUnits(player, tile, [Spearman], game.rules);
          }
        }
      })
    ),
  ];
};

export default getRules;
