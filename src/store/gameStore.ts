import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { EventEffects, RoleType } from '../config/storyNodes'
import { getScenarioTotalRounds, pickRandomScenario } from '../config/storyNodes'
import { clamp } from '../utils/clamp'

export type GameStatus = 'onboarding' | 'playing' | 'dead' | 'cleared'

export type EventLogItem = {
  role: 'npc' | 'player' | 'system'
  content: string
  at: number
}

export type RoundSnapshot = {
  round: number
  stats: {
    kpi: number
    shield: number
    mental: number
  }
  eventLog: EventLogItem[]
}

export type GameResult = {
  resultId: string
  resultType: 'dead' | 'cleared'
  finalStats: {
    kpi: number
    shield: number
    mental: number
  }
  achievedTitle: string
  fatalQuote?: string
  heatPercentage: string
  createdAt: number
  isHiddenEnding?: boolean
  hiddenEndingTag?: string
  hiddenContext?: string
}

export type HiddenEndingTag = 'active_resign_flow' | 'full_slack_flow'

export type HiddenEndingMeta = {
  hiddenEndingTag: HiddenEndingTag
  hiddenContext: string
}

const initialState = {
  status: 'onboarding' as GameStatus,
  currentRound: 1 as number,
  currentScenarioId: null as string | null,
  totalRounds: 5 as number,
  stats: {
    kpi: 50,
    shield: 50,
    mental: 50,
  },
  eventLog: [] as EventLogItem[],
  reviveUsed: false,
  lastRoundSnapshot: null as RoundSnapshot | null,
  historyPokedex: [] as GameResult[],
  pendingHiddenEnding: null as HiddenEndingMeta | null,
}

type GameStoreState = {
  status: GameStatus
  currentRound: number
  currentScenarioId: string | null
  totalRounds: number
  stats: {
    kpi: number
    shield: number
    mental: number
  }
  eventLog: EventLogItem[]
  reviveUsed: boolean
  lastRoundSnapshot: RoundSnapshot | null
  historyPokedex: GameResult[]
  pendingHiddenEnding: HiddenEndingMeta | null
  /** 持久化匿名设备 id，用于 A/B Sticky 与 `ab_clicks.device_id`。 */
  deviceId: string
  isTyping: boolean
  currentRole: RoleType | null
  agreedDisclaimer: boolean
  /** 首次进入应用时生成并写入 persist。 */
  ensureDeviceId: () => void
  setRole: (role: RoleType) => void
  setAgreedDisclaimer: (agreed: boolean) => void
  startNewGame: () => void
  resumeGame: () => void
  saveRoundSnapshot: () => void
  setTypingState: (isTyping: boolean) => void
  applyDecision: (optionEffects: EventEffects) => void
  submitDecision: (optionEffects: EventEffects) => void
  nextRound: () => void
  useRevive: () => void
  appendEventLog: (eventItem: EventLogItem) => void
  addGameResult: (result: Omit<GameResult, 'resultId' | 'createdAt'>) => void
  setPendingHiddenEnding: (meta: HiddenEndingMeta) => void
  clearPendingHiddenEnding: () => void
  resetForTest: () => void
}

export const useGameStore = create<GameStoreState>()(
  persist(
    (set) => ({
      ...initialState,
      deviceId: '',
      isTyping: false,
      currentRole: null,
      agreedDisclaimer: false,
      ensureDeviceId: () =>
        set((state) =>
          state.deviceId
            ? {}
            : {
                deviceId: crypto.randomUUID(),
              },
        ),
      setRole: (role) =>
        set({
          currentRole: role,
        }),
      setAgreedDisclaimer: (agreed) =>
        set({
          agreedDisclaimer: agreed,
        }),
      startNewGame: () =>
        set((state) => {
          const role = state.currentRole ?? 'PM'
          const scenario = pickRandomScenario(role)
          const totalRounds = scenario.nodes.length
          return {
            ...initialState,
            deviceId: state.deviceId,
            isTyping: false,
            currentRole: state.currentRole,
            agreedDisclaimer: state.agreedDisclaimer,
            historyPokedex: state.historyPokedex,
            pendingHiddenEnding: null,
            status: 'playing',
            currentScenarioId: scenario.id,
            totalRounds,
          }
        }),
      resumeGame: () =>
        set({
          isTyping: false,
        }),
      saveRoundSnapshot: () =>
        set((state) => ({
          lastRoundSnapshot: {
            round: state.currentRound,
            stats: { ...state.stats },
            eventLog: [...state.eventLog],
          },
        })),
      setTypingState: (isTyping) =>
        set({
          isTyping,
        }),
      applyDecision: (optionEffects) =>
        set((state) => {
          const nextStats = {
            kpi: clamp(state.stats.kpi + optionEffects.kpiDelta, 0, 100),
            shield: clamp(state.stats.shield + optionEffects.shieldDelta, 0, 100),
            mental: clamp(state.stats.mental + optionEffects.mentalDelta, 0, 100),
          }

          const isDead = nextStats.kpi <= 0 || nextStats.shield <= 0 || nextStats.mental <= 0
          const nextStatus: GameStatus = isDead ? 'dead' : state.status === 'onboarding' ? 'playing' : state.status

          return {
            stats: nextStats,
            status: nextStatus,
            isTyping: false,
            eventLog: [
              ...state.eventLog,
              {
                role: 'system',
                content: `本轮结算：KPI ${optionEffects.kpiDelta}，护盾 ${optionEffects.shieldDelta}，精神 ${optionEffects.mentalDelta}`,
                at: Date.now(),
              },
            ],
          }
        }),
      submitDecision: (optionEffects) =>
        set((state) => {
          const snapshot: RoundSnapshot = {
            round: state.currentRound,
            stats: { ...state.stats },
            eventLog: [...state.eventLog],
          }

          const nextStats = {
            kpi: clamp(state.stats.kpi + optionEffects.kpiDelta, 0, 100),
            shield: clamp(state.stats.shield + optionEffects.shieldDelta, 0, 100),
            mental: clamp(state.stats.mental + optionEffects.mentalDelta, 0, 100),
          }

          const isDead = nextStats.kpi <= 0 || nextStats.shield <= 0 || nextStats.mental <= 0
          if (isDead) {
            return {
              lastRoundSnapshot: snapshot,
              stats: nextStats,
              status: 'dead' as GameStatus,
              isTyping: false,
              eventLog: [
                ...state.eventLog,
                {
                  role: 'system',
                  content: `本轮结算：KPI ${optionEffects.kpiDelta}，护盾 ${optionEffects.shieldDelta}，精神 ${optionEffects.mentalDelta}`,
                  at: Date.now(),
                },
              ],
            }
          }

          const isFinalRound = state.currentRound >= state.totalRounds
          return {
            lastRoundSnapshot: snapshot,
            stats: nextStats,
            currentRound: isFinalRound ? state.currentRound : state.currentRound + 1,
            status: isFinalRound ? ('cleared' as GameStatus) : ('playing' as GameStatus),
            isTyping: false,
            eventLog: [
              ...state.eventLog,
              {
                role: 'system',
                content: `本轮结算：KPI ${optionEffects.kpiDelta}，护盾 ${optionEffects.shieldDelta}，精神 ${optionEffects.mentalDelta}`,
                at: Date.now(),
              },
            ],
          }
        }),
      nextRound: () =>
        set((state) => {
          if (state.status === 'dead' || state.status === 'cleared') {
            return {}
          }

          if (state.currentRound >= state.totalRounds) {
            return {
              status: 'cleared' as GameStatus,
              isTyping: false,
            }
          }

          return {
            currentRound: state.currentRound + 1,
            status: 'playing' as GameStatus,
            isTyping: false,
          }
        }),
      useRevive: () =>
        set((state) => {
          if (state.reviveUsed || !state.lastRoundSnapshot) {
            return {}
          }

          return {
            status: 'playing' as GameStatus,
            currentRound: state.lastRoundSnapshot.round,
            stats: {
              ...state.lastRoundSnapshot.stats,
            },
            eventLog: [...state.lastRoundSnapshot.eventLog],
            reviveUsed: true,
            isTyping: false,
          }
        }),
      appendEventLog: (eventItem) =>
        set((state) => ({
          eventLog: [...state.eventLog, eventItem],
        })),
      addGameResult: (result) =>
        set((state) => ({
          historyPokedex: [
            ...state.historyPokedex,
            {
              ...result,
              resultId: crypto.randomUUID(),
              createdAt: Date.now(),
            },
          ],
        })),
      setPendingHiddenEnding: (meta) =>
        set({
          pendingHiddenEnding: meta,
        }),
      clearPendingHiddenEnding: () =>
        set({
          pendingHiddenEnding: null,
        }),
      resetForTest: () =>
        set((state) => ({
          ...initialState,
          deviceId: state.deviceId,
          isTyping: false,
          currentRole: state.currentRole,
          agreedDisclaimer: state.agreedDisclaimer,
          historyPokedex: state.historyPokedex,
          pendingHiddenEnding: null,
        })),
    }),
    {
      name: 'opencode-game-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        status: state.status,
        currentRound: state.currentRound,
        currentScenarioId: state.currentScenarioId,
        totalRounds: state.totalRounds,
        stats: state.stats,
        eventLog: state.eventLog,
        reviveUsed: state.reviveUsed,
        lastRoundSnapshot: state.lastRoundSnapshot,
        historyPokedex: state.historyPokedex,
        pendingHiddenEnding: state.pendingHiddenEnding,
        currentRole: state.currentRole,
        agreedDisclaimer: state.agreedDisclaimer,
        deviceId: state.deviceId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isTyping = false
          if (!state.deviceId) {
            queueMicrotask(() => {
              useGameStore.getState().ensureDeviceId()
            })
          }
        }
      },
    }
  )
)
