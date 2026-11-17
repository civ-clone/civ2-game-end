"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.comesBackAgain = exports.recordComeback = exports.comebacksOf = exports.COMEBACKS = void 0;
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const PendingEffect_1 = require("@civ-clone/core-pending-effect/PendingEffect");
/**
 * How many times a civilization has come back, kept on the player that came back in the game's pending effects so it's
 *  saved: nothing discharges it. A player the game started with has none.
 */
exports.COMEBACKS = 'civ2-game-end:comebacks';
/** How many times `player`'s line has come back before: 0 for a civilization the game started with. */
const comebacksOf = (player, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    const record = pendingEffectRegistry
        .getByHandler(exports.COMEBACKS)
        .find((effect) => effect.target() === player);
    return record ? Number(record.data().count) || 0 : 0;
};
exports.comebacksOf = comebacksOf;
/** Records that `player` came back for the `count`-th time. */
const recordComeback = (player, count, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    pendingEffectRegistry.register(new PendingEffect_1.default(exports.COMEBACKS, player, { count: String(count) }));
};
exports.recordComeback = recordComeback;
/**
 * Whether a civilization that has come back `comebacks` times comes back again: 1 in comebacks + 1, as Civ2 rolls for a
 *  tribe used before (`civ_create_pick_leader`: `rand() % (times_used + 1)`, and only 0 comes back). Counted along the
 *  line of civilizations that came back in each other's place, as there are no fixed slots here.
 */
const comesBackAgain = (comebacks, randomNumberGenerator) => Math.floor(randomNumberGenerator() * (comebacks + 1)) === 0;
exports.comesBackAgain = comesBackAgain;
//# sourceMappingURL=comebacks.js.map