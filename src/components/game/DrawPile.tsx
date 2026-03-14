import { useDroppable } from '@dnd-kit/core'
import { motion } from 'framer-motion'

interface DrawPileProps {
  count: number
  onDraw?: () => void
  disabled?: boolean
}

export default function DrawPile({ count, onDraw, disabled }: DrawPileProps) {
  const { setNodeRef } = useDroppable({ id: 'draw-pile' })

  return (
    <div className="flex flex-col items-center gap-1" ref={setNodeRef}>
      <motion.button
        onClick={disabled ? undefined : onDraw}
        whileHover={disabled ? {} : { scale: 1.05 }}
        whileTap={disabled ? {} : { scale: 0.95 }}
        disabled={disabled}
        className={`
          relative w-12 h-16 rounded-lg border-2 border-white/20
          bg-gradient-to-br from-gray-600 to-gray-800
          flex items-center justify-center
          shadow-lg
          ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-white/50'}
        `}
        title={disabled ? undefined : 'Draw a tile'}
        aria-label={`Draw pile — ${count} tiles remaining`}
      >
        {/* Stack effect */}
        <div className="absolute inset-0 rounded-lg border border-white/10 translate-x-0.5 translate-y-0.5 bg-gray-700" />
        <div className="absolute inset-0 rounded-lg border border-white/10 translate-x-1 translate-y-1 bg-gray-600" />
        <span className="relative text-2xl">🂠</span>
      </motion.button>
      <span className="text-white/60 text-xs font-mono">{count}</span>
    </div>
  )
}
