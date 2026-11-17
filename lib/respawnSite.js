"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.respawnSite = exports.ATTEMPTS = void 0;
/** The tries the original makes before it gives up (`civ_create_find_start`: `attempts < 0x7d1`). */
exports.ATTEMPTS = 2000;
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
const respawnSite = ({ cities, distance, fertility, goodyHuts, landMasses, randomNumberGenerator, turn, units, }) => {
    const cityTiles = cities.map((city) => city.tile()), radius = new Set(cities.flatMap((city) => city.tiles().entries())), occupied = new Set([
        ...cityTiles,
        ...units.map((unit) => unit.tile()),
    ]), settled = new Set(landMasses.filter((landMass) => landMass.tiles().some((tile) => cityTiles.includes(tile)))), fertileSquares = new Map(landMasses.map((landMass) => [
        landMass,
        landMass.tiles().filter((tile) => fertility(tile) > 0)
            .length,
    ])), nearest = new Map(), nearestCity = (tile) => {
        if (!nearest.has(tile)) {
            // No city at all: 30, as the original takes it.
            nearest.set(tile, cityTiles.reduce((closest, cityTile) => Math.min(closest, distance(tile, cityTile)), cityTiles.length === 0 ? 30 : Infinity));
        }
        return nearest.get(tile);
    }, fertilityNow = (tile) => {
        if (radius.has(tile)) {
            return 0;
        }
        const value = fertility(tile);
        return nearestCity(tile) <= 3 && value > 0 ? 8 : value;
    };
    for (let tries = 0; tries <= exports.ATTEMPTS; tries += 32) {
        const candidates = landMasses
            .filter((landMass) => {
            var _a;
            return ((_a = fertileSquares.get(landMass)) !== null && _a !== void 0 ? _a : 0) >=
                32 - (turn >> 4) - (tries >> 6) &&
                !(turn > 200 && settled.has(landMass));
        })
            .flatMap((landMass) => landMass.tiles())
            .filter((tile) => tile.isLand() &&
            !occupied.has(tile) &&
            goodyHuts.getByTile(tile) === null &&
            fertilityNow(tile) >= 12 - (tries >> 5) &&
            nearestCity(tile) >= Math.max(16 - (tries >> 7), 2));
        if (candidates.length > 0) {
            const tile = candidates[Math.floor(randomNumberGenerator() * candidates.length)], height = tile.map().height();
            return tile.y() < 3 || tile.y() >= height - 3 ? null : tile;
        }
    }
    return null;
};
exports.respawnSite = respawnSite;
exports.default = exports.respawnSite;
//# sourceMappingURL=respawnSite.js.map