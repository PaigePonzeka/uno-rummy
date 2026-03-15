import { Volume2, VolumeX } from 'lucide-react'
import { useSettingsStore } from '@/store/settingsStore'

export default function SoundToggle() {
  const { soundEnabled, toggleSound } = useSettingsStore()

  return (
    <button
      onClick={toggleSound}
      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
      title={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
      aria-label={soundEnabled ? 'Mute sounds' : 'Unmute sounds'}
    >
      {soundEnabled
        ? <Volume2 size={16} className="text-white" />
        : <VolumeX size={16} className="text-white/50" />}
    </button>
  )
}
