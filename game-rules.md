# Uno Rummy Up — Official Rules Reference

> **This file is the source of truth for all game rules.**
> All engine logic, AI behavior, and UI copy must conform to these rules.
> Sources: Mattel instruction sheet #49002, BoardGameGeek thread #1284429, Geeky Hobbies review, House of Games rules.

---

## Overview

**Uno Rummy Up** combines Rummy tile mechanics with Uno special cards. Published by Mattel/Spear's Games (1993).

- **Players:** 2–4
- **Ages:** 7+
- **Objective:** Be the first to empty your tile rack, then score points from tiles remaining in opponents' racks. First player to **200 total points** wins the game.

---

## Components

### Tile Deck — 100 Tiles Total

| Category | Count | Details |
|----------|-------|---------|
| Number tiles | 72 | Values 1, 3, 4, 6, 8, 9, 10, 11, 12 × 4 colors × 2 copies |
| Special tiles | 24 | Draw Two, Skip, Reverse × 4 colors × 2 copies |
| Wild Draw Four | 4 | No color; wildcards |
| **Total** | **100** | |

### Number Slot Mapping (Critical)

The tile numbers run 1–12, but slots **2, 5, and 7 are occupied by special tiles**, not number tiles:

| Slot | Tile Type | Scoring Value |
|------|-----------|---------------|
| 1 | Number 1 | 1 pt |
| **2** | **Draw Two** | **20 pts** |
| 3 | Number 3 | 3 pts |
| 4 | Number 4 | 4 pts |
| **5** | **Skip** | **20 pts** |
| 6 | Number 6 | 6 pts |
| **7** | **Reverse** | **20 pts** |
| 8 | Number 8 | 8 pts |
| 9 | Number 9 | 9 pts |
| 10 | Number 10 | 10 pts |
| 11 | Number 11 | 11 pts |
| 12 | Number 12 | 12 pts |
| Wild | Wild Draw Four | 50 pts |

### Colors

| Color | Hex |
|-------|-----|
| Red | #D72600 |
| Blue | #0956BF |
| Green | #379711 |
| Yellow | #C9A800 |

### Other Components
- 1 tile rack per player (holds tiles upright, hidden from opponents)
- 1 draw pile (face-down remaining tiles)

---

## Setup

1. Shuffle all 100 tiles face-down.
2. Each player draws **14 tiles** and places them on their rack (hidden from others).
3. Draw **4 more tiles** from the pile and place them **face-up in the center** of the play area. These are the starting table groups (individual tiles — not yet in valid groups).
4. Remaining tiles form the **draw pile** (face-down).
5. The player who drew the highest-value tile goes first. Ties are re-drawn.
6. Play proceeds **clockwise** (unless a Reverse tile changes direction).

---

## Gameplay

### On Your Turn

You **must** do one of the following:

**Option A — Play tiles:**
- Play **1 to 4 tiles** from your rack onto the table.
- You may also **rearrange any tiles already on the table** (see Rearrangement Rules).
- At the end of your turn, **all groups on the table must be valid** (valid run or valid set, minimum 3 tiles each).
- If your final table state is invalid, your turn is not complete — you must fix it or cancel.

**Option B — Draw a tile:**
- If you cannot (or choose not to) play, draw **1 tile** from the draw pile.
- Your turn ends immediately after drawing.

### Calling UNO

- When you have exactly **1 tile remaining** on your rack, you **must call "UNO!"**
- If another player catches you with 1 tile without having called UNO, you must **draw 2 penalty tiles**.
- UNO must be called before the next player takes their turn.

### Going Out

- When you play your **last tile**, the round ends immediately.
- You are the **round winner**.

---

## Tile Groups

All tiles on the table must belong to valid groups at the end of every turn.

### Runs

A run is **3 or more consecutive tiles of the same color**, using slot numbers 1–12.

- Minimum length: **3 tiles**
- Maximum length: **12 tiles** (slots 1–12)
- All tiles must share the **same color**
- Numbers must be **consecutive** (no gaps, unless a Wild fills the gap)
- Special tiles (Draw Two at slot 2, Skip at slot 5, Reverse at slot 7) are valid in runs at their slot positions

**Examples of valid runs:**
- Red 1 → Red Draw-Two (slot 2) → Red 3
- Blue 8 → Blue 9 → Blue 10 → Blue 11
- Green 6 → Green Reverse (slot 7) → Green 8 → Wild (slot 9)

### Sets

A set is **3 or 4 tiles of the same number/slot from different colors**.

- Minimum size: **3 tiles**
- Maximum size: **4 tiles** (one per color — there are only 4 colors)
- All tiles must have the **same slot number**
- All tiles must be **different colors**
- Wild Draw Four can substitute for any color

**Examples of valid sets:**
- Red 9, Blue 9, Green 9
- Red Skip (slot 5), Blue Skip (slot 5), Yellow Skip (slot 5), Green Skip (slot 5)
- Red 10, Blue 10, Wild (substituting for green or yellow 10)

---

## Rearrangement Rules

This is the key strategic mechanic that distinguishes Uno Rummy Up from standard Rummy:

1. **Any player** may rearrange **any tiles already on the table** on their turn.
2. Tiles on the table **can never be removed** from the table back to a player's rack.
3. Tiles can be moved in any way — split groups, merge groups, move individual tiles — as long as the **final state has all valid groups**.
4. At the end of your turn, **every group on the table must be valid** (minimum 3 tiles, valid run or set).
5. You may use rearrangement to create openings for tiles from your rack.

---

## Special Tiles

### Draw Two (slot 2)

- When played from a rack onto the table: the **next player draws 2 tiles** and **skips their turn**.
- In runs/sets on the table: acts as its slot number (2) — has no ongoing effect after placement.
- Scoring value: **20 points** (when counted in an opponent's rack at round end).

### Skip (slot 5)

- When played from a rack: the **next player skips their turn** (draws nothing).
- In runs/sets: acts as slot number 5.
- Scoring value: **20 points**.

### Reverse (slot 7)

- When played from a rack: **reverses the direction of play**.
- With 2 players: acts as a Skip (next player loses their turn).
- In runs/sets: acts as slot number 7.
- Scoring value: **20 points**.

### Wild Draw Four

- Can be played in **any run or set** as a substitute for any tile.
- When played from a rack to start or extend a group: the **next player draws 4 tiles** and **skips their turn**.
- If the target player holds the specific tile the Wild is substituting, they may **swap** the actual tile for the Wild on their turn.
- Only **one Wild Draw Four** is allowed per set (but multiple are allowed in a run).
- Scoring value: **50 points**.

### Multiple Specials in One Turn

- If a player plays **multiple special tiles in one turn**, only **one special effect activates**.
- Priority order (highest wins): Wild Draw Four > Draw Two > Skip > Reverse.

---

## Scoring

### Round End

When a player empties their rack, the **round ends immediately**.

The winner scores points equal to the **sum of all tiles remaining in all other players' racks**:

| Tile | Point Value |
|------|-------------|
| Number tiles | Face value (1–12) |
| Draw Two | 20 |
| Skip | 20 |
| Reverse | 20 |
| Wild Draw Four | 50 |

### Game Win

The first player to accumulate **200 or more total points** (across multiple rounds) wins the game.

**Alternative play:** Agree in advance to play a set number of rounds; highest score wins.

---

## Edge Cases & Clarifications

- **Incomplete groups during a turn:** Groups may temporarily have fewer than 3 tiles mid-turn as you rearrange. Only the final state at turn-end must be fully valid.
- **Draw pile exhausted:** If the draw pile runs out, the round ends without a winner; scores are tallied as if each player is the loser (all players score 0 for the round, or use a house rule).
- **Wild color:** A Wild Draw Four in a run takes the color of the run. In a set, it takes the number of the set. Its specific "missing" color is inferred from context.
- **Swapping a Wild:** A player may only substitute the real tile for a Wild if the entire group remains valid after the swap.
- **First turn:** The 4 starting tiles on the table are individual loose tiles (not yet valid groups). Players build on them. A valid final table state is required to end your turn.
