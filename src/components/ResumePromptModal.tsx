import { AnimatePresence, motion } from 'framer-motion'
import { CapsuleButton } from './common/CapsuleButton'

type ResumePromptModalProps = {
  open: boolean
  currentRound: number
  totalRounds: number
  onContinue: () => void
  onRestart: () => void
  onClose: () => void
}

/**
 * PRD 对齐：检测到残局时，先弹窗分流“继续收拾”或“重新入职”。
 */
export function ResumePromptModal({ open, currentRound, totalRounds, onContinue, onRestart, onClose }: ResumePromptModalProps) {
  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-[85] flex items-center justify-center bg-text-primary/35 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[360px] rounded-3xl bg-card-bg p-5 shadow-[0_20px_40px_rgba(0,0,0,0.2)]"
            initial={{ y: 20, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 12, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
          >
            <h2 className="text-center font-heading text-2xl text-text-primary">检测到未完成烂摊子</h2>
            <p className="mt-2 text-center text-sm text-text-secondary">
              你上次还在第 {currentRound}/{totalRounds} 回合和老板对线，要继续收拾，还是直接重新入职？
            </p>

            <div className="mt-5 grid gap-3">
              <CapsuleButton onClick={onContinue}>继续收拾烂摊子</CapsuleButton>
              <CapsuleButton variant="warning" onClick={onRestart}>
                重新入职
              </CapsuleButton>
              <button
                type="button"
                onClick={onClose}
                className="mx-auto text-xs text-text-secondary underline underline-offset-4"
              >
                稍后再说
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
