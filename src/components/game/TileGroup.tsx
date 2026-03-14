import { motion, AnimatePresence } from 'framer-motion'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Tile, TileGroup as TileGroupData } from '@/engine/types'
import TileComponent from './Tile'
import { GROUP_BORDER } from '@/styles/colors'

interface TileGroupProps {
  group: TileGroupData
  selectedTileIds?: Set<string>
  onTileClick?: (tileId: string) => void
  onSplit?: (groupId: string, splitIndex: number) => void
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
  onSplit,
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
        position:   'absolute',
        left:        group.position.x,
        top:         group.position.y,
        transition:  shake
          ? 'none'
          : 'left 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275), top 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor:      draggable ? 'default' : 'grab',
        padding:     8,
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
              {/* Split button — appears between tiles at valid split points */}
              {draggable && onSplit && group.type === 'run' && group.tiles.length >= 6
                && idx >= 2 && idx <= group.tiles.length - 4 && (
                <button
                  onPointerDown={e => e.stopPropagation()}
                  onClick={e => { e.stopPropagation(); onSplit(group.id, idx + 1) }}
                  title="Split run here"
                  style={{
                    width: 10, height: 36, flexShrink: 0,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px dashed rgba(255,255,255,0.35)',
                    borderRadius: 3, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'rgba(255,255,255,0.5)', fontSize: 8,
                    transition: 'background 0.15s, color 0.15s',
                    marginRight: 2,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.28)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                    e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
                  }}
                >
                  ✂
                </button>
              )}
              {draggable ? (
                <DraggableTableTile tile={tile} groupId={group.id}>
                  <TileComponent
                    tile={tile}
                    noLayoutId
                    selected={selectedTileIds.has(tile.id)}
                    onClick={onTileClick ? () => onTileClick(tile.id) : undefined}
                  />
                </DraggableTableTile>
              ) : (
                <TileComponent
                  tile={tile}
                  noLayoutId
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
