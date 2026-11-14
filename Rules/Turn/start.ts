import { RETIREMENT_WARNING_YEAR, RETIREMENT_YEAR } from '../../lib/retirement';
import {
  Engine,
  instance as engineInstance,
} from '@civ-clone/core-engine/Engine';
import {
  GameResultRegistry,
  instance as gameResultRegistryInstance,
} from '@civ-clone/core-turn-based-game/GameResultRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import { Year, instance as yearInstance } from '@civ-clone/core-game-year/Year';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import endGame from '@civ-clone/core-turn-based-game/lib/endGame';

// Civ2 checks retirement as each turn starts, before anyone moves (OpenCiv2 `src/auto/game.cpp` `game_play_loop`,
//  after `game_advance_turn`), with the years compared exactly (`game_check_retirement`, richardpenman/civ2@49f26ec).
export const getRules = (
  gameResultRegistry: GameResultRegistry = gameResultRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  year: Year = yearInstance,
  engine: Engine = engineInstance
): Start[] => [
  // The leader is warned in 2000 that they'll retire in 2020.
  new Start(
    'civ2-game-end:turn/start/retirement-warning',
    new Criterion((): boolean => gameResultRegistry.get() === null),
    new Criterion(
      (turn: Turn): boolean =>
        year.value(turn.value()) === RETIREMENT_WARNING_YEAR
    ),
    new Effect((): void => {
      engine.emit('game:retirement-warning', RETIREMENT_YEAR);
    })
  ),

  // In 2020 the leader retires: the game ends, and no one wins.
  new Start(
    'civ2-game-end:turn/start/retirement',
    new Criterion(
      (turn: Turn): boolean => year.value(turn.value()) === RETIREMENT_YEAR
    ),
    new Effect((turn: Turn): void => {
      endGame('date', null, gameResultRegistry, ruleRegistry, turn);
    })
  ),
];

export default getRules;
