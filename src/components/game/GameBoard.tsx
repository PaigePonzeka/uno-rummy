import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import {
  DndContext,
  DragOverlay,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import type { LastFiredEffect, Player, TileGroup } from '@/engine/types'
import { TILE_COLORS, SELECTED_COLOR } from '@/styles/colors'
import { moveTileBetweenGroups, createGroupFromTiles, moveGroup, canReplaceWild } from '@/engine/manipulationEngine'
import { isValidSet, findValidPlays } from '@/engine/validationEngine'
import { findFreePosition } from '@/engine/deckGenerator'
import TableCanvas from './TableCanvas'
import PlayerArea from './PlayerArea'
import CpuArea from './CpuArea'
import DrawPile from './DrawPile'
import ScoreBoard from './ScoreBoard'
import Toast, { useToast } from '@/components/ui/Toast'
import { useCpuTurns } from '@/hooks/useGameLoop'
import { useSound } from '@/hooks/useSound'
import Tile from './Tile'

// ── Board auto-zoom ───────────────────────────────────────────────────────────
const TILE_W = 54, TILE_GAP = 4, TILE_PAD = 16, GROUP_H = 90, ZOOM_MARGIN = 24

function computeBoardScale(
  groups: TileGroup[],
  canvas: { w: number; h: number },
): number {
  if (groups.length === 0) return 1
  let maxRight = 0, maxBottom = 0
  for (const g of groups) {
    const gw = g.tiles.length * (TILE_W + TILE_GAP) + TILE_PAD
    maxRight  = Math.max(maxRight,  g.position.x + gw)
    maxBottom = Math.max(maxBottom, g.position.y + GROUP_H)
  }
  const scaleX = (canvas.w - ZOOM_MARGIN) / maxRight
  const scaleY = (canvas.h - ZOOM_MARGIN) / maxBottom
  return Math.max(Math.min(scaleX, scaleY, 1), 0.4)
}

export default function GameBoard() {
  const phase              = useGameStore(s => s.phase)
  const players            = useGameStore(s => s.players)
  const currentPlayerIndex = useGameStore(s => s.currentPlayerIndex)
  const tableGroups        = useGameStore(s => s.tableGroups)
  const drawPile           = useGameStore(s => s.drawPile)
  const tilesPlayedThisTurn = useGameStore(s => s.tilesPlayedThisTurn)
  const turnDirection       = useGameStore(s => s.turnDirection)
  const lastFiredEffect     = useGameStore(s => s.lastFiredEffect)
  const unoPenaltyFiredAt   = useGameStore(s => s.unoPenaltyFiredAt)
  const canvasSize          = useGameStore(s => s.canvasSize)

  const boardScale = useMemo(
    () => computeBoardScale(tableGroups, canvasSize),
    [tableGroups, canvasSize],
  )

  const playTilesFromRack = useGameStore(s => s.playTilesFromRack)
  const rearrangeTable    = useGameStore(s => s.rearrangeTable)
  const commitTurn        = useGameStore(s => s.commitTurn)
  const drawTile          = useGameStore(s => s.drawTile)
  const callUno           = useGameStore(s => s.callUno)
  const cancelTurn        = useGameStore(s => s.cancelTurn)
  const resetGame         = useGameStore(s => s.resetGame)
  const returnTileToRack  = useGameStore(s => s.returnTileToRack)
  const splitTableGroup   = useGameStore(s => s.splitTableGroup)
  const swapWild          = useGameStore(s => s.swapWild)

  const humanPlayer = players[0]

  // ── Local state ──────────────────────────────────────────
  const [selectedIds, setSelectedIds]         = useState<Set<string>>(new Set())
  const [shakeGroupIds, setShakeGroupIds]     = useState<Set<string>>(new Set())
  const [insertIndicator, setInsertIndicator] = useState<{ groupId: string; index: number } | null>(null)
  const [banner, setBanner]                   = useState<{ message: string; key: number } | null>(null)
  const [rackOrder, setRackOrder]             = useState<string[]>([])
  const [activeDragData, setActiveDragData]   = useState<Record<string, unknown> | null>(null)

  const prevDrawPileLenRef = useRef(drawPile.length)

  const { toasts, addToast, dismiss } = useToast()
  const { play } = useSound()

  // ── CPU turn orchestration ──────────────────────────────
  useCpuTurns()

  // ── Center banner helper ─────────────────────────────────
  function showBanner(message: string) {
    setBanner({ message, key: Date.now() })
  }

  // ── Turn start announcements ─────────────────────────────
  useEffect(() => {
    if (phase !== 'PLAYER_TURN' && phase !== 'CPU_THINKING') return
    const player = players[currentPlayerIndex]
    if (!player) return
    showBanner(player.type === 'human' ? 'Your Turn!' : `${player.name}'s Turn`)
  }, [currentPlayerIndex, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── CPU draw detection ──────────────────────────────────
  useEffect(() => {
    if ((phase === 'CPU_ANIMATING' || phase === 'CPU_THINKING') &&
        drawPile.length < prevDrawPileLenRef.current) {
      const name = players[currentPlayerIndex]?.name ?? 'CPU'
      showBanner(`${name} drew a tile`)
    }
    prevDrawPileLenRef.current = drawPile.length
  }, [drawPile.length]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Special card effect announcements ───────────────────
  useEffect(() => {
    if (!lastFiredEffect) return
    showBanner(formatEffectBanner(lastFiredEffect, humanPlayer?.name ?? 'You'))
    switch (lastFiredEffect.type) {
      case 'skip':         play('skip');        break
      case 'draw2':        play('drawPenalty'); break
      case 'wildDrawFour': play('drawPenalty'); break
      case 'reverse':      play('specialPlay'); break
    }
  }, [lastFiredEffect]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── UNO penalty sound ────────────────────────────────────
  useEffect(() => {
    if (unoPenaltyFiredAt === 0) return
    play('unoPenalty')
    showBanner('You forgot to call UNO! Draw 2 tiles.')
  }, [unoPenaltyFiredAt]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Rack order state (for manual reordering) ────────────
  useEffect(() => {
    const rack = humanPlayer?.rack ?? []
    setRackOrder(prev => {
      const currentIds = new Set(rack.map(t => t.id))
      const filtered   = prev.filter(id => currentIds.has(id))
      const newIds     = rack.filter(t => !prev.includes(t.id)).map(t => t.id)
      return [...filtered, ...newIds]
    })
  }, [humanPlayer?.rack])

  function handleRackSort(activeId: string, overId: string) {
    setRackOrder(prev => {
      const oldIdx = prev.indexOf(activeId)
      const newIdx = prev.indexOf(overId)
      if (oldIdx < 0 || newIdx < 0) return prev
      return arrayMove(prev, oldIdx, newIdx)
    })
  }

  // ── Auto-play valid sets ─────────────────────────────────
  useEffect(() => {
    if (phase !== 'PLAYER_TURN') return
    if (selectedIds.size < 3 || selectedIds.size > 4) return
    const humanRack = players[0]?.rack ?? []
    const selectedTiles = humanRack.filter(t => selectedIds.has(t.id))
    if (selectedTiles.length !== selectedIds.size) return
    if (!isValidSet(selectedTiles)) return
    const pos = findFreePosition(tableGroups, selectedTiles.length)
    const result = playTilesFromRack([...selectedIds], null, 0, pos)
    if (result?.success !== false) {
      play('tilePlay')
      setSelectedIds(new Set())
    }
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Round end sounds ──────────────────────────────────────
  useEffect(() => {
    if (phase !== 'ROUND_END') return
    const humanWon = players[0] && [...players].sort((a, b) => b.score - a.score)[0]?.id === players[0].id
    play(humanWon ? 'roundWin' : 'roundLose')
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ────────────────────────────────────
  const canCommit = tilesPlayedThisTurn.length > 0
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (phase !== 'PLAYER_TURN' || e.repeat) return
      if (e.code === 'Space' && canCommit) { e.preventDefault(); handleCommit() }
      if (e.code === 'Escape') cancelTurn()
      if ((e.key === 'd' || e.key === 'D') && tilesPlayedThisTurn.length === 0) handleDraw()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, tilesPlayedThisTurn.length, canCommit]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Tile selection ───────────────────────────────────────
  const handleToggleSelect = useCallback((id: string, multi: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (multi) {
        if (next.has(id)) next.delete(id)
        else { next.add(id); play('tileClick') }
      } else {
        if (next.has(id) && next.size === 1) next.clear()
        else { next.clear(); next.add(id); play('tileClick') }
      }
      return next
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Swappable wild IDs ───────────────────────────────────
  const swappableWildIds = useMemo(() => {
    if (phase !== 'PLAYER_TURN' || selectedIds.size !== 1) return new Set<string>()
    const rackTileId = [...selectedIds][0]
    const rackTile = (humanPlayer?.rack ?? []).find(t => t.id === rackTileId)
    if (!rackTile) return new Set<string>()
    const result = new Set<string>()
    for (const group of tableGroups) {
      for (const tile of group.tiles) {
        if (tile.isWild && canReplaceWild(rackTile, tile.id, group)) result.add(tile.id)
      }
    }
    return result
  }, [phase, selectedIds, humanPlayer?.rack, tableGroups])

  // ── Table tile click: swap wild or toggle select ─────────
  function handleTableTileClick(tileId: string) {
    if (swappableWildIds.has(tileId) && selectedIds.size === 1) {
      const rackTileId = [...selectedIds][0]
      const group = tableGroups.find(g => g.tiles.some(t => t.id === tileId))
      if (group) {
        const result = swapWild(group.id, tileId, rackTileId)
        if (result.success) setSelectedIds(new Set())
        else addToast(result.message ?? 'Cannot swap', 'error')
      }
    } else {
      handleToggleSelect(tileId, false)
    }
  }

  // ── Draw handler (shows banner + sound) ─────────────────
  function handleDraw() {
    play('tileDraw')
    showBanner('You drew a tile')
    drawTile()
  }

  // ── Give Up handler (womp womp + confirm) ────────────────
  function handleGiveUp() {
    if (window.confirm('Give up and return to the start screen?')) {
      play('giveUp')
      resetGame()
    }
  }

  // ── UNO handler (banner + sound) ─────────────────────────
  function handleCallUno() {
    callUno()
    showBanner('UNO!')
    play('unoCall')
  }

  // ── DnD sensors ─────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveDragData((event.active.data.current ?? null) as Record<string, unknown> | null)
  }

  function handleDragOver(event: DragOverEvent) {
    const { over } = event
    if (!over || over.id === 'table-canvas' || over.id === 'draw-pile') {
      setInsertIndicator(null)
      return
    }
    const groupId = over.id as string
    const group   = tableGroups.find(g => g.id === groupId)
    if (group) setInsertIndicator({ groupId, index: group.tiles.length })
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDragData(null)
    setInsertIndicator(null)
    const { active, over } = event
    if (!over) return

    const dragData = active.data.current
    if (!dragData) return

    const translatedRect = active.rect.current.translated

    // ── Rack-internal sort ───────────────────────────────────
    if (dragData.type === 'rack-tile' && over.data.current?.type === 'rack-tile') {
      handleRackSort(active.id as string, over.id as string)
      return
    }

    // Compute canvas-relative drop position from the dragged element's translated rect.
    // Divide by boardScale to convert screen-space pixels → logical canvas-space coordinates.
    let position = { x: 20, y: 20 }
    if (translatedRect && over.rect) {
      const rawX = (translatedRect.left - over.rect.left) / boardScale
      const rawY = (translatedRect.top  - over.rect.top)  / boardScale
      position = {
        x: Math.max(4, Math.min(over.rect.width  / boardScale - 60,  rawX)),
        y: Math.max(4, Math.min(over.rect.height / boardScale - 90,  rawY)),
      }
    }

    // ── Group drag handle (move whole group) ─────────────────
    if (dragData.type === 'group-move') {
      const { groupId } = dragData as { groupId: string }
      const group = tableGroups.find(g => g.id === groupId)
      if (!group || !translatedRect || !over.rect) return
      const gw  = group.tiles.length * 54 + 24
      const gh  = 90
      const x   = Math.max(4, Math.min(over.rect.width  - gw, translatedRect.left - over.rect.left))
      const y   = Math.max(16, Math.min(over.rect.height - gh, translatedRect.top  - over.rect.top))
      rearrangeTable(moveGroup(tableGroups, groupId, { x, y }))
      return
    }

    // ── Rack tile dragged to table ───────────────────────────
    if (dragData.type === 'rack-tile') {
      const tile = dragData.tile as { id: string }
      if (over.id === 'table-canvas') {
        const result = playTilesFromRack([tile.id], null, 0, position)
        if (!result.success) addToast(result.message ?? 'Invalid play', 'error')
      } else if (over.id !== 'draw-pile') {
        const targetGroupId = over.id as string
        const insertPos = insertIndicator?.groupId === targetGroupId
          ? insertIndicator.index
          : tableGroups.find(g => g.id === targetGroupId)?.tiles.length ?? 0
        const result = playTilesFromRack([tile.id], targetGroupId, insertPos, position)
        if (!result.success) addToast(result.message ?? 'Invalid play', 'error')
      }
      setSelectedIds(new Set())
      return
    }

    // ── Table tile dragged to another group or canvas ────────
    if (dragData.type === 'table-tile') {
      const { tileId, fromGroupId } = dragData as { tileId: string; fromGroupId: string }

      // Dropped onto the rack → try to return tile to hand
      if (over.data.current?.type === 'rack-tile' || over.id === 'player-rack') {
        const result = returnTileToRack(tileId, fromGroupId)
        if (!result.success) addToast(result.message ?? 'Cannot return that tile', 'error')
        return
      }

      if (over.id === 'table-canvas') {
        const sourceGroup = tableGroups.find(g => g.id === fromGroupId)
        if (!sourceGroup) return
        const movedTile = sourceGroup.tiles.find(t => t.id === tileId)
        if (!movedTile) return
        const withoutTile = tableGroups.map(g =>
          g.id === fromGroupId
            ? { ...g, tiles: g.tiles.filter(t => t.id !== tileId) }
            : g
        ).filter(g => g.tiles.length > 0)
        rearrangeTable(createGroupFromTiles(withoutTile, [movedTile], position))
      } else if (over.id !== 'draw-pile' && over.id !== fromGroupId) {
        const targetGroupId = over.id as string
        // Safety: only call moveTileBetweenGroups if the target is an actual group
        if (!tableGroups.some(g => g.id === targetGroupId)) return
        const insertPos = insertIndicator?.groupId === targetGroupId
          ? insertIndicator.index
          : tableGroups.find(g => g.id === targetGroupId)?.tiles.length ?? 0
        rearrangeTable(moveTileBetweenGroups(tableGroups, tileId, fromGroupId, targetGroupId, insertPos))
      }
    }
  }

  // ── Commit ───────────────────────────────────────────────
  function handleCommit() {
    const result = commitTurn()
    if (!result.success) {
      play('error')
      addToast(result.message ?? 'Invalid table state', 'error')
      const ids = new Set(tableGroups.filter(g => g.type === 'invalid' || g.tiles.length < 3).map(g => g.id))
      if (ids.size > 0) {
        setShakeGroupIds(ids)
        setTimeout(() => setShakeGroupIds(new Set()), 600)
      }
    }
  }

  // ── Hint ─────────────────────────────────────────────────
  function handleHint() {
    const plays = findValidPlays(humanPlayer?.rack ?? [], tableGroups)
    if (plays.length === 0) {
      addToast('No valid plays found — try drawing', 'info')
      return
    }
    setSelectedIds(new Set(plays[0].tilesToPlay.map(t => t.id)))
  }

  const cpuPlayers = players.slice(1)

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      {/* Drag overlay — floating tile that follows the cursor */}
      <DragOverlay dropAnimation={null}>
        {activeDragData?.type === 'rack-tile' && (
          <Tile tile={activeDragData.tile as Parameters<typeof Tile>[0]['tile']} dragPreview />
        )}
        {activeDragData?.type === 'table-tile' && (() => {
          const tile = tableGroups.flatMap(g => g.tiles).find(t => t.id === activeDragData.tileId)
          return tile ? <Tile tile={tile} dragPreview /> : null
        })()}
      </DragOverlay>

      <div className="flex flex-col h-screen w-screen overflow-hidden" data-testid="game-board">
        <Toast toasts={toasts} onDismiss={dismiss} />

        {/* Center turn/draw announcements */}
        <AnimatePresence>
          {banner && (
            <CenterBanner
              key={banner.key}
              message={banner.message}
              onDone={() => setBanner(null)}
            />
          )}
        </AnimatePresence>

        {/* CPU players top bar */}
        <div className="flex items-start gap-2 p-2 flex-shrink-0 overflow-x-auto">
          {cpuPlayers.map((cpu, i) => (
            <CpuArea
              key={cpu.id}
              player={cpu}
              isThinking={phase === 'CPU_THINKING' && currentPlayerIndex === i + 1}
              isCurrentTurn={currentPlayerIndex === i + 1}
              compact={cpuPlayers.length > 2}
            />
          ))}
          <div className="ml-auto flex-shrink-0 flex items-center pr-1">
            <TurnDirectionIndicator direction={turnDirection} />
          </div>
        </div>

        {/* Center: table + sidebar */}
        <div className="flex flex-1 gap-3 px-3 min-h-0">
          <div className="flex-1 relative">
            <TableCanvas
              groups={tableGroups}
              selectedTileIds={selectedIds}
              swappableWildIds={swappableWildIds}
              onTileClick={handleTableTileClick}
              onSplit={splitTableGroup}
              shakeGroupIds={shakeGroupIds}
              insertIndicator={insertIndicator}
              readOnly={phase !== 'PLAYER_TURN'}
              draggable={phase === 'PLAYER_TURN'}
              boardScale={boardScale}
            />
          </div>

          <div className="flex flex-col gap-3 flex-shrink-0 w-[130px]">
            <ScoreBoard players={players} currentPlayerIndex={currentPlayerIndex} />
            <div className="flex justify-center">
              <DrawPile
                count={drawPile.length}
                onDraw={handleDraw}
                disabled={phase !== 'PLAYER_TURN' || tilesPlayedThisTurn.length > 0}
              />
            </div>
          </div>
        </div>

        {/* Human player bottom */}
        <div className="flex-shrink-0 p-3">
          {humanPlayer && (
            <PlayerArea
              playerName={humanPlayer.name}
              tiles={humanPlayer.rack}
              rackOrder={rackOrder}
              phase={phase}
              tilesPlayedCount={tilesPlayedThisTurn.length}
              hasUnoCallPending={humanPlayer.unoCallPending}
              canCommit={tilesPlayedThisTurn.length > 0}
              onCommit={handleCommit}
              onDraw={handleDraw}
              onCallUno={handleCallUno}
              onCancel={cancelTurn}
              onGiveUp={handleGiveUp}
              onHint={handleHint}
              selectedIds={selectedIds}
              onToggleSelect={handleToggleSelect}
            />
          )}
        </div>

        {/* Round end overlay */}
        <AnimatePresence>
          {phase === 'ROUND_END' && <RoundEndOverlay players={players} />}
        </AnimatePresence>
      </div>
    </DndContext>
  )
}

// ── Special effect banner text ───────────────────────────────

function formatEffectBanner(effect: LastFiredEffect, humanName: string): string {
  const actor  = effect.actorName  === humanName ? 'You'  : effect.actorName
  const target = effect.targetName === humanName ? 'you'  : effect.targetName
  const targetCap = effect.targetName === humanName ? 'You' : effect.targetName

  switch (effect.type) {
    case 'skip':        return `${actor} played Skip — ${targetCap} ${target === 'you' ? 'are' : 'is'} skipped!`
    case 'draw2':       return `${actor} played Draw 2 — ${targetCap} draw${target === 'you' ? '' : 's'} 2!`
    case 'reverse':     return `${actor} played Reverse — turn order flipped!`
    case 'wildDrawFour':return `${actor} played Wild +4 — ${targetCap} draw${target === 'you' ? '' : 's'} 4!`
    default:            return 'Special card played!'
  }
}

// ── Turn direction indicator ──────────────────────────────────

function TurnDirectionIndicator({ direction }: { direction: 1 | -1 }) {
  return (
    <motion.div
      animate={{ scaleX: direction === 1 ? 1 : -1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      title={direction === 1 ? 'Clockwise' : 'Counter-clockwise'}
      style={{
        fontSize:        22,
        color:           'rgba(255,255,255,0.45)',
        display:         'inline-block',
        transformOrigin: 'center',
        userSelect:      'none',
        lineHeight:      1,
      }}
    >
      ↻
    </motion.div>
  )
}

// ── Center announcement banner ───────────────────────────────

function CenterBanner({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 1500)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-40"
    >
      <div className="bg-black/85 text-white text-2xl font-black px-8 py-4 rounded-2xl shadow-2xl border border-white/20 backdrop-blur-sm">
        {message}
      </div>
    </motion.div>
  )
}

// ── Falling confetti ─────────────────────────────────────────

export function Confetti() {
  const COLORS = [TILE_COLORS.red, TILE_COLORS.blue, TILE_COLORS.green, TILE_COLORS.yellow, SELECTED_COLOR, '#ffffff']
  const particles = Array.from({ length: 80 }, (_, i) => ({
    id: i,
    color: COLORS[i % COLORS.length],
    startX: Math.random() * 100, // vw %
    drift: (Math.random() - 0.5) * 200,
    rotate: Math.random() * 720 * (Math.random() > 0.5 ? 1 : -1),
    delay: Math.random() * 1.5,
    duration: 2.2 + Math.random() * 1.2,
    width: 6 + Math.random() * 6,
    height: 10 + Math.random() * 8,
  }))
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 50 }}>
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: -20, opacity: 1, rotate: 0 }}
          animate={{ x: p.drift, y: '110vh', opacity: 0, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: 'linear' }}
          style={{
            position: 'absolute',
            left: `${p.startX}%`,
            top: 0,
            width: p.width,
            height: p.height,
            borderRadius: 2,
            background: p.color,
          }}
        />
      ))}
    </div>
  )
}

// ── Round end overlay ────────────────────────────────────────

function RoundEndOverlay({ players }: { players: Player[] }) {
  const startRound = useGameStore(s => s.startRound)
  const sorted     = [...players].sort((a, b) => b.score - a.score)
  const winner     = sorted[0]
  const humanWon   = winner?.id === players[0]?.id

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-black/70 flex items-center justify-center z-30"
    >
      {humanWon && <Confetti />}
      <motion.div
        initial={{ scale: 0.8, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-gray-900 rounded-2xl p-8 text-center border border-white/10 shadow-2xl max-w-sm w-full mx-4"
        style={{ position: 'relative', zIndex: 51 }}
      >
        <div className="text-5xl mb-3">{humanWon ? '🏆' : '🎉'}</div>
        <h2 className="text-2xl font-black text-white mb-2">Round Over!</h2>
        <p className="text-white/70 mb-4">
          Leader: <strong>{winner?.name}</strong> with {winner?.score} pts
        </p>

        <div className="space-y-2 mb-6">
          {sorted.map(p => (
            <div key={p.id} className="flex justify-between text-sm text-white/80">
              <span>{p.name}</span>
              <span className="font-bold tabular-nums">{p.score} pts</span>
            </div>
          ))}
        </div>

        <button
          onClick={startRound}
          className="bg-uno-red text-white font-black px-6 py-3 rounded-xl hover:bg-red-700 transition-colors w-full"
        >
          Next Round →
        </button>
      </motion.div>
    </motion.div>
  )
}
