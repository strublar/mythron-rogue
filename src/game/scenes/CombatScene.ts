// TODO: Main tactical combat scene (9×5 grid).
// Responsibilities:
// - Render board tiles and unit sprites
// - Handle player pointer input (tap tile → select unit → tap target → move/attack)
// - Own GameState, ActionSystem instances for this combat encounter
// - Drive AIController on enemy turn
// - Emit 'combat:end' event when a general dies
// - Spawn Phaser particle VFX on attacks/spells

import Phaser from 'phaser';
import { GameState, TurnPhase } from '../../types';
import { createInitialGameState } from '../../engine/GameState';

const COLS = 9;
const ROWS = 5;
const GRID_WIDTH_RATIO = 0.8;
const CELL_COLOR_A = 0x1a1a2e;
const CELL_COLOR_B = 0x16213e;
const BORDER_COLOR = 0x4a4a6a;

export class CombatScene extends Phaser.Scene {
  private gridOriginX!: number;
  private gridOriginY!: number;
  private cellSize!: number;
  private gameState!: GameState;
  private unitSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private currentPhase: TurnPhase = 'PLAYER_TURN';
  private playerActedThisTurn: boolean = false;
  private turnIndicator!: Phaser.GameObjects.Text;
  private endTurnBtn!: Phaser.GameObjects.Rectangle;
  private endTurnBtnText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'CombatScene' });
  }

  preload(): void {
    this.load.atlas('f1_general', 'resources/units/f1_general.png', 'resources/units/f1_general_atlas.json');
    this.load.atlas('f2_general', 'resources/units/f2_general.png', 'resources/units/f2_general_atlas.json');
  }

  create(): void {
    this.cellSize = Math.floor((this.scale.width * GRID_WIDTH_RATIO) / COLS);
    const gridWidth = COLS * this.cellSize;
    const gridHeight = ROWS * this.cellSize;
    this.gridOriginX = (this.scale.width - gridWidth) / 2;
    this.gridOriginY = (this.scale.height - gridHeight) / 2;

    const g = this.add.graphics();

    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = this.gridOriginX + col * this.cellSize;
        const y = this.gridOriginY + row * this.cellSize;
        const color = (col + row) % 2 === 0 ? CELL_COLOR_A : CELL_COLOR_B;
        g.fillStyle(color);
        g.fillRect(x, y, this.cellSize, this.cellSize);
      }
    }

    g.lineStyle(1, BORDER_COLOR);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x = this.gridOriginX + col * this.cellSize;
        const y = this.gridOriginY + row * this.cellSize;
        g.strokeRect(x, y, this.cellSize, this.cellSize);
      }
    }

    this.gameState = createInitialGameState();
    this.renderUnits();

    const cx = this.scale.width / 2;
    this.turnIndicator = this.add.text(cx, 16, 'YOUR TURN', {
      fontSize: '18px',
      color: '#00ff00',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    const btnW = 120;
    const btnH = 36;
    const btnX = this.scale.width - btnW / 2 - 12;
    const btnY = this.scale.height - btnH / 2 - 12;
    this.endTurnBtn = this.add.rectangle(btnX, btnY, btnW, btnH, 0x334466)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.endPlayerTurn());
    this.endTurnBtnText = this.add.text(btnX, btnY, 'End Turn', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5);

    // TODO: register pointer input handlers
  }

  endPlayerTurn(): void {
    if (this.currentPhase !== 'PLAYER_TURN') return;
    this.currentPhase = 'AI_TURN';
    this.turnIndicator.setText('AI TURN').setColor('#ff4444');
    this.endTurnBtn.disableInteractive();
    this.endTurnBtnText.setAlpha(0.4);
    this.runAITurn(this.playerActedThisTurn);
    this.playerActedThisTurn = false;
  }

  startPlayerTurn(): void {
    this.currentPhase = 'PLAYER_TURN';
    this.turnIndicator.setText('YOUR TURN').setColor('#00ff00');
    this.endTurnBtn.setInteractive({ useHandCursor: true });
    this.endTurnBtnText.setAlpha(1);
    this.playerActedThisTurn = false;
  }

  private runAITurn(_playerActed: boolean): void {
    // TASK-08: delegate to AIController.takeTurn()
    this.time.delayedCall(500, () => this.startPlayerTurn());
  }

  update(_time: number, _delta: number): void {
    // TODO: sync sprite positions with gameState.units
    // TODO: run pending action animations from ActionSystem queue
  }

  private renderUnits(): void {
    for (const unit of this.gameState.units) {
      const { x, y } = this.cellToPixel(unit.position.col, unit.position.row);
      const atlasKey = unit.faction === 'player' ? 'f1_general' : 'f2_general';
      const frameKey = unit.faction === 'player' ? 'f1_general_idle_000' : 'f2_general_idle_000';
      const sprite = this.add.sprite(x, y, atlasKey, frameKey);
      if (unit.faction === 'enemy') {
        sprite.setFlipX(true);
      }
      this.unitSprites.set(unit.id, sprite);
    }
  }

  protected cellToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: this.gridOriginX + col * this.cellSize + this.cellSize / 2,
      y: this.gridOriginY + row * this.cellSize + this.cellSize / 2,
    };
  }
}
