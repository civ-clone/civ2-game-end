import { Engine } from '@civ-clone/core-engine/Engine';
import { GameResultRegistry } from '@civ-clone/core-turn-based-game/GameResultRegistry';
import { RuleRegistry } from '@civ-clone/core-rule/RuleRegistry';
import { Year } from '@civ-clone/core-game-year/Year';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
export declare const getRules: (
  gameResultRegistry?: GameResultRegistry,
  ruleRegistry?: RuleRegistry,
  year?: Year,
  engine?: Engine
) => Start[];
export default getRules;
