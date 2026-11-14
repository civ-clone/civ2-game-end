"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const retirement_1 = require("../../lib/retirement");
const Engine_1 = require("@civ-clone/core-engine/Engine");
const GameResultRegistry_1 = require("@civ-clone/core-turn-based-game/GameResultRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const Year_1 = require("@civ-clone/core-game-year/Year");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const Start_1 = require("@civ-clone/core-turn-based-game/Rules/Start");
const endGame_1 = require("@civ-clone/core-turn-based-game/lib/endGame");
// Civ2 checks retirement as each turn starts, before anyone moves (OpenCiv2 `src/auto/game.cpp:5294`, after
//  `game_advance_turn`), with the years compared exactly (`game.cpp:5013-5034`).
const getRules = (gameResultRegistry = GameResultRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance, year = Year_1.instance, engine = Engine_1.instance) => [
    // The leader is warned in 2000 that they'll retire in 2020.
    new Start_1.default('civ2-game-end:turn/start/retirement-warning', new Criterion_1.default(() => gameResultRegistry.get() === null), new Criterion_1.default((turn) => year.value(turn.value()) === retirement_1.RETIREMENT_WARNING_YEAR), new Effect_1.default(() => {
        engine.emit('game:retirement-warning', retirement_1.RETIREMENT_YEAR);
    })),
    // In 2020 the leader retires: the game ends, and no one wins.
    new Start_1.default('civ2-game-end:turn/start/retirement', new Criterion_1.default((turn) => year.value(turn.value()) === retirement_1.RETIREMENT_YEAR), new Effect_1.default((turn) => {
        (0, endGame_1.default)('date', null, gameResultRegistry, ruleRegistry, turn);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=start.js.map