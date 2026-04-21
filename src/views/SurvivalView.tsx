import { motion } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DecisionArea } from '../components/game/DecisionArea'
import { ReviveModal } from '../components/game/ReviveModal'
import { StatusBar } from '../components/game/StatusBar'
import { StoryCard } from '../components/game/StoryCard'
import {
  SPEC_SLOW_LOADING_HINTS,
  SPEC_STATUS_CLEARED_HINT,
  SPEC_STATUS_DEAD_HINT,
} from '../config/specCopy'
import { getStoryNodesForRole, type StoryOption } from '../config/storyNodes'
import { useLLM } from '../hooks/useLLM'
import { useGameStore } from '../store/gameStore'

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 250,
      damping: 26,
      staggerChildren: 0.1,
    },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 250,
      damping: 26,
    },
  },
}

export function SurvivalView() {
  const navigate = useNavigate()
  const currentRole = useGameStore((state) => state.currentRole)
  const currentRound = useGameStore((state) => state.currentRound)
  const status = useGameStore((state) => state.status)
  const stats = useGameStore((state) => state.stats)
  const eventLog = useGameStore((state) => state.eventLog)
  const reviveUsed = useGameStore((state) => state.reviveUsed)
  const isTyping = useGameStore((state) => state.isTyping)
  const currentScenarioId = useGameStore((state) => state.currentScenarioId)
  const totalRounds = useGameStore((state) => state.totalRounds)
  const submitDecision = useGameStore((state) => state.submitDecision)
  const useRevive = useGameStore((state) => state.useRevive)
  const setTypingState = useGameStore((state) => state.setTypingState)
  const appendEventLog = useGameStore((state) => state.appendEventLog)
  const setPendingHiddenEnding = useGameStore((state) => state.setPendingHiddenEnding)
  const { requestLLM, isLoading, isSlow } = useLLM()

  const roleNodes = getStoryNodesForRole(currentRole, currentScenarioId)
  const currentNode = roleNodes[(currentRound - 1) % roleNodes.length]
  /**
   * 从事件流中提取最近一条 NPC 文案。
   * 若暂无 NPC 记录，则回退为剧情开场白；开场白缺失时再回退主题文案。
   */
    const latestNpcMessage = eventLog.slice(-2).find((item) => item.role === 'npc')?.content
  const fallbackStoryText = currentNode.npcDialogue?.trim() || `当前议题：${currentNode.theme}`
  const storyText = latestNpcMessage ?? fallbackStoryText
  const slowLoadingHint =
    SPEC_SLOW_LOADING_HINTS[Math.max(0, currentRound - 1) % SPEC_SLOW_LOADING_HINTS.length]

  const statusTextMap = {
    onboarding: '待入局',
    playing: '进行中',
    dead: '已死局',
    cleared: '已通关',
  } as const

  /**
   * 统一选项提交流程：所有入口（滑卡、Chip、输入）都走同一状态收口方法。
   */
  const handleSelectOption = async (option: StoryOption) => {
    submitDecision(option.effects)
  }

  const handleSubmitInput = async (inputText: string) => {
    const llmResult = await requestLLM(inputText)
    if (llmResult.hiddenEndingTag && llmResult.hiddenContext) {
      setPendingHiddenEnding({
        hiddenEndingTag: llmResult.hiddenEndingTag,
        hiddenContext: llmResult.hiddenContext,
      })
    }
    appendEventLog({
      role: 'npc',
      content: llmResult.reply,
      at: Date.now(),
    })
    submitDecision(llmResult.effects)
  }

  useEffect(() => {
    if (status === 'dead' && reviveUsed) {
      const timer = window.setTimeout(() => {
        navigate('/result')
      }, 3000)

      return () => window.clearTimeout(timer)
    }

    if (status === 'cleared') {
      const timer = window.setTimeout(() => {
        navigate('/result')
      }, 2000)

      return () => window.clearTimeout(timer)
    }

    return undefined
  }, [status, reviveUsed, navigate])

  const isDecisionLocked = status === 'dead' || status === 'cleared' || isTyping || isLoading
  const showReviveModal = status === 'dead' && !reviveUsed

  const handleGiveUp = () => {
    navigate('/result')
  }

  return (
    <motion.section
      className="relative flex h-full flex-col overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <button
        type="button"
        className="absolute top-4 left-4 z-50 flex items-center gap-1 rounded-full bg-white/70 px-3 py-1.5 text-xs text-text-secondary shadow-sm backdrop-blur-sm"
        onClick={() => {
          if (window.confirm('确诊单还没拿，确定要退出并丢失当前进度吗？')) {
            useGameStore.getState().resetForTest()
            navigate('/')
          }
        }}
      >
        <ChevronLeft size={14} />
        退出
      </button>
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute -left-20 top-20 h-64 w-64 rounded-full bg-sunset/10 blur-3xl"
          animate={{ x: [0, 20, -14, 0], y: [0, -18, 12, 0] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute -right-16 bottom-24 h-72 w-72 rounded-full bg-babyblue/10 blur-3xl"
          animate={{ x: [0, -16, 12, 0], y: [0, 14, -10, 0] }}
          transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
        />
      </div>

      <motion.div className="mt-12" variants={itemVariants}>
        <StatusBar stats={stats} />
      </motion.div>

      <div className="flex flex-1 flex-col px-4 pb-28 pt-5">
        <motion.div
          className="mb-4 flex items-center justify-between rounded-full border border-white/45 bg-white/45 px-3 py-1.5 text-sm text-text-secondary backdrop-blur-xl"
          variants={itemVariants}
        >
          <span>第 {currentRound}/{totalRounds} 回合 · {currentNode.theme}</span>
          <span>状态：{statusTextMap[status]}</span>
        </motion.div>

        <motion.div className="flex flex-1 items-center justify-center" variants={itemVariants}>
          <StoryCard
            key={`${currentRound}-${status}-${reviveUsed}`}
            text={storyText}
            leftOption={currentNode.presetOptions[0]}
            rightOption={currentNode.presetOptions[2]}
            stats={stats}
            isSlow={isSlow}
            slowLoadingHint={slowLoadingHint}
            isInteractionLocked={isDecisionLocked}
            isTyping={isTyping}
            onTypingChange={setTypingState}
            onSelect={handleSelectOption}
          />
        </motion.div>

        <motion.div variants={itemVariants}>
          {status === 'dead' ? (
            <p className="mt-3 text-center text-sm text-critical">{SPEC_STATUS_DEAD_HINT}</p>
          ) : null}
          {status === 'cleared' ? (
            <p className="mt-3 text-center text-sm text-mint">{SPEC_STATUS_CLEARED_HINT}</p>
          ) : null}
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <DecisionArea
          options={currentNode.presetOptions}
          isInteractionLocked={isDecisionLocked}
          isSubmitting={isLoading}
          onQuickSelect={handleSelectOption}
          onSubmitInput={handleSubmitInput}
        />
      </motion.div>
      <ReviveModal visible={showReviveModal} onConfirmRevive={useRevive} onGiveUp={handleGiveUp} />
    </motion.section>
  )
}
