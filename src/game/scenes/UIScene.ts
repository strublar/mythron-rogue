// TODO: In-game HUD rendered as a Phaser scene running in parallel with CombatScene.
// Shows: current mana pips, card hand (tappable), end-turn button, turn indicator.
// Kept separate from CombatScene so HUD can be updated without re-rendering the board.
// React overlay (RunHUD.tsx) handles run-level stats (HP, floor, gold) above this.

import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create(): void {
    // TODO: draw mana pip row
    // TODO: draw card hand row (tappable cards, each fires 'card:selected' event)
    // TODO: draw End Turn button → dispatch EndTurnAction
    // TODO: draw turn indicator text
  }

  // TODO: method to refresh hand display when cards are drawn/played
  // TODO: method to update mana pips on mana change
}
