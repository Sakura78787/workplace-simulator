import { motion } from 'framer-motion'
import { SPRING_SOFT } from '../../config/motion'

const meteorItems = Array.from({ length: 12 }, (_, index) => ({
  id: index,
  left: `${6 + index * 8}%`,
  delay: index * 0.45,
  duration: 2.8 + (index % 4) * 0.35,
}))

export function Meteors() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-20">
      {meteorItems.map((meteor) => (
        <motion.span
          key={meteor.id}
          className="absolute top-[-12%] block h-24 w-[1px] rotate-[22deg] bg-gradient-to-b from-white/90 to-transparent"
          style={{ left: meteor.left }}
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: ['0%', '130%'], opacity: [0, 1, 0] }}
          transition={{
            ...SPRING_SOFT,
            repeat: Infinity,
            repeatType: 'loop',
            delay: meteor.delay,
            duration: meteor.duration,
          }}
        />
      ))}
    </div>
  )
}
