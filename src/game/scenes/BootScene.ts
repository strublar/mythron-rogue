import Phaser from 'phaser';
import { UNIT_DEFS } from '../UnitAnimator';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload(): void {
    this.loadUnitAtlases();
    // TODO: this.load.image('tile', 'assets/ui/tile.png');
  }

  private loadUnitAtlases(): void {
    for (const [unitKey, def] of Object.entries(UNIT_DEFS)) {
      const base = `resources/units/${unitKey}`;
      this.load.atlas(def.atlasKey, `${base}.png`, `${base}_atlas.json`);
    }
  }

  create(): void {
    this.scene.start('AnimTestScene');
  }
}
