# CLAUDE.md — AI Agent Instructions for Uno Rummy Up

This file provides instructions for AI agents (Claude Code and others) working in this repository.

---

## Project Summary

A browser-based Uno Rummy Up tile game built with React 18 + TypeScript + Vite. One human player vs. 1–3 zoo-creature CPU opponents. Full drag-and-drop tile gameplay on a free-form canvas.

---

## Non-Negotiable Rules

### 1. `game-rules.md` is the source of truth

Never invent, guess, or modify game rules. If there is any ambiguity in game behavior, consult `game-rules.md` first. Do not implement behavior that contradicts it.

### 2. Single type definition location

All shared TypeScript types and interfaces live in **`src/engine/types.ts`** only. Never duplicate type definitions elsewhere. Import from `src/engine/types.ts`.

### 3. State mutations go through the store only

All game state changes must go through **`src/store/gameStore.ts`**. Never mutate tile arrays, player hands, or table groups directly in components. Components only call store actions.

### 4. Engine functions are pure

Functions in `src/engine/` must be **pure functions** (no side effects, no store access, no React hooks). They take data, return data.

### 5. AI logic stays in `src/ai/`

Never implement AI decision logic in components or the store. All CPU behavior goes in `src/ai/creatures/`. All creatures must extend `BaseAI` from `src/ai/baseAI.ts`.

### 6. Color constants only from `src/styles/colors.ts`

Never hardcode hex color values. Use the exported constants from `src/styles/colors.ts` which mirrors the official Uno color scheme SVG.

### 7. Drag and drop only through `useDragDrop`

The `src/hooks/useDragDrop.ts` hook is the sole interface for DnD interactions. Do not wire `@dnd-kit` event handlers directly in components — use the hook.

### 8. Sound triggers: components and store only

`useSound()` hook calls belong in React components or store actions. Never call sounds from engine functions or AI files.

### 9. Tile IDs are stable identifiers

Tile IDs follow these patterns and must never change during a game:
- Number tiles: `{color}_{slot}_{copy}` — e.g. `red_9_a`, `blue_3_b`
- Special tiles: `{color}_{type}_{copy}` — e.g. `yellow_draw2_a`, `green_skip_b`
- Wild tiles: `wild_{0}` through `wild_{3}`

### 10. Run tests before committing engine changes

After modifying any file in `src/engine/`, run `npm run test` and ensure all tests pass before committing.

---

## Architecture Overview

```
src/
├── engine/          Pure game logic (no React, no side effects)
│   ├── types.ts          All shared types — import from here everywhere
│   ├── deckGenerator.ts  Tile deck creation and shuffling
│   ├── validationEngine.ts  Run/set/table validity checks
│   ├── manipulationEngine.ts  Pure tile movement operations
│   └── scoreEngine.ts    Point calculation and round/game win detection
│
├── store/           Zustand state management
│   ├── gameStore.ts      Central game state machine (all mutations here)
│   └── settingsStore.ts  Dark mode, sound, score history (persisted)
│
├── ai/              CPU opponent logic
│   ├── baseAI.ts         Abstract base class all creatures extend
│   ├── aiWorker.ts       Web Worker for expensive AI (Marco/Leo/Tara)
│   └── creatures/        One file per zoo creature
│
├── hooks/           Custom React hooks
│   ├── useGameLoop.ts    Phase transition orchestration
│   ├── useDragDrop.ts    All DnD interaction handling
│   └── useSound.ts       Howler.js sound playback
│
├── components/
│   ├── game/        Game-specific visual components
│   └── ui/          Generic reusable UI primitives
│
├── screens/         Top-level route screens
│
└── styles/
    └── colors.ts    Uno color palette constants (from uno-color-scheme.svg)
```

---

## Key Design Decisions (do not change without discussion)

| Decision | Rationale |
|----------|-----------|
| Zustand (not Redux) | Simpler, less boilerplate, single-file store works well |
| @dnd-kit (not react-dnd) | TypeScript-native, touch-ready, Framer Motion compatible |
| CSS divs for tiles (not SVG) | Framer Motion `layoutId` animation requires DOM elements |
| Web Worker for complex AI | Marco/Leo/Tara can block the main thread; worker keeps UI smooth |
| Slot-based run validation | Slots 1–12 include specials (2=Draw2, 5=Skip, 7=Reverse), enabling mixed runs |
| Turn snapshot for rollback | Deep-clone at turn start; `cancelTurn()` restores; cleared on commit success |

---

## Adding a New Zoo Creature

1. Create `src/ai/creatures/{key}.ts`
2. Export a class that `extends BaseAI`
3. Define your `personality: AIPersonality` object
4. Implement `decideTurn()` — return an `AITurn`
5. Add the creature key to `ZooCreatureKey` union in `src/engine/types.ts`
6. Add creature metadata (name, blurb, difficulty, avatar) to the `ZOO_CREATURES` registry in `src/ai/baseAI.ts`
7. Create an SVG avatar in `src/assets/avatars/{key}.svg`
8. Register the creature in `GameSetupScreen.tsx` creature picker grid

---

## Adding New Sounds

1. Place the `.mp3` file in `src/assets/sounds/`
2. Add the key and path to the `SOUNDS` map in `src/hooks/useSound.ts`
3. Call `play('{key}')` at the appropriate trigger point

---

## Game Phase State Machine

```
WELCOME → SETUP → DEALING → PLAYER_TURN ↔ CPU_THINKING → CPU_ANIMATING
                                  ↓                              ↓
                              VALIDATING                    check win
                                  ↓                              ↓
                             ROUND_END ──── 200 pts? ──── GAME_OVER
```

---

## Tile Slot / Special Mapping (from game-rules.md)

```
Slot 1  → Number 1       Slot 7  → Reverse (special)
Slot 2  → Draw Two       Slot 8  → Number 8
Slot 3  → Number 3       Slot 9  → Number 9
Slot 4  → Number 4       Slot 10 → Number 10
Slot 5  → Skip (special) Slot 11 → Number 11
Slot 6  → Number 6       Slot 12 → Number 12
                          Wild   → Wild Draw Four (no slot)
```

---

## Auto-Placement Scope (Do Not Expand Without User Approval)

Auto-placement of rack tiles onto the board is **intentionally limited to complete valid SETs only** (3–4 tiles of the same number, different colors). Single tiles and RUNs must always be placed manually by the player — this preserves the skill element of deciding where a tile fits in a run.

**Any future code change that automates tile placement beyond complete sets (e.g. auto-playing runs, auto-inserting single tiles into existing groups) MUST be flagged to the user before implementing.**

The relevant code is the `useEffect` in `src/components/game/GameBoard.tsx` that watches `selectedIds`.

---

## Common Pitfalls

- **Do not remove tiles from the table** — once placed, tiles never return to a rack. Only the player who placed them can pick them up during `cancelTurn()` via snapshot rollback.
- **Special effects only fire from rack** — a Draw Two already on the table has no effect when rearranged.
- **Multiple specials per turn = one effect** — see priority order in `game-rules.md`.
- **Run validation uses slot numbers** — a run of [Red-1, Red-Draw2, Red-3] is valid because Draw2 is at slot 2.
- **Wild color is inferred** — `wildAssignedColor` is set contextually; a wild with `null` color is valid and displays as rainbow/gradient.
