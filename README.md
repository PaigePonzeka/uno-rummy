# Uno Rummy Up 🦁🦓🦛🦜

A browser-based implementation of **Uno Rummy Up** — the classic Mattel tile game combining Rummy mechanics with Uno special cards. Play against zoo-creature CPU opponents of varying difficulty, from Ziggy the bumbling Zebra to Leo the ferocious Lion.

Play it here: https://uno-rummy.netlify.app/

---

## Gameplay

- Drag tiles from your rack onto the shared table to form **runs** (consecutive same-color sequences) and **sets** (same number, different colors)
- **Rearrange any tiles already on the table** to open up plays
- Use special tiles (Draw Two, Skip, Reverse, Wild Draw Four) to disrupt opponents
- Call **UNO!** when you have one tile left — or draw 2 as penalty
- First player to **200 points** across multiple rounds wins

---

## Tech Stack

| Tool | Purpose |
|------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool and dev server |
| Zustand | State management |
| @dnd-kit | Drag and drop |
| Framer Motion | Animations and transitions |
| Howler.js | Sound effects |
| Tailwind CSS | Styling |
| Vitest | Unit testing |

---

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (http://localhost:5173)
npm run dev

# Run tests
npm run test

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## Project Structure

```
/
├── game-rules.md         Official rules reference (source of truth)
├── CLAUDE.md             AI agent instructions
├── plans.md              Full implementation roadmap
├── progress.md           Session-by-session progress log
│
└── src/
    ├── engine/           Pure game logic (no React)
    │   ├── types.ts          All shared TypeScript types
    │   ├── deckGenerator.ts  100-tile deck creation + shuffle
    │   ├── validationEngine.ts  Run/set validity rules
    │   ├── manipulationEngine.ts  Tile movement operations
    │   └── scoreEngine.ts    Scoring and win detection
    │
    ├── store/            Zustand stores
    │   ├── gameStore.ts      Game state machine
    │   └── settingsStore.ts  Persisted preferences (dark mode, sounds, history)
    │
    ├── ai/               CPU opponent logic
    │   ├── baseAI.ts         Abstract base + shared utilities
    │   ├── aiWorker.ts       Web Worker for heavy AI computation
    │   └── creatures/        One file per zoo creature
    │
    ├── hooks/
    │   ├── useGameLoop.ts    Phase orchestration
    │   ├── useDragDrop.ts    Drag and drop interactions
    │   └── useSound.ts       Sound playback
    │
    ├── components/
    │   ├── game/         Tile, TileGroup, TileRack, TableCanvas, GameBoard…
    │   └── ui/           Button, Modal, Avatar, DarkModeToggle, UnoButton
    │
    ├── screens/          WelcomeScreen, GameSetupScreen, GameScreen, GameOverScreen
    │
    ├── styles/
    │   └── colors.ts     Uno color palette constants
    │
    └── assets/
        ├── sounds/       .ogg sound effects
        └── avatars/      SVG zoo creature avatars
```

---

## Screens

### Game Screens

The app uses a phase-based state machine — screens advance automatically as you play:

| Screen | How to reach |
|--------|-------------|
| **Welcome** | Default on load; or "Main Menu" from Game Over |
| **Setup** | Click "Let's Play" on the Welcome screen |
| **Game** | Pick creatures and confirm on the Setup screen |
| **Round End** | Win a round — shows scores and a "Next Round" button |
| **Game Over** | First player reaches 200 points |

### In-Game Controls

| Control | Action |
|---------|--------|
| Drag tile → board | Play a tile from your rack |
| Click tile | Select / deselect |
| **End Turn** (Space) | Commit your plays for this turn |
| **Draw Tile** (D) | Draw one tile from the pile |
| **Hint** | Suggest the best available play |
| **Reset Board** (Esc) | Undo all tile placements this turn |
| **UNO!** | Call UNO when you have one tile left |
| 🔊 / 🔇 | Toggle sound on/off |
| **Give Up** | Resign and return to the Welcome screen |
| **▼ / ▲** (chevron) | Collapse / expand your tile rack |

### Developer Pages

Navigate to these URLs while the dev server is running:

| URL | Page |
|-----|------|
| `/#/dev/sounds` | **Sound Test** — play every sound effect with descriptions |
| `/#/dev/tiles` | **Tile Gallery** — view all tile designs including backs |

---

## Zoo Creature Opponents

| Creature | Name | Difficulty | Playing Style |
|---------|------|-----------|---------------|
| 🦓 Zebra | Ziggy | ⭐ Easy | Makes silly mistakes, misses plays, forgets to plan |
| 🦒 Giraffe | Gerald | ⭐⭐ Easy | Slow and steady, decent plays but rarely combos |
| 🦛 Hippo | Harriet | ⭐⭐⭐ Medium | Defensive — often draws rather than rearranging |
| 🦜 Parrot | Polly | ⭐⭐⭐ Medium | Chaotic and unpredictable — pure random valid moves |
| 🐧 Penguin | Penelope | ⭐⭐⭐ Medium | Cool and methodical — always correct, never inspired |
| 🐒 Monkey | Marco | ⭐⭐⭐⭐ Medium-Hard | Loves rearranging — tricky combo finder |
| 🦁 Lion | Leo | ⭐⭐⭐⭐⭐ Hard | The king — optimal, strategic, targets the leader |
| 🐯 Tiger | Tara | ⭐⭐⭐⭐⭐ Hard | Aggressive — maximizes tiles every turn, attacks with specials |

---

## Adding a New Zoo Creature

1. Create `src/ai/creatures/{key}.ts` extending `BaseAI`
2. Add `{key}` to `ZooCreatureKey` in `src/engine/types.ts`
3. Add metadata to `ZOO_CREATURES` registry in `src/ai/baseAI.ts`
4. Create `src/assets/avatars/{key}.svg`
5. The creature will automatically appear in `GameSetupScreen`

See `CLAUDE.md` for full instructions.

---

## Adding New Sounds

1. Place `.ogg` in `src/assets/sounds/`
2. Add key + path to `SOUNDS` in `src/hooks/useSound.ts`
3. Call `play('{key}')` where needed

---

## Deployment (Netlify)

The site is hosted on Netlify with continuous deployment from the `main` branch.

```bash
# Deploy by pushing to main
git push origin main
```

Netlify auto-detects Vite and runs `npm run build` — no dashboard configuration needed.

---

## Contributing

### For humans
- Follow the commit convention: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`
- Run `npm run test` before pushing engine changes
- Keep `game-rules.md` as the single source of truth for rules

### For AI agents
- Read `CLAUDE.md` before making any changes
- All game logic must comply with `game-rules.md`
- Do not hardcode colors, tile values, or rule exceptions

---

## License

MIT
