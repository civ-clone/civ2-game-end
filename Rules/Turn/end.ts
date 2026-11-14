import {
  GameResultRegistry,
  instance as gameResultRegistryInstance,
} from '@civ-clone/core-turn-based-game/GameResultRegistry';
import {
  PlayerRegistry,
  instance as playerRegistryInstance,
} from '@civ-clone/core-player/PlayerRegistry';
import {
  PlayerWorldRegistry,
  instance as playerWorldRegistryInstance,
} from '@civ-clone/core-player-world/PlayerWorldRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import { conqueror, isConquest } from '@civ-clone/base-game-end/lib/conquest';
import Criterion from '@civ-clone/core-rule/Criterion';
import Effect from '@civ-clone/core-rule/Effect';
import End from '@civ-clone/core-turn-based-game/Rules/End';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import endGame from '@civ-clone/core-turn-based-game/lib/endGame';

export const getRules = (
  playerRegistry: PlayerRegistry = playerRegistryInstance,
  playerWorldRegistry: PlayerWorldRegistry = playerWorldRegistryInstance,
  gameResultRegistry: GameResultRegistry = gameResultRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance
): End[] => [
  // One civilization is left, from a game that started with others: it conquered the world (OpenCiv2
  //  `src/auto/civ.cpp` `civ_create`, richardpenman/civ2@49f26ec: fewer than 2 civilizations alive, game over reason 3). The barbarians are no
  //  civilization. Civ2 checks as a civilization is destroyed; this checks once every player has moved.
  new End(
    'civ2-game-end:turn/end/conquest',
    new Criterion((): boolean =>
      isConquest(playerRegistry, playerWorldRegistry)
    ),
    new Effect((turn: Turn): void => {
      endGame(
        'conquest',
        conqueror(playerRegistry),
        gameResultRegistry,
        ruleRegistry,
        turn
      );
    })
  ),
];

export default getRules;
