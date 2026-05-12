# Assets

Source: open-duelyst/duelyst (CC0 — no attribution required)

## TODO: Asset Pipeline

1. Copy unit spritesheets from open-duelyst repo into `src/assets/units/`
2. Copy UI sprites (tiles, card frames, icons) into `src/assets/ui/`
3. Register all assets in BootScene.preload()
4. Unit animation frames follow Duelyst convention: idle=0-3, walk=4-7, attack=8-11, death=12-15
5. VFX: Phaser particle system only — no Cocos2d .plist files

## Directory Structure (target)

```
src/assets/
  units/          # unit spritesheets (96×96 per frame)
  ui/             # tile textures, card frame, pip icons
  fx/             # particle textures (simple circles/sparks)
  audio/          # SFX (attack hit, card play, win/lose) — optional
```
