import { GameResultRegistry } from '@civ-clone/core-turn-based-game/GameResultRegistry';
import { PlayerRegistry } from '@civ-clone/core-player/PlayerRegistry';
import { PlayerWorldRegistry } from '@civ-clone/core-player-world/PlayerWorldRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import End from '@civ-clone/core-turn-based-game/Rules/End';
export declare const getRules: (
  playerRegistry?: PlayerRegistry,
  playerWorldRegistry?: PlayerWorldRegistry,
  gameResultRegistry?: GameResultRegistry,
  ruleRegistry?: RuleRegistry
) => End[];
export default getRules;
