import Phaser from 'phaser';
import { UnitAnimKey, createUnitSprite, playUnitAnim } from '../UnitAnimator';

const ANIMS: UnitAnimKey[] = ['idle', 'breathing', 'run', 'attack', 'cast', 'caststart', 'castloop', 'castend', 'hit', 'death'];

const BTN_W = 130;
const BTN_H = 36;
const BTN_PAD = 10;
const BTN_COLS = 2;

export class AnimTestScene extends Phaser.Scene {
  private sprite!: Phaser.GameObjects.Sprite;
  private unitKey = 'f5_general';
  private activeBtn: Phaser.GameObjects.Rectangle | null = null;
  private labelText!: Phaser.GameObjects.Text;

  constructor() {
    super({ key: 'AnimTestScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(0, 0, width, height, 0x1a1a2e).setOrigin(0);

    this.add.text(width / 2, 24, 'Animation Test — f5_general', {
      fontSize: '18px', color: '#ffffff', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.sprite = createUnitSprite(this, this.unitKey, width / 2, height / 2);
    this.sprite.setScale(3);

    this.labelText = this.add.text(width / 2, height / 2 + 140, 'idle', {
      fontSize: '14px', color: '#aaaaaa', fontFamily: 'monospace',
    }).setOrigin(0.5, 0);

    this.buildButtons();

    this.sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      playUnitAnim(this.sprite, this.unitKey, 'idle');
      this.labelText.setText('idle');
    });
  }

  private buildButtons(): void {
    const startX = 40;
    const startY = 100;

    ANIMS.forEach((anim, i) => {
      const col = i % BTN_COLS;
      const row = Math.floor(i / BTN_COLS);
      const x = startX + col * (BTN_W + BTN_PAD);
      const y = startY + row * (BTN_H + BTN_PAD);

      const bg = this.add.rectangle(x, y, BTN_W, BTN_H, 0x2d2d4e).setOrigin(0).setInteractive({ useHandCursor: true });
      const label = this.add.text(x + BTN_W / 2, y + BTN_H / 2, anim, {
        fontSize: '13px', color: '#ccccff', fontFamily: 'monospace',
      }).setOrigin(0.5);

      bg.on('pointerover', () => { if (bg !== this.activeBtn) bg.setFillStyle(0x3d3d6e); });
      bg.on('pointerout',  () => { if (bg !== this.activeBtn) bg.setFillStyle(0x2d2d4e); });
      bg.on('pointerdown', () => {
        if (this.activeBtn) this.activeBtn.setFillStyle(0x2d2d4e);
        bg.setFillStyle(0x5555aa);
        this.activeBtn = bg;
        label.setColor('#ffffff');

        // reset other labels
        this.children.list
          .filter(c => c instanceof Phaser.GameObjects.Text && c !== this.labelText && c !== label)
          .forEach(c => (c as Phaser.GameObjects.Text).setColor('#ccccff'));

        playUnitAnim(this.sprite, this.unitKey, anim, false);
        this.labelText.setText(anim);
      });
    });
  }
}
