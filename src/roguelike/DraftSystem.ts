// TODO: Post-combat card draft (Slay the Spire style).
// - Generate N card offers (typically 3) from the card pool weighted by floor/faction
// - Player picks one card → added to run deck via RunState.addCardToDeck
// - Skip option: player can skip draft for gold compensation

import { CardDefinition, RunState } from '../types';
import { addCardToDeck } from './RunState';

export interface DraftOffer {
  cards: CardDefinition[];
}

/** Generate a draft offer for the player to choose from */
export function generateDraftOffer(
  run: RunState,
  cardPool: CardDefinition[],
  offerCount = 3,
): DraftOffer {
  // TODO: weight card pool by run.floor (higher floors → rarer cards)
  // TODO: exclude cards already at max copies in run.deck
  void run;
  const shuffled = [...cardPool].sort(() => Math.random() - 0.5);
  return { cards: shuffled.slice(0, offerCount) };
}

/** Player picks a card from the offer */
export function pickCard(run: RunState, offer: DraftOffer, pickedIndex: number): RunState {
  const card = offer.cards[pickedIndex];
  if (!card) throw new Error(`Invalid draft pick index: ${pickedIndex}`);
  return addCardToDeck(run, card);
}

/** Player skips draft — award gold instead */
export function skipDraft(run: RunState, goldReward: number): RunState {
  return { ...run, gold: run.gold + goldReward };
}
