// TODO: Resolve card effects against GameState.
// Cards are data objects (CardDefinition). Resolver reads the effect payload
// and applies it (damage, summon, buff, draw, etc.) returning updated GameState.
// No switch/case — use a lookup table keyed by effect type.

import { GameState, CardDefinition, Position } from '../types';

// TODO: define CardEffect union type covering all effect variants
// e.g. { type: 'damage', amount: number, target: 'unit' | 'general' }
//      { type: 'summon', unitDefinitionId: string }
//      { type: 'draw', count: number }

export interface ResolveContext {
  state: GameState;
  card: CardDefinition;
  targetPosition?: Position;
  targetUnitId?: string;
}

/**
 * Apply card effects and return updated GameState.
 * TODO: implement per-effect-type handlers in a lookup table, not switch/case.
 */
export function resolveCard(ctx: ResolveContext): GameState {
  // TODO: validate mana cost against ctx.state.activePlayer mana
  // TODO: look up card's effect list, run each effect handler in sequence
  // TODO: deduct mana, remove card from hand
  void ctx;
  return ctx.state; // placeholder — replace with immutable state update
}
