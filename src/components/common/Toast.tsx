import { AnimatePresence, motion } from 'framer-motion'
import { useEffect } from 'react'
import { useToastStore } from '../../store/toastStore'
import type { ToastTone } from '../../store/toastStore'

const toneClassMap: Record<ToastTone, string> = {
  info: 'bg-card-bg/95 text-text-primary ring-1 ring-babyblue/60',
  warn: 'bg-sunset/95 text-text-primary ring-1 ring-sunset/70',
  error: 'bg-critical text-white ring-1 ring-critical/80',
}

export function ToastViewport() {
  const activeToast = useToastStore((state) => state.activeToast)
  const clearToast = useToastStore((state) => state.clearToast)

  useEffect(() => {
    if (!activeToast) return

    const timer = window.setTimeout(() => {
      clearToast()
    }, activeToast.durationMs)

    return () => window.clearTimeout(timer)
  }, [activeToast, clearToast])

  return (
    <div className="pointer-events-none absolute inset-x-0 top-6 z-30 flex justify-center px-4">
      <AnimatePresence>
        {activeToast ? (
          <motion.div
            key={activeToast.id}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28, mass: 0.7 }}
            className={[
              'pointer-events-auto max-w-[360px] rounded-full px-5 py-2 text-sm font-medium shadow-lg backdrop-blur',
              toneClassMap[activeToast.tone],
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            {activeToast.message}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}
