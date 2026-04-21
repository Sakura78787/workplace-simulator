import { useEffect, useRef, useState } from 'react'
import type { StoryOption } from '../../config/storyNodes'

type DecisionAreaProps = {
  options: StoryOption[]
  onQuickSelect: (option: StoryOption) => void | Promise<void>
  onSubmitInput: (inputText: string) => void | Promise<void>
  isInteractionLocked?: boolean
  isSubmitting?: boolean
}

export function DecisionArea({
  onSubmitInput,
  isInteractionLocked = false,
  isSubmitting = false,
}: DecisionAreaProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (isInteractionLocked) {
      inputRef.current?.blur()
    }
  }, [isInteractionLocked])

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
        <div className="flex items-center gap-2 rounded-full border border-white/60 bg-white/65 p-1">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(event) => setInputValue(event.target.value)}
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
