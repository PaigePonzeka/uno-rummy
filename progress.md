# Progress Log

Updates are added at the top (newest first) each session.

---

## Session 1 — 2026-03-14

### Phase 0 — Documentation

- [x] `game-rules.md` — complete official rules (100 tiles, runs/sets, specials, scoring, edge cases)
- [x] `CLAUDE.md` — AI agent instructions and architectural rules
- [x] `README.md` — human + AI developer guide with zoo creature table
- [x] `plans.md` — full phase-by-phase implementation checklist
- [x] `progress.md` (this file)
- [x] `git init` + `.gitignore` + initial docs commit

### Phase 1 — Project Scaffold

- [x] `package.json` with all runtime + dev dependencies
- [x] `vite.config.ts` with code splitting, path aliases, worker support
- [x] `vitest.config.ts`
- [x] `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`
- [x] `tailwind.config.js` with Uno color palette, custom animations
- [x] `postcss.config.js`
- [x] `index.html`
- [x] `src/index.css` with Tailwind layers and tile/group CSS
- [x] `src/main.tsx` + `src/App.tsx`
- [x] `src/styles/colors.ts` — Uno color constants from uno-color-scheme.svg
- [x] `src/test-setup.ts`
- [x] All `src/` directories created

### Phase 2 — Core Engine

- [x] `src/engine/types.ts` — all shared TS types and interfaces
- [x] `src/engine/deckGenerator.ts` — 100-tile deck, Fisher-Yates shuffle, deal
- [x] `src/engine/validationEngine.ts` — `isValidRunClean`, `isValidSet`, `isValidGroup`, `isValidTableState`, `findValidPlays`
- [x] `src/engine/manipulationEngine.ts` — all pure tile movement functions, `validateRearrangement`
- [x] `src/engine/scoreEngine.ts` — rack value, round end, game win detection
- [x] Engine unit tests: **39/39 passing** (`deckGenerator.test.ts`, `validationEngine.test.ts`)

### Phase 3 — State Stores

- [x] `src/store/settingsStore.ts` — dark mode, sound, score history (persisted via Zustand persist)
- [x] `src/store/gameStore.ts` — full game state machine (all phases, turn snapshot, UNO, specials)

### Phase 4 — UI Components

- [x] `src/components/ui/Button.tsx`
- [x] `src/components/ui/Modal.tsx`
- [x] `src/components/ui/DarkModeToggle.tsx`
- [x] `src/components/ui/Toast.tsx` + `useToast` hook
- [x] `src/components/ui/Avatar.tsx` — all 8 zoo creatures with metadata, `CreatureCard`
- [x] `src/components/ui/UnoButton.tsx`
- [x] `src/components/game/Tile.tsx` — colored tile with `layoutId`, `TileBack`
- [x] `src/components/game/TileGroup.tsx` — group with validity border, type badge, insert indicator
- [x] `src/components/game/TileRack.tsx` — sortable rack with multi-select, draggable tiles
- [x] `src/components/game/DrawPile.tsx`
- [x] `src/components/game/ScoreBoard.tsx`
- [x] `src/components/game/CpuArea.tsx` — CPU avatar, face-down rack, thinking animation
- [x] `src/components/game/TableCanvas.tsx` — free-form felt canvas with droppable areas
- [x] `src/components/game/PlayerArea.tsx` — human rack + action buttons
- [x] `src/components/game/GameBoard.tsx` — full game layout with DnD context

### Phase 5 — Screens

- [x] `src/screens/WelcomeScreen.tsx` — name input, score history modal
- [x] `src/screens/GameSetupScreen.tsx` — CPU count + creature picker grid
- [x] `src/screens/GameScreen.tsx` — renders GameBoard with AI imported
- [x] `src/screens/GameOverScreen.tsx` — final scores, play again

### Phase 6 — Drag and Drop

- [x] `@dnd-kit` integrated in `GameBoard` and `TileRack`
- [x] Rack tiles are `Draggable` via `useDraggable`
- [x] Table groups and canvas are `Droppable` via `useDroppable`
- [x] Insert position indicator rendered in `TileGroup`
- [x] Drag-end handler dispatches to `playTilesFromRack`

### Phase 7 — AI Zoo Creatures

- [x] `src/ai/baseAI.ts` — abstract class, shared utilities, registry
- [x] `src/ai/creatures/ziggy.ts` — Easy ⭐ (Zebra, 40% miss, max 1/turn)
- [x] `src/ai/creatures/gerald.ts` — Easy ⭐⭐ (Giraffe, slow, prefers simple plays)
- [x] `src/ai/creatures/harriet.ts` — Medium ⭐⭐⭐ (Hippo, defensive)
- [x] `src/ai/creatures/polly.ts` — Medium ⭐⭐⭐ (Parrot, chaotic random)
- [x] `src/ai/creatures/penelope.ts` — Medium ⭐⭐⭐ (Penguin, methodical)
- [x] `src/ai/creatures/marco.ts` — Medium-Hard ⭐⭐⭐⭐ (Monkey, rearranges aggressively)
- [x] `src/ai/creatures/leo.ts` — Hard ⭐⭐⭐⭐⭐ (Lion, optimal + strategic specials)
- [x] `src/ai/creatures/tara.ts` — Hard ⭐⭐⭐⭐⭐ (Tiger, maximizes tiles/turn)
- [x] `src/ai/index.ts` — registers all creatures on import
- [x] `src/hooks/useGameLoop.ts` — drives CPU turns from `CPU_THINKING` phase

### Phase 8 — Sound & Animations

- [x] `src/hooks/useSound.ts` — `HTMLAudioElement` + Web Audio API beep fallback
- [x] Framer Motion `layoutId` on Tile components
- [x] `AnimatePresence` on TileGroup lists
- [x] CPU thinking pulse animation via Tailwind keyframe
- [x] Invalid group shake animation
- [x] UNO button spring animation
- [x] Round end overlay with motion transitions

### Phase 9 — Polish

- [x] Dark mode toggle (Tailwind class strategy, persisted)
- [x] Toast notification system for errors and warnings
- [x] Score history modal in WelcomeScreen
- [x] Tile sort controls (Original / By Color / By Value)

### Phase 10 — Deployment

- [x] `vercel.json` with SPA rewrite rule
- [x] Vite code splitting: vendor, motion, dnd, sound, store chunks

### Build Status

- **TypeScript:** ✅ Clean (0 errors)
- **Tests:** ✅ 39/39 passing
- **Vite build:** ✅ 430 modules, built successfully

---

## Session 2 — 2026-03-14

### Bug Fixes (Code Review)

- [x] **Position bug** — new tile groups dropped on canvas were always placed at `{x:150,y:100}`;
      fixed `GameBoard.handleDragEnd` to use `event.active.rect.current.translated` minus
      `over.rect` for canvas-relative coordinates
- [x] **UNO check in CPU turn** — `applyCpuTurn` checked UNO status against `p.rack.length`
      (the old rack before tiles were removed); fixed to use `newRack.length`
- [x] **Special effects didn't skip turns** — Skip / Draw2 / WildDrawFour drew tiles for the
      targeted player but did NOT skip their turn; fixed `_advanceTurn` to advance `nextIndex`
      one additional step past the targeted player for these effect types

### Session 2 Build Status

- **TypeScript:** ✅ Clean (0 errors)
- **Tests:** ✅ 39/39 passing
- **Vite build:** ✅ 430 modules, built successfully

---

## Up Next (Session 3)

- [ ] Manual playtest — full game from Welcome → Game Over
- [ ] Add sound files to `public/sounds/` (or rely on Web Audio beep fallback)
- [ ] Drag-to-rearrange within table (table-tile-to-table-tile drag)
- [ ] Multi-tile drag from rack (Ctrl+click to select multiple, then drag)
- [ ] Improve CPU turn animation (fly-to-table visual)
- [ ] Keyboard accessibility (arrow keys in rack)
- [ ] Deploy to Vercel

---

## Status Key

- 🟢 Complete
- 🟡 In Progress
- 🔴 Blocked
- ⚪ Not Started

## Phase Status

| Phase | Status | Notes |
|-------|--------|-------|
| 0 — Documentation | 🟢 Complete | All docs created |
| 1 — Project Scaffold | 🟢 Complete | Vite + React + TS + Tailwind |
| 2 — Core Engine | 🟢 Complete | 39 tests passing |
| 3 — State Store | 🟢 Complete | Zustand game + settings |
| 4 — UI Components | 🟢 Complete | All game + UI components |
| 5 — Screens | 🟢 Complete | Welcome, Setup, Game, GameOver |
| 6 — Drag and Drop | 🟢 Complete | @dnd-kit rack→table |
| 7 — AI Players | 🟢 Complete | All 8 zoo creatures |
| 8 — Sound & Animations | 🟢 Complete | Framer Motion + sound hook |
| 9 — Polish | 🟢 Complete | Dark mode, toasts, sort |
| 10 — Deployment | 🟢 Complete | vercel.json ready |
