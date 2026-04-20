import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { SPRING_STIFF } from '../../config/motion'
import type { StoryOption } from '../../config/storyNodes'

type DecisionAreaProps = {
  options: StoryOption[]
  onQuickSelect: (option: StoryOption) => void | Promise<void>
  onSubmitInput: (inputText: string) => void | Promise<void>
  isInteractionLocked?: boolean
  isSubmitting?: boolean
}

const longPressThresholdMs = 400

export function DecisionArea({
  options,
  onQuickSelect,
  onSubmitInput,
  isInteractionLocked = false,
  isSubmitting = false,
}: DecisionAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement | null>(null)
  const longPressTimerRef = useRef<number | null>(null)
  const hasLongPressedRef = useRef(false)

  /** NPC 打字或 LLM 等待期间：强制失焦，防止移动浏览器拉起键盘。 */
  useEffect(() => {
    if (isInteractionLocked) {
      inputRef.current?.blur()
    }
  }, [isInteractionLocked])

  const hideQuickChips = isInputFocused || isInteractionLocked

  const clearLongPressTimer = () => {
    if (!longPressTimerRef.current) return
    window.clearTimeout(longPressTimerRef.current)
    longPressTimerRef.current = null
  }

  const handlePointerDown = (option: StoryOption) => {
    if (isInteractionLocked) return

    hasLongPressedRef.current = false
    clearLongPressTimer()
    longPressTimerRef.current = window.setTimeout(() => {
      setInputValue(option.text)
      hasLongPressedRef.current = true
    }, longPressThresholdMs)
  }

  const handlePointerUp = async (option: StoryOption) => {
    if (isInteractionLocked) return

    const isLongPressAction = hasLongPressedRef.current
    clearLongPressTimer()
    hasLongPressedRef.current = false

    if (!isLongPressAction) {
      await onQuickSelect(option)
    }
  }

  const handleSubmitInput = async () => {
    const trimmedInput = inputValue.trim()
    if (!trimmedInput || isInteractionLocked || isSubmitting) return
    await onSubmitInput(trimmedInput)
    setInputValue('')
  }

  return (
    <div
      className="sticky bottom-0 z-20 mt-auto px-4 pt-4"
      style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative flex flex-col gap-3 rounded-[28px] border border-white/45 bg-white/50 p-3 shadow-[0_12px_24px_rgba(45,45,45,0.1)] backdrop-blur-xl">
        <motion.div
          className="flex flex-nowrap gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          initial={false}
          animate={{
            opacity: hideQuickChips ? 0.2 : 1,
            y: hideQuickChips ? 12 : 0,
            pointerEvents: hideQuickChips ? 'none' : 'auto',
          }}
          transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        >
          {options.map((option) => (
            <motion.button
              key={option.id}
              type="button"
              className={[
                'shrink-0 rounded-full px-4 py-2 text-xs text-left leading-relaxed shadow-sm',
                isInteractionLocked ? 'bg-text-secondary/20 text-text-secondary' : 'bg-white/80 text-text-primary border border-white',
              ].join(' ')}
              onPointerDown={() => handlePointerDown(option)}
              onPointerUp={() => {
                void handlePointerUp(option)
              }}
              onPointerCancel={clearLongPressTimer}
              onPointerLeave={clearLongPressTimer}
              onClick={(event) => {
                event.preventDefault()
              }}
              disabled={isInteractionLocked}
              whileTap={isInteractionLocked ? undefined : { scale: 0.92 }}
              transition={SPRING_STIFF}
            >
              {option.text}
            </motion.button>
          ))}
        </motion.div>

        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/65 p-1">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
            onFocus={() => setIsInputFocused(true)}
            onBlur={() => setIsInputFocused(false)}
            placeholder="输入你的回复（本任务为占位输入）"
            className="h-10 flex-1 rounded-full border-none bg-transparent px-3 text-sm text-text-primary outline-none"
            disabled={isInteractionLocked}
          />
          <button
            type="button"
            className="rounded-full bg-sunset px-4 py-2 text-xs text-text-primary disabled:opacity-50"
            disabled={isInteractionLocked || isSubmitting || inputValue.trim().length === 0}
            onClick={() => {
              void handleSubmitInput()
            }}
          >
            {isSubmitting ? '提交中...' : '提交'}
          </button>
        </div>
      </div>
    </div>
  )
}
