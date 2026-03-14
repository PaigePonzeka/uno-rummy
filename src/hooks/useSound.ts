import { useCallback, useRef } from 'react'
import { useSettingsStore } from '@/store/settingsStore'

// ============================================================
// Sound map — paths relative to /public
// Files may not exist; we fall back to Web Audio API beeps.
// ============================================================

type SoundKey =
  | 'tileClick'
  | 'tilePlay'
  | 'tileDraw'
  | 'unoCall'
  | 'roundWin'
  | 'roundLose'
  | 'specialPlay'
  | 'wildPlay'
  | 'error'

const SOUND_PATHS: Record<SoundKey, string> = {
  tileClick:   '/sounds/tile-click.mp3',
  tilePlay:    '/sounds/tile-play.mp3',
  tileDraw:    '/sounds/tile-draw.mp3',
  unoCall:     '/sounds/uno-call.mp3',
  roundWin:    '/sounds/round-win.mp3',
  roundLose:   '/sounds/round-lose.mp3',
  specialPlay: '/sounds/special-play.mp3',
  wildPlay:    '/sounds/wild-play.mp3',
  error:       '/sounds/error.mp3',
}

// Fallback beep frequencies (Hz) per sound
const BEEP_FREQS: Record<SoundKey, number> = {
  tileClick:   440,
  tilePlay:    520,
  tileDraw:    330,
  unoCall:     880,
  roundWin:    660,
  roundLose:   220,
  specialPlay: 600,
  wildPlay:    750,
  error:       150,
}

function playBeep(freq: number, volume: number, duration = 0.08) {
  try {
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
  } catch {
    // AudioContext not available
  }
}

export function useSound() {
  const { soundEnabled, volume } = useSettingsStore()
  const audioCache = useRef<Map<SoundKey, HTMLAudioElement>>(new Map())

  const play = useCallback((key: SoundKey) => {
    if (!soundEnabled) return

    // Try cached/new HTMLAudioElement first
    let audio = audioCache.current.get(key)
    if (!audio) {
      audio = new Audio(SOUND_PATHS[key])
      audioCache.current.set(key, audio)
    }

    audio.volume = volume
    audio.currentTime = 0
    audio.play().catch(() => {
      // File not found — fall back to beep
      playBeep(BEEP_FREQS[key], volume)
    })
  }, [soundEnabled, volume])

  return { play }
}
