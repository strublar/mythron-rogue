// TODO: Score each legal action for the AI. No lookahead — pure greedy.
// AI personality is controlled by tuning the weight constants below.
// Higher weight = AI prioritizes that type of action more.
// Example: boss has high GENERAL_DAMAGE weight → aggressively targets player general.

import { GameAction, GameState, ScoredAction } from '../types';
import { manhattanDistance } from '../engine/BoardState';

// Tunable weights — adjust per enemy type / boss personality
export interface ScoreWeights {
  generalDamage: number;    // reward for damaging player general
  unitDamage: number;       // reward for damaging player units
  unitKill: number;         // reward for killing a unit
  generalKill: number;      // reward for killing player general (win)
  positioning: number;      // reward for moving closer to player general
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  generalDamage: 3,
  unitDamage: 1,
  unitKill: 4,
  generalKill: 1000,
  positioning: 0.5,
};

export function scoreAction(
  action: GameAction,
  state: GameState,
  weights: ScoreWeights = DEFAULT_WEIGHTS,
): number {
  switch (action.type) {
    case 'endTurn':
      return 0;

    case 'move': {
      // TODO: reward moves that reduce distance to player general
      const unit = state.units.find(u => u.id === action.unitId);
      if (!unit) return 0;
      const before = manhattanDistance(unit.position, state.player.general.position);
      const after = manhattanDistance(action.to, state.player.general.position);
      return (before - after) * weights.positioning;
    }

    case 'attack': {
      // TODO: score based on target HP reduction and kill bonus
      const target = state.units.find(u => u.id === action.targetId);
      const attacker = state.units.find(u => u.id === action.attackerId);
      if (!target || !attacker) return 0;
      const isGeneral = target.id === state.player.general.id;
      const damage = attacker.stats.attack;
      const kills = damage >= target.stats.hp;
      let score = damage * (isGeneral ? weights.generalDamage : weights.unitDamage);
      if (kills) score += isGeneral ? weights.generalKill : weights.unitKill;
      return score;
    }

    case 'playCard':
      // TODO: delegate to per-card scoring once CardDefinition effects are defined
      return 1;
  }
}

/** Score all legal actions and return them sorted best-first */
export function scoreAllActions(
  actions: GameAction[],
  state: GameState,
  weights?: ScoreWeights,
): ScoredAction[] {
  return actions
    .map(action => ({ action, score: scoreAction(action, state, weights) }))
    .sort((a, b) => b.score - a.score);
}
