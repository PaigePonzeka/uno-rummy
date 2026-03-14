import { motion } from 'framer-motion'
import type { Tile as TileData } from '@/engine/types'
import { TILE_COLORS, SELECTED_COLOR } from '@/styles/colors'

interface TileProps {
  tile: TileData
  selected?: boolean
  dragging?: boolean
  disabled?: boolean
  small?: boolean
  dragPreview?: boolean
  noLayoutId?: boolean
  onClick?: () => void
  style?: React.CSSProperties
}

// ── Label helpers ────────────────────────────────────────────────────────────

/**
 * The number/symbol shown in the corners (top-left / bottom-right).
 * For specials this is the slot number so players can read runs.
 */
function getCornerLabel(tile: TileData): string {
  if (tile.isWild) return '★'
  if (tile.displayNumber !== null) return String(tile.displayNumber)
  return '?'
}

/**
 * The large symbol shown inside the colored oval.
 */
function getOvalLabel(tile: TileData): string {
  if (tile.isWild)             return 'Wild'
  if (tile.type === 'draw2')   return '+2'
  if (tile.type === 'skip')    return '⊘'
  if (tile.type === 'reverse') return '↺'
  return tile.displayNumber !== null ? String(tile.displayNumber) : '?'
}

/**
 * Small secondary text below the oval label (type hint for specials/wilds).
 */
function getOvalSubLabel(tile: TileData): string | null {
  if (tile.isWild)             return '+4'
  if (tile.type === 'draw2')   return 'DRAW'
  if (tile.type === 'skip')    return 'SKIP'
  if (tile.type === 'reverse') return 'REV'
  return null
}

/** Oval background — solid tile color for normal tiles (wild handled separately) */
function getOvalBg(tile: TileData): string {
  if (!tile.color) return '#555'
  return TILE_COLORS[tile.color]
}

/** Border color for the tile outline */
function getTileColor(tile: TileData): string {
  if (tile.isWild || !tile.color) return 'rgba(255,255,255,0.18)'
  return TILE_COLORS[tile.color]
}

// ── Component ────────────────────────────────────────────────────────────────

export default function Tile({
  tile,
  selected = false,
  dragging = false,
  disabled = false,
  small = false,
  dragPreview = false,
  noLayoutId = false,
  onClick,
  style,
}: TileProps) {
  const cornerLabel = getCornerLabel(tile)
  const ovalLabel   = getOvalLabel(tile)
  const subLabel    = getOvalSubLabel(tile)
  const ovalBg      = getOvalBg(tile)
  const tileColor   = getTileColor(tile)

  const w = small ? 40 : 48
  const h = small ? 54 : 64

  // Oval: 62% wide, 74% tall — rounded pill shape
  const ovalW = Math.round(w * 0.62)
  const ovalH = Math.round(h * 0.74)

  // Corner font size — scale down for 2-digit labels (10, 11, 12) to prevent overflow
  const cornerFontSize = small
    ? (cornerLabel.length > 1 ? 6 : 8)
    : (cornerLabel.length > 1 ? 8 : 10)

  return (
    <motion.div
      layout={!dragPreview && !noLayoutId}
      layoutId={dragPreview || noLayoutId ? undefined : tile.id}
      onClick={disabled ? undefined : onClick}
      style={{
        background:   tile.isWild ? '#1a1a1a' : '#FFF8E7',
        width:        w,
        height:       h,
        borderRadius: 7,
        border:    `2px solid ${tileColor}`,
        boxShadow: selected
          ? `inset 0 1px 0 rgba(255,255,255,0.15), 0 0 0 2px ${SELECTED_COLOR}, 0 0 10px rgba(147,51,234,0.45), 0 4px 0 rgba(0,0,0,0.2), 0 10px 20px rgba(0,0,0,0.5)`
          : tile.isWild
            ? 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 0 rgba(0,0,0,0.3), 0 4px 0 rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.5)'
            : 'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 rgba(0,0,0,0.2), 0 4px 0 rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.35)',
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         disabled ? 'default' : onClick ? 'pointer' : 'grab',
        userSelect:     'none',
        opacity:        dragging ? 0.45 : 1,
        transform:      selected ? 'translateY(-8px)' : 'translateY(-1px)',
        transition:     'transform 0.15s, box-shadow 0.15s',
        flexShrink:     0,
        position:       'relative',
        ...style,
      }}
      aria-label={`${tile.color ?? 'wild'} ${ovalLabel}`}
      role={onClick ? 'button' : 'img'}
    >
      {/* Top-left corner */}
      <span style={{
        position:   'absolute',
        top:        3,
        left:       4,
        fontSize:   cornerFontSize,
        fontWeight: 900,
        lineHeight: 1,
        color: selected ? SELECTED_COLOR : (tile.isWild ? '#FFF8E7' : tileColor),
      }}>
        {cornerLabel}
      </span>

      {/* Centered oval */}
      {tile.isWild ? (
        // Wild card — 4-quadrant oval matching brand colors
        <div style={{
          width:        ovalW,
          height:       ovalH,
          borderRadius: '50%',
          overflow:     'hidden',
          position:     'relative',
          flexShrink:   0,
          border:       '1.5px solid rgba(255,255,255,0.15)',
          boxShadow:    'inset 0 1px 3px rgba(0,0,0,0.5)',
        }}>
          {/* Top-left: Red */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: '50%', background: '#D72600' }} />
          {/* Top-right: Blue */}
          <div style={{ position: 'absolute', top: 0, right: 0, width: '50%', height: '50%', background: '#0956BF' }} />
          {/* Bottom-left: Yellow */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, width: '50%', height: '50%', background: '#ECD407' }} />
          {/* Bottom-right: Green */}
          <div style={{ position: 'absolute', bottom: 0, right: 0, width: '50%', height: '50%', background: '#379711' }} />
          {/* Dividing lines */}
          <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(0,0,0,0.35)', transform: 'translateX(-50%)' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, top: '50%', height: 1, background: 'rgba(0,0,0,0.35)', transform: 'translateY(-50%)' }} />
          {/* Text overlay */}
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
            <span style={{ fontSize: small ? 10 : 12, fontWeight: 900, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.8)', fontStyle: 'italic', lineHeight: 1 }}>Wild</span>
            <span style={{ fontSize: small ? 6 : 7, fontWeight: 800, color: 'rgba(255,255,255,0.9)', letterSpacing: 0.5, textShadow: '0 1px 2px rgba(0,0,0,0.6)', lineHeight: 1 }}>+4</span>
          </div>
        </div>
      ) : (
        // Normal / special tile oval
        <div style={{
          width:          ovalW,
          height:         ovalH,
          borderRadius:   '50%',
          background:     ovalBg,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
          boxShadow:      'inset 0 1px 3px rgba(0,0,0,0.25)',
          flexShrink:     0,
          gap:            1,
        }}>
          <span style={{
            fontSize:   tile.type !== 'number'
              ? (small ? 13 : 16)     // symbols (+2, ⊘, ↺)
              : (small ? 15 : 19),    // numbers
            fontWeight:  900,
            lineHeight:  1,
            color:       '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.4)',
          }}>
            {ovalLabel}
          </span>
          {subLabel && (
            <span style={{
              fontSize:   small ? 6 : 7,
              fontWeight: 800,
              lineHeight: 1,
              color:      'rgba(255,255,255,0.85)',
              letterSpacing: 0.5,
              textShadow: '0 1px 1px rgba(0,0,0,0.3)',
            }}>
              {subLabel}
            </span>
          )}
        </div>
      )}

      {/* Bottom-right corner (rotated) */}
      <span style={{
        position:   'absolute',
        bottom:     3,
        right:      4,
        fontSize:   cornerFontSize,
        fontWeight: 900,
        lineHeight: 1,
        color:      selected ? SELECTED_COLOR : (tile.isWild ? '#FFF8E7' : tileColor),
        transform:  'rotate(180deg)',
      }}>
        {cornerLabel}
      </span>
    </motion.div>
  )
}

// Face-down tile (for CPU racks) — Uno-card inspired
export function TileBack({ small = false }: { small?: boolean }) {
  const w = small ? 40 : 48
  const h = small ? 54 : 64
  const ovalW = Math.round(w * 0.62)
  const ovalH = Math.round(h * 0.74)
  return (
    <div style={{
      width:          w,
      height:         h,
      borderRadius:   7,
      background:     '#FFF8E7',
      border:         '2px solid rgba(0,0,0,0.12)',
      boxShadow:      'inset 0 1px 0 rgba(255,255,255,0.5), 0 2px 0 rgba(0,0,0,0.2), 0 4px 0 rgba(0,0,0,0.12), 0 6px 10px rgba(0,0,0,0.35)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'center',
      flexShrink:     0,
    }}>
      <div style={{
        width:          ovalW,
        height:         ovalH,
        borderRadius:   '50%',
        background:     '#1a1a1a',
        border:         '2px solid #FFF8E7',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        boxShadow:      'inset 0 1px 3px rgba(0,0,0,0.5)',
      }}>
        <span style={{ fontSize: small ? 7 : 9, fontWeight: 900, color: '#FFF8E7', letterSpacing: 1, fontStyle: 'italic', transform: 'rotate(-15deg)', display: 'inline-block' }}>UNO</span>
      </div>
    </div>
  )
}
