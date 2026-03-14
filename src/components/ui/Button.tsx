import { type ButtonHTMLAttributes, forwardRef } from 'react'

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  fullWidth?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-uno-red text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-900/40',
  secondary: 'bg-white/10 text-white hover:bg-white/20 active:bg-white/30 disabled:bg-white/5',
  danger:    'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 disabled:bg-orange-900/40',
  ghost:     'bg-transparent text-white/70 hover:text-white hover:bg-white/10 disabled:text-white/30',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
  ...props
}, ref) => (
  <button
    ref={ref}
    className={[
      'rounded-lg font-bold transition-colors duration-150',
      'focus:outline-none focus:ring-2 focus:ring-white/50',
      'disabled:cursor-not-allowed',
      variantClasses[variant],
      sizeClasses[size],
      fullWidth ? 'w-full' : '',
      className,
    ].join(' ')}
    {...props}
  >
    {children}
  </button>
))

Button.displayName = 'Button'
export default Button
