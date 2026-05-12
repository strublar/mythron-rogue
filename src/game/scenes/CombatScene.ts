// TODO: Main tactical combat scene (9×5 grid).
// Responsibilities:
// - Render board tiles and unit sprites
// - Handle player pointer input (tap tile → select unit → tap target → move/attack)
// - Own GameState, ActionSystem instances for this combat encounter
// - Drive AIController on enemy turn
// - Emit 'combat:end' event when a general dies
// - Spawn Phaser particle VFX on attacks/spells

import Phaser from 'phaser';
import { GameState } from '../../types';
import { createInitialGameState } from '../../engine/GameState';
import { ActionSystem } from '../../engine/ActionSystem';
import { AIController } from '../../ai/AIController';

export class CombatScene extends Phaser.Scene {
  private gameState!: GameState;
  private actionSystem!: ActionSystem;
  private aiController!: AIController;

  // TODO: selectedUnitId tracks which unit the player has tapped
  private selectedUnitId: string | null = null;

  constructor() {
    super({ key: 'CombatScene' });
  }

  create(): void {
    this.gameState = createInitialGameState();
    this.actionSystem = new ActionSystem(this.gameState);
    this.aiController = new AIController(this.actionSystem);

    // TODO: render grid tiles
    // TODO: render unit sprites from gameState.units
    // TODO: register pointer input handlers
    // TODO: subscribe to turn:end event to trigger AI turn
  }

  update(_time: number, _delta: number): void {
    // TODO: sync sprite positions with gameState.units
    // TODO: run pending action animations from ActionSystem queue
  }
}
