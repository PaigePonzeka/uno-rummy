import { motion, AnimatePresence } from 'framer-motion'
import type { Player } from '@/engine/types'
import { TileBack } from './Tile'
import Avatar from '@/components/ui/Avatar'
import type { ZooCreatureKey } from '@/engine/types'

interface CpuAreaProps {
  player: Player
  isThinking: boolean
  isCurrentTurn: boolean
  compact?: boolean
}

export default function CpuArea({ player, isThinking, isCurrentTurn, compact }: CpuAreaProps) {
  const creatureKey = player.creatureKey as ZooCreatureKey

  return (
    <div className={`
      flex flex-row items-center gap-2 px-3 py-2 rounded-xl transition-all duration-300 flex-shrink-0
      ${isCurrentTurn ? 'bg-white/10 ring-2 ring-white/30' : 'bg-black/20'}
    `}>
      {/* Avatar + thinking indicator */}
      <div className="relative flex-shrink-0">
        <Avatar
          creatureKey={creatureKey}
          size={compact ? 'sm' : 'sm'}
          thinking={isThinking}
        />
        <AnimatePresence>
          {isThinking && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[9px] font-black px-1 py-0.5 rounded-full"
            >
              ...
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Name + score */}
      <div className="flex-shrink-0 text-left min-w-[52px]">
        <div className="text-white text-xs font-bold leading-tight">{player.name}</div>
        <div className="text-white/40 text-[10px]">{player.score} pts</div>
        <AnimatePresence>
          {player.rack.length === 1 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="bg-uno-red text-white text-[9px] font-black px-1.5 py-0.5 rounded-full inline-block mt-0.5"
            >
              UNO!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Face-down tiles in a single scrollable row */}
      <div className="flex flex-row gap-0.5 overflow-x-auto" style={{ maxHeight: 44 }}>
        {player.rack.map((_, i) => (
          <TileBack key={i} small />
        ))}
      </div>
    </div>
  )
}
