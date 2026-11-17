import Advance from '@civ-clone/core-science/Advance';
import { AddPlayerGame } from '@civ-clone/base-player/lib/addPlayer';
import Defeated from '@civ-clone/core-player/Rules/Defeated';
import { Game } from '@civ-clone/core-game';
import Player from '@civ-clone/core-player/Player';
import Respawns from '@civ-clone/base-game-end/Rules/Respawns';
export type RespawnGame = AddPlayerGame &
  Pick<
    Game,
    | 'cities'
    | 'clients'
    | 'difficulty'
    | 'goodyHuts'
    | 'landMasses'
    | 'pendingEffects'
    | 'playerResearch'
    | 'playerWorlds'
    | 'ruleSets'
    | 'turn'
    | 'units'
  >;
/** The last turn a destroyed civilization comes back on: 350 on Chieftain, 35 fewer each level up, 175 on Deity. */
export declare const lastRespawnTurn: (level: number) => number;
/**
 * What a civilization coming back may inherit (`civ_create_grant_advances`): each advance a person knows, unless only
 *  one other civilization knows it and a person discovered it first. Who discovered an advance first isn't kept, so
 *  an advance a computer player also knows is taken as one a computer player discovered. Barbarians aside.
 */
export declare const inheritable: (
  others: Player[],
  human: (player: Player) => boolean,
  completed: (player: Player) => (typeof Advance)[]
) => (typeof Advance)[];
export declare const getRules: (game: RespawnGame) => (Defeated | Respawns)[];
export default getRules;
