import { useSettingsStore } from '@/store/settingsStore'

export default function DarkModeToggle() {
  const { darkMode, toggleDarkMode } = useSettingsStore()

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-lg"
      title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {darkMode ? '☀️' : '🌙'}
    </button>
  )
}
