// TODO: Configure and create the Phaser.Game instance.
// - Add BootScene, CombatScene, UIScene to scene list
// - Canvas appended to document.body (React overlay sits above via z-index)
// - Scale: FIT mode, landscape, 1280×720 base resolution

import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CombatScene } from './scenes/CombatScene';
import { UIScene } from './scenes/UIScene';

export function createPhaserGame(): Phaser.Game {
  // TODO: tune antialias, pixelArt, backgroundColor per art style decision
  return new Phaser.Game({
    type: Phaser.AUTO,
    width: 1280,
    height: 720,
    backgroundColor: '#1a1a2e',
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [BootScene, CombatScene, UIScene],
    // TODO: add physics config if projectile VFX need it
  });
}
