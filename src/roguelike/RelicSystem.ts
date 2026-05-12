// TODO: Relic pool management and passive effect application.
// Relics are awarded at milestone floors (every 3rd floor, after boss, etc.).
// Player picks 1 of N relics offered. Effects are passive — applied via hooks
// that fire at defined game events (start-of-turn, on-attack, on-card-play, etc.).
// Relic effects hook into ActionSystem or GameState mutations.

import { RelicDefinition, RunState } from '../types';
import { addRelic } from './RunState';

// TODO: define full RELIC_POOL array in src/data/relics.ts
const RELIC_POOL: RelicDefinition[] = [
  // placeholder entries
  { id: 'iron_hide', name: 'Iron Hide', description: '+2 max HP per combat start' },
  { id: 'battle_hymn', name: 'Battle Hymn', description: 'First card each turn costs 0 mana' },
];

export interface RelicOffer {
  relics: RelicDefinition[];
}

/** Generate relic offer (player picks 1 of N) */
export function generateRelicOffer(run: RunState, offerCount = 2): RelicOffer {
  // TODO: exclude relics already held in run.relics
  const available = RELIC_POOL.filter(r => !run.relics.some(held => held.id === r.id));
  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return { relics: shuffled.slice(0, offerCount) };
}

/** Player picks a relic */
export function pickRelic(run: RunState, offer: RelicOffer, pickedIndex: number): RunState {
  const relic = offer.relics[pickedIndex];
  if (!relic) throw new Error(`Invalid relic pick index: ${pickedIndex}`);
  return addRelic(run, relic);
}

// TODO: applyRelicEffects(event, gameState, relics) — called by ActionSystem on each event
