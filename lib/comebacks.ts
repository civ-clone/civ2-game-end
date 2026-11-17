import {
  PendingEffectRegistry,
  instance as pendingEffectRegistryInstance,
} from '@civ-clone/core-pending-effect/PendingEffectRegistry';
import PendingEffect from '@civ-clone/core-pending-effect/PendingEffect';
import Player from '@civ-clone/core-player/Player';

/**
 * How many times a civilization has come back, kept on the player that came back in the game's pending effects so it's
 *  saved: nothing discharges it. A player the game started with has none.
 */
export const COMEBACKS = 'civ2-game-end:comebacks';

/** How many times `player`'s line has come back before: 0 for a civilization the game started with. */
export const comebacksOf = (
  player: Player,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): number => {
  const record = pendingEffectRegistry
    .getByHandler(COMEBACKS)
    .find((effect: PendingEffect) => effect.target() === player);

  return record ? Number(record.data().count) || 0 : 0;
};

/** Records that `player` came back for the `count`-th time. */
export const recordComeback = (
  player: Player,
  count: number,
  pendingEffectRegistry: PendingEffectRegistry = pendingEffectRegistryInstance
): void => {
  pendingEffectRegistry.register(
    new PendingEffect(COMEBACKS, player, { count: String(count) })
  );
};

/**
 * Whether a civilization that has come back `comebacks` times comes back again: 1 in comebacks + 1, as Civ2 rolls for a
 *  tribe used before (`civ_create_pick_leader`: `rand() % (times_used + 1)`, and only 0 comes back). Counted along the
 *  line of civilizations that came back in each other's place, as there are no fixed slots here.
 */
export const comesBackAgain = (
  comebacks: number,
  randomNumberGenerator: () => number
): boolean => Math.floor(randomNumberGenerator() * (comebacks + 1)) === 0;
