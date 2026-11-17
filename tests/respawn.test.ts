import { COMEBACKS_RULE_SET, RESPAWN_RULE } from '../RuleIds';
import { comebacksOf, comesBackAgain, recordComeback } from '../lib/comebacks';
import {
  getRules,
  inheritable,
  lastRespawnTurn,
} from '../Rules/Player/respawn';
import Advance from '@civ-clone/core-science/Advance';
import { Game } from '@civ-clone/core-game';
import LandMass from '@civ-clone/core-world/LandMass';
import Player from '@civ-clone/core-player/Player';
import Respawns from '@civ-clone/base-game-end/Rules/Respawns';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Tile from '@civ-clone/core-world/Tile';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import { expect } from 'chai';
import respawnSite from '../lib/respawnSite';
import { respawns } from '@civ-clone/base-game-end/lib/respawn';

// OpenCiv2 `src/auto/civ.cpp` `civ_create` ~4710 (richardpenman/civ2@49f26ec).

describe('respawn: the gate', (): void => {
  it('brings civilizations back until turn 350 − 35 × level', (): void => {
    expect([0, 1, 2, 3, 4, 5].map(lastRespawnTurn)).eql([
      350, 315, 280, 245, 210, 175,
    ]);
  });

  it('asks the turn through a `Respawns` rule (King, with no level set)', (): void => {
    const rules = new RuleRegistry(),
      turn = new Turn(),
      game = new Game({ rules, turn }),
      player = new Player(rules);

    rules.register(...getRules(game));

    turn.set(245);
    expect(respawns(player, rules)).true;
    turn.set(246);
    expect(respawns(player, rules)).false;
    expect(rules.get(Respawns)).length(1);
  });

  it('is switched off with its New Game setting, on by default', (): void => {
    const rules = new RuleRegistry(),
      game = new Game({ rules });

    rules.register(...getRules(game));

    expect(rules.getById(RESPAWN_RULE)!.enabled()).true;
    game.ruleSets.set(COMEBACKS_RULE_SET, false);
    expect(rules.getById(RESPAWN_RULE)!.enabled()).false;
  });

  it('brings a line back the k-th time with chance 1 / (k + 1)', (): void => {
    expect(comesBackAgain(0, () => 0.99)).true;
    expect(comesBackAgain(1, () => 0.49)).true;
    expect(comesBackAgain(1, () => 0.5)).false;
    expect(comesBackAgain(2, () => 0.33)).true;
    expect(comesBackAgain(2, () => 0.34)).false;
  });

  it('counts comebacks along the line, and saves them', (): void => {
    const rules = new RuleRegistry(),
      game = new Game({ rules }),
      [first, second] = [new Player(rules), new Player(rules)];

    expect(comebacksOf(first, game.pendingEffects)).equal(0);
    recordComeback(second, 1, game.pendingEffects);
    expect(comebacksOf(second, game.pendingEffects)).equal(1);
  });
});

describe('respawn: inheritable', (): void => {
  class A extends Advance {}
  class B extends Advance {}
  class C extends Advance {}
  class D extends Advance {}

  it('takes what a person knows, unless only one other civilization knows it and no computer player does', (): void => {
    const rules = new RuleRegistry(),
      [person, computer, other] = [
        new Player(rules),
        new Player(rules),
        new Player(rules),
      ],
      known = new Map<Player, (typeof Advance)[]>([
        [person, [A, B, C]],
        [computer, [A]],
        [other, [D]],
      ]),
      human = (player: Player) => player === person;

    // A: a computer player knows it too. B, C: the person alone. D: no person.
    expect(
      inheritable([person, computer, other], human, (p) => known.get(p)!)
    ).eql([A]);
  });
});

describe('respawn: respawnSite', (): void => {
  // A strip of land 20 squares wide on rows 0 to 9, with steps along x only.
  const world = (
    fertilityOf: (x: number, y: number) => number,
    height = 10
  ) => {
    const map = { height: () => height },
      tiles: Tile[] = [];

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < 40; x++) {
        tiles.push({
          x: () => x,
          y: () => y,
          isLand: () => true,
          map: () => map,
          fertility: fertilityOf(x, y),
        } as unknown as Tile);
      }
    }

    return {
      tiles,
      landMass: { tiles: () => tiles } as unknown as LandMass,
    };
  };

  const options = (landMass: LandMass, turn = 100, random = 0) => ({
    cities: [],
    distance: (a: Tile, b: Tile) =>
      Math.max(Math.abs(a.x() - b.x()), Math.abs(a.y() - b.y())),
    fertility: (tile: Tile) =>
      (tile as unknown as { fertility: number }).fertility,
    goodyHuts: { getByTile: () => null } as any,
    landMasses: [landMass],
    randomNumberGenerator: () => random,
    turn,
    units: [],
  });

  it('takes the most fertile squares first, away from the poles', (): void => {
    const { landMass } = world((x, y) => (x === 5 && y === 5 ? 15 : 8));

    expect(respawnSite(options(landMass))!.x()).equal(5);
  });

  it('relaxes the fertility asked for as the tries run out', (): void => {
    // 12 is asked first, 11 after 32 tries.
    const { landMass } = world((x, y) => (x === 7 && y === 4 ? 11 : 10));

    expect(respawnSite(options(landMass))!.x()).equal(7);
  });

  it('refuses a land mass with too few fertile squares for the turn', (): void => {
    // One fertile square, at turn 100: 32 − 6 − tries / 64 reaches 1 only at try 1600, when any square passes.
    const { landMass } = world((x, y) => (x === 7 && y === 4 ? 15 : 0));

    expect(respawnSite(options(landMass, 100, 0.5))!.y()).equal(5);
    // At turn 496, 32 − 31 = 1 at once: the fertile square.
    expect(respawnSite(options(landMass, 496, 0.5))!.x()).equal(7);
  });

  it('gives up on a square within 3 rows of a pole', (): void => {
    const { landMass } = world((x, y) => (y === 1 ? 15 : 0));

    expect(respawnSite(options(landMass))).null;
  });
});
