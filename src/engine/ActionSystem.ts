// TODO: Legal action generation, action dispatch, and turn lifecycle.
// - generateLegalActions: returns all valid actions for current active player
// - dispatch: validates + applies action to GameState, emits events
// - Turn lifecycle: start-of-turn draw/mana, end-of-turn cleanup, win check

import { GameState, GameAction, MoveAction, AttackAction } from '../types';
import { reachableTiles, attackableTargets } from './BoardState';

export class ActionSystem {
  private state: GameState;

  // TODO: replace with typed event emitter (Phaser.Events.EventEmitter or mitt)
  private listeners: Array<(action: GameAction, next: GameState) => void> = [];

  constructor(initialState: GameState) {
    this.state = initialState;
  }

  getState(): GameState {
    return this.state;
  }

  /** All legal actions the current active player can take */
  generateLegalActions(): GameAction[] {
    const actions: GameAction[] = [];
    const { units, activePlayer } = this.state;

    for (const unit of units.filter(u => u.faction === activePlayer)) {
      if (!unit.hasMoved) {
        const tiles = reachableTiles(unit, units);
        const moveActions: MoveAction[] = tiles.map(to => ({ type: 'move', unitId: unit.id, to }));
        actions.push(...moveActions);
      }
      if (!unit.hasAttacked) {
        const targets = attackableTargets(unit, units);
        const attackActions: AttackAction[] = targets.map(t => ({
          type: 'attack',
          attackerId: unit.id,
          targetId: t.id,
        }));
        actions.push(...attackActions);
      }
    }

    // TODO: add PlayCardAction for each card in hand that player can afford
    actions.push({ type: 'endTurn' });
    return actions;
  }

  /** Validate + apply action, update state, notify listeners */
  dispatch(action: GameAction): void {
    // TODO: validate action is in generateLegalActions() result
    const next = this.applyAction(this.state, action);
    this.state = next;
    this.listeners.forEach(fn => fn(action, next));
  }

  on(fn: (action: GameAction, next: GameState) => void): void {
    this.listeners.push(fn);
  }

  private applyAction(state: GameState, action: GameAction): GameState {
    switch (action.type) {
      case 'move':
        // TODO: move unit to new position, set hasMoved = true
        return state;
      case 'attack':
        // TODO: apply combat damage both ways (Duelyst: defender counter-attacks)
        return state;
      case 'playCard':
        // TODO: delegate to CardResolver.resolveCard
        return state;
      case 'endTurn':
        // TODO: flip activePlayer, reset hasMoved/hasAttacked, increment mana, draw card
        return state;
    }
  }
}
