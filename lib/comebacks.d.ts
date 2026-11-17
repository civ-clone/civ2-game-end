import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Civilization from '@civ-clone/core-civilization/Civilization';
import { Game } from '@civ-clone/core-game';
import Leader from '@civ-clone/core-civilization/Leader';
/**
 * The times each civilization has been reused, kept in the game's pending effects so it's saved (nothing discharges
 *  it): one record, its data the civilizations' names. Every civilization in the reuse pool has played once before.
 */
export declare const CIVILIZATION_USES = 'civ2-game-end:civilization-uses';
/** How many times `CivilizationType` has been used: once for playing at all, and once for each reuse since. */
export declare const timesUsed: (
  CivilizationType: typeof Civilization,
  pendingEffectRegistry?: PendingEffectRegistry
) => number;
/** Counts a reuse of `CivilizationType`, whether or not it came back. */
export declare const recordUse: (
  CivilizationType: typeof Civilization,
  pendingEffectRegistry?: PendingEffectRegistry
) => void;
/** Whether a civilization used `times` times comes back: 1 in times + 1. */
export declare const comesBackAgain: (
  times: number,
  randomNumberGenerator: () => number
) => boolean;
export type Comeback =
  | {
      reuse: false;
    }
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
export declare const chooseComeback: (game: ComebackGame) => Comeback;
export default chooseComeback;
