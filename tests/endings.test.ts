import AIClient from '@civ-clone/core-ai-client/AIClient';
import Barbarian from '@civ-clone/base-civilization-barbarian/Barbarian';
import Client from '@civ-clone/core-client/Client';
import ClientRegistry from '@civ-clone/core-client/ClientRegistry';
import Defeated from '@civ-clone/core-player/Rules/Defeated';
import Effect from '@civ-clone/core-rule/Effect';
import End from '@civ-clone/core-turn-based-game/Rules/End';
import Engine from '@civ-clone/core-engine/Engine';
import GameResult from '@civ-clone/core-turn-based-game/GameResult';
import GameResultRegistry from '@civ-clone/core-turn-based-game/GameResultRegistry';
import Landed from '@civ-clone/core-spaceship/Rules/Landed';
import Player from '@civ-clone/core-player/Player';
import PlayerRegistry from '@civ-clone/core-player/PlayerRegistry';
import PlayerWorldRegistry from '@civ-clone/core-player-world/PlayerWorldRegistry';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Spaceship from '@civ-clone/core-spaceship/Spaceship';
import Start from '@civ-clone/core-turn-based-game/Rules/Start';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Year from '@civ-clone/core-game-year/Year';
import YearRule from '@civ-clone/core-game-year/Rules/Year';
import { expect } from 'chai';
import gameOver from '../Rules/GameOver/game-over';
import playerDefeated from '../Rules/Player/defeated';
import spaceshipLanded from '../Rules/Spaceship/landed';
import turnEnd from '../Rules/Turn/end';
import turnStart from '../Rules/Turn/start';

// A game of a human and two computer players, its calendar given by `yearOf`: by default a year a turn from 1990.
const setUp = (
  human = true,
  yearOf: (turn: number) => number = (turn: number) => 1990 + turn
) => {
  const rules = new RuleRegistry(),
    engine = new Engine(),
    turn = new Turn(),
    year = new Year(turn, rules),
    clients = new ClientRegistry(),
    players = new PlayerRegistry(),
    gameResult = new GameResultRegistry(),
    [you, rival, other] = [
      new Player(rules),
      new Player(rules),
      new Player(rules),
    ],
    over: GameResult[] = [],
    warnings: number[] = [];

  // The worlds are only counted, one for each player the game started with, and asked whose they are.
  const worlds = [you, rival, other],
    playerWorlds = {
      get length() {
        return worlds.length;
      },
      entries: () => worlds.map((player) => ({ player: () => player })),
    } as unknown as PlayerWorldRegistry;

  const addBarbarians = (): Player => {
    const barbarians = new Player(rules);

    barbarians.setCivilization(new Barbarian());
    players.register(barbarians);
    clients.register(new AIClient(barbarians));
    worlds.push(barbarians);

    return barbarians;
  };

  players.register(you, rival, other);
  clients.register(
    human ? new Client(you) : new AIClient(you),
    new AIClient(rival),
    new AIClient(other)
  );

  rules.register(
    new YearRule(new Effect(yearOf)),
    ...gameOver(clients, engine),
    ...playerDefeated(clients, gameResult, rules, turn),
    ...spaceshipLanded(gameResult, rules, turn),
    ...turnEnd(players, playerWorlds, gameResult, rules),
    ...turnStart(gameResult, rules, year, engine)
  );

  engine.on('game:over', (result: GameResult) => over.push(result));
  engine.on('game:retirement-warning', (year: number) => warnings.push(year));

  const startTurn = (value: number): void => {
    turn.set(value);
    rules.process(Start, turn);
  };

  return {
    addBarbarians,
    gameResult,
    other,
    over,
    players,
    rival,
    rules,
    startTurn,
    turn,
    warnings,
    worlds,
    you,
  };
};

describe('retirement', (): void => {
  it('ends the game as the turn of 2020 starts, with no winner', (): void => {
    const { gameResult, over, rules, startTurn, turn } = setUp();

    startTurn(29);
    rules.process(End, turn);

    expect(over).to.deep.equal([]);

    startTurn(30);

    expect(over.length).to.equal(1);
    expect(over[0].reason()).to.equal('date');
    expect(over[0].winner()).to.equal(null);
    expect(over[0].turn()).to.equal(30);
    expect(gameResult.pending()).to.equal(true);
  });

  it('warns of retirement in 2000, once, that it comes in 2020', (): void => {
    const { startTurn, warnings } = setUp();

    for (let value = 1; value <= 29; value++) {
      startTurn(value);
    }

    expect(warnings).to.deep.equal([2020]);
  });

  it('compares the years exactly, as Civ2 does: a calendar that skips 2020 never retires', (): void => {
    // Two years a turn from 1991: 2019, then 2021.
    const { over, startTurn, warnings } = setUp(
      true,
      (turn: number) => 1989 + 2 * turn
    );

    for (let value = 1; value <= 20; value++) {
      startTurn(value);
    }

    expect(over).to.deep.equal([]);
    expect(warnings).to.deep.equal([]);
  });

  it('ends only once, and not again after the players keep playing', (): void => {
    const { gameResult, over, startTurn } = setUp(true, () => 2020);

    startTurn(30);
    gameResult.get()!.completeScoring();
    startTurn(31);

    expect(over.length).to.equal(1);
    expect(gameResult.pending()).to.equal(false);
  });

  it("doesn't warn once the game is over", (): void => {
    const { startTurn, warnings } = setUp(true, () => 2000);

    startTurn(5);

    expect(warnings).to.deep.equal([2020]);

    // Ended by something else first: no more warnings.
    const ended = setUp(true, () => 2000);

    ended.rules.process(Defeated, ended.you, ended.rival);
    ended.startTurn(5);

    expect(ended.warnings).to.deep.equal([]);
  });
});

describe('conquest', (): void => {
  it('ends the game once one civilization is left, which wins it', (): void => {
    const { other, over, players, rival, rules, turn, you } = setUp();

    turn.set(5);
    players.unregister(rival);
    rules.process(End, turn);

    expect(over).to.deep.equal([]);

    players.unregister(other);
    rules.process(End, turn);

    expect(over.length).to.equal(1);
    expect(over[0].reason()).to.equal('conquest');
    expect(over[0].winner()).to.equal(you);
  });

  it('is neither won nor blocked by the barbarians', (): void => {
    const { addBarbarians, over, players, rival, other, rules, turn, you } =
      setUp();

    addBarbarians();
    turn.set(5);
    players.unregister(rival, other);
    rules.process(End, turn);

    expect(over.length).to.equal(1);
    expect(over[0].winner()).to.equal(you);
  });

  it('does not end a game of one civilization and the barbarians', (): void => {
    const { addBarbarians, over, players, rival, other, rules, turn, worlds } =
      setUp();

    players.unregister(rival, other);
    worlds.splice(1);
    addBarbarians();
    turn.set(5);
    rules.process(End, turn);

    expect(over).to.deep.equal([]);
  });
});

describe('your civilization destroyed', (): void => {
  it('ends the game when the human is defeated, and not when a computer player is', (): void => {
    const { over, rival, rules, you } = setUp();

    rules.process(Defeated, rival, you);

    expect(over).to.deep.equal([]);

    rules.process(Defeated, you, rival);

    expect(over.length).to.equal(1);
    expect(over[0].reason()).to.equal('destroyed');
  });
});

describe('a spaceship landing', (): void => {
  it('ends the game, won by the first to land', (): void => {
    const { over, rival, rules, you } = setUp(),
      first = { player: () => rival } as unknown as Spaceship,
      second = { player: () => you } as unknown as Spaceship;

    rules.process(Landed, first);
    rules.process(Landed, second);

    expect(over.length).to.equal(1);
    expect(over[0].reason()).to.equal('spaceship');
    expect(over[0].winner()).to.equal(rival);
  });
});

describe('a game nobody is playing', (): void => {
  it('carries on after it ends, with its scoring complete', (): void => {
    const { gameResult, over, startTurn } = setUp(false);

    startTurn(30);

    expect(over.length).to.equal(1);
    expect(gameResult.pending()).to.equal(false);
  });
});
