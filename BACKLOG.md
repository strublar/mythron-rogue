# MVP Fight — Task Backlog

Each task is atomic. One task = one commit. Execute in order.

---

## TASK-01 — BoardState: implement reachableTiles and attackableTargets

**File:** `src/engine/BoardState.ts`

Implement the two stubbed functions:

- `reachableTiles(board, unit, maxSteps)` — BFS from unit.position, respects occupied cells and board bounds, returns `Position[]` of reachable tiles (excluding the unit's own tile).
- `attackableTargets(board, unit, units)` — returns `Unit[]` that are cardinal neighbors of the unit and belong to the opposing player.

Reuse existing utilities: `isInBounds`, `manhattanDistance`, `unitAt`, `cardinalNeighbors` (all already in the same file).

**Types** (already in `src/types/index.ts`): `Position`, `Unit`, `BoardState`.

**Acceptance:** Pure functions, no side effects. Unit at position blocks BFS traversal. Return empty arrays if no valid targets.

---

## TASK-02 — GameState: place two generals on board at game start

**File:** `src/engine/GameState.ts`

In `createInitialGameState()`, after creating the initial state, add two `Unit` objects to `state.board.units[]`:

- Player general: `{ id: 'general-player', owner: 'player', position: { col: 0, row: 2 }, stats: { hp: 25, maxHp: 25, attack: 2, movement: 2 }, isGeneral: true, faction: 'lyonar' }`
- AI general: `{ id: 'general-ai', owner: 'ai', position: { col: 8, row: 2 }, stats: { hp: 25, maxHp: 25, attack: 2, movement: 2 }, isGeneral: true, faction: 'abyssian' }`

**Types** (already in `src/types/index.ts`): `Unit`, `GameState`.

**Acceptance:** `createInitialGameState().board.units` contains exactly 2 generals at the specified positions.

---

## TASK-03 — CombatScene: render 9×5 grid

**File:** `src/game/scenes/CombatScene.ts`

In the `create()` method:

1. Compute `cellSize` so the grid fills ~80% of canvas width in landscape (canvas 960×540 → cellSize = ~85px, grid = 765×425).
2. Center the grid on the canvas.
3. Draw grid using `this.add.graphics()`: filled rect per cell (dark background) + stroke border (lighter color). Alternate cell color slightly for checkerboard feel (optional).
4. Store `gridOriginX`, `gridOriginY`, `cellSize` as scene properties for reuse by later tasks.

Helper: `cellToPixel(col, row) → { x, y }` — returns the center pixel of a grid cell. Add as a private method.

**Acceptance:** Running `npm run dev` and navigating to the combat scene shows a visible 9×5 grid centered on screen.

---

## TASK-04 — CombatScene: load and render general sprites

**File:** `src/game/scenes/CombatScene.ts`

**Assets:**
- Player general sprite sheet: `public/resources/generals/f1/f1_general.png` (or similar — check the actual filename with a targeted ls of `public/resources/generals/f1/`)
- AI general sprite sheet: `public/resources/generals/f2/f2_general.png`

In `preload()`:
- Load both as spritesheets (`this.load.spritesheet`). Frame size is 128×128px (standard Duelyst unit frame — confirm with a quick file check).

In `create()`:
- After rendering the grid (TASK-03), call `renderUnits()`.
- `renderUnits()` iterates `gameState.board.units`, calls `cellToPixel()` for each unit's position, and places a sprite at that pixel.
- Store sprite references in a `Map<string, Phaser.GameObjects.Sprite>` keyed by `unit.id` for later updates.
- Flip the AI general sprite horizontally (`sprite.setFlipX(true)`).

**Acceptance:** Two general sprites appear on the grid at their starting positions (col 0 and col 8, row 2).

---

## TASK-05 — CombatScene: turn state machine + End Turn button

**File:** `src/game/scenes/CombatScene.ts`

Add a simple turn state machine:

```
type TurnPhase = 'PLAYER_TURN' | 'AI_TURN';
```

State:
- `currentPhase: TurnPhase` initialized to `'PLAYER_TURN'`
- `playerActedThisTurn: boolean` — track if the player has moved/attacked (for future use)

UI (using Phaser text/rectangle, not React):
- Turn indicator text top-center: "YOUR TURN" (green) or "AI TURN" (red).
- "End Turn" button bottom-right: rectangle + text. Clicking calls `endPlayerTurn()`.

`endPlayerTurn()`:
1. Sets `currentPhase = 'AI_TURN'`
2. Updates turn indicator text
3. Disables End Turn button
4. Calls `runAITurn()` (implemented in TASK-08)

`startPlayerTurn()`:
1. Sets `currentPhase = 'PLAYER_TURN'`
2. Updates turn indicator text
3. Re-enables End Turn button
4. Resets `playerActedThisTurn = false`

**Acceptance:** Turn indicator visible. Clicking End Turn switches to AI TURN text.

---

## TASK-06 — CombatScene: player move input

**File:** `src/game/scenes/CombatScene.ts`

Requires TASK-01, TASK-03, TASK-04, TASK-05 complete.

State to add:
- `selectedUnit: Unit | null`
- `highlightedTiles: Phaser.GameObjects.Rectangle[]`

Input flow:
1. On pointer down (grid area only), convert pixel to `{ col, row }` via `pixelToCell(x, y)`.
2. If `currentPhase !== 'PLAYER_TURN'`, ignore.
3. If a player-owned unit is at the clicked cell → select it, call `showReachableTiles(unit)`.
4. If a tile is highlighted and no enemy is there → call `moveUnit(selectedUnit, targetPos)`, clear highlights, deselect.

`showReachableTiles(unit)`:
- Calls `reachableTiles()` from BoardState.
- Draws semi-transparent blue rectangles over each reachable tile. Push to `highlightedTiles`.

`moveUnit(unit, pos)`:
- Updates `unit.position` in `gameState.board.units`.
- Moves the sprite to `cellToPixel(pos)` (instant or tweened).
- Clears `highlightedTiles`.

`pixelToCell(x, y) → Position | null`: inverse of `cellToPixel`. Returns null if out of bounds.

**Acceptance:** Click player general → blue tiles appear. Click a blue tile → general moves there.

---

## TASK-07 — CombatScene: player attack input

**File:** `src/game/scenes/CombatScene.ts`

Requires TASK-01, TASK-06 complete.

Extend the pointer-down handler from TASK-06:

When a unit is selected and the clicked cell contains an enemy unit that is in `attackableTargets()`:
1. Call `resolveAttack(attacker, defender)`.
2. Deselect and clear highlights.

`resolveAttack(attacker, defender)`:
- `defender.stats.hp -= attacker.stats.attack`
- `attacker.stats.hp -= defender.stats.attack` (counter-attack)
- Call `updateHPDisplay(unit)` for both units.
- If either unit `hp <= 0`, call `handleDeath(unit)`.

`updateHPDisplay(unit)`:
- Show or update a small text label below the sprite with current HP (e.g. "25 HP").
- Store labels in a `Map<string, Phaser.GameObjects.Text>` keyed by `unit.id`.

Highlight attackable enemies in red (via `showReachableTiles` extension or a separate `showAttackableTargets`).

**Acceptance:** Click player general → red highlight on adjacent enemies. Click enemy → both take damage, HP labels update.

---

## TASK-08 — AIController: auto-skip turn

**File:** `src/ai/AIController.ts` + `src/game/scenes/CombatScene.ts`

Keep AI simple for MVP: just end its turn immediately.

In `CombatScene`:
```ts
runAITurn() {
  this.time.delayedCall(800, () => {
    this.startPlayerTurn();
  });
}
```

Wire `runAITurn()` into `endPlayerTurn()` (already stubbed in TASK-05).

No changes needed to `AIController.ts` for MVP — the greedy scorer is skipped until combat is stable.

**Acceptance:** After clicking End Turn, "AI TURN" shows briefly, then "YOUR TURN" returns automatically after ~800ms.

---

## TASK-09 — CombatScene: death detection + game over screen

**File:** `src/game/scenes/CombatScene.ts`

`handleDeath(unit)`:
1. Remove `unit` from `gameState.board.units`.
2. Destroy the sprite and HP label from the scene.
3. If `unit.isGeneral`:
   - If `unit.owner === 'player'` → `showGameOver('DEFEAT')`
   - If `unit.owner === 'ai'` → `showGameOver('VICTORY')`

`showGameOver(result)`:
- Dim the screen with a semi-transparent overlay rectangle.
- Large centered text: "VICTORY" (gold) or "DEFEAT" (red).
- Sub-text: "Click to return" (or restart — keep simple).
- On pointer down: `this.scene.restart()` to reset the scene.

**Acceptance:** Kill the AI general (by attacking repeatedly via End Turn cycling) → VICTORY screen. Kill player general (cheat the HP values to test) → DEFEAT screen. Clicking restarts.

---

## Execution Order

```
TASK-01 → TASK-02 → TASK-03 → TASK-04 → TASK-05 → TASK-06 → TASK-07 → TASK-08 → TASK-09
```

All tasks depend on the previous. Do not skip or reorder.
