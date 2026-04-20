/**
 * 与 `memory-bank/spec-supplement.md` §9 文案池保持逐字一致。
 * 若产品调整文案，请先改 spec-supplement，再同步本文件。
 */
export const SPEC_SLOW_LOADING_HINTS = ['老板正在打字...', '你的回复正在被HR审查...'] as const

export const SPEC_FALLBACK_MESSAGE = '职场服务器开小差了。不过别高兴，扣分照旧。'

export const SPEC_FALLBACK_EFFECTS = {
  kpiDelta: -6,
  shieldDelta: -6,
  mentalDelta: -6,
} as const
