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
  const maxSteps = unit.stats.moveRange;
  const visited = new Map<string, number>();
  const queue: Array<{ pos: Position; steps: number }> = [{ pos: unit.position, steps: 0 }];
  const key = (p: Position) => `${p.col},${p.row}`;

  visited.set(key(unit.position), 0);

  while (queue.length > 0) {
    const { pos, steps } = queue.shift()!;
    if (steps >= maxSteps) continue;
    for (const neighbor of cardinalNeighbors(pos)) {
      const k = key(neighbor);
      if (visited.has(k)) continue;
      if (unitAt(allUnits, neighbor)) continue;
      visited.set(k, steps + 1);
      queue.push({ pos: neighbor, steps: steps + 1 });
    }
  }

  const startKey = key(unit.position);
  const result: Position[] = [];
  for (const [k, _] of visited) {
    if (k !== startKey) {
      const [col, row] = k.split(',').map(Number);
      result.push({ col, row });
    }
  }
  return result;
}

/** All enemy units within attackRange of attacker */
export function attackableTargets(attacker: Unit, allUnits: Unit[]): Unit[] {
  return allUnits.filter(
    u => u.faction !== attacker.faction &&
      manhattanDistance(attacker.position, u.position) <= attacker.stats.attackRange
  );
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
