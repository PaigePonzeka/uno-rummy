import { motion, AnimatePresence } from 'framer-motion'

interface UnoButtonProps {
  onClick: () => void
  visible: boolean
  disabled?: boolean
}

export default function UnoButton({ onClick, visible, disabled }: UnoButtonProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          onClick={onClick}
          disabled={disabled}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`
            w-16 h-16 rounded-full font-black text-white text-sm
            bg-uno-red border-4 border-white shadow-lg
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          aria-label="Call UNO!"
        >
          UNO!
        </motion.button>
      )}
    </AnimatePresence>
  )
}
