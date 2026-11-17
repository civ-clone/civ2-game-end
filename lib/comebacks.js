"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chooseComeback = exports.comesBackAgain = exports.recordUse = exports.timesUsed = exports.CIVILIZATION_USES = void 0;
const PendingEffectRegistry_1 = require("@civ-clone/core-pending-effect/PendingEffectRegistry");
const PendingEffect_1 = require("@civ-clone/core-pending-effect/PendingEffect");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
// Which civilization a destroyed one comes back as (OpenCiv2 `src/auto/civ.cpp` `civ_create_pick_leader`,
//  richardpenman/civ2@49f26ec). Civ2 takes a tribe not used yet, with no roll; only once every tribe of its colour has
//  been used does it reuse one, which comes back with chance 1 in (times used + 1) (`rand() % (times_used + 1)`, only 0
//  comes back), and counts the use either way. There are no colours or fixed slots here, so the same holds across
//  every civilization: an unused one while any is left, then one that has played.
/**
 * The times each civilization has been reused, kept in the game's pending effects so it's saved (nothing discharges
 *  it): one record, its data the civilizations' names. Every civilization in the reuse pool has played once before.
 */
exports.CIVILIZATION_USES = 'civ2-game-end:civilization-uses';
const recordOf = (pendingEffectRegistry) => { var _a; return (_a = pendingEffectRegistry.getByHandler(exports.CIVILIZATION_USES)[0]) !== null && _a !== void 0 ? _a : null; };
/** How many times `CivilizationType` has been used: once for playing at all, and once for each reuse since. */
const timesUsed = (CivilizationType, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    var _a;
    return 1 +
        (Number((_a = recordOf(pendingEffectRegistry)) === null || _a === void 0 ? void 0 : _a.data()[CivilizationType.name]) || 0);
};
exports.timesUsed = timesUsed;
/** Counts a reuse of `CivilizationType`, whether or not it came back. */
const recordUse = (CivilizationType, pendingEffectRegistry = PendingEffectRegistry_1.instance) => {
    const record = recordOf(pendingEffectRegistry), reuses = (0, exports.timesUsed)(CivilizationType, pendingEffectRegistry);
    if (record === null) {
        pendingEffectRegistry.register(new PendingEffect_1.default(exports.CIVILIZATION_USES, null, {
            [CivilizationType.name]: String(reuses),
        }));
        return;
    }
    record.setData({ ...record.data(), [CivilizationType.name]: String(reuses) });
};
exports.recordUse = recordUse;
/** Whether a civilization used `times` times comes back: 1 in times + 1. */
const comesBackAgain = (times, randomNumberGenerator) => Math.floor(randomNumberGenerator() * (times + 1)) === 0;
exports.comesBackAgain = comesBackAgain;
/**
 * Which civilization comes back: an unused one while any is left (`{ reuse: false }`, no draw: `addPlayer` draws it);
 *  otherwise one drawn from those that have played and aren't in the game, rolled for, and its use counted. `null`
 *  when there is none to reuse.
 */
const chooseComeback = (game) => {
    if (game.civilizations.length > 0) {
        return { reuse: false };
    }
    const playing = game.players
        .entries()
        .map((player) => player.civilization().constructor), played = new Map();
    game.playerWorlds
        .entries()
        .map((playerWorld) => playerWorld.player())
        .filter((player) => !(0, isBarbarian_1.default)(player))
        .forEach((player) => {
        const civilization = player.civilization(), leader = civilization.leader();
        if (leader !== null &&
            !playing.includes(civilization.constructor) &&
            !played.has(civilization.constructor)) {
            played.set(civilization.constructor, leader.constructor);
        }
    });
    const candidates = [...played.entries()];
    if (candidates.length === 0) {
        return null;
    }
    const [civilization, leader] = candidates[Math.floor(game.rng() * candidates.length)], times = (0, exports.timesUsed)(civilization, game.pendingEffects), comesBack = (0, exports.comesBackAgain)(times, game.rng);
    (0, exports.recordUse)(civilization, game.pendingEffects);
    return { reuse: true, civilization, leader, comesBack };
};
exports.chooseComeback = chooseComeback;
exports.default = exports.chooseComeback;
//# sourceMappingURL=comebacks.js.map