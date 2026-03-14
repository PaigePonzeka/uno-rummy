# Uno Rummy Up — Implementation Roadmap

Track implementation progress here. See `progress.md` for session-by-session logs.

---

## Phase 0 — Repository Bootstrap & Documentation

- [ ] Create `game-rules.md` — full official rules reference
- [ ] Create `CLAUDE.md` — AI agent instructions
- [ ] Create `README.md` — developer guide
- [ ] Create `plans.md` (this file)
- [ ] Create `progress.md`
- [ ] `git init` + `.gitignore` + initial commit

---

## Phase 1 — Project Scaffold

- [ ] `npm create vite@latest` with `react-ts` template
- [ ] Install runtime deps: `zustand @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities framer-motion howler @types/howler`
- [ ] Install dev deps: `tailwindcss postcss autoprefixer vitest @testing-library/react @testing-library/user-event`
- [ ] Configure Tailwind CSS (`darkMode: 'class'`, Uno colors)
- [ ] Create full `src/` directory skeleton
- [ ] Create `src/styles/colors.ts` with Uno palette
- [ ] Configure `vite.config.ts` (code splitting, worker support)
- [ ] Configure `vitest.config.ts`

---

## Phase 2 — Core Engine

### `src/engine/types.ts`
- [ ] `TileColor`, `TileType` union types
- [ ] `Tile` interface
- [ ] `TileGroup` interface
- [ ] `Player` interface
- [ ] `GamePhase` union
- [ ] `GameState` interface
- [ ] `ZooCreatureKey` union
- [ ] `PendingEffect`, `GameAction`, `RoundScore`
- [ ] `PlayOption`, `ValidationResult`, `RearrangementResult`
- [ ] `AIPersonality`, `AITurn` interfaces

### `src/engine/deckGenerator.ts`
- [ ] `generateDeck(): Tile[]` — 100 tiles, correct distribution
- [ ] `shuffleDeck(deck)` — Fisher-Yates
- [ ] `dealInitialHands(deck, playerCount)` — 14 each + 4 table starters

### `src/engine/validationEngine.ts`
- [ ] `isValidRun(tiles)` — slot-based consecutive, wilds fill gaps
- [ ] `isValidSet(tiles)` — same slot, different colors, 3–4 tiles
- [ ] `isValidGroup(tiles)` — dispatches to run/set
- [ ] `isValidTableState(groups)` — all groups valid at commit time
- [ ] `findValidPlays(rack, tableGroups)` — returns `PlayOption[]` for AI

### `src/engine/manipulationEngine.ts`
- [ ] `moveTile(...)` — move tile between groups
- [ ] `splitGroup(...)` — split at index
- [ ] `mergeGroups(...)` — combine two groups
- [ ] `createGroupFromRack(...)` — new group from rack tiles
- [ ] `moveGroup(...)` — reposition group on canvas
- [ ] `validateRearrangement(before, after, addedTiles)` — conservation + validity

### `src/engine/scoreEngine.ts`
- [ ] `calculateRackValue(rack)` — sum of tile values
- [ ] `processRoundEnd(gameState)` — find winner, compute deltas
- [ ] `checkGameWin(players)` — first to 200 pts

### Engine Tests (`src/engine/__tests__/`)
- [ ] `validationEngine.test.ts` — valid/invalid run and set cases, wild edge cases
- [ ] `deckGenerator.test.ts` — 100 tiles, correct distribution
- [ ] `manipulationEngine.test.ts` — conservation check, rearrangement validation

---

## Phase 3 — State Store

### `src/store/settingsStore.ts`
- [ ] `darkMode`, `soundEnabled`, `volume` state
- [ ] `scoreHistory` with localStorage persistence
- [ ] All toggle/update actions

### `src/store/gameStore.ts`
- [ ] Initial state + `initializeGame(config)`
- [ ] `startRound()` + deal flow
- [ ] `_startTurnSnapshot()` + `cancelTurn()`
- [ ] `playTilesFromRack(...)` + `rearrangeTable(...)`
- [ ] `commitTurn()` with validation and error handling
- [ ] `drawTile()` with auto-commit
- [ ] `callUno()` + UNO violation detection
- [ ] `_advanceTurn()` + pending effect resolution
- [ ] `cpuTakeTurn(idx)` — AI worker integration
- [ ] `ROUND_END` + `GAME_OVER` transitions

---

## Phase 4 — UI Components

### `src/components/game/`
- [ ] `Tile.tsx` — color, number, special symbol, states, `layoutId`
- [ ] `TileBack.tsx` — face-down tile for CPU racks
- [ ] `TileGroup.tsx` — horizontal tile row, validity border, type badge
- [ ] `TileRack.tsx` — scrollable rack, multi-select, sort controls
- [ ] `TableCanvas.tsx` — free-form canvas, felt background, droppable
- [ ] `GameBoard.tsx` — full layout orchestrator
- [ ] `PlayerArea.tsx` — rack + action buttons
- [ ] `CpuArea.tsx` — avatar, name, tile-back rack, thinking animation
- [ ] `DrawPile.tsx` — pile with tile count
- [ ] `ScoreBoard.tsx` — running scores sidebar

### `src/components/ui/`
- [ ] `Button.tsx` — primary/secondary/danger variants
- [ ] `Modal.tsx` — overlay modal with backdrop
- [ ] `Avatar.tsx` — SVG creature avatar with name/difficulty badge
- [ ] `DarkModeToggle.tsx` — sun/moon icon toggle
- [ ] `UnoButton.tsx` — big red UNO panic button with animation
- [ ] `Toast.tsx` — notification for errors, UNO, special effects

---

## Phase 5 — Screens

- [ ] `screens/WelcomeScreen.tsx` — title, name input, history button
- [ ] `screens/GameSetupScreen.tsx` — CPU count, creature picker
- [ ] `screens/GameScreen.tsx` — main game view with `<GameBoard>`
- [ ] `screens/GameOverScreen.tsx` — winner, scores, play again
- [ ] Wire routing (React Router or simple state-based navigation)

---

## Phase 6 — Drag and Drop

- [ ] `src/hooks/useDragDrop.ts` — `DragState`, handlers, animation props
- [ ] Wrap `TableCanvas` + `TileRack` in `DndContext`
- [ ] Make rack tiles `<Draggable>`
- [ ] Make table groups and canvas `<Droppable>`
- [ ] Insert position indicator (vertical line between tiles)
- [ ] Multi-tile select drag (Ctrl/Cmd + click)
- [ ] Framer Motion conflict resolution (disable `layout` during drag)
- [ ] Connect drag end → store actions
- [ ] End-to-end test: drag from rack, drag within table, group split/merge

---

## Phase 7 — AI Players

- [ ] `src/ai/baseAI.ts` — abstract class, `AIPersonality`, shared utilities
- [ ] `src/ai/aiWorker.ts` — Web Worker message interface
- [ ] `src/ai/creatures/ziggy.ts` — Easy: 40% miss, no rearrange
- [ ] `src/ai/creatures/gerald.ts` — Easy: slow, 20% miss
- [ ] `src/ai/creatures/harriet.ts` — Medium: defensive, draws often
- [ ] `src/ai/creatures/polly.ts` — Medium: random valid moves
- [ ] `src/ai/creatures/penelope.ts` — Medium: perfect moves, no lookahead
- [ ] `src/ai/creatures/marco.ts` — Medium-Hard: rearranges aggressively
- [ ] `src/ai/creatures/leo.ts` — Hard: optimal, targets leader
- [ ] `src/ai/creatures/tara.ts` — Hard: max tiles/turn, aggressive specials
- [ ] Wire `cpuTakeTurn()` in game store
- [ ] Full game test vs. each creature

---

## Phase 8 — Sound & Animations

### Sound
- [ ] Source or generate 9 sound files (tile-click, tile-play, tile-draw, uno-call, round-win, round-lose, special-play, wild-play, error)
- [ ] `src/hooks/useSound.ts` with Howler.js
- [ ] Web Audio API fallback tone generator
- [ ] Wire sound triggers in components + store

### Framer Motion
- [ ] `layoutId` on all `<Tile>` components
- [ ] `<AnimatePresence>` on tile group lists
- [ ] CPU tile fly-to-table animation
- [ ] Invalid group shake keyframe
- [ ] UNO call flash + text spring
- [ ] Round end rack explosion
- [ ] CPU thinking pulse + dots
- [ ] Win screen confetti

---

## Phase 9 — Polish

- [ ] Score history modal in WelcomeScreen
- [ ] Dark mode toggle (Tailwind class strategy)
- [ ] Toast notification system for game events
- [ ] Keyboard navigation for rack (arrow keys + Enter to select)
- [ ] ARIA labels on tiles and interactive elements
- [ ] Error boundaries around GameScreen and TableCanvas
- [ ] Responsive layout: 1024px min, 768px secondary target

---

## Phase 10 — Deployment

- [ ] `vercel.json` with SPA rewrite rule
- [ ] `vite.config.ts` lazy chunk splitting per screen
- [ ] `npm run build` passes cleanly
- [ ] Deploy to Vercel, confirm live URL
- [ ] Add screenshot to README
