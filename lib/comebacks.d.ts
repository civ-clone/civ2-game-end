import { PendingEffectRegistry } from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import Player from '@civ-clone/core-player/Player';
/**
 * How many times a civilization has come back, kept on the player that came back in the game's pending effects so it's
 *  saved: nothing discharges it. A player the game started with has none.
 */
export declare const COMEBACKS = 'civ2-game-end:comebacks';
/** How many times `player`'s line has come back before: 0 for a civilization the game started with. */
export declare const comebacksOf: (
  player: Player,
  pendingEffectRegistry?: PendingEffectRegistry
) => number;
/** Records that `player` came back for the `count`-th time. */
export declare const recordComeback: (
  player: Player,
  count: number,
  pendingEffectRegistry?: PendingEffectRegistry
) => void;
/**
 * Whether a civilization that has come back `comebacks` times comes back again: 1 in comebacks + 1, as Civ2 rolls for a
 *  tribe used before (`civ_create_pick_leader`: `rand() % (times_used + 1)`, and only 0 comes back). Counted along the
 *  line of civilizations that came back in each other's place, as there are no fixed slots here.
 */
export declare const comesBackAgain: (
  comebacks: number,
  randomNumberGenerator: () => number
) => boolean;
