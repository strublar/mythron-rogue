import Phaser from 'phaser';
import { createUnitSprite, playUnitAnim } from '../UnitAnimator';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.scale;

    // Background layers
    this.add.image(width / 2, height / 2, 'menu_bg').setDisplaySize(width, height);
    this.add.image(width / 2, height / 2, 'menu_midground').setDisplaySize(width, height);

    // Animated general (left side)
    const sprite = createUnitSprite(this, 'f5_general', width * 0.28, height * 0.58);
    sprite.setScale(3.5);
    playUnitAnim(sprite, 'f5_general', 'breathing', true);

    // General portrait (right side)
    const portrait = this.add.image(width * 0.78, height * 0.48, 'menu_portrait');
    portrait.setScale(0.85);
    portrait.setAlpha(0.92);

    // Vignette overlay
    this.add.image(width / 2, height / 2, 'menu_vignette').setDisplaySize(width, height).setAlpha(0.55);

    // Title
    this.add.text(width / 2, height * 0.18, 'MYTHRON ROGUE', {
      fontSize: '52px',
      fontFamily: 'Georgia, serif',
      color: '#f0d080',
      stroke: '#3a1a00',
      strokeThickness: 6,
      shadow: { offsetX: 2, offsetY: 4, color: '#000000', blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.29, 'Slay. Draft. Survive.', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#c0a060',
      stroke: '#1a0a00',
      strokeThickness: 3,
    }).setOrigin(0.5);

    this.buildStartButton(width / 2, height * 0.72);
  }

  private buildStartButton(x: number, y: number): void {
    const btn = this.add.image(x, y, 'btn_confirm').setInteractive({ useHandCursor: true });
    const btnGlow = this.add.image(x, y, 'btn_confirm_glow').setAlpha(0);

    const label = this.add.text(x, y, 'START COMBAT', {
      fontSize: '20px',
      fontFamily: 'Georgia, serif',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(1);

    btn.on('pointerover', () => {
      btnGlow.setAlpha(1);
      label.setColor('#ffe080');
      this.tweens.add({ targets: btn, scaleX: 1.06, scaleY: 1.06, duration: 120, ease: 'Sine.easeOut' });
    });

    btn.on('pointerout', () => {
      btnGlow.setAlpha(0);
      label.setColor('#ffffff');
      this.tweens.add({ targets: btn, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
    });

    btn.on('pointerdown', () => {
      this.cameras.main.fadeOut(400, 0, 0, 0, (_cam: Phaser.Cameras.Scene2D.Camera, progress: number) => {
        if (progress === 1) {
          this.scene.start('CombatScene');
          this.scene.start('UIScene');
        }
      });
    });
  }
}
