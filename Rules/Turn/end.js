"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRules = void 0;
const GameResultRegistry_1 = require("@civ-clone/core-turn-based-game/GameResultRegistry");
const PlayerRegistry_1 = require("@civ-clone/core-player/PlayerRegistry");
const PlayerWorldRegistry_1 = require("@civ-clone/core-player-world/PlayerWorldRegistry");
const RuleRegistry_1 = require("@civ-clone/core-rule/RuleRegistry");
const conquest_1 = require("@civ-clone/base-game-end/lib/conquest");
const Criterion_1 = require("@civ-clone/core-rule/Criterion");
const Effect_1 = require("@civ-clone/core-rule/Effect");
const End_1 = require("@civ-clone/core-turn-based-game/Rules/End");
const endGame_1 = require("@civ-clone/core-turn-based-game/lib/endGame");
const getRules = (playerRegistry = PlayerRegistry_1.instance, playerWorldRegistry = PlayerWorldRegistry_1.instance, gameResultRegistry = GameResultRegistry_1.instance, ruleRegistry = RuleRegistry_1.instance) => [
    // One civilization is left, from a game that started with others: it conquered the world (OpenCiv2
    //  `src/auto/civ.cpp:4776-4786`: fewer than 2 civilizations alive, game over reason 3). The barbarians are no
    //  civilization. Civ2 checks as a civilization is destroyed; this checks once every player has moved.
    new End_1.default('civ2-game-end:turn/end/conquest', new Criterion_1.default(() => (0, conquest_1.isConquest)(playerRegistry, playerWorldRegistry)), new Effect_1.default((turn) => {
        (0, endGame_1.default)('conquest', (0, conquest_1.conqueror)(playerRegistry), gameResultRegistry, ruleRegistry, turn);
    })),
];
exports.getRules = getRules;
exports.default = exports.getRules;
//# sourceMappingURL=end.js.map