import { motion } from 'framer-motion'

const blobTransition = {
  duration: 22,
  repeat: Infinity,
  repeatType: 'reverse' as const,
  ease: 'easeInOut' as const,
}

export function BlobBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -left-24 -top-20 h-72 w-72 rounded-[40%] bg-mint/55 blur-3xl"
        animate={{
          x: [0, 36, -12, 18],
          y: [0, 28, 60, 14],
          scale: [1, 1.08, 0.95, 1.03],
          borderRadius: ['40% 60% 65% 35%', '52% 48% 58% 42%', '46% 54% 40% 60%'],
        }}
        transition={blobTransition}
      />
      <motion.div
        className="absolute -right-24 top-1/4 h-80 w-80 rounded-[45%] bg-babyblue/55 blur-3xl"
        animate={{
          x: [0, -30, 22, -16],
          y: [0, -36, 24, 46],
          scale: [1, 0.94, 1.06, 0.98],
          borderRadius: ['45% 55% 50% 50%', '58% 42% 40% 60%', '48% 52% 62% 38%'],
        }}
        transition={{ ...blobTransition, duration: 26 }}
      />
      <motion.div
        className="absolute -bottom-28 left-1/2 h-80 w-80 -translate-x-1/2 rounded-[50%] bg-sunset/35 blur-3xl"
        animate={{
          x: [0, 18, -22, 8],
          y: [0, -26, -8, -34],
          scale: [1, 1.05, 0.92, 1.04],
          borderRadius: ['50% 50% 42% 58%', '38% 62% 52% 48%', '56% 44% 64% 36%'],
        }}
        transition={{ ...blobTransition, duration: 24 }}
      />
    </div>
  )
}
