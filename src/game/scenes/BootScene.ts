// TODO: Preload all game assets before any other scene runs.
// - Load unit spritesheets from open-duelyst CC0 assets (src/assets/)
// - Load UI sprites, tile textures, card art
// - Show a loading bar while assets stream in
// - On complete: transition to CombatScene (or RunSelectionScreen via React event)

import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    // TODO: this.load.spritesheet('unit_lyonar', 'assets/units/lyonar.png', { frameWidth: 96, frameHeight: 96 });
    // TODO: this.load.image('tile', 'assets/ui/tile.png');
    // TODO: add loading bar graphics
  }

  create(): void {
    // TODO: start CombatScene after assets loaded
    // this.scene.start('CombatScene');
  }
}
