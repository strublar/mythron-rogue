// TODO: Pure functions for 9×5 grid queries. No mutation — always return new data.
// Used by ActionSystem (legal move gen) and GreedyScorer (position evaluation).

import { Position, Unit, BOARD_COLS, BOARD_ROWS } from '../types';

/** True if position is within grid bounds */
export function isInBounds(pos: Position): boolean {
  return pos.col >= 0 && pos.col < BOARD_COLS && pos.row >= 0 && pos.row < BOARD_ROWS;
}

/** Manhattan distance between two positions */
export function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.col - b.col) + Math.abs(a.row - b.row);
}

/** Find unit occupying a position, or undefined */
export function unitAt(units: Unit[], pos: Position): Unit | undefined {
  return units.find(u => u.position.col === pos.col && u.position.row === pos.row);
}

/** All positions within moveRange steps (BFS, blocked by occupied tiles) */
export function reachableTiles(unit: Unit, allUnits: Unit[]): Position[] {
  // TODO: implement BFS respecting occupied tiles and board bounds
  void unit; void allUnits;
  return [];
}

/** All enemy units within attackRange of attacker */
export function attackableTargets(attacker: Unit, allUnits: Unit[]): Unit[] {
  // TODO: filter units by faction !== attacker.faction and distance <= attackRange
  void attacker; void allUnits;
  return [];
}

/** Adjacent positions (cardinal only, no diagonal) */
export function cardinalNeighbors(pos: Position): Position[] {
  return [
    { col: pos.col - 1, row: pos.row },
    { col: pos.col + 1, row: pos.row },
    { col: pos.col, row: pos.row - 1 },
    { col: pos.col, row: pos.row + 1 },
  ].filter(isInBounds);
}
