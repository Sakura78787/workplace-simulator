import { motion, AnimatePresence } from 'framer-motion'
import type { Variants } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { CapsuleButton } from '../components/common/CapsuleButton'
import type { RoleType } from '../config/storyNodes'
import { ResumePromptModal } from '../components/ResumePromptModal'
import { useGameStore } from '../store/gameStore'
import { useToastTrigger } from '../store/toastStore'
import { LeaderboardModal } from '../components/LeaderboardModal'
import { PokedexDrawer } from '../components/PokedexDrawer'

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

const headerVariants: Variants = {
  hidden: { opacity: 0, filter: 'blur(8px)', y: 15 },
  visible: {
    opacity: 1,
    filter: 'blur(0px)',
    y: 0,
    transition: { type: 'spring' as const, stiffness: 250, damping: 26 },
  },
}

const roleGroupVariants: Variants = {
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

const roleCardVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 250, damping: 26 },
  },
}

const footerVariants: Variants = {
  hidden: { opacity: 0, y: 15, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring' as const, stiffness: 250, damping: 26 },
  },
}

const roleCards: Array<{
  role: RoleType
  title: string
  description: string
  activeBorderClassName: string
}> = [
  {
    role: 'PM',
    title: '产品经理',
    description: '需求翻译官，负责平衡老板、用户和研发。',
    activeBorderClassName: 'border-sunset',
  },
  {
    role: 'Ops',
    title: '用户运营',
    description: '活跃与留存守门员，负责对用户情绪精细运营。',
    activeBorderClassName: 'border-babyblue',
  },
  {
    role: 'RD',
    title: '研发工程师',
    description: '工位灭火队，负责让需求不炸、线上不崩。',
    activeBorderClassName: 'border-mint',
  },
  {
    role: 'QA',
    title: '测试工程师',
    description: '质量守夜人，负责在死线前揪出隐藏雷点。',
    activeBorderClassName: 'border-critical',
  },
]

export function LandingView() {
  const navigate = useNavigate()
  const triggerToast = useToastTrigger()
  const currentRole = useGameStore((state) => state.currentRole)
  const currentRound = useGameStore((state) => state.currentRound)
  const agreedDisclaimer = useGameStore((state) => state.agreedDisclaimer)
  const status = useGameStore((state) => state.status)
  const historyPokedex = useGameStore((state) => state.historyPokedex)
  const setRole = useGameStore((state) => state.setRole)
  const startNewGame = useGameStore((state) => state.startNewGame)
  const resumeGame = useGameStore((state) => state.resumeGame)
  const setAgreedDisclaimer = useGameStore((state) => state.setAgreedDisclaimer)

  const [isPokedexOpen, setIsPokedexOpen] = useState(false)
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false)
  const [isResumePromptOpen, setIsResumePromptOpen] = useState(false)
  const [resumePromptDismissed, setResumePromptDismissed] = useState(false)

  const canStartGame = Boolean(currentRole) && agreedDisclaimer
  const hasInProgressGame = status === 'playing'

  useEffect(() => {
    if (hasInProgressGame && agreedDisclaimer && !resumePromptDismissed) {
      setIsResumePromptOpen(true)
    }
  }, [hasInProgressGame, agreedDisclaimer, resumePromptDismissed])

  const handleStartGame = () => {
    if (!currentRole) {
      triggerToast({ tone: 'warn', message: '请先选择岗位方向。' })
      return
    }
    if (!agreedDisclaimer) {
      triggerToast({ tone: 'warn', message: '请先勾选免责声明后再入局。' })
      return
    }

    startNewGame()
    navigate('/survival')
  }

  const handleResumeGame = () => {
    if (!agreedDisclaimer) {
      triggerToast({ tone: 'warn', message: '请先勾选免责声明后再入局。' })
      return
    }
    setIsResumePromptOpen(false)
    setResumePromptDismissed(true)
    resumeGame()
    navigate('/survival')
  }

  const handleRestartFromPrompt = () => {
    if (!currentRole) {
      triggerToast({ tone: 'warn', message: '请先选择岗位方向。' })
      return
    }
    if (!agreedDisclaimer) {
      triggerToast({ tone: 'warn', message: '请先勾选免责声明后再入局。' })
      return
    }
    setIsResumePromptOpen(false)
    setResumePromptDismissed(true)
    startNewGame()
    navigate('/survival')
  }

  return (
    <>
      <motion.section
        className="relative flex h-[100dvh] flex-col justify-between gap-6 overflow-hidden px-6 pb-8 pt-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="pointer-events-none absolute inset-0 -z-10">
          <motion.div
            className="absolute -left-14 top-12 h-56 w-56 rounded-full bg-sunset/10 blur-3xl"
            animate={{ x: [0, 18, -10, 0], y: [0, -16, 10, 0] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-babyblue/10 blur-3xl"
            animate={{ x: [0, -14, 8, 0], y: [0, 12, -10, 0] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'mirror', ease: 'easeInOut' }}
          />
        </div>

        <motion.header className="space-y-2 text-center" variants={headerVariants}>
          <h1 className="font-heading text-3xl text-text-primary">沉浸式岗位试跑模拟器</h1>
          <p className="text-sm text-text-secondary">先选身份，再看看你能扛到第几轮。</p>
        </motion.header>

        <motion.div className="role-list-scrollbar grid flex-1 gap-4 overflow-y-auto overflow-x-hidden mb-4 py-2 px-2 -mx-2" variants={roleGroupVariants}>
          {roleCards.map((card) => (
            <motion.button
              key={card.role}
              type="button"
              className={[
                'rounded-3xl border-2 bg-card-bg p-5 text-left shadow-sm',
                currentRole === card.role ? card.activeBorderClassName : 'border-transparent',
              ].join(' ')}
              whileTap={{ scale: 0.98 }}
              animate={{ scale: currentRole === card.role ? 1.02 : 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 28 }}
              onClick={() => setRole(card.role)}
              variants={roleCardVariants}
            >
              <h2 className="font-heading text-xl text-text-primary">{card.title}</h2>
              <p className="mt-2 text-sm text-text-secondary">{card.description}</p>
            </motion.button>
          ))}
        </motion.div>

        <motion.div className="space-y-4" variants={footerVariants}>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-card-bg/90 p-4 shadow-sm">
            <input
              type="checkbox"
              className="mt-0.5 h-5 w-5 appearance-none rounded-md border-2 border-text-secondary/45 bg-white checked:border-sunset checked:bg-sunset checked:shadow-[inset_0_0_0_3px_#fff]"
              checked={agreedDisclaimer}
              onChange={(event) => setAgreedDisclaimer(event.target.checked)}
            />
            <span className="text-xs leading-relaxed text-text-secondary">
              本剧本纯属发癫虚构，请勿输入个人及公司真实涉密信息。
            </span>
          </label>

          <div className="flex flex-col gap-3">
            <CapsuleButton
              className="w-full"
              disabled={!canStartGame}
              onClick={handleStartGame}
            >
              {hasInProgressGame ? '重新入职' : '一键入职'}
            </CapsuleButton>

            <div className="mt-2 flex flex-col items-center gap-2">
              <CapsuleButton
                type="button"
                className="w-full max-w-xs"
                onClick={() => setIsLeaderboardOpen(true)}
              >
                比惨排行榜
              </CapsuleButton>
              {historyPokedex.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsPokedexOpen(true)}
                  className="text-sm text-text-secondary underline underline-offset-4 opacity-80 transition-opacity hover:opacity-100"
                >
                  查看打工履历 ({historyPokedex.length})
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.section>

      <LeaderboardModal open={isLeaderboardOpen} onClose={() => setIsLeaderboardOpen(false)} />
      <ResumePromptModal
        open={isResumePromptOpen}
        currentRound={currentRound}
        onContinue={handleResumeGame}
        onRestart={handleRestartFromPrompt}
        onClose={() => {
          setIsResumePromptOpen(false)
          setResumePromptDismissed(true)
        }}
      />

      <AnimatePresence>
        {isPokedexOpen && (
          <PokedexDrawer
            pokedex={historyPokedex}
            onClose={() => setIsPokedexOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
