// TODO: Configure and create the Phaser.Game instance.
// - Add BootScene, CombatScene, UIScene to scene list
// - Canvas appended to document.body (React overlay sits above via z-index)
// - Scale: FIT mode, landscape, 1920×1080 base resolution

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { UIScene } from './scenes/UIScene';
import { AnimTestScene } from './scenes/AnimTestScene';
import { MainMenuScene } from './scenes/MainMenuScene';

export function createPhaserGame(): Phaser.Game {
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 1920,
    height: 1080,
    backgroundColor: '#1a1a2e',
    pixelArt: false,
    scale: {
      mode: Phaser.Scale.EXPAND,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, MainMenuScene, AnimTestScene, CombatScene, UIScene],
    // TODO: add physics config if projectile VFX need it
  });
}
