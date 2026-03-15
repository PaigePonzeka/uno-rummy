import { useCallback } from 'react'
import { Howl } from 'howler'
import { useSettingsStore } from '@/store/settingsStore'

// ============================================================
// Sound map — paths relative to /public
// Files may not exist; we fall back to Web Audio API beeps.
// ============================================================

export type SoundKey =
  | 'tileClick'
  | 'tilePlay'
  | 'tileDraw'
  | 'unoCall'
  | 'roundWin'
  | 'roundLose'
  | 'specialPlay'
  | 'wildPlay'
  | 'error'
  | 'giveUp'
  | 'skip'
  | 'drawPenalty'
  | 'unoPenalty'

const SOUND_PATHS: Record<SoundKey, string> = {
  tileClick:    '/sounds/tile-click.ogg',
  tilePlay:     '/sounds/tile-play.ogg',
  tileDraw:     '/sounds/tile-draw.ogg',
  unoCall:      '/sounds/uno-call.ogg',
  roundWin:     '/sounds/round-win.ogg',
  roundLose:    '/sounds/round-lose.ogg',
  specialPlay:  '/sounds/special-play.ogg',
  wildPlay:     '/sounds/wild-play.ogg',
  error:        '/sounds/error.ogg',
  giveUp:       '/sounds/give-up.ogg',
  skip:         '/sounds/skip.ogg',
  drawPenalty:  '/sounds/draw-penalty.ogg',
  unoPenalty:   '/sounds/uno-penalty.ogg',
}

// Fallback beep frequencies (Hz) for generic keys
const BEEP_FREQS: Partial<Record<SoundKey, number>> = {
  tileClick:   440,
  tilePlay:    520,
  tileDraw:    330,
  roundWin:    660,
  roundLose:   220,
  specialPlay: 600,
  wildPlay:    750,
  error:       150,
}

// ============================================================
// Web Audio API fallbacks (used when MP3 files are absent)
// ============================================================

type AudioContextConstructor = typeof AudioContext
function getCtx(): AudioContext {
  const ctor = (window.AudioContext ||
    (window as unknown as { webkitAudioContext: AudioContextConstructor }).webkitAudioContext)
  return new ctor()
}

function playBeep(freq: number, volume: number, duration = 0.08) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, ctx.currentTime)
    gain.gain.setValueAtTime(volume * 0.3, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration)
  } catch { /* AudioContext not available */ }
}

// Foreboding descending sawtooth sweep — UNO call warning
function playUnoBeep(volume: number) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(260, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(85, ctx.currentTime + 0.7)
    gain.gain.setValueAtTime(volume * 0.45, ctx.currentTime)
    gain.gain.setValueAtTime(volume * 0.45, ctx.currentTime + 0.45)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.75)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.75)
  } catch { /* AudioContext not available */ }
}

// Womp womp trombone slide — Give Up
function playWompBeep(volume: number) {
  try {
    const ctx   = getCtx()
    const notes = [
      { start: 0,    startFreq: 440, endFreq: 300, duration: 0.4 },
      { start: 0.38, startFreq: 300, endFreq: 160, duration: 0.5 },
    ]
    notes.forEach(({ start, startFreq, endFreq, duration }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(startFreq, ctx.currentTime + start)
      osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + duration)
      gain.gain.setValueAtTime(volume * 0.35, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + duration)
    })
  } catch { /* AudioContext not available */ }
}

// Short abrupt square-wave drop — "nope, you're skipped"
function playSkipBeep(volume: number) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'square'
    osc.frequency.setValueAtTime(300, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(130, ctx.currentTime + 0.2)
    gain.gain.setValueAtTime(volume * 0.25, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.22)
  } catch { /* AudioContext not available */ }
}

// Two quick sawtooth thuds — forced draw punishment
function playDrawPenaltyBeep(volume: number) {
  try {
    const ctx  = getCtx()
    const hits = [
      { start: 0,    freq: 220 },
      { start: 0.18, freq: 160 },
    ]
    hits.forEach(({ start, freq }) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + start)
      gain.gain.setValueAtTime(volume * 0.4, ctx.currentTime + start)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + 0.15)
      osc.start(ctx.currentTime + start)
      osc.stop(ctx.currentTime + start + 0.15)
    })
  } catch { /* AudioContext not available */ }
}

// Long deep sine drone — "you messed up, pal"
function playUnoPenaltyBeep(volume: number) {
  try {
    const ctx  = getCtx()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(100, ctx.currentTime)
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime)
    gain.gain.setValueAtTime(volume * 0.5, ctx.currentTime + 0.6)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.9)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.9)
  } catch { /* AudioContext not available */ }
}

function playCustomFallback(key: SoundKey, volume: number) {
  switch (key) {
    case 'unoCall':     playUnoBeep(volume);         break
    case 'giveUp':      playWompBeep(volume);        break
    case 'skip':        playSkipBeep(volume);        break
    case 'drawPenalty': playDrawPenaltyBeep(volume); break
    case 'unoPenalty':  playUnoPenaltyBeep(volume);  break
    default:            playBeep(BEEP_FREQS[key] ?? 440, volume); break
  }
}

// ============================================================
// Howler instance cache (module-level, one Howl per key)
// Keys added here have failed to load and always use fallback.
// ============================================================

const howlCache   = new Map<SoundKey, Howl>()
const failedKeys  = new Set<SoundKey>()

function getHowl(key: SoundKey): Howl {
  if (!howlCache.has(key)) {
    const h = new Howl({
      src:          [SOUND_PATHS[key]],
      preload:      true,
      onloaderror:  () => failedKeys.add(key),
      onplayerror:  () => failedKeys.add(key),
    })
    howlCache.set(key, h)
  }
  return howlCache.get(key)!
}

// ============================================================
// Hook
// ============================================================

export function useSound() {
  const { soundEnabled, volume } = useSettingsStore()

  const play = useCallback((key: SoundKey) => {
    if (!soundEnabled) return

    // If this key previously failed to load, go straight to Web Audio
    if (failedKeys.has(key)) {
      playCustomFallback(key, volume)
      return
    }

    const h = getHowl(key)
    h.volume(volume)
    h.play()
  }, [soundEnabled, volume])

  return { play }
}
