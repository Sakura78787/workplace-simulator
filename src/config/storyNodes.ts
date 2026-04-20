import storyDataRaw from '../../memory-bank/game-data.json'

export type EventEffects = {
  kpiDelta: number
  shieldDelta: number
  mentalDelta: number
}

export type StoryOption = {
  id: string
  text: string
  effects: EventEffects
}

export type RoleType = 'PM' | 'Ops' | 'RD' | 'QA'
export type StoryTheme = '热身' | '甩锅' | '插单' | '死线' | '背锅'

export type StoryNode = {
  stepId: 1 | 2 | 3 | 4 | 5
  theme: StoryTheme
  role: RoleType
  npcDialogue: string
  presetOptions: [StoryOption, StoryOption, StoryOption]
}

type RawStoryData = {
  storyNodes?: Partial<Record<RoleType, unknown>>
}

const ROLE_ORDER: readonly RoleType[] = ['PM', 'Ops', 'RD', 'QA']
const THEME_ORDER: readonly StoryTheme[] = ['热身', '甩锅', '插单', '死线', '背锅']

function toEffects(input: unknown): EventEffects {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<EventEffects>) : {}
  const normalize = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : 0)
  return {
    kpiDelta: normalize(candidate.kpiDelta),
    shieldDelta: normalize(candidate.shieldDelta),
    mentalDelta: normalize(candidate.mentalDelta),
  }
}

function toOption(input: unknown, fallbackId: string): StoryOption {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<StoryOption>) : {}
  return {
    id: typeof candidate.id === 'string' && candidate.id.trim() ? candidate.id : fallbackId,
    text: typeof candidate.text === 'string' && candidate.text.trim() ? candidate.text : '先稳住局面',
    effects: toEffects(candidate.effects),
  }
}

function toNode(input: unknown, role: RoleType, round: number): StoryNode {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<StoryNode>) : {}
  const stepId = round as 1 | 2 | 3 | 4 | 5
  const fallbackOptions: [StoryOption, StoryOption, StoryOption] = [
    toOption(undefined, `${role.toLowerCase()}-${round}-a`),
    toOption(undefined, `${role.toLowerCase()}-${round}-b`),
    toOption(undefined, `${role.toLowerCase()}-${round}-c`),
  ]
  const sourceOptions = Array.isArray(candidate.presetOptions) ? candidate.presetOptions : []
  const presetOptions = fallbackOptions.map((_, index) =>
    toOption(sourceOptions[index], `${role.toLowerCase()}-${round}-${index + 1}`),
  ) as [StoryOption, StoryOption, StoryOption]

  return {
    stepId,
    theme: THEME_ORDER[round - 1],
    role,
    npcDialogue:
      typeof candidate.npcDialogue === 'string' && candidate.npcDialogue.trim()
        ? candidate.npcDialogue
        : `当前议题：${THEME_ORDER[round - 1]}`,
    presetOptions,
  }
}

function normalizeRoleNodes(input: unknown, role: RoleType): StoryNode[] {
  const source = Array.isArray(input) ? input : []
  return THEME_ORDER.map((_, index) => toNode(source[index], role, index + 1))
}

const storyData = (storyDataRaw as RawStoryData) ?? {}

export const storyNodesByRole: Record<RoleType, StoryNode[]> = {
  PM: normalizeRoleNodes(storyData.storyNodes?.PM, 'PM'),
  Ops: normalizeRoleNodes(storyData.storyNodes?.Ops, 'Ops'),
  RD: normalizeRoleNodes(storyData.storyNodes?.RD, 'RD'),
  QA: normalizeRoleNodes(storyData.storyNodes?.QA, 'QA'),
}

export const defaultRole: RoleType = ROLE_ORDER[0]

export function getStoryNodesForRole(role: RoleType | null): StoryNode[] {
  if (role && storyNodesByRole[role]) {
    return storyNodesByRole[role]
  }
  return storyNodesByRole[defaultRole]
}
