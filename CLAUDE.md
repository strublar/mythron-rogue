# CLAUDE.md — Mythron-Rogue

## 🎮 Project

Roguelike game built on top of Duelyst's CC0 assets (units, UI, artwork).
Gameplay loop: Slay the Spire-style meta (runs, card draft, relics, boss progression) over Duelyst's tactical grid combat.
Solo offline only — no multiplayer, no server infra.

**Assets source:** `open-duelyst/duelyst` (CC0 — fully free, commercial use allowed, no attribution required)

---

## 🛠 Stack

| Layer | Tech |
|---|---|
| Game engine | Phaser 3 |
| Language | TypeScript |
| Bundler | Vite |
| CI/CD | GitHub Actions → Vercel (preview URL per PR) |
| Mobile | Browser-first (landscape), Capacitor for store packaging later |

---

## 🗂 Architecture

See `ARCHITECTURE.md` for all file paths. No blind exploration.

Key directories:
```
src/
  game/         # Phaser scenes, game loop
  engine/       # Card resolution, board state, action system
  ai/           # Greedy AI scorer
  roguelike/    # Meta-loop: runs, draft, relics, progression
  assets/       # Sprites, spritesheets (from open-duelyst CC0)
  ui/           # React/HTML overlay (meta-loop UI, outside Phaser canvas)
```

---

## 🚨 SURVIVAL RULES (Token Economy)

**Zero Blind Exploration:** No `find` or `ls -R`. Use `ARCHITECTURE.md` for paths.

**Atomic Reads:** Never read a file >200 lines in full. Always use `grep` or precise line ranges.

**No Synthesis:** Never generate a "Comprehensive Report" or architecture summary.

**Strike Plan:** Bullet list `(File | Action | Impact)`. No prose. Wait for validation before coding.

**Plan Mode Lock:** Stay in plan mode. No file edits until user says `ok`, `go`, or `accept`.

**Grep Ladder:** `files_with_matches` → `content (-C 3 max)` → `Read (targeted range)`. Never skip a step.

**Output Contract:** Before any Read, state: `"I need X to do Y."` If X is not precise, grep first.

**Diff-Only:** For modifications, show only impacted lines. Never rewrite a file >50 lines in full.

**No Verbosity:** No pleasantries, no summary of what you're about to do, no post-coding explanation.

**Avoid Duplication:** Extract shared logic into reusable utilities instead of copy-pasting.

**Atomic Task:** One task = one commit. No grouping refactor + feature + bugfix in the same session.

**Agent Isolation:** For tasks requiring exploration of >3 files, delegate research to a sub-agent.

---

## 🤖 Sub-Agent Output Contract

Include this block in any sub-agent prompt:

```
Rules (mandatory):
- No find/ls -R. Use ARCHITECTURE.md for paths.
- No full reads of files >200 lines. Use grep or targeted line ranges only.
- Grep Ladder: files_with_matches → content (-C 3 max) → Read (targeted range). Never skip a step.
- Output Contract: before any Read, state exactly "I need X to do Y". If X is not precise, grep first.
- Report in under 150 words. Return ONLY: bullet list of (file path | line range | one-line finding).
```

---

## 📐 Code Principles

**Type-First:** Always define Types/Interfaces before implementing logic.

**Simplicity First:** Minimum code that solves the problem. No speculative abstractions.

**Surgical Changes:** Touch only what's needed. Don't improve adjacent code.

**Modularity:** If a component/module exceeds 150-200 lines, propose extraction.

**Strict DRY:** Extract shared logic (e.g. shared board utilities, card resolvers).

**Mobile-first:** Touch input via Phaser pointer API (unified mouse/touch). Grid tap targets must be finger-friendly. Test on mobile browser at every PR via Vercel preview URL.

---

## 🎯 Game Design Constraints

**AI:** Greedy scorer only. Generate all legal actions → score each → play best. No lookahead.
AI personality via score weight tuning (aggressive boss = high `general_damage` weight, etc.).

**VFX:** Phaser particle system only (no Cocos2d `.plist` assets). Simple effects first, polish last.

**Cards:** Defined as JSON/TypeScript data objects. No switch/case factory pattern.

**Board:** 9×5 grid, landscape orientation. Zoom/pan on mobile if needed.

**Meta-loop:** Run selection → combat → card draft → relic → next combat → boss.
All meta-loop UI lives outside the Phaser canvas (HTML overlay).

---

## 🗣️ Communication Style

Respond like caveman. No articles. No filler words. No pleasantries. Short. Direct. Grunt-level brevity. Code speaks for itself. If asked for code, give code. No explain unless asked.

---

## 🗜 Compact Instructions

When compacting context, preserve:
- Current task description and Strike Plan
- All Types/Interfaces defined in the session
- File paths and line ranges already identified
- Decisions made (chosen approach, rejected alternatives)
- Current git branch name

Remove:
- Full contents of already-read, unmodified files
- Exploration results from completed sub-tasks
- Verbose error messages already resolved
