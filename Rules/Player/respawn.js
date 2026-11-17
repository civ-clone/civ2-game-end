"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = exports.inheritable = exports.lastRespawnTurn = void 0;
const RuleIds_1 = require("../../RuleIds");
const comebacks_1 = require("../../lib/comebacks");
const respawn_1 = require("@civ-clone/base-game-end/lib/respawn");
const BronzeWorking_1 = require("@civ-clone/base-science-advance-bronzeworking/BronzeWorking");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Defeated_1 = require("@civ-clone/core-player/Rules/Defeated");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Low_1 = require("@civ-clone/core-rule/Priorities/Low");
const Respawns_1 = require("@civ-clone/base-game-end/Rules/Respawns");
const RuleSet_1 = require("@civ-clone/core-rule/RuleSet");
const Settlers_1 = require("@civ-clone/base-unit-settlers/Settlers");
const Spearman_1 = require("@civ-clone/base-unit-spearman/Spearman");
const byLevel_1 = require("@civ-clone/base-game-end/lib/byLevel");
const fertility_1 = require("@civ-clone/civ2-world/lib/fertility");
const isBarbarian_1 = require("@civ-clone/base-civilization-barbarian/isBarbarian");
const isHuman_1 = require("@civ-clone/base-difficulty/lib/isHuman");
const level_1 = require("@civ-clone/civ2-difficulty/level");
const respawnSite_1 = require("../../lib/respawnSite");
const spawnUnits_1 = require("@civ-clone/base-player/lib/spawnUnits");
// Civilization II brings a destroyed computer civilization back as a new one (OpenCiv2 `src/auto/civ.cpp` `civ_create`
//  ~4710, richardpenman/civ2@49f26ec).
/** The last turn a destroyed civilization comes back on: 350 on Chieftain, 35 fewer each level up, 175 on Deity. */
exports.lastRespawnTurn = (0, byLevel_1.default)(350, -35);
const steps = (from, to) => from.map().topology().steps(from.x(), from.y(), to.x(), to.y());
/**
 * What a civilization coming back may inherit (`civ_create_grant_advances`): each advance a person knows, unless only
 *  one other civilization knows it and a person discovered it first. Who discovered an advance first isn't kept, so
 *  an advance a computer player also knows is taken as one a computer player discovered. Barbarians aside.
 */
const inheritable = (others, human, completed) => {
    const civilizations = others.filter((other) => !(0, isBarbarian_1.default)(other)), knownBy = new Map();
    civilizations.forEach((player) => completed(player).forEach((AdvanceType) => { var _a; return knownBy.set(AdvanceType, [...((_a = knownBy.get(AdvanceType)) !== null && _a !== void 0 ? _a : []), player]); }));
    return [...knownBy.entries()]
        .filter(([, players]) => players.some(human) &&
        (players.length > 2 || players.some((player) => !human(player))))
        .map(([AdvanceType]) => AdvanceType);
};
exports.inheritable = inheritable;
const getRules = (game) => {
    const human = (player) => (0, isHuman_1.default)(player, game.clients), level = () => (0, level_1.levelOf)(game.difficulty), completed = (player) => {
        try {
            return game.playerResearch
                .getByPlayer(player)
                .complete()
                .map((advance) => advance.sourceClass());
        }
        catch (e) {
            return [];
        }
    };
    // On by default; a New Game setting switches the rule that brings civilizations back off (base-game-end).
    game.ruleSets.register(new RuleSet_1.default(RuleIds_1.COMEBACKS_RULE_SET, RuleIds_1.RESPAWN_RULE));
    return [
        // Until turn 350 − 35 × level (`civ_create`: `game.turn <= difficulty * -35 + 350`).
        new Respawns_1.default(RuleIds_1.RESPAWNS_RULE, new Effect_1.default(() => game.turn.value() <= (0, exports.lastRespawnTurn)(level()))),
        // A computer civilization destroyed comes back, as a new civilization with a Settlers somewhere empty. `Low`, after
        //  the player has left the game.
        new Defeated_1.default(RuleIds_1.RESPAWN_RULE, new Low_1.default(), new Criterion_1.default((player) => !human(player) && !(0, isBarbarian_1.default)(player)), new Criterion_1.default((player) => (0, respawn_1.respawns)(player, game.rules)), new Criterion_1.default(() => game.civilizations.length > 0), new Effect_1.default((defeated) => {
            const comebacks = (0, comebacks_1.comebacksOf)(defeated, game.pendingEffects);
            if (!(0, comebacks_1.comesBackAgain)(comebacks, game.rng)) {
                return;
            }
            let site = null;
            const player = (0, respawn_1.default)(game, defeated, {
                site: () => (site = (0, respawnSite_1.default)({
                    cities: game.cities.entries(),
                    distance: steps,
                    fertility: (tile) => (0, fertility_1.default)(tile),
                    goodyHuts: game.goodyHuts,
                    landMasses: game.landMasses.entries(),
                    randomNumberGenerator: game.rng,
                    turn: game.turn.value(),
                    units: game.units.entries(),
                })),
                // Civ2 has no starting advances to hold off: every civilization starts knowing nothing.
                heldOff: [],
                isHuman: human,
                advances: (others) => (0, exports.inheritable)(others, human, completed),
                // Each with chance level / (level + 1), none on Chieftain (`rand() % (difficulty + 1) != 0`).
                inherits: () => level() > 0 && Math.floor(game.rng() * (level() + 1)) !== 0,
            });
            if (player === null || site === null) {
                return;
            }
            const tile = site;
            (0, comebacks_1.recordComeback)(player, comebacks + 1, game.pendingEffects);
            // The barbarians' units within 8 squares are removed (`civ_create_place_units` ~4532).
            game.units
                .entries()
                .filter((unit) => (0, isBarbarian_1.default)(unit.player()) && steps(unit.tile(), tile) < 9)
                .forEach((unit) => unit.destroy(player));
            // After turn 20 a second Settlers, where no person sees it; after turn 40, a Phalanx too, if it can build one.
            if (game.turn.value() > 20 &&
                !game.playerWorlds
                    .entries()
                    .some((playerWorld) => human(playerWorld.player()) && playerWorld.includes(tile))) {
                (0, spawnUnits_1.default)(player, tile, [Settlers_1.default], game.rules);
                if (game.turn.value() > 40 &&
                    game.playerResearch
                        .getByPlayer(player)
                        .completed(BronzeWorking_1.default)) {
                    (0, spawnUnits_1.default)(player, tile, [Spearman_1.default], game.rules);
                }
            }
        })),
    ];
};
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=respawn.js.map