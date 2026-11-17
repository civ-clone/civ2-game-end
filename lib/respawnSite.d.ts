import City from '@civ-clone/core-city/City';
import { GoodyHutRegistry } from '@civ-clone/core-goody-hut/GoodyHutRegistry';
import LandMass from '@civ-clone/core-world/LandMass';
import Tile from '@civ-clone/core-world/Tile';
import Unit from '@civ-clone/core-unit/Unit';
export type RespawnSiteOptions = {
  cities: City[];
  goodyHuts: GoodyHutRegistry;
  landMasses: LandMass[];
  /** Civ2's fertility of a square as the map was made, 0 or 8 to 15 (civ2-world's `fertility`). */
  fertility: (tile: Tile) => number;
  /** The distance between two squares, by the map's own steps. */
  distance: (from: Tile, to: Tile) => number;
  randomNumberGenerator: () => number;
  turn: number;
  units: Unit[];
};
/** The tries the original makes before it gives up (`civ_create_find_start`: `attempts < 0x7d1`). */
export declare const ATTEMPTS = 2000;
/**
 * Where a destroyed civilization comes back, as Civilization II looks for it (OpenCiv2 `src/auto/civ.cpp`
 *  `civ_create_find_start` ~4431, richardpenman/civ2@49f26ec). Its random tries reject a square that is:
 *
 * - ocean;
 * - of fertility below 12 − tries / 32 (a square in a city's radius has none here, and one near a city 8 at most, as
 *   the original lowers them around a city);
 * - nearer a city than 16 − tries / 128, or than 2;
 * - on a land mass with fewer fertile squares than 32 − turn / 16 − tries / 64;
 * - after turn 200, on a land mass with a city;
 * - with a hut, a city or a unit.
 *
 * Here each relaxation is tried in turn, every 32 tries, choosing at random among the squares that pass; `null` means
 * there is nowhere, as 2,000 failed tries do. A square within 3 rows of either pole is then refused, as the original
 * refuses the square it found.
 */
export declare const respawnSite: ({
  cities,
  distance,
  fertility,
  goodyHuts,
  landMasses,
  randomNumberGenerator,
  turn,
  units,
}: RespawnSiteOptions) => Tile | null;
export default respawnSite;
