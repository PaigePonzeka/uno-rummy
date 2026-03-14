import { useCallback, useEffect, useRef } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { AnimatePresence } from 'framer-motion'
import type { TileGroup } from '@/engine/types'
import TileGroupComponent from './TileGroup'
import { useGameStore } from '@/store/gameStore'

interface TableCanvasProps {
  groups: TileGroup[]
  selectedTileIds: Set<string>
  onTileClick: (tileId: string) => void
  onSplit?: (groupId: string, splitIndex: number) => void
  shakeGroupIds?: Set<string>
  insertIndicator?: { groupId: string; index: number } | null
  readOnly?: boolean
  draggable?: boolean
}

export default function TableCanvas({
  groups,
  selectedTileIds,
  onTileClick,
  onSplit,
  shakeGroupIds = new Set(),
  insertIndicator,
  readOnly = false,
  draggable = false,
}: TableCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({ id: 'table-canvas' })
  const setCanvasSize = useGameStore(s => s.setCanvasSize)
  const canvasRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = canvasRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setCanvasSize(Math.round(width), Math.round(height))
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [setCanvasSize])

  const combinedRef = useCallback((node: HTMLDivElement | null) => {
    setNodeRef(node)
    canvasRef.current = node
  }, [setNodeRef])

  return (
    <div
      ref={combinedRef}
      className={`
        felt-table relative w-full h-full rounded-xl overflow-hidden
        transition-all duration-200
        ${isOver ? 'ring-2 ring-white/20' : ''}
      `}
      style={{ minHeight: 320 }}
    >
      {/* Tile groups */}
      <AnimatePresence>
        {groups.map(group => (
          <TileGroupComponent
            key={group.id}
            group={group}
            selectedTileIds={selectedTileIds}
            onTileClick={readOnly ? undefined : onTileClick}
            onSplit={readOnly ? undefined : onSplit}
            shake={shakeGroupIds.has(group.id)}
            insertIndicatorIndex={
              insertIndicator?.groupId === group.id ? insertIndicator.index : null
            }
            draggable={draggable && !readOnly}
          />
        ))}
      </AnimatePresence>

      {/* Empty state hint */}
      {groups.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-white/20 text-sm text-center">
            Drag tiles here to start playing
          </p>
        </div>
      )}
    </div>
  )
}
