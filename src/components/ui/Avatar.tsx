import type { ZooCreatureKey } from '@/engine/types'

export interface CreatureMeta {
  key:         ZooCreatureKey
  name:        string
  emoji:       string
  difficulty:  1 | 2 | 3 | 4 | 5
  blurb:       string
  color:       string
}

export const CREATURES: Record<ZooCreatureKey, CreatureMeta> = {
  ziggy: {
    key: 'ziggy', name: 'Ziggy', emoji: '🦓',
    difficulty: 1,
    blurb: 'Makes silly mistakes and forgets to plan. Perfect for beginners!',
    color: '#6B7280',
  },
  gerald: {
    key: 'gerald', name: 'Gerald', emoji: '🦒',
    difficulty: 2,
    blurb: 'Slow and steady wins the race... usually. Mostly.',
    color: '#D97706',
  },
  harriet: {
    key: 'harriet', name: 'Harriet', emoji: '🦛',
    difficulty: 3,
    blurb: 'Prefers to stay in the water and draw tiles rather than fight.',
    color: '#6366F1',
  },
  polly: {
    key: 'polly', name: 'Polly', emoji: '🦜',
    difficulty: 3,
    blurb: 'Chaotic and unpredictable. Nobody knows what Polly will do next!',
    color: '#10B981',
  },
  penelope: {
    key: 'penelope', name: 'Penelope', emoji: '🐧',
    difficulty: 3,
    blurb: 'Cool, methodical, and precise. Makes correct moves — just not brilliant ones.',
    color: '#3B82F6',
  },
  marco: {
    key: 'marco', name: 'Marco', emoji: '🐒',
    difficulty: 4,
    blurb: 'Loves to rearrange everything! Tricky combo plays are his specialty.',
    color: '#92400E',
  },
  leo: {
    key: 'leo', name: 'Leo', emoji: '🦁',
    difficulty: 5,
    blurb: 'The king of the jungle. Ferocious, optimal, and always targeting the leader.',
    color: '#B45309',
  },
  tara: {
    key: 'tara', name: 'Tara', emoji: '🐯',
    difficulty: 5,
    blurb: 'Pure aggression. Maximizes every turn and attacks with special tiles.',
    color: '#DC2626',
  },
}

interface AvatarProps {
  creatureKey: ZooCreatureKey
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showName?: boolean
  showDifficulty?: boolean
  thinking?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-10 h-10 text-2xl',
  md: 'w-14 h-14 text-3xl',
  lg: 'w-20 h-20 text-5xl',
  xl: 'w-28 h-28 text-7xl',
}

export default function Avatar({
  creatureKey,
  size = 'md',
  showName = false,
  showDifficulty = false,
  thinking = false,
  className = '',
}: AvatarProps) {
  const meta = CREATURES[creatureKey]

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center
          border-2 border-white/20 shadow-md
          ${thinking ? 'animate-thinking' : ''}`}
        style={{ backgroundColor: `${meta.color}33` }}
      >
        {meta.emoji}
      </div>
      {showName && (
        <span className="text-sm font-bold text-white/90">{meta.name}</span>
      )}
      {showDifficulty && (
        <div className="flex gap-0.5">
          {Array.from({ length: 5 }, (_, i) => (
            <span key={i} className={i < meta.difficulty ? 'text-yellow-400' : 'text-white/20'}>
              ★
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

interface CreatureCardProps {
  meta: CreatureMeta
  selected: boolean
  disabled?: boolean
  onClick: () => void
}

export function CreatureCard({ meta, selected, disabled, onClick }: CreatureCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200
        ${selected
          ? 'border-white bg-white/20 scale-105 shadow-lg'
          : 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/40'
        }
        ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <div className="text-4xl">{meta.emoji}</div>
      <div className="font-bold text-white text-sm">{meta.name}</div>
      <div className="flex gap-0.5">
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i} className={`text-xs ${i < meta.difficulty ? 'text-yellow-400' : 'text-white/20'}`}>
            ★
          </span>
        ))}
      </div>
      <p className="text-white/60 text-xs text-center leading-tight line-clamp-2">{meta.blurb}</p>
    </button>
  )
}
