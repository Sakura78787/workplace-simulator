import { motion, useAnimationControls, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { SPRING_SOFT, SPRING_STIFF } from '../../config/motion'
import { SPEC_SLOW_LOADING_HINTS } from '../../config/specCopy'
import type { StoryOption } from '../../config/storyNodes'

type StoryCardProps = {
  text: string
  leftOption: StoryOption
  rightOption: StoryOption
  stats: {
    kpi: number
    shield: number
    mental: number
  }
  isSlow?: boolean
  /** 与规格补充文档 §9 一致的慢响应提示（由父组件按回合轮换）。 */
  slowLoadingHint?: string
  isInteractionLocked?: boolean
  isTyping?: boolean
  onTypingChange?: (isTyping: boolean) => void
  onSelect: (option: StoryOption) => void | Promise<void>
}

/** 规格补充文档 §2：提交阈值 |dx| ≥ 60px；手感允许 50–70px 微调，此处取 60。 */
const dragThreshold = 60

export function StoryCard({
  text,
  leftOption,
  rightOption,
  stats,
  isSlow = false,
  slowLoadingHint = SPEC_SLOW_LOADING_HINTS[0],
  isInteractionLocked = false,
  isTyping = false,
  onTypingChange,
  onSelect,
}: StoryCardProps) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-320, 320], [-8, 8])
  const rotateY = useTransform(x, [-260, 0, 260], [-10, 0, 10])
  const rotateX = useTransform(x, [-260, 0, 260], [3, 0, -3])
  const rightGlowOpacity = useTransform(x, [0, 55, 220], [0, 0.25, 0.75])
  const leftGlowOpacity = useTransform(x, [-220, -55, 0], [0.75, 0.25, 0])
  const controls = useAnimationControls()
  const [typedWordCount, setTypedWordCount] = useState(0)
  const [isEntryAnimationDone, setIsEntryAnimationDone] = useState(false)
  const entryAnimationPendingRef = useRef(true)
  const words = text.includes(' ') ? text.split(/\s+/) : Array.from(text)
  const isAvatarCritical = stats.kpi < 30 || stats.shield < 20

  useEffect(() => {
    entryAnimationPendingRef.current = true
    controls.set({ opacity: 0, y: 30, scale: 0.85, x: 0, rotate: 0 })
    void controls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: SPRING_STIFF,
    })
  }, [controls])

  useEffect(() => {
    if (!isEntryAnimationDone) {
      onTypingChange?.(false)
      return
    }

    let destroyed = false
    onTypingChange?.(true)
    let index = 0

    const timer = window.setInterval(() => {
      if (destroyed) return
      index += 1
      setTypedWordCount(index)
      if (index >= words.length) {
        window.clearInterval(timer)
        onTypingChange?.(false)
      }
    }, 45)

    return () => {
      destroyed = true
      window.clearInterval(timer)
      onTypingChange?.(false)
    }
  }, [isEntryAnimationDone, text, words.length, onTypingChange])

  useEffect(() => {
    return () => {
      controls.stop()
      x.stop()
      x.set(0)
      onTypingChange?.(false)
    }
  }, [controls, onTypingChange, x])

  /**
   * 根据滑动方向播放飞出动画，并在动画结束后提交对应选项。
   */
  const playFlyOutAndSettle = async (direction: 'left' | 'right') => {
    const targetX = direction === 'left' ? -520 : 520
    const targetRotate = direction === 'left' ? -12 : 12
    const targetOption = direction === 'left' ? leftOption : rightOption

    await controls.start({
      x: targetX,
      rotate: targetRotate,
      opacity: 0,
      transition: SPRING_STIFF,
    })

    controls.set({ x: 0, rotate: 0, opacity: 1 })
    x.set(0)
    await onSelect(targetOption)
  }

  return (
    <motion.div
      className="relative mx-auto w-full max-w-[340px] rounded-3xl border border-white/50 bg-white/50 p-6 shadow-[0_16px_28px_rgba(45,45,45,0.12)] ring-1 ring-text-secondary/15 backdrop-blur-xl"
      style={{ x, rotate, rotateY, rotateX, transformPerspective: 1200 }}
      animate={controls}
      drag={isInteractionLocked ? false : 'x'}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      whileTap={isInteractionLocked ? undefined : { scale: 0.99 }}
      onDragEnd={async (_, info) => {
        if (isInteractionLocked) return

        if (info.offset.x <= -dragThreshold) {
          await playFlyOutAndSettle('left')
          return
        }
        if (info.offset.x >= dragThreshold) {
          await playFlyOutAndSettle('right')
          return
        }

        controls.start({
          x: 0,
          rotate: 0,
          transition: SPRING_STIFF,
        })
      }}
      transition={SPRING_STIFF}
      onAnimationComplete={() => {
        if (!entryAnimationPendingRef.current) return
        entryAnimationPendingRef.current = false
        setIsEntryAnimationDone(true)
      }}
    >
      <motion.div
        className="pointer-events-none absolute inset-x-8 bottom-2 h-14 rounded-full bg-mint/30 blur-2xl"
        style={{ opacity: rightGlowOpacity }}
      />
      <motion.div
        className="pointer-events-none absolute inset-x-8 bottom-2 h-14 rounded-full bg-sunset/30 blur-2xl"
        style={{ opacity: leftGlowOpacity }}
      />

      <motion.div
        className="pointer-events-none absolute -inset-1 rounded-[28px] ring-2 ring-mint/35"
        animate={{ opacity: [0.25, 0.55, 0.25], scale: [1, 1.01, 1] }}
        transition={{ ...SPRING_SOFT, repeat: Infinity, repeatType: 'mirror', duration: 2.8 }}
      />

      {isTyping ? (
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 2px, transparent 2px, transparent 6px)',
          }}
          animate={{ opacity: [0.16, 0.26, 0.16] }}
          transition={{ ...SPRING_SOFT, repeat: Infinity, repeatType: 'mirror' }}
        />
      ) : null}

      {isSlow ? (
        <motion.div
          className="absolute -top-11 left-4 flex items-center gap-1 rounded-full bg-card-bg px-3 py-1.5 text-xs text-text-primary shadow-md ring-1 ring-babyblue/50"
          initial={{ opacity: 0, y: 8, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <span>{slowLoadingHint}</span>
          {[0, 1, 2].map((index) => (
            <motion.span
              key={index}
              className="inline-block"
              animate={{ y: [0, -3, 0], opacity: [0.4, 1, 0.4] }}
              transition={{
                type: 'spring',
                stiffness: 320,
                damping: 16,
                repeat: Infinity,
                repeatType: 'loop',
                delay: index * 0.12,
              }}
            >
              .
            </motion.span>
          ))}
        </motion.div>
      ) : null}

      <div className="mb-4 flex items-center gap-3">
        <motion.div
          className="relative"
          animate={isAvatarCritical ? { x: [-1, 1, -1] } : { x: 0 }}
          transition={
            isAvatarCritical
              ? { ...SPRING_STIFF, repeat: Infinity, repeatType: 'mirror', duration: 0.28 }
              : SPRING_SOFT
          }
        >
          <motion.div
            key={`${stats.kpi}-${stats.shield}-${stats.mental}`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sunset/85 text-xl shadow-sm"
            initial={{ scale: 1 }}
            animate={{ scale: [1, 1.2, 1] }}
            transition={SPRING_STIFF}
          >
            🦊
          </motion.div>
        </motion.div>
        <div>
          <p className="text-sm font-semibold text-text-primary">主管猪总</p>
          <p className="text-xs text-text-secondary">今天也在精准施压</p>
        </div>
      </div>

      <p className="mb-4 text-xs text-text-secondary">⇠ 滑动抉择 ⇢</p>
      <p className="min-h-14 font-body text-base leading-relaxed text-text-primary">
        {words.slice(0, typedWordCount).map((word, index) => (
          <motion.span
            key={`${index}-${word}`}
            className="inline-block"
            initial={{ opacity: 0, filter: 'blur(4px)', y: 2 }}
            animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
            transition={SPRING_SOFT}
          >
            {word}
            {index < typedWordCount - 1 ? ' ' : ''}
          </motion.span>
        ))}
        {isTyping ? (
          <motion.span
            className="ml-0.5 inline-block h-4 w-[2px] bg-sunset align-middle"
            animate={{ opacity: [1, 0.2, 1] }}
            transition={{ ...SPRING_SOFT, repeat: Infinity, repeatType: 'mirror' }}
          />
        ) : null}
      </p>
      <div className="mt-6 flex items-center justify-between text-xs text-text-secondary">
        <span>左滑：{leftOption.text}</span>
        <span>右滑：{rightOption.text}</span>
      </div>
    </motion.div>
  )
}
