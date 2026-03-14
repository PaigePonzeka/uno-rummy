import { useRef, useState, useEffect } from 'react'
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
  const creatureKey    = player.creatureKey as ZooCreatureKey
  const containerRef   = useRef<HTMLDivElement>(null)
  const [visibleCount, setVisibleCount] = useState(player.rack.length)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const TILE_W  = 42  // 40px tile + 2px gap
    const BADGE_W = 36  // approximate width of "+ X" badge

    const compute = () => {
      const available = el.offsetWidth
      const fits = Math.floor(available / TILE_W)
      const overflow = player.rack.length > fits
      setVisibleCount(
        overflow ? Math.max(1, Math.floor((available - BADGE_W) / TILE_W)) : player.rack.length
      )
    }

    compute()
    const ro = new ResizeObserver(compute)
    ro.observe(el)
    return () => ro.disconnect()
  }, [player.rack.length])

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

      {/* Face-down tiles — clip to container width, badge for overflow */}
      <div ref={containerRef} className="flex flex-row gap-0.5 overflow-hidden flex-1" style={{ maxHeight: 44 }}>
        {player.rack.slice(0, visibleCount).map((_, i) => (
          <TileBack key={i} small />
        ))}
        {player.rack.length > visibleCount && (
          <div className="flex items-center justify-center text-white/70 text-xs font-bold px-1 shrink-0 whitespace-nowrap">
            +{player.rack.length - visibleCount}
          </div>
        )}
      </div>
    </div>
  )
}
