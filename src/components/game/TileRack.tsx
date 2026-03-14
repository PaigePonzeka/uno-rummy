import { useSortable, SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Tile as TileData } from '@/engine/types'
import Tile from './Tile'

interface TileRackProps {
  tiles: TileData[]
  orderedIds: string[]
  selectedIds: Set<string>
  onToggleSelect: (id: string, multi: boolean) => void
  disabled?: boolean
}

function SortableRackTile({
  tile,
  selected,
  onToggleSelect,
  disabled,
}: {
  tile: TileData
  selected: boolean
  onToggleSelect: (id: string, multi: boolean) => void
  disabled?: boolean
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id:   tile.id,
    data: { type: 'rack-tile', tile },
    disabled,
  })

  const style = {
    transform:  CSS.Transform.toString(transform),
    transition,
    zIndex:     isDragging ? 100 : undefined,
    opacity:    isDragging ? 0 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-testid="rack-tile"
      {...attributes}
      {...listeners}
    >
      <Tile
        tile={tile}
        selected={selected}
        dragging={isDragging}
        disabled={disabled}
        onClick={(e?: React.MouseEvent) => {
          if (!disabled) onToggleSelect(tile.id, e?.shiftKey ?? false)
        }}
      />
    </div>
  )
}

export default function TileRack({ tiles, orderedIds, selectedIds, onToggleSelect, disabled }: TileRackProps) {
  // Build display order from orderedIds, falling back to original order for unknown ids
  const displayed = orderedIds
    .map(id => tiles.find(t => t.id === id))
    .filter((t): t is TileData => t !== undefined)

  const { setNodeRef } = useDroppable({ id: 'player-rack' })

  return (
    <SortableContext items={orderedIds} strategy={horizontalListSortingStrategy}>
      <div ref={setNodeRef} className="flex flex-row flex-wrap gap-1.5 px-2 py-1">
        {displayed.map(tile => (
          <SortableRackTile
            key={tile.id}
            tile={tile}
            selected={selectedIds.has(tile.id)}
            onToggleSelect={onToggleSelect}
            disabled={disabled}
          />
        ))}
        {tiles.length === 0 && (
          <div className="text-white/30 text-sm italic self-center px-2">
            No tiles — you went out!
          </div>
        )}
      </div>
    </SortableContext>
  )
}
