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

/** 规格补充文档 §11：输入长度上限。超过即第一层拦截。 */
export const SPEC_INPUT_MAX_LENGTH = 200

/** 与 `roadmap_to_100_percent.md` Task 13 / decision-log 文案实验组一致。 */
export const SPEC_SHARE_SAVE_CTA_SELF_MOCK = '查看我的病危通知书'

/** 与 `roadmap_to_100_percent.md` Task 13 / decision-log 文案实验组一致。 */
export const SPEC_SHARE_SAVE_CTA_PK_TAUNT = '你行你上啊'

/** Task 14：榜单空态提示。 */
export const SPEC_LEADERBOARD_EMPTY = '暂无上榜记录，先去局里送个人头吧。'

/** Survival 状态提示（替换历史占位文案）。 */
export const SPEC_STATUS_DEAD_HINT = '你已触发死局，请选择是否复活或直接结算。'

/** Survival 状态提示（替换历史占位文案）。 */
export const SPEC_STATUS_CLEARED_HINT = '已通关本局，点击结算查看你的战报。'
