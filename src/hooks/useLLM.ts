import { useCallback, useRef, useState } from 'react'
import { SPEC_FALLBACK_EFFECTS, SPEC_FALLBACK_MESSAGE } from '../config/specCopy'
import { defaultRole, getStoryNodesForRole } from '../config/storyNodes'
import { runSafetyCheck } from '../services/safety'
import { useGameStore } from '../store/gameStore'

export type LlmVerdict = 'allow' | 'penalty' | 'block' | 'fallback'

export type LlmEffects = {
  kpiDelta: number
  shieldDelta: number
  mentalDelta: number
}

export type LlmResponse = {
  reply: string
  effects: LlmEffects
  verdict: LlmVerdict
  reasonCode?: string
  hiddenEndingTag?: 'active_resign_flow' | 'full_slack_flow'
  hiddenContext?: string
}

const FALLBACK_RESPONSE: LlmResponse = {
  reply: SPEC_FALLBACK_MESSAGE,
  effects: {
    kpiDelta: SPEC_FALLBACK_EFFECTS.kpiDelta,
    shieldDelta: SPEC_FALLBACK_EFFECTS.shieldDelta,
    mentalDelta: SPEC_FALLBACK_EFFECTS.mentalDelta,
  },
  verdict: 'fallback',
  reasonCode: 'timeout_fallback',
}

async function requestVercelLLM(input: string, signal: AbortSignal): Promise<LlmResponse> {
  const state = useGameStore.getState()
  const role = state.currentRole ?? defaultRole
  const roleNodes = getStoryNodesForRole(role)
  const currentNode = roleNodes[(state.currentRound - 1) % roleNodes.length]

  const response = await fetch('/api/chat-completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal,
    body: JSON.stringify({
      input,
      context: {
        role,
        currentRound: state.currentRound,
        theme: currentNode.theme,
        npcDialogue: currentNode.npcDialogue,
        stats: state.stats,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`vercel_api_error_${response.status}`)
  }

  const payload = (await response.json()) as Partial<LlmResponse>
  const verdict: LlmVerdict =
    payload.verdict === 'allow' || payload.verdict === 'penalty' || payload.verdict === 'block' || payload.verdict === 'fallback'
      ? payload.verdict
      : 'fallback'

  if (
    typeof payload.reply !== 'string' ||
    typeof payload.effects?.kpiDelta !== 'number' ||
    typeof payload.effects?.shieldDelta !== 'number' ||
    typeof payload.effects?.mentalDelta !== 'number'
  ) {
    return {
      ...FALLBACK_RESPONSE,
      reasonCode: 'invalid_api_payload',
    }
  }

  return {
    reply: payload.reply,
    effects: {
      kpiDelta: payload.effects.kpiDelta,
      shieldDelta: payload.effects.shieldDelta,
      mentalDelta: payload.effects.mentalDelta,
    },
    verdict,
    reasonCode: payload.reasonCode,
    hiddenEndingTag:
      payload.hiddenEndingTag === 'active_resign_flow' || payload.hiddenEndingTag === 'full_slack_flow'
        ? payload.hiddenEndingTag
        : undefined,
    hiddenContext: typeof payload.hiddenContext === 'string' ? payload.hiddenContext : undefined,
  }
}

export function useLLM() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  const requestLLM = useCallback(async (input: string): Promise<LlmResponse> => {
    const safetyResult = runSafetyCheck(input)
    if (safetyResult.blocked) {
      return {
        reply: safetyResult.reply,
        effects: { kpiDelta: -8, shieldDelta: -8, mentalDelta: -8 },
        verdict: 'block',
        reasonCode: safetyResult.reasonCode,
      }
    }

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setIsSlow(false)

    const slowTimer = window.setTimeout(() => { setIsSlow(true) }, 3000)
    const hardTimeout = window.setTimeout(() => { controller.abort() }, 30000)

    try {
      const response = await requestVercelLLM(input, controller.signal)
      return response
    } catch (error) {
      return {
        ...FALLBACK_RESPONSE,
        reasonCode:
          error instanceof DOMException && error.name === 'AbortError'
            ? 'timeout_fallback'
            : 'request_error_fallback',
      }
    } finally {
      window.clearTimeout(slowTimer)
      window.clearTimeout(hardTimeout)
      setIsSlow(false)
      setIsLoading(false)
    }
  }, [])

  const abortRequest = useCallback(() => {
    abortControllerRef.current?.abort()
  }, [])

  return { requestLLM, abortRequest, isLoading, isSlow }
}
