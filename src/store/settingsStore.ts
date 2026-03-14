import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ScoreHistoryEntry } from '@/engine/types'

interface SettingsStore {
  darkMode: boolean
  soundEnabled: boolean
  volume: number
  scoreHistory: ScoreHistoryEntry[]

  toggleDarkMode: () => void
  toggleSound: () => void
  setVolume: (v: number) => void
  addScoreEntry: (entry: ScoreHistoryEntry) => void
  clearHistory: () => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      darkMode:     false,
      soundEnabled: true,
      volume:       0.7,
      scoreHistory: [],

      toggleDarkMode:  () => set(s => ({ darkMode: !s.darkMode })),
      toggleSound:     () => set(s => ({ soundEnabled: !s.soundEnabled })),
      setVolume:       (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
      addScoreEntry:   (entry) => set(s => ({
        scoreHistory: [entry, ...s.scoreHistory].slice(0, 50), // keep last 50
      })),
      clearHistory:    () => set({ scoreHistory: [] }),
    }),
    {
      name: 'uno-rummy-settings',
    }
  )
)
