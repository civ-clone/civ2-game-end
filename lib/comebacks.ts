import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Civilization from '@civ-clone/core-civilization/Civilization';
import { Game } from '@civ-clone/core-game';
import Leader from '@civ-clone/core-civilization/Leader';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import isBarbarian from '@civ-clone/base-civilization-barbarian/isBarbarian';

// Which civilization a destroyed one comes back as (OpenCiv2 `src/auto/civ.cpp` `civ_create_pick_leader`,
//  richardpenman/civ2@49f26ec). Civ2 takes a tribe not used yet, with no roll; only once every tribe of its colour has
//  been used does it reuse one, which comes back with chance 1 in (times used + 1) (`rand() % (times_used + 1)`, only 0
//  comes back), and counts the use either way. There are no colours or fixed slots here, so the same holds across
//  every civilization: an unused one while any is left, then one that has played.

/**
 * The times each civilization has been reused, kept in the game's pending effects so it's saved (nothing discharges
 *  it): one record, its data the civilizations' names. Every civilization in the reuse pool has played once before.
 */
export const CIVILIZATION_USES = 'civ2-game-end:civilization-uses';

const recordOf = (
  pendingEffectRegistry: PendingEffectRegistry
): PendingEffect | null =>
  pendingEffectRegistry.getByHandler(CIVILIZATION_USES)[0] ?? null;

/** How many times `CivilizationType` has been used: once for playing at all, and once for each reuse since. */
export const timesUsed = (
  CivilizationType: typeof Civilization,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): number =>
  1 +
  (Number(recordOf(pendingEffectRegistry)?.data()[CivilizationType.name]) || 0);

/** Counts a reuse of `CivilizationType`, whether or not it came back. */
export const recordUse = (
  CivilizationType: typeof Civilization,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  const record = recordOf(pendingEffectRegistry),
    reuses = timesUsed(CivilizationType, pendingEffectRegistry);

  if (record === null) {
    pendingEffectRegistry.register(
      new PendingEffect(CIVILIZATION_USES, null, {
        [CivilizationType.name]: String(reuses),
      })
    );

    return;
  }

  record.setData({ ...record.data(), [CivilizationType.name]: String(reuses) });
};

/** Whether a civilization used `times` times comes back: 1 in times + 1. */
export const comesBackAgain = (
  times: number,
  randomNumberGenerator: () => number
): boolean => Math.floor(randomNumberGenerator() * (times + 1)) === 0;

export type Comeback =
  | { reuse: false }
  | {
      reuse: true;
      civilization: typeof Civilization;
      leader: typeof Leader;
      comesBack: boolean;
    }
  | null;

export type ComebackGame = Pick<
  Game,
  'civilizations' | 'pendingEffects' | 'players' | 'playerWorlds' | 'rng'
>;

/**
 * Which civilization comes back: an unused one while any is left (`{ reuse: false }`, no draw: `addPlayer` draws it);
 *  otherwise one drawn from those that have played and aren't in the game, rolled for, and its use counted. `null`
 *  when there is none to reuse.
 */
export const chooseComeback = (game: ComebackGame): Comeback => {
  if (game.civilizations.length > 0) {
    return { reuse: false };
  }

  const playing = game.players
      .entries()
      .map((player: Player) => player.civilization().constructor),
    played = new Map<typeof Civilization, typeof Leader>();

  game.playerWorlds
    .entries()
    .map((playerWorld: PlayerWorld): Player => playerWorld.player())
    .filter((player: Player): boolean => !isBarbarian(player))
    .forEach((player: Player): void => {
      const civilization = player.civilization(),
        leader = civilization.leader();

      if (
        leader !== null &&
        !playing.includes(civilization.constructor) &&
        !played.has(civilization.constructor as typeof Civilization)
      ) {
        played.set(
          civilization.constructor as typeof Civilization,
          leader.constructor as typeof Leader
        );
      }
    });

  const candidates = [...played.entries()];

  if (candidates.length === 0) {
    return null;
  }

  const [civilization, leader] =
      candidates[Math.floor(game.rng() * candidates.length)],
    times = timesUsed(civilization, game.pendingEffects),
    comesBack = comesBackAgain(times, game.rng);

  recordUse(civilization, game.pendingEffects);

  return { reuse: true, civilization, leader, comesBack };
};

export default chooseComeback;
