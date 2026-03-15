import { useMemo } from 'react'
import { Home, Layers } from 'lucide-react'
import { generateDeck } from '@/engine/deckGenerator'
import type { Tile as TileData, TileColor } from '@/engine/types'
import Tile, { TileBack } from '@/components/game/Tile'
import Button from '@/components/ui/Button'

const COLORS: TileColor[] = ['red', 'blue', 'green', 'yellow']
const COLOR_LABELS: Record<TileColor, string> = {
  red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow',
}

export default function TileGalleryScreen() {
  const deck = useMemo(() => generateDeck(), [])

  // Deduplicate to one tile per (color × slot) for display — use copy 'a'
  const byType = {
    number:      deck.filter(t => t.type === 'number'      && t.id.endsWith('_a')),
    draw2:       deck.filter(t => t.type === 'draw2'       && t.id.endsWith('_a')),
    skip:        deck.filter(t => t.type === 'skip'        && t.id.endsWith('_a')),
    reverse:     deck.filter(t => t.type === 'reverse'     && t.id.endsWith('_a')),
    wildDrawFour: deck.filter(t => t.type === 'wildDrawFour'),
  }

  function goHome() { window.location.hash = '' }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2">
              <Layers size={24} /> Tile Gallery
            </h1>
            <p className="text-white/50 text-sm mt-1">All tile designs — one copy of each variant</p>
          </div>
          <Button variant="ghost" size="sm" onClick={goHome}>
            <span className="flex items-center gap-1.5"><Home size={14} /> Back to Game</span>
          </Button>
        </div>

        {/* Number tiles by color */}
        <Section title="Number Tiles">
          {COLORS.map(color => (
            <div key={color} className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                {COLOR_LABELS[color]}
              </div>
              <TileRow tiles={byType.number.filter(t => t.color === color)} />
            </div>
          ))}
        </Section>

        {/* Special tiles */}
        <Section title="Special Tiles">
          {(['draw2', 'skip', 'reverse'] as const).map(type => (
            <div key={type} className="mb-4">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-2">
                {type === 'draw2' ? 'Draw Two' : type === 'skip' ? 'Skip' : 'Reverse'}
              </div>
              <TileRow tiles={byType[type]} />
            </div>
          ))}
        </Section>

        {/* Wild tiles */}
        <Section title="Wild Draw Four">
          <TileRow tiles={byType.wildDrawFour} />
        </Section>

        {/* Tile backs */}
        <Section title="Tile Backs">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="text-center">
              <TileBack />
              <div className="text-xs text-white/40 mt-1">Normal</div>
            </div>
            <div className="text-center">
              <TileBack small />
              <div className="text-xs text-white/40 mt-1">Small</div>
            </div>
          </div>
        </Section>

        {/* Footer nav */}
        <div className="mt-10 pt-6 border-t border-white/10 text-center">
          <p className="text-white/30 text-xs mb-3">Dev tools</p>
          <div className="flex justify-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { window.location.hash = '#/dev/sounds' }}>
              ← Sound Test
            </Button>
            <Button variant="ghost" size="sm" onClick={goHome}>
              <span className="flex items-center gap-1.5"><Home size={14} /> Game</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-sm font-black uppercase tracking-widest text-white/60 mb-4 pb-2 border-b border-white/10">
        {title}
      </h2>
      {children}
    </section>
  )
}

function TileRow({ tiles }: { tiles: TileData[] }) {
  return (
    <div className="flex flex-wrap gap-2 items-end">
      {tiles.map(tile => (
        <div key={tile.id} className="flex flex-col items-center gap-1">
          <Tile tile={tile} noLayoutId />
          <div className="text-xs text-white/30">{tile.displayNumber ?? '★'}</div>
        </div>
      ))}
    </div>
  )
}
