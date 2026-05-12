// TODO: Drives the enemy turn using greedy scoring.
// Algorithm: generate all legal actions → score each → dispatch best → repeat until endTurn is best.
// CombatScene calls takeTurn() at the start of each enemy turn.
// Add artificial delay between actions so the player can follow what the AI is doing.

import { ActionSystem } from '../engine/ActionSystem';
import { scoreAllActions, ScoreWeights } from './GreedyScorer';

export class AIController {
  private actionSystem: ActionSystem;
  private weights: ScoreWeights | undefined;

  constructor(actionSystem: ActionSystem, weights?: ScoreWeights) {
    this.actionSystem = actionSystem;
    this.weights = weights;
  }

  /** Execute the full enemy turn synchronously (call from CombatScene) */
  takeTurn(): void {
    // TODO: add per-action animation delay (e.g. 400ms between actions) for readability
    // TODO: guard: only run if activePlayer === 'enemy'

    let safetyLimit = 50; // prevent infinite loops during development

    while (safetyLimit-- > 0) {
      const state = this.actionSystem.getState();
      const legal = this.actionSystem.generateLegalActions();
      const scored = scoreAllActions(legal, state, this.weights);

      const best = scored[0];
      if (!best || best.action.type === 'endTurn') {
        this.actionSystem.dispatch({ type: 'endTurn' });
        break;
      }

      this.actionSystem.dispatch(best.action);
    }
  }
}
