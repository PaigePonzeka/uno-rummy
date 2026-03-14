import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Tile, TileGroup as TileGroupData } from '@/engine/types'
import TileComponent from './Tile'
import { GROUP_BORDER } from '@/styles/colors'

interface TileGroupProps {
  group: TileGroupData
  selectedTileIds?: Set<string>
  onTileClick?: (tileId: string) => void
  shake?: boolean
  isDragOver?: boolean
  insertIndicatorIndex?: number | null
  draggable?: boolean
}

// ── Drag handle to move the whole group ──────────────────────────────────────

function DraggableGroupHandle({ groupId }: { groupId: string }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id:   `group-move-${groupId}`,
    data: { type: 'group-move', groupId },
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      title="Drag to move group"
      style={{
        position:   'absolute',
        top:        -14,
        left:       '50%',
        transform:  'translateX(-50%)',
        cursor:     isDragging ? 'grabbing' : 'grab',
        color:      'rgba(255,255,255,0.35)',
        fontSize:   13,
        padding:    '1px 8px',
        userSelect: 'none',
        lineHeight: 1,
      }}
    >
      ⠿
    </div>
  )
}

// ── Draggable wrapper for individual tiles on the table ──────────────────────

interface DraggableTableTileProps {
  tile: Tile
  groupId: string
  children: React.ReactNode
}

function DraggableTableTile({ tile, groupId, children }: DraggableTableTileProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id:   `table-tile-${tile.id}`,
    data: { type: 'table-tile', tileId: tile.id, fromGroupId: groupId },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        transform: transform ? `translate(${transform.x}px, ${transform.y}px)` : undefined,
        opacity:   isDragging ? 0 : 1,
        zIndex:    isDragging ? 50 : undefined,
        cursor:    'grab',
      }}
    >
      {children}
    </div>
  )
}

// ── Main TileGroup component ─────────────────────────────────────────────────

export default function TileGroupComponent({
  group,
  selectedTileIds = new Set(),
  onTileClick,
  shake = false,
  isDragOver = false,
  insertIndicatorIndex = null,
  draggable = false,
}: TileGroupProps) {
  const { setNodeRef, isOver } = useDroppable({ id: group.id })

  const borderClass = GROUP_BORDER[group.type] ?? GROUP_BORDER.incomplete
  const isHovered   = isOver || isDragOver

  return (
    <motion.div
      ref={setNodeRef}
      data-testid="tile-group"
      animate={shake ? { x: [0, 12, -12, 6, -6, 0] } : { x: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        group-container flex-row gap-1 rounded-lg border-2 transition-colors duration-150
        ${borderClass}
        ${isHovered ? 'bg-white/20 scale-105' : 'bg-black/20'}
      `}
      style={{
        position:    'absolute',
        left:        group.position.x,
        top:         group.position.y,
        cursor:      draggable ? 'default' : 'grab',
        paddingTop:  draggable ? 16 : 8,
        paddingBottom: 8,
        paddingLeft: 8,
        paddingRight: 8,
      }}
    >
      {/* Group drag handle */}
      {draggable && <DraggableGroupHandle groupId={group.id} />}

      {/* Tiles */}
      <div className="flex flex-row gap-1 items-center">
        <AnimatePresence mode="popLayout">
          {group.tiles.map((tile, idx) => (
            <div key={tile.id} className="relative flex items-center">
              {/* Insert indicator */}
              {insertIndicatorIndex === idx && (
                <div className="w-0.5 h-14 bg-white rounded-full mx-0.5 animate-pulse" />
              )}
              {draggable ? (
                <DraggableTableTile tile={tile} groupId={group.id}>
                  <TileComponent
                    tile={tile}
                    selected={selectedTileIds.has(tile.id)}
                    onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                  />
                </DraggableTableTile>
              ) : (
                <TileComponent
                  tile={tile}
                  selected={selectedTileIds.has(tile.id)}
                  onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                />
              )}
            </div>
          ))}
          {/* Trailing insert indicator */}
          {insertIndicatorIndex === group.tiles.length && (
            <div className="w-0.5 h-14 bg-white rounded-full mx-0.5 animate-pulse" />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
