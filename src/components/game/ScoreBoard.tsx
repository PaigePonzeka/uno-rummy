import type { Player, ZooCreatureKey } from '@/engine/types'

interface ScoreBoardProps {
  players: Player[]
  currentPlayerIndex: number
}

export default function ScoreBoard({ players, currentPlayerIndex }: ScoreBoardProps) {
  return (
    <div className="flex flex-col gap-2 bg-black/30 rounded-xl p-3 min-w-[120px]">
      <h3 className="text-white/60 text-xs font-bold uppercase tracking-wider text-center">
        Scores
      </h3>
      {players.map((player, idx) => (
        <div
          key={player.id}
          className={`
            flex items-center gap-2 p-2 rounded-lg transition-colors
            ${idx === currentPlayerIndex ? 'bg-white/20 ring-1 ring-white/40' : 'bg-white/5'}
          `}
        >
          {player.type === 'cpu' && player.creatureKey ? (
            <span className="text-xl">
              {/* Emoji inline since Avatar adds too much height here */}
              {getEmoji(player.creatureKey)}
            </span>
          ) : (
            <span className="text-xl">👤</span>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">{player.name}</div>
            <div className="text-white/50 text-xs">{player.rack.length} tiles</div>
          </div>
          <div className="text-white font-black text-sm tabular-nums">
            {player.score}
          </div>
        </div>
      ))}
    </div>
  )
}

const EMOJIS: Record<ZooCreatureKey, string> = {
  ziggy: '🦓', gerald: '🦒', harriet: '🦛', polly: '🦜',
  penelope: '🐧', marco: '🐒', leo: '🦁', tara: '🐯',
}

function getEmoji(key: ZooCreatureKey): string {
  return EMOJIS[key] ?? '🤖'
}
