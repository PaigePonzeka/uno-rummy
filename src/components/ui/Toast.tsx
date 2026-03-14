import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface ToastMessage {
  id:      string
  message: string
  type:    'error' | 'success' | 'info' | 'warning'
}

interface ToastProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const typeStyles: Record<ToastMessage['type'], string> = {
  error:   'bg-red-600 border-red-400',
  success: 'bg-emerald-600 border-emerald-400',
  info:    'bg-blue-600 border-blue-400',
  warning: 'bg-amber-600 border-amber-400',
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`px-4 py-3 rounded-lg border text-white text-sm font-semibold shadow-lg ${typeStyles[toast.type]} cursor-pointer`}
      onClick={() => onDismiss(toast.id)}
    >
      {toast.message}
    </motion.div>
  )
}

export default function Toast({ toasts, onDismiss }: ToastProps) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 items-center">
      <AnimatePresence>
        {toasts.map(t => (
          <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Hook ────────────────────────────────────────────────────

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  function addToast(message: string, type: ToastMessage['type'] = 'info') {
    const id = `${Date.now()}_${Math.random()}`
    setToasts(prev => [...prev, { id, message, type }])
  }

  function dismiss(id: string) {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismiss }
}
