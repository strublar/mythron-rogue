// TODO: Manages current run data (persists across combat encounters).
// RunState is read by React UI components and written by ProgressionSystem.
// On run start: pick faction → build starter deck → floor 1.
// On run end (win or death): clear state, return to main menu.

import { RunState, CardDefinition, RelicDefinition } from '../types';

export function createNewRun(factionId: string): RunState {
  // TODO: derive starter deck from factionId
  void factionId;
  return {
    floor: 1,
    playerHp: 25,
    playerMaxHp: 25,
    gold: 0,
    deck: [],    // TODO: populate with faction starter cards
    relics: [],
  };
}

/** Apply end-of-combat HP changes to run state */
export function applyPostCombat(
  run: RunState,
  damageTaken: number,
  goldEarned: number,
): RunState {
  return {
    ...run,
    playerHp: Math.max(0, run.playerHp - damageTaken),
    gold: run.gold + goldEarned,
    floor: run.floor + 1,
  };
}

/** Add a card to the run deck (from draft) */
export function addCardToDeck(run: RunState, card: CardDefinition): RunState {
  return { ...run, deck: [...run.deck, card] };
}

/** Add a relic to the run */
export function addRelic(run: RunState, relic: RelicDefinition): RunState {
  return { ...run, relics: [...run.relics, relic] };
}
