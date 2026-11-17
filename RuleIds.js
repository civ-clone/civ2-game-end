"use strict";
// civ2-game-end's rule ids that other packages and a renderer use.
Object.defineProperty(exports, "__esModule", { value: true });
exports.COMEBACKS_RULE_SET = exports.RESPAWNS_RULE = exports.RESPAWN_RULE = void 0;
/** The `Defeated` rule that brings a destroyed computer civilization back. */
exports.RESPAWN_RULE = 'civ2-game-end:player/defeated/respawn';
/** The `Respawns` gate: until turn 350 − 35 × level. */
exports.RESPAWNS_RULE = 'civ2-game-end:player/respawns/last-turn';
/** The New Game setting: a set holding `RESPAWN_RULE`, on by default. */
exports.COMEBACKS_RULE_SET = 'civ2-game-end:comebacks';
//# sourceMappingURL=RuleIds.js.map