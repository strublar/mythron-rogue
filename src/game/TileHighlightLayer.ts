import Phaser from 'phaser';
import { Position, HighlightType, BOARD_COLS, BOARD_ROWS } from '../types';

type CellToPixel = (col: number, row: number) => { x: number; y: number };

const ATLAS_KEY = 'tiles_board';

const PREFIX: Record<HighlightType, string> = {
  move: 'tile_merged_large_',
  attack: 'tile_merged_hover_',
};

const TINT: Record<HighlightType, number> = {
  move: 0x4488ff,
  attack: 0xff4400,
};

// Maps the corner value string to atlas frame suffix.
// Only 6 values are possible given the diagonal guard in neighbor analysis.
const VALUE_TO_SUFFIX: Record<string, string> = {
  '': '0',
  '1': '01',
  '3': '03',
  '13': '013',
  '123': '0123',
  '_seam': '0_seam',
};

export class TileHighlightLayer {
  private scene: Phaser.Scene;
  private sprites: Phaser.GameObjects.Image[] = [];
  private cellToPixel: CellToPixel;
  private tileW: number;
  private tileH: number;

  constructor(scene: Phaser.Scene, cellToPixel: CellToPixel, tileW: number, tileH: number) {
    this.scene = scene;
    this.cellToPixel = cellToPixel;
    this.tileW = tileW;
    this.tileH = tileH;
  }

  show(positions: Position[], type: HighlightType, altPositions?: Position[]): void {
    this.clear();

    const set = new Set<string>(positions.map(p => `${p.col},${p.row}`));
    const altSet = altPositions
      ? new Set<string>(altPositions.map(p => `${p.col},${p.row}`))
      : null;

    const has = (col: number, row: number, s: Set<string>): boolean =>
      col >= 0 && col < BOARD_COLS && row >= 0 && row < BOARD_ROWS && s.has(`${col},${row}`);

    const prefix = PREFIX[type];
    const tint = TINT[type];

    for (const pos of positions) {
      const { col, row } = pos;
      const { x, y } = this.cellToPixel(col, row);
      const depth = col + row + 0.1;

      const nl = has(col - 1, row, set);
      const nr = has(col + 1, row, set);
      const nt = has(col, row - 1, set);   // y-down: row-1 = visually above
      const nb = has(col, row + 1, set);
      const ntl = nt && nl && has(col - 1, row - 1, set);
      const ntr = nt && nr && has(col + 1, row - 1, set);
      const nbl = nb && nl && has(col - 1, row + 1, set);
      const nbr = nb && nr && has(col + 1, row + 1, set);

      let tlVal = (nl ? '1' : '') + (ntl ? '2' : '') + (nt ? '3' : '');
      let trVal = (nt ? '1' : '') + (ntr ? '2' : '') + (nr ? '3' : '');
      let brVal = (nr ? '1' : '') + (nbr ? '2' : '') + (nb ? '3' : '');
      let blVal = (nb ? '1' : '') + (nbl ? '2' : '') + (nl ? '3' : '');

      // seam: corner is empty but adjacent to altMap
      if (altSet) {
        if (!tlVal && (has(col - 1, row, altSet) || has(col, row - 1, altSet) || has(col - 1, row - 1, altSet))) tlVal = '_seam';
        if (!trVal && (has(col, row - 1, altSet) || has(col + 1, row, altSet) || has(col + 1, row - 1, altSet))) trVal = '_seam';
        if (!brVal && (has(col + 1, row, altSet) || has(col, row + 1, altSet) || has(col + 1, row + 1, altSet))) brVal = '_seam';
        if (!blVal && (has(col, row + 1, altSet) || has(col - 1, row, altSet) || has(col - 1, row + 1, altSet))) blVal = '_seam';
      }

      const corners: Array<{ val: string; dx: number; dy: number; angle: number }> = [
        { val: tlVal, dx: -this.tileW / 4, dy: -this.tileH / 4, angle: 0 },
        { val: trVal, dx: +this.tileW / 4, dy: -this.tileH / 4, angle: 90 },
        { val: brVal, dx: +this.tileW / 4, dy: +this.tileH / 4, angle: 180 },
        { val: blVal, dx: -this.tileW / 4, dy: +this.tileH / 4, angle: 270 },
      ];

      for (const { val, dx, dy, angle } of corners) {
        const suffix = VALUE_TO_SUFFIX[val] ?? VALUE_TO_SUFFIX[''];
        const frame = `${prefix}${suffix}.png`;
        // For 90° and 270° rotations Phaser's setAngle swaps the visual axes,
        // so swap displaySize dimensions to keep the post-rotation footprint at tileW/2 × tileH/2.
        const sideways = angle === 90 || angle === 270;
        const dispW = sideways ? this.tileH / 2 : this.tileW / 2;
        const dispH = sideways ? this.tileW / 2 : this.tileH / 2;
        const sprite = this.scene.add.image(x + dx, y + dy, ATLAS_KEY, frame)
          .setDisplaySize(dispW, dispH)
          .setAngle(angle)
          .setDepth(depth)
          .setTint(tint)
          .setAlpha(0.75);
        this.sprites.push(sprite);
      }
    }
  }

  absorb(other: TileHighlightLayer): void {
    this.sprites.push(...other.sprites);
    other.sprites = [];
  }

  clear(fadeDuration?: number): void {
    if (fadeDuration) {
      for (const sprite of this.sprites) {
        this.scene.tweens.add({
          targets: sprite,
          alpha: 0,
          duration: fadeDuration * 1000,
          ease: 'Linear',
          onComplete: () => sprite.destroy(),
        });
      }
    } else {
      for (const sprite of this.sprites) sprite.destroy();
    }
    this.sprites = [];
  }

  reposition(cellToPixel: CellToPixel, tileW: number, tileH: number): void {
    this.cellToPixel = cellToPixel;
    this.tileW = tileW;
    this.tileH = tileH;
    // Highlights are ephemeral — caller re-shows them after reposition if needed.
    this.clear();
  }
}
