import { useEffect, useState } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useGameStore } from '@/store/gameStore'
import WelcomeScreen from '@/screens/WelcomeScreen'
import GameSetupScreen from '@/screens/GameSetupScreen'
import GameScreen from '@/screens/GameScreen'
import GameOverScreen from '@/screens/GameOverScreen'
import SoundTestScreen from '@/screens/SoundTestScreen'
import TileGalleryScreen from '@/screens/TileGalleryScreen'

function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash)
  useEffect(() => {
    const onHashChange = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  return hash
}

export default function App() {
  const darkMode = useSettingsStore(s => s.darkMode)
  const phase = useGameStore(s => s.phase)
  const hash = useHashRoute()

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  // Dev routes — accessible via URL hash regardless of game phase
  if (hash === '#/dev/sounds') return <SoundTestScreen />
  if (hash === '#/dev/tiles')  return <TileGalleryScreen />

  return (
    <div className={`h-screen w-screen overflow-hidden ${darkMode ? 'dark' : ''}`}>
      {phase === 'WELCOME' && <WelcomeScreen />}
      {phase === 'SETUP' && <GameSetupScreen />}
      {(phase === 'DEALING' ||
        phase === 'PLAYER_TURN' ||
        phase === 'CPU_THINKING' ||
        phase === 'CPU_ANIMATING' ||
        phase === 'VALIDATING' ||
        phase === 'ROUND_END') && <GameScreen />}
      {phase === 'GAME_OVER' && <GameOverScreen />}
    </div>
  )
}
