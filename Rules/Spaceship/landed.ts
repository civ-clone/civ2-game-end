import {
  GameResultRegistry,
  instance as gameResultRegistryInstance,
} from '@civ-clone/core-turn-based-game/GameResultRegistry';
import {
  RuleRegistry,
  instance as ruleRegistryInstance,
} from '@civ-clone/core-rule/RuleRegistry';
import {
  Turn,
  instance as turnInstance,
} from '@civ-clone/core-turn-based-game/Turn';
import Effect from '@civ-clone/core-rule/Effect';
import Landed from '@civ-clone/core-spaceship/Rules/Landed';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import endGame from '@civ-clone/core-turn-based-game/lib/endGame';

export const getRules = (
  gameResultRegistry: GameResultRegistry = gameResultRegistryInstance,
  ruleRegistry: RuleRegistry = ruleRegistryInstance,
  turn: Turn = turnInstance
): Landed[] => [
  // The first ship to reach Alpha Centauri wins the game for its civilization; Civ2 rolls no success on arrival
  //  (OpenCiv2 `src/auto/game.cpp` `game_advance_turn`,
  //  richardpenman/civ2@49f26ec).
  new Landed(
    'civ2-game-end:spaceship/landed/game-over',
    new Effect((spaceship: Spaceship): void => {
      endGame(
        'spaceship',
        spaceship.player(),
        gameResultRegistry,
        ruleRegistry,
        turn
      );
    })
  ),
];

export default getRules;
