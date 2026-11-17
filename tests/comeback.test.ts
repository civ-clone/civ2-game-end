import { CIVILIZATION_USES, chooseComeback, timesUsed } from '../lib/comebacks';
import { COMEBACKS_RULE_SET, RESPAWN_RULE } from '../RuleIds';
import {
  generateGenerator,
  generateWorld,
} from '@civ-clone/core-world/tests/lib/buildWorld';
import Added from '@civ-clone/core-player/Rules/Added';
import AIClient from '@civ-clone/core-ai-client/AIClient';
import Barbarian from '@civ-clone/base-civilization-barbarian/Barbarian';
import BronzeWorking from '@civ-clone/base-science-advance-bronzeworking/BronzeWorking';
import Civilization from '@civ-clone/core-civilization/Civilization';
import Client from '@civ-clone/core-client/Client';
import Created from '@civ-clone/core-unit/Rules/Created';
import Defeated from '@civ-clone/core-player/Rules/Defeated';
import Destroyed from '@civ-clone/core-unit/Rules/Destroyed';
import Effect from '@civ-clone/core-rule/Effect';
import { Game } from '@civ-clone/core-game';
import { Land } from '@civ-clone/core-terrain/Types';
import Leader from '@civ-clone/core-civilization/Leader';
import Player from '@civ-clone/core-player/Player';
import PlayerResearch from '@civ-clone/core-science/PlayerResearch';
import PlayerWorld from '@civ-clone/core-player-world/PlayerWorld';
import RuleRegistry from '@civ-clone/core-rule/RuleRegistry';
import Settlers from '@civ-clone/base-unit-settlers/Settlers';
import Spawn from '@civ-clone/core-player/Rules/Spawn';
import Spearman from '@civ-clone/base-unit-spearman/Spearman';
import Tile from '@civ-clone/core-world/Tile';
import Turn from '@civ-clone/core-turn-based-game/Turn';
import Unit from '@civ-clone/core-unit/Unit';
import World from '@civ-clone/core-world/World';
import { expect } from 'chai';
import { getRules } from '../Rules/Player/respawn';

// Stand-in civilizations, each with its leader.
class Alpha extends Civilization {}
class Beta extends Civilization {}
class Gamma extends Civilization {}
class Delta extends Civilization {}
const leaderOf = (CivilizationType: typeof Civilization): typeof Leader =>
  class extends Leader {
    static civilization() {
      return CivilizationType;
    }

    name() {
      return CivilizationType.name;
    }
  };
const [AlphaLeader, BetaLeader, GammaLeader, DeltaLeader] = [
  Alpha,
  Beta,
  Gamma,
  Delta,
].map(leaderOf);

// A person (Alpha), a computer player about to be destroyed (Beta), another (Gamma) and the barbarians, on a 20 × 20
//  world of land; Delta is the one civilization left unused unless `unused` is false. `random` is every draw.
const setUp = async ({
  random = () => 0,
  turn = 45,
  unused = true,
}: { random?: () => number; turn?: number; unused?: boolean } = {}) => {
  const rules = new RuleRegistry(),
    clock = new Turn(),
    draws: number[] = [],
    rng = () => {
      const value = random();

      draws.push(value);

      return value;
    },
    game = new Game({ rules, turn: clock, rng: rng as any }),
    world: World = await generateWorld(
      generateGenerator(20, 20, Land),
      rules,
      game.landMasses
    ),
    created: [Player, string][] = [],
    destroyed: Unit[] = [],
    join = (
      CivilizationType: typeof Civilization,
      LeaderType: typeof Leader
    ) => {
      const player = new Player(rules),
        civilization = new (CivilizationType as any)();

      civilization.setLeader(new (LeaderType as any)());
      player.setCivilization(civilization);
      game.players.register(player);
      game.playerWorlds.register(new PlayerWorld(player, world, rules));
      game.playerResearch.register(new PlayerResearch(player, rules));

      return player;
    };

  clock.set(turn);

  if (unused) {
    game.civilizations.register(Delta);
    game.leaders.register(DeltaLeader);
  }

  const person = join(Alpha, AlphaLeader),
    defeated = join(Beta, BetaLeader),
    other = join(Gamma, GammaLeader),
    barbarians = new Player(rules);

  barbarians.setCivilization(new Barbarian());
  game.players.register(barbarians);
  game.clients.register(
    new Client(person),
    new AIClient(defeated),
    new AIClient(other),
    new AIClient(barbarians)
  );

  // Bronze Working: the person knows it, and so does a computer player, so it may be inherited.
  [person, other].forEach((player) =>
    game.playerResearch.getByPlayer(player).addAdvance(BronzeWorking)
  );

  const site = world.get(5, 5),
    near = new Unit(null, barbarians, world.get(5, 8), rules),
    far = new Unit(null, barbarians, world.get(15, 15), rules);

  game.units.register(near, far);

  rules.register(
    new Added(
      new Effect((player: Player) =>
        game.playerResearch.register(new PlayerResearch(player, rules))
      )
    ),
    new Spawn(
      new Effect((player: Player, tile: Tile) => {
        new Settlers(null, player, tile, rules);
      })
    ),
    new Created(
      new Effect((unit: Unit) =>
        created.push([unit.player(), unit.constructor.name])
      )
    ),
    new Destroyed(new Effect((unit: Unit) => destroyed.push(unit))),
    ...getRules(game, { site: () => site })
  );

  // The defeated player leaves the game, as civ2-player's rules have it, before the respawn rule (`Low`).
  game.players.unregister(defeated);

  return {
    barbarians,
    created,
    defeated,
    destroyed,
    draws,
    far,
    game,
    near,
    other,
    person,
    rules,
    site,
    world,
  };
};

const newcomer = (game: Game, ...known: Player[]): Player | undefined =>
  game.players.entries().find((player) => !known.includes(player));

describe('respawn: the comeback', (): void => {
  it('comes back as an unused civilization with no reuse roll, its units at the site', async (): Promise<void> => {
    const {
      barbarians,
      created,
      defeated,
      destroyed,
      draws,
      game,
      near,
      other,
      person,
      rules,
    } = await setUp({ random: () => 0.9 });

    expect(chooseComeback(game)).eql({ reuse: false });
    expect(draws).length(0);

    rules.process(Defeated, defeated, person);

    const player = newcomer(game, person, other, barbarians)!;

    expect(player.civilization()).instanceOf(Delta);
    // Its Settlers; after turn 20, unseen by any person, a second; after turn 40, with Bronze Working inherited
    //  (0.9 × 4 = 3, not 0), a Phalanx.
    expect(
      created.filter(([owner]) => owner === player).map(([, name]) => name)
    ).eql(['Settlers', 'Settlers', 'Spearman']);
    expect(game.playerResearch.getByPlayer(player).completed(BronzeWorking))
      .true;
    // The barbarians within 8 squares are removed.
    expect(destroyed.length === 1 && destroyed[0] === near).true;
    // No reuse is recorded for a civilization that hadn't played.
    expect(game.pendingEffects.getByHandler(CIVILIZATION_USES)).length(0);
    expect(game.civilizations.length).equal(0);
  });

  it('gives no second Settlers where a person sees the site, nor before turn 21, and no Phalanx before turn 41', async (): Promise<void> => {
    const seen = await setUp(),
      early = await setUp({ turn: 20 }),
      middle = await setUp({ turn: 40 });

    seen.game.playerWorlds.getByPlayer(seen.person).register(seen.site);

    [seen, early, middle].forEach(({ rules, defeated, person }) =>
      rules.process(Defeated, defeated, person)
    );

    const unitsOf = ({
      created,
      game,
      person,
      other,
      barbarians,
    }: typeof seen) => {
      const player = newcomer(game, person, other, barbarians)!;

      return created
        .filter(([owner]) => owner === player)
        .map(([, name]) => name);
    };

    expect(unitsOf(seen)).eql(['Settlers']);
    expect(unitsOf(early)).eql(['Settlers']);
    expect(unitsOf(middle)).eql(['Settlers', 'Settlers']);
  });

  it('once every civilization has played, reuses one, 1 in (times used + 1), counting the use either way', async (): Promise<void> => {
    // Draws: the civilization (0: the first that played and isn't in the game, Beta), then the roll.
    const lucky = await setUp({ unused: false, random: () => 0.49 }),
      unlucky = await setUp({ unused: false, random: () => 0.5 });

    [lucky, unlucky].forEach(({ rules, defeated, person }) =>
      rules.process(Defeated, defeated, person)
    );

    const back = newcomer(
      lucky.game,
      lucky.person,
      lucky.other,
      lucky.barbarians
    )!;

    expect(back.civilization()).instanceOf(Beta);
    expect(timesUsed(Beta, lucky.game.pendingEffects)).equal(2);
    expect(
      newcomer(unlucky.game, unlucky.person, unlucky.other, unlucky.barbarians)
    ).undefined;
    expect(timesUsed(Beta, unlucky.game.pendingEffects)).equal(2);
    // Not left on offer for another to take.
    expect(unlucky.game.civilizations.length).equal(0);
  });

  it('rolls 1 in 3 for a civilization reused once already', async (): Promise<void> => {
    const { game, rules, defeated, person } = await setUp({
      unused: false,
      random: () => 0.34,
    });

    game.pendingEffects.register(
      new (require('@civ-clone/core-pending-effect/PendingEffect').default)(
        CIVILIZATION_USES,
        null,
        { Beta: '1' }
      )
    );

    rules.process(Defeated, defeated, person);

    expect(game.players.length).equal(3);
    expect(timesUsed(Beta, game.pendingEffects)).equal(3);
  });

  it('is switched off with its New Game setting', async (): Promise<void> => {
    const { game, rules, defeated, person } = await setUp();

    game.ruleSets.set(COMEBACKS_RULE_SET, false);
    rules.process(Defeated, defeated, person);

    expect(rules.getById(RESPAWN_RULE)!.enabled()).false;
    expect(game.players.length).equal(3);
  });
});
