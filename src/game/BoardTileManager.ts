import Phaser from 'phaser';
import { BOARD_COLS, BOARD_ROWS } from '../types';

type CellToPixel = (col: number, row: number) => { x: number; y: number };

const FLOOR_TILE_OPACITY = 0.2;
const FLOOR_TILE_FRAME = 'tile_board.png';
const ATLAS_KEY = 'tiles_board';

interface TileEntry {
  img: Phaser.GameObjects.Image;
  scaleX: number;
  scaleY: number;
}

export class BoardTileManager {
  private scene: Phaser.Scene;
  private tiles: TileEntry[] = [];
  private cellToPixel: CellToPixel;
  private tileW: number;
  private tileH: number;

  constructor(scene: Phaser.Scene, cellToPixel: CellToPixel, tileW: number, tileH: number) {
    this.scene = scene;
    this.cellToPixel = cellToPixel;
    this.tileW = tileW;
    this.tileH = tileH;
    this.createTiles();
  }

  private createTiles(): void {
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const { x, y } = this.cellToPixel(col, row);
        const img = this.scene.add.image(x, y, ATLAS_KEY, FLOOR_TILE_FRAME)
          .setDisplaySize(this.tileW, this.tileH)
          .setDepth(col + row)
          .setAlpha(0);

        // Save target scale BEFORE zeroing it so the tween knows where to go.
        const scaleX = img.scaleX;
        const scaleY = img.scaleY;
        img.setScale(0);

        this.tiles[col + row * BOARD_COLS] = { img, scaleX, scaleY };
      }
    }
  }

  show(forPlayer2 = false, duration = 0.8): void {
    const shown = new Array(BOARD_COLS * BOARD_ROWS).fill(false);
    const startCol = forPlayer2 ? BOARD_COLS - 1 : 0;
    const startIdx = startCol;

    let waveFront: number[] = [startIdx];
    let nextWave: number[] = [];
    let delay = 0;
    const delayStep = duration * 0.1 * 1000;
    const fadeDur = duration * 0.3 * 1000;
    const scaleDur = duration * 1000;

    while (waveFront.length > 0) {
      for (const idx of waveFront) {
        if (shown[idx]) continue;
        shown[idx] = true;

        const col = idx % BOARD_COLS;
        const row = Math.floor(idx / BOARD_COLS);
        const entry = this.tiles[idx];
        if (!entry) continue;
        const { img, scaleX, scaleY } = entry;

        this.scene.tweens.add({
          targets: img,
          alpha: FLOOR_TILE_OPACITY,
          delay,
          duration: fadeDur,
          ease: 'Expo.easeIn',
        });
        this.scene.tweens.add({
          targets: img,
          scaleX,
          scaleY,
          delay,
          duration: scaleDur,
          ease: 'Back.easeOut',
        });

        if (row + 1 < BOARD_ROWS) nextWave.push(col + (row + 1) * BOARD_COLS);
        if (forPlayer2) {
          if (col - 1 >= 0) nextWave.push((col - 1) + row * BOARD_COLS);
        } else {
          if (col + 1 < BOARD_COLS) nextWave.push((col + 1) + row * BOARD_COLS);
        }
      }

      delay += delayStep;
      waveFront = nextWave.filter(i => !shown[i]);
      nextWave = [];
    }
  }

  hide(duration = 0.4): void {
    for (const entry of this.tiles) {
      if (!entry) continue;
      this.scene.tweens.add({
        targets: entry.img,
        alpha: 0,
        duration: duration * 1000,
        ease: 'Linear',
      });
    }
  }

  reposition(cellToPixel: CellToPixel, tileW: number, tileH: number): void {
    this.cellToPixel = cellToPixel;
    this.tileW = tileW;
    this.tileH = tileH;
    for (let row = 0; row < BOARD_ROWS; row++) {
      for (let col = 0; col < BOARD_COLS; col++) {
        const entry = this.tiles[col + row * BOARD_COLS];
        if (!entry) continue;
        const { x, y } = cellToPixel(col, row);
        entry.img.setPosition(x, y).setDisplaySize(tileW, tileH);
        entry.scaleX = entry.img.scaleX;
        entry.scaleY = entry.img.scaleY;
      }
    }
  }
}
