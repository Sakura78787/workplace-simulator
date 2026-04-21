import storyDataRaw from './game-data.json'

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

export type StoryNode = {
  stepId: number
  theme: string
  role: RoleType
  npcDialogue: string
  presetOptions: [StoryOption, StoryOption, StoryOption]
  isTrap?: boolean
}

export type Scenario = {
  id: string
  name: string
  role: RoleType
  nodes: StoryNode[]
}

type RawStoryData = {
  storyNodes?: Partial<Record<RoleType, unknown[]>>
}

function toEffects(input: unknown): EventEffects {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<EventEffects>) : {}
  const normalize = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) ? value : 0
  return {
    kpiDelta: normalize(candidate.kpiDelta),
    shieldDelta: normalize(candidate.shieldDelta),
    mentalDelta: normalize(candidate.mentalDelta),
  }
}

function toOption(input: unknown, fallbackId: string): StoryOption {
  const candidate = typeof input === 'object' && input !== null ? (input as Partial<StoryOption>) : {}
  return {
    id:
      typeof candidate.id === 'string' && candidate.id.trim()
        ? candidate.id
        : fallbackId,
    text:
      typeof candidate.text === 'string' && candidate.text.trim()
        ? candidate.text
        : '先稳住局面',
    effects: toEffects(candidate.effects),
  }
}

function toNode(input: unknown, role: RoleType, stepIndex: number): StoryNode {
  const candidate =
    typeof input === 'object' && input !== null ? (input as Partial<StoryNode>) : {}
  const stepId = stepIndex + 1
  const fallbackOptions: [StoryOption, StoryOption, StoryOption] = [
    toOption(undefined, `${role.toLowerCase()}-${stepId}-a`),
    toOption(undefined, `${role.toLowerCase()}-${stepId}-b`),
    toOption(undefined, `${role.toLowerCase()}-${stepId}-c`),
  ]
  const sourceOptions = Array.isArray(candidate.presetOptions)
    ? candidate.presetOptions
    : []
  const presetOptions = fallbackOptions.map((_, index) =>
    toOption(sourceOptions[index], `${role.toLowerCase()}-${stepId}-${index + 1}`),
  ) as [StoryOption, StoryOption, StoryOption]

  return {
    stepId,
    theme:
      typeof candidate.theme === 'string' && candidate.theme.trim()
        ? candidate.theme
        : `第${stepId}回合`,
    role,
    npcDialogue:
      typeof candidate.npcDialogue === 'string' && candidate.npcDialogue.trim()
        ? candidate.npcDialogue
        : `当前议题：第${stepId}回合`,
    presetOptions,
    isTrap: typeof candidate.isTrap === 'boolean' ? candidate.isTrap : false,
  }
}

function toScenario(input: unknown, role: RoleType): Scenario {
  const candidate =
    typeof input === 'object' && input !== null ? (input as Partial<Scenario>) : {}
  const id =
    typeof candidate.id === 'string' && candidate.id.trim()
      ? candidate.id
      : `${role.toLowerCase()}-default`
  const name =
    typeof candidate.name === 'string' && candidate.name.trim()
      ? candidate.name
      : `${role}默认剧本`
  const sourceNodes = Array.isArray(candidate.nodes) ? candidate.nodes : []
  const nodes = sourceNodes.map((n, i) => toNode(n, role, i))
  return { id, name, role, nodes }
}

const storyData = (storyDataRaw as RawStoryData) ?? {}

export const scenariosByRole: Record<RoleType, Scenario[]> = {
  PM: ((storyData.storyNodes?.PM ?? []) as unknown[]).map((s) =>
    toScenario(s, 'PM'),
  ),
  Ops: ((storyData.storyNodes?.Ops ?? []) as unknown[]).map((s) =>
    toScenario(s, 'Ops'),
  ),
  RD: ((storyData.storyNodes?.RD ?? []) as unknown[]).map((s) =>
    toScenario(s, 'RD'),
  ),
  QA: ((storyData.storyNodes?.QA ?? []) as unknown[]).map((s) =>
    toScenario(s, 'QA'),
  ),
}

export const defaultRole: RoleType = 'PM'

export function getScenariosForRole(role: RoleType | null): Scenario[] {
  const r = role && scenariosByRole[role] ? role : defaultRole
  return scenariosByRole[r]
}

export function pickRandomScenario(role: RoleType | null): Scenario {
  const scenarios = getScenariosForRole(role)
  if (scenarios.length === 0) {
    return {
      id: 'fallback',
      name: '默认剧本',
      role: (role ?? defaultRole) as RoleType,
      nodes: [
        {
          stepId: 1,
          theme: '热身',
          role: (role ?? defaultRole) as RoleType,
          npcDialogue: '欢迎来到职场试毒模拟器。先熟悉一下环境吧。',
          presetOptions: [
            { id: 'f1-a', text: '好的，我准备好了', effects: { kpiDelta: 5, shieldDelta: 5, mentalDelta: -5 } },
            { id: 'f1-b', text: '等等，让我再想想', effects: { kpiDelta: -3, shieldDelta: 3, mentalDelta: 5 } },
            { id: 'f1-c', text: '能不能先看看文档？', effects: { kpiDelta: 2, shieldDelta: 5, mentalDelta: 3 } },
          ],
        },
      ],
    }
  }
  return scenarios[Math.floor(Math.random() * scenarios.length)]
}

export function getScenarioById(
  role: RoleType,
  scenarioId: string,
): Scenario | null {
  const scenarios = scenariosByRole[role] ?? []
  return scenarios.find((s) => s.id === scenarioId) ?? null
}

export function getStoryNodesForRole(
  role: RoleType | null,
  scenarioId?: string | null,
): StoryNode[] {
  const r = role ?? defaultRole
  if (scenarioId) {
    const scenario = getScenarioById(r, scenarioId)
    if (scenario) return scenario.nodes
  }
  const scenarios = scenariosByRole[r] ?? []
  if (scenarios.length > 0) return scenarios[0].nodes
  return []
}

export function getScenarioTotalRounds(
  role: RoleType | null,
  scenarioId: string | null,
): number {
  const nodes = getStoryNodesForRole(role, scenarioId)
  return Math.max(nodes.length, 1)
}
