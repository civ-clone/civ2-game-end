/** The `Defeated` rule that brings a destroyed computer civilization back. */
export declare const RESPAWN_RULE = 'civ2-game-end:player/defeated/respawn';
/** The `Respawns` gate: until turn 350 − 35 × level. */
export declare const RESPAWNS_RULE = 'civ2-game-end:player/respawns/last-turn';
/** The New Game setting: a set holding `RESPAWN_RULE`, on by default. */
export declare const COMEBACKS_RULE_SET = 'civ2-game-end:comebacks';
