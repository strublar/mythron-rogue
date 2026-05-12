# ARCHITECTURE.md — Mythron-Rogue

## File Map

```
/
├── index.html                          # HTML shell, mounts #app (React) + Phaser canvas
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.ts                         # Entry: boots Phaser + mounts React overlay
    ├── types/
    │   └── index.ts                    # ALL shared types/interfaces (source of truth)
    ├── game/
    │   ├── PhaserGame.ts               # Phaser.Game instance + config
    │   └── scenes/
    │       ├── BootScene.ts            # Preloads all assets (sprites, audio)
    │       ├── CombatScene.ts          # Main tactical grid combat scene
    │       └── UIScene.ts              # In-game HUD overlay (Phaser scene, on top of CombatScene)
    ├── engine/
    │   ├── GameState.ts                # Full game state (board + hand + mana + turn)
    │   ├── BoardState.ts               # 9×5 grid: unit placement, movement validation
    │   ├── CardResolver.ts             # Resolves card effects (damage, summon, buff, etc.)
    │   └── ActionSystem.ts             # Action queue, legal action gen, turn lifecycle
    ├── ai/
    │   ├── GreedyScorer.ts             # Scores each legal action (no lookahead)
    │   └── AIController.ts             # Picks highest-scored action, executes, repeats
    ├── roguelike/
    │   ├── RunState.ts                 # Current run: deck, relics, HP, floor, gold
    │   ├── DraftSystem.ts              # Card draft: offer N cards, player picks one
    │   ├── RelicSystem.ts              # Relic pool, pickup, passive effect application
    │   └── ProgressionSystem.ts        # Encounter ladder: floor → combat → boss
    ├── assets/
    │   └── README.md                   # CC0 asset pipeline notes (open-duelyst source)
    └── ui/
        ├── App.tsx                     # React root, routes between meta-loop screens
        ├── RunHUD.tsx                  # HP, gold, floor counter (shown during combat)
        ├── DraftScreen.tsx             # Card pick UI (post-combat)
        └── RelicScreen.tsx             # Relic pick UI (milestone rewards)
```

## Data Flow

```
main.ts
  ├── PhaserGame (canvas)
  │     BootScene → CombatScene + UIScene (parallel)
  │     CombatScene owns: GameState, ActionSystem, CardResolver, BoardState
  │     AIController polls ActionSystem each enemy turn
  └── React App (HTML overlay, z-index above canvas)
        RunHUD ←── RunState (read-only during combat)
        DraftScreen ←── DraftSystem (post-combat)
        RelicScreen ←── RelicSystem (milestone)
        ProgressionSystem drives screen transitions
```

## Key Constraints

- Board: 9 cols × 5 rows, 0-indexed, [col, row]
- Cards: plain TS data objects (no class factory, no switch/case)
- AI: greedy only — generate all legal actions, score each, play best
- VFX: Phaser particle system only
- Meta UI: HTML/React only, never inside Phaser canvas
