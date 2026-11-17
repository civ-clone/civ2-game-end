// civ2-game-end's rule ids that other packages and a renderer use.

/** The `Defeated` rule that brings a destroyed computer civilization back. */
export const RESPAWN_RULE = 'civ2-game-end:player/defeated/respawn';

/** The `Respawns` gate: until turn 350 − 35 × level. */
export const RESPAWNS_RULE = 'civ2-game-end:player/respawns/last-turn';

/** The New Game setting: a set holding `RESPAWN_RULE`, on by default. */
export const COMEBACKS_RULE_SET = 'civ2-game-end:comebacks';
