// Main tactical combat scene (9×5 grid).
// Responsibilities:
// - Render board tiles and unit sprites
// - Handle player pointer input (tap tile → select unit → tap target → move/attack)
// - Own GameState, ActionSystem instances for this combat encounter
// - Drive AIController on enemy turn
// - Emit 'combat:end' event when a general dies
// - Spawn Phaser particle VFX on attacks/spells

import Phaser from 'phaser';
import { GameState, TurnPhase, Unit, Position } from '../../types';
import { createInitialGameState } from '../../engine/GameState';
import { reachableTiles, attackableTargets } from '../../engine/BoardState';
import { createUnitSprite, playUnitAnim, UnitAnimKey } from '../UnitAnimator';

const COLS = 9;
const ROWS = 5;
const GRID_WIDTH_RATIO = 0.72;
const MAX_MANA = 9;

export class CombatScene extends Phaser.Scene {
  private gridOriginX!: number;
  private gridOriginY!: number;
  private cellSize!: number;
  private gameState!: GameState;
  private unitSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private unitKeyMap: Map<string, string> = new Map();
  private bracketSprites: Map<string, Phaser.GameObjects.Image> = new Map();
  private currentPhase: TurnPhase = 'PLAYER_TURN';
  private playerActedThisTurn: boolean = false;
  private selectedUnit: Unit | null = null;
  private tileHighlights: Phaser.GameObjects.Image[] = [];
  private highlightedPositions: Position[] = [];
  private attackablePositions: Position[] = [];
  private hpLabels: Map<string, Phaser.GameObjects.Text> = new Map();
  private hpIcons: Map<string, Phaser.GameObjects.Image> = new Map();
  private turnIndicator!: Phaser.GameObjects.Text;
  private endTurnImage!: Phaser.GameObjects.Image;
  private manaIcons: Phaser.GameObjects.Image[] = [];
  private playerHpText!: Phaser.GameObjects.Text;
  private enemyHpText!: Phaser.GameObjects.Text;
  private tooltipContainer: Phaser.GameObjects.Container | null = null;
  private tooltipTimer: Phaser.Time.TimerEvent | null = null;
  private hoveredUnit: Unit | null = null;
  private gameOver = false;

  constructor() {
    super({ key: 'CombatScene' });
  }

  preload(): void {
    this.load.atlas('f1_general', 'resources/units/f1_general.png', 'resources/units/f1_general_atlas.json');
    this.load.atlas('f2_general', 'resources/units/f2_general.png', 'resources/units/f2_general_atlas.json');
    if (!this.textures.exists('combat_bg')) {
      this.load.image('combat_bg',     'resources/maps/battlemap0_background.png');
      this.load.image('combat_mid',    'resources/maps/battlemap0_middleground.png');
      this.load.image('tile_board',    'resources/tiles/tile_board.png');
      this.load.image('tile_hover',    'resources/tiles/tile_hover.png');
      this.load.image('tile_attack',   'resources/tiles/tile_attack.png');
      this.load.image('tile_grid',     'resources/tiles/tile_grid.png');
      this.load.image('bottom_bar',    'resources/ui/bottom_bar_background.png');
      this.load.image('bracket_p',     'resources/ui/bracket_friendly.png');
      this.load.image('bracket_e',     'resources/ui/bracket_enemy.png');
      this.load.image('icon_mana',     'resources/ui/icon_mana.png');
      this.load.image('icon_mana_off', 'resources/ui/icon_mana_inactive.png');
      this.load.image('icon_hp',       'resources/ui/icon_general_hp.png');
      this.load.image('btn_end_mine',  'resources/ui/button_end_turn_mine.png');
      this.load.image('btn_end_enemy', 'resources/ui/button_end_turn_enemy.png');
      this.load.image('notif_yours',   'resources/ui/notification_your_turn.png');
      this.load.image('notif_enemy',   'resources/ui/notification_enemy_turn.png');
      this.load.image('status_panel',  'resources/ui/status_panel.png');
    }
  }

  create(): void {
    const { width, height } = this.scale;

    // Grid geometry — leave room for top UI (~55px) and bottom bar (~80px)
    const TOP_UI_H = 55;
    const availableHeight = height - 90 - TOP_UI_H;
    this.cellSize = Math.floor(Math.min(
      (width * GRID_WIDTH_RATIO) / COLS,
      availableHeight / ROWS,
    ));
    const gridWidth = COLS * this.cellSize;
    const gridHeight = ROWS * this.cellSize;
    this.gridOriginX = (width - gridWidth) / 2;
    this.gridOriginY = (availableHeight - gridHeight) / 2 + TOP_UI_H + 10;

    this.drawBackground();
    this.drawGrid();

    this.gameState = createInitialGameState();
    this.renderUnits();
    this.drawPlayerHUDs();
    this.drawBottomBar();

    // Turn indicator (legacy text, kept for accessibility)
    const cx = width / 2;
    this.turnIndicator = this.add.text(cx, 6, 'YOUR TURN', {
      fontSize: '11px',
      color: '#88bbff',
      fontFamily: 'monospace',
    }).setOrigin(0.5, 0).setDepth(10).setAlpha(0.7);

    this.input.on('pointerdown', (ptr: Phaser.Input.Pointer) => this.handlePointerDown(ptr.x, ptr.y));
    this.input.on('pointermove', (ptr: Phaser.Input.Pointer) => this.handlePointerMove(ptr.x, ptr.y));
    this.input.on('pointerup', () => this.hideTooltip());
  }

  // ---------------------------------------------------------------------------
  // Visual layer builders
  // ---------------------------------------------------------------------------

  private drawBackground(): void {
    const { width, height } = this.scale;
    this.add.image(width / 2, height / 2, 'combat_bg')
      .setDisplaySize(width, height).setDepth(0);
    this.add.image(width / 2, height / 2, 'combat_mid')
      .setDisplaySize(width, height).setDepth(1).setAlpha(0.85);
  }

  private drawGrid(): void {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const { x, y } = this.cellToPixel(col, row);
        this.add.image(x, y, 'tile_board')
          .setDisplaySize(this.cellSize, this.cellSize)
          .setDepth(2).setAlpha(0.65);
        this.add.image(x, y, 'tile_grid')
          .setDisplaySize(this.cellSize, this.cellSize)
          .setDepth(3).setAlpha(0.25);
      }
    }
  }

  private drawPlayerHUDs(): void {
    const { width } = this.scale;
    const gs = this.gameState;
    const depth = 10;
    const py = 8;

    // --- Player 1 (top-left) ---
    this.add.text(10, py, 'PLAYER 1', { fontSize: '11px', color: '#aaddff', fontFamily: 'monospace' })
      .setDepth(depth);
    const hpIcon1 = this.add.image(10, py + 18, 'icon_hp').setDisplaySize(14, 14).setOrigin(0, 0.5).setDepth(depth);
    void hpIcon1;
    this.playerHpText = this.add.text(28, py + 11, `${gs.player.general.stats.hp}/${gs.player.general.stats.maxHp}`, {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
    }).setDepth(depth);
    this.drawManaPips(10, py + 32, gs.player.mana, gs.player.maxMana, depth);

    // --- Player 2 (top-right) ---
    this.add.text(width - 10, py, 'PLAYER 2', { fontSize: '11px', color: '#ffaaaa', fontFamily: 'monospace' })
      .setOrigin(1, 0).setDepth(depth);
    const hpIcon2 = this.add.image(width - 10, py + 18, 'icon_hp').setDisplaySize(14, 14).setOrigin(1, 0.5).setDepth(depth);
    void hpIcon2;
    this.enemyHpText = this.add.text(width - 28, py + 11, `${gs.enemy.general.stats.hp}/${gs.enemy.general.stats.maxHp}`, {
      fontSize: '11px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(depth);
    this.drawManaPips(width - 10 - (MAX_MANA * 14), py + 32, gs.enemy.mana, gs.enemy.maxMana, depth);
  }

  private drawManaPips(startX: number, y: number, mana: number, maxMana: number, depth: number): void {
    for (let i = 0; i < MAX_MANA; i++) {
      const key = i < maxMana && i < mana ? 'icon_mana' : 'icon_mana_off';
      const icon = this.add.image(startX + i * 14 + 7, y, key)
        .setDisplaySize(12, 12).setDepth(depth);
      this.manaIcons.push(icon);
    }
  }

  private drawBottomBar(): void {
    const { width, height } = this.scale;
    const barH = 80;
    const barY = height - barH / 2;
    const depth = 10;

    this.add.image(width / 2, barY, 'bottom_bar')
      .setDisplaySize(width, barH).setDepth(depth);

    // REPLACE button (left)
    const replaceBtn = this.add.text(70, barY, 'REPLACE', {
      fontSize: '12px', color: '#ffffff', fontFamily: 'monospace',
      backgroundColor: '#223355', padding: { x: 8, y: 6 },
    }).setOrigin(0.5, 0.5).setDepth(depth + 1).setInteractive({ useHandCursor: true });
    replaceBtn.on('pointerover', () => replaceBtn.setColor('#88ddff'));
    replaceBtn.on('pointerout', () => replaceBtn.setColor('#ffffff'));

    // Card slot placeholders (3 cards centred)
    const cardW = 50;
    const cardH = 66;
    const gap = 12;
    const totalW = 3 * cardW + 2 * gap;
    const startX = width / 2 - totalW / 2 + cardW / 2;
    for (let i = 0; i < 3; i++) {
      const cx = startX + i * (cardW + gap);
      const g = this.add.graphics().setDepth(depth + 1);
      g.lineStyle(1, 0x4466aa, 0.6);
      g.strokeRoundedRect(cx - cardW / 2, barY - cardH / 2, cardW, cardH, 4);
    }

    // END TURN button (right)
    this.endTurnImage = this.add.image(width - 80, barY, 'btn_end_mine')
      .setDisplaySize(130, 44).setDepth(depth + 1)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.endPlayerTurn())
      .on('pointerover', () => this.endTurnImage.setAlpha(0.85))
      .on('pointerout', () => this.endTurnImage.setAlpha(1));
  }

  // ---------------------------------------------------------------------------
  // HUD refresh
  // ---------------------------------------------------------------------------

  private refreshHUD(): void {
    const gs = this.gameState;
    this.playerHpText.setText(`${gs.player.general.stats.hp}/${gs.player.general.stats.maxHp}`);
    this.enemyHpText.setText(`${gs.enemy.general.stats.hp}/${gs.enemy.general.stats.maxHp}`);
    // Refresh mana pips
    for (const icon of this.manaIcons) icon.destroy();
    this.manaIcons = [];
    const { width } = this.scale;
    const depth = 10;
    const py = 8;
    this.drawManaPips(10, py + 32, gs.player.mana, gs.player.maxMana, depth);
    this.drawManaPips(width - 10 - (MAX_MANA * 14), py + 32, gs.enemy.mana, gs.enemy.maxMana, depth);
  }

  // ---------------------------------------------------------------------------
  // Turn flow
  // ---------------------------------------------------------------------------

  endPlayerTurn(): void {
    if (this.currentPhase !== 'PLAYER_TURN') return;
    this.currentPhase = 'AI_TURN';
    this.turnIndicator.setText('AI TURN').setColor('#ff8888');
    this.endTurnImage.setTexture('btn_end_enemy').setAlpha(0.55).disableInteractive();
    this.showTurnNotification('notif_enemy');
    this.runAITurn(this.playerActedThisTurn);
    this.playerActedThisTurn = false;
  }

  startPlayerTurn(): void {
    this.currentPhase = 'PLAYER_TURN';
    this.turnIndicator.setText('YOUR TURN').setColor('#88bbff');
    this.endTurnImage.setTexture('btn_end_mine').setAlpha(1).setInteractive({ useHandCursor: true });
    this.playerActedThisTurn = false;
    for (const unit of this.gameState.units) {
      if (unit.faction === 'player') {
        unit.hasMoved = false;
        unit.hasAttacked = false;
      }
    }
    // Increment mana (Duelyst: +1 per turn, cap 9)
    const ps = this.gameState.player;
    ps.maxMana = Math.min(ps.maxMana + 1, MAX_MANA);
    ps.mana = ps.maxMana;
    this.refreshHUD();
    this.showTurnNotification('notif_yours');
  }

  private runAITurn(_playerActed: boolean): void {
    this.time.delayedCall(800, () => this.startPlayerTurn());
  }

  private showTurnNotification(key: 'notif_yours' | 'notif_enemy'): void {
    const { width, height } = this.scale;
    const img = this.add.image(width / 2, -80, key).setDepth(18).setScale(0.9);
    this.tweens.add({
      targets: img, y: height * 0.35, duration: 400, ease: 'Back.Out',
      onComplete: () => this.time.delayedCall(1200, () =>
        this.tweens.add({
          targets: img, y: -80, duration: 300, ease: 'Cubic.In',
          onComplete: () => img.destroy(),
        })
      ),
    });
  }

  update(_time: number, _delta: number): void {
    // Sync bracket positions with unit positions (after tweens)
    for (const unit of this.gameState.units) {
      const bracket = this.bracketSprites.get(unit.id);
      const sprite = this.unitSprites.get(unit.id);
      if (bracket && sprite) {
        bracket.setPosition(sprite.x, sprite.y);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Input
  // ---------------------------------------------------------------------------

  private handlePointerDown(x: number, y: number): void {
    if (this.gameOver) return;
    if (this.currentPhase !== 'PLAYER_TURN') return;
    const pos = this.pixelToCell(x, y);
    if (!pos) return;
    const unit = this.gameState.units.find(u => u.position.col === pos.col && u.position.row === pos.row);
    if (this.selectedUnit) {
      const isAttackable = this.attackablePositions.some(p => p.col === pos.col && p.row === pos.row);
      if (isAttackable && unit && unit.faction !== 'player') {
        this.resolveAttack(this.selectedUnit, unit);
        this.clearHighlights();
        this.selectedUnit = null;
        return;
      }
      const isHighlighted = this.highlightedPositions.some(p => p.col === pos.col && p.row === pos.row);
      if (isHighlighted && !unit) {
        this.moveUnit(this.selectedUnit, pos);
        return;
      }
      this.clearHighlights();
      this.selectedUnit = null;
    }
    if (unit?.faction === 'player' && (!unit.hasMoved || !unit.hasAttacked)) {
      this.selectedUnit = unit;
      this.showReachableTiles(unit);
    }
  }

  private handlePointerMove(x: number, y: number): void {
    const pos = this.pixelToCell(x, y);
    const unit = pos
      ? this.gameState.units.find(u => u.position.col === pos.col && u.position.row === pos.row) ?? null
      : null;
    if (unit === this.hoveredUnit) return;
    this.hoveredUnit = unit;
    this.tooltipTimer?.remove();
    this.tooltipTimer = null;
    this.hideTooltip();
    if (unit) {
      this.tooltipTimer = this.time.delayedCall(400, () => this.showTooltip(unit));
    }
  }

  // ---------------------------------------------------------------------------
  // Tooltip
  // ---------------------------------------------------------------------------

  private showTooltip(unit: Unit): void {
    this.hideTooltip();
    const { x, y } = this.cellToPixel(unit.position.col, unit.position.row);
    const panel = this.add.image(0, 0, 'status_panel').setDisplaySize(120, 72);
    const lines = [
      unit.definitionId,
      `ATK ${unit.stats.attack}   HP ${unit.stats.hp}/${unit.stats.maxHp}`,
      `MOV ${unit.stats.moveRange}   RNG ${unit.stats.attackRange}`,
    ];
    const text = this.add.text(0, 0, lines, {
      fontSize: '9px', color: '#ffffff', fontFamily: 'monospace', align: 'center',
    }).setOrigin(0.5);
    const ty = y - this.cellSize * 0.85;
    this.tooltipContainer = this.add.container(x, ty, [panel, text]).setDepth(15);
  }

  private hideTooltip(): void {
    this.tooltipContainer?.destroy();
    this.tooltipContainer = null;
  }

  // ---------------------------------------------------------------------------
  // Unit rendering
  // ---------------------------------------------------------------------------

  private renderUnits(): void {
    for (const unit of this.gameState.units) {
      const { x, y } = this.cellToPixel(unit.position.col, unit.position.row);
      const unitKey = unit.faction === 'player' ? 'f1_general' : 'f2_general';
      const sprite = createUnitSprite(this, unitKey, x, y)
        .setDisplaySize(this.cellSize * 1.6, this.cellSize * 1.6)
        .setDepth(5);
      if (unit.faction === 'enemy') sprite.setFlipX(true);
      this.unitSprites.set(unit.id, sprite);
      this.unitKeyMap.set(unit.id, unitKey);

      const bracketKey = unit.faction === 'player' ? 'bracket_p' : 'bracket_e';
      const bracket = this.add.image(x, y, bracketKey)
        .setDisplaySize(this.cellSize * 1.84, this.cellSize * 1.84)
        .setDepth(6);
      this.bracketSprites.set(unit.id, bracket);
    }
  }

  // ---------------------------------------------------------------------------
  // HP display
  // ---------------------------------------------------------------------------

  private updateHPDisplay(unit: Unit): void {
    const { x, y } = this.cellToPixel(unit.position.col, unit.position.row);
    const labelY = y + this.cellSize * 0.42;
    const iconX = x - 10;

    const existingLabel = this.hpLabels.get(unit.id);
    const existingIcon = this.hpIcons.get(unit.id);
    if (existingLabel) {
      existingLabel.setText(`${unit.stats.hp}`).setPosition(x + 2, labelY);
      existingIcon?.setPosition(iconX, labelY + 6);
    } else {
      const icon = this.add.image(iconX, labelY + 6, 'icon_hp')
        .setDisplaySize(12, 12).setDepth(7);
      this.hpIcons.set(unit.id, icon);
      const label = this.add.text(x + 2, labelY, `${unit.stats.hp}`, {
        fontSize: '10px', color: '#ffffff', fontFamily: 'monospace',
      }).setOrigin(0.5, 0).setDepth(7);
      this.hpLabels.set(unit.id, label);
    }
  }

  // ---------------------------------------------------------------------------
  // Highlights
  // ---------------------------------------------------------------------------

  private showReachableTiles(unit: Unit): void {
    this.clearHighlights();
    if (!unit.hasMoved) {
      const tiles = reachableTiles(unit, this.gameState.units);
      this.highlightedPositions = tiles;
      for (const pos of tiles) {
        const { x, y } = this.cellToPixel(pos.col, pos.row);
        const img = this.add.image(x, y, 'tile_hover')
          .setDisplaySize(this.cellSize * 1.15, this.cellSize * 1.15)
          .setAlpha(0.65).setDepth(4).setTint(0x4488ff);
        this.tileHighlights.push(img);
      }
    }
    if (!unit.hasAttacked) {
      this.showAttackableTargets(unit);
    }
  }

  private showAttackableTargets(unit: Unit): void {
    const targets = attackableTargets(unit, this.gameState.units);
    this.attackablePositions = targets.map(t => t.position);
    for (const target of targets) {
      const { x, y } = this.cellToPixel(target.position.col, target.position.row);
      const img = this.add.image(x, y, 'tile_hover')
        .setDisplaySize(this.cellSize * 1.15, this.cellSize * 1.15)
        .setAlpha(0.65).setDepth(4).setTint(0xff4400);
      this.tileHighlights.push(img);
    }
  }

  private clearHighlights(): void {
    for (const img of this.tileHighlights) img.destroy();
    this.tileHighlights = [];
    this.highlightedPositions = [];
    this.attackablePositions = [];
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  private moveUnit(unit: Unit, pos: Position): void {
    unit.position = pos;
    unit.hasMoved = true;
    const sprite = this.unitSprites.get(unit.id);
    if (sprite) {
      const { x, y } = this.cellToPixel(pos.col, pos.row);
      const unitKey = this.unitKeyMap.get(unit.id) ?? '';
      playUnitAnim(sprite, unitKey, 'run', false);
      this.tweens.add({
        targets: sprite, x, y, duration: 1000, ease: 'Linear',
        onComplete: () => playUnitAnim(sprite, unitKey, 'idle', false),
      });
    }
    this.clearHighlights();
    this.selectedUnit = null;
  }

  private resolveAttack(attacker: Unit, defender: Unit): void {
    defender.stats.hp -= attacker.stats.attack;
    attacker.stats.hp -= defender.stats.attack;
    attacker.hasAttacked = true;
    this.playerActedThisTurn = true;
    this.refreshHUD();

    const attackerSprite = this.unitSprites.get(attacker.id);
    const defenderSprite = this.unitSprites.get(defender.id);
    const attackerKey = this.unitKeyMap.get(attacker.id) ?? '';
    const defenderKey = this.unitKeyMap.get(defender.id) ?? '';
    const attackerDied = attacker.stats.hp <= 0;
    const defenderDied = defender.stats.hp <= 0;

    const afterHit = () => {
      this.updateHPDisplay(attacker);
      this.updateHPDisplay(defender);
      if (defenderDied) this.handleDeath(defender);
      else if (defenderSprite) playUnitAnim(defenderSprite, defenderKey, 'idle', false);
      if (attackerDied) this.handleDeath(attacker);
      else if (attackerSprite) playUnitAnim(attackerSprite, attackerKey, 'idle', false);
    };

    const afterAttack = () => {
      if (defenderSprite) {
        this.playAnimThen(defenderSprite, defenderKey, 'hit', afterHit);
      } else {
        afterHit();
      }
    };

    if (attackerSprite) {
      this.playAnimThen(attackerSprite, attackerKey, 'attack', afterAttack);
    } else {
      afterAttack();
    }
  }

  private playAnimThen(
    sprite: Phaser.GameObjects.Sprite,
    unitKey: string,
    anim: UnitAnimKey,
    callback: () => void,
  ): void {
    const globalKey = `${unitKey}_${anim}`;
    if (sprite.scene?.anims.exists(globalKey)) {
      sprite.once('animationcomplete', callback);
      playUnitAnim(sprite, unitKey, anim, false);
    } else {
      callback();
    }
  }

  private handleDeath(unit: Unit): void {
    this.gameState.units = this.gameState.units.filter(u => u.id !== unit.id);
    const dyingSprite = this.unitSprites.get(unit.id);
    const dyingKey = this.unitKeyMap.get(unit.id) ?? '';
    if (dyingSprite) {
      const deathAnimKey = `${dyingKey}_death`;
      if (dyingSprite.scene?.anims.exists(deathAnimKey)) {
        dyingSprite.once('animationcomplete', () => dyingSprite.destroy());
        playUnitAnim(dyingSprite, dyingKey, 'death', false);
      } else {
        dyingSprite.destroy();
      }
    }
    this.unitSprites.delete(unit.id);
    this.unitKeyMap.delete(unit.id);
    this.bracketSprites.get(unit.id)?.destroy();
    this.bracketSprites.delete(unit.id);
    this.hpLabels.get(unit.id)?.destroy();
    this.hpLabels.delete(unit.id);
    this.hpIcons.get(unit.id)?.destroy();
    this.hpIcons.delete(unit.id);
    if (unit.isGeneral) {
      this.showGameOver(unit.faction === 'player' ? 'DEFEAT' : 'VICTORY');
    }
  }

  private showGameOver(result: 'VICTORY' | 'DEFEAT'): void {
    this.gameOver = true;
    const { width, height } = this.scale;
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75)
      .setDepth(20).setInteractive();
    const color = result === 'VICTORY' ? '#ffd700' : '#ff2222';
    this.add.text(width / 2, height / 2 - 40, result, {
      fontSize: '56px', color, fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setDepth(21);
    this.add.text(width / 2, height / 2 + 30, 'Click to restart', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0.5).setDepth(21);
    overlay.on('pointerdown', () => this.scene.restart());
  }

  // ---------------------------------------------------------------------------
  // Coordinate helpers
  // ---------------------------------------------------------------------------

  private pixelToCell(x: number, y: number): Position | null {
    const col = Math.floor((x - this.gridOriginX) / this.cellSize);
    const row = Math.floor((y - this.gridOriginY) / this.cellSize);
    if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return null;
    return { col, row };
  }

  protected cellToPixel(col: number, row: number): { x: number; y: number } {
    return {
      x: this.gridOriginX + col * this.cellSize + this.cellSize / 2,
      y: this.gridOriginY + row * this.cellSize + this.cellSize / 2,
    };
  }
}
