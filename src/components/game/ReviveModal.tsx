import { AnimatePresence, motion } from 'framer-motion'
import { CapsuleButton } from '../common/CapsuleButton'

type ReviveModalProps = {
  visible: boolean
  onConfirmRevive: () => void
  onGiveUp: () => void
}

export function ReviveModal({ visible, onConfirmRevive, onGiveUp }: ReviveModalProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="absolute inset-0 z-40 flex items-center justify-center bg-black/35 p-6 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-[320px] rounded-3xl bg-card-bg p-5 shadow-[0_18px_36px_rgba(0,0,0,0.22)]"
            initial={{ opacity: 0, scale: 0.9, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 18 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
          >
            <h2 className="text-center font-heading text-2xl text-text-primary">你还能抢救一下</h2>
            <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
              你触发了死局。是否使用「HR免死金牌 / 请喝奶茶」回退到本回合开始前？
            </p>
            <div className="mt-5 grid gap-3">
              <CapsuleButton onClick={onConfirmRevive}>使用复活</CapsuleButton>
              <CapsuleButton variant="warning" onClick={onGiveUp}>
                放弃挣扎
              </CapsuleButton>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
