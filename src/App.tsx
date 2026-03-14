import { useEffect } from 'react'
import { useSettingsStore } from '@/store/settingsStore'
import { useGameStore } from '@/store/gameStore'
import WelcomeScreen from '@/screens/WelcomeScreen'
import GameSetupScreen from '@/screens/GameSetupScreen'
import GameScreen from '@/screens/GameScreen'
import GameOverScreen from '@/screens/GameOverScreen'

export default function App() {
  const darkMode = useSettingsStore(s => s.darkMode)
  const phase = useGameStore(s => s.phase)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

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
