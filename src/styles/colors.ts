// Uno color palette — sourced from uno-color-scheme.svg
// Never hardcode these hex values elsewhere; always import from here.

export const TILE_COLORS = {
  red:    '#D72600',
  blue:   '#0956BF',
  green:  '#379711',
  yellow: '#ECD407',
} as const

export type TileColorHex = typeof TILE_COLORS[keyof typeof TILE_COLORS]

// Tailwind class helpers for tile backgrounds
export const TILE_BG_CLASSES = {
  red:    'bg-uno-red',
  blue:   'bg-uno-blue',
  green:  'bg-uno-green',
  yellow: 'bg-uno-yellow',
} as const

// Tailwind text contrast classes (yellow needs dark text)
export const TILE_TEXT_CLASSES = {
  red:    'text-white',
  blue:   'text-white',
  green:  'text-white',
  yellow: 'text-gray-900',
} as const

// Purple for selected/interacted tiles
export const SELECTED_COLOR = '#9333EA'

// Group validity border colors
export const GROUP_BORDER = {
  run:        'border-emerald-400',
  set:        'border-sky-400',
  incomplete: 'border-gray-400',
  invalid:    'border-red-500',
} as const
