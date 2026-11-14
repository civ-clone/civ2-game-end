"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RETIREMENT_YEAR = exports.RETIREMENT_WARNING_YEAR = void 0;
// Civilization II's retirement (OpenCiv2 `src/auto/game.cpp` `game_check_retirement`, :5003): checked as each turn
//  starts, the leader is warned in the year 2000 and retires in 2020, at every level. Both are years the calendar
//  reaches exactly (`civ2-game-year`), and the game compares them exactly.
exports.RETIREMENT_WARNING_YEAR = 2000;
exports.RETIREMENT_YEAR = 2020;
//# sourceMappingURL=retirement.js.map