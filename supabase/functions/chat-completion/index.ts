type LlmVerdict = 'allow' | 'penalty' | 'block' | 'fallback'

type LlmEffects = {
  kpiDelta: number
  shieldDelta: number
  mentalDelta: number
}

type LlmResponse = {
  verdict: LlmVerdict
  reply: string
  effects: LlmEffects
  reasonCode?: string
  hiddenEndingTag?: string
  hiddenContext?: string
}

type LlmContext = {
  role?: 'PM' | 'Ops' | 'RD' | 'QA' | null
  currentRound?: number
  theme?: string
  npcDialogue?: string
  stats?: {
    kpi: number
    shield: number
    mental: number
  }
}

type ChatCompletionRequest = {
  input?: string
  context?: LlmContext
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const fallbackResponse: LlmResponse = {
  verdict: 'fallback',
  reply: '职场服务器开小差了。不过别高兴，扣分照旧。',
  effects: {
    kpiDelta: -6,
    shieldDelta: -6,
    mentalDelta: -6,
  },
  reasonCode: 'edge_fallback',
}

const firstLayerInjectionPatterns = [
  /忽略指令/gi,
  /system\s*prompt/gi,
  /developer\s+mode/gi,
  /ignore\s+all\s+previous\s+instructions/gi,
  /bypass/gi,
  /jailbreak/gi,
]

const firstLayerBlockKeywords = ['涉政', '色情', '暴恐', '自残', '洗钱', '黑产', '仇恨']
const secondLayerUnsafeReplyPatterns = [/教你绕过/gi, /非法操作/gi, /暴力报复/gi, /仇恨言论/gi]
const maxInputLength = 200
const hiddenEndingRules: Array<{ tag: 'active_resign_flow' | 'full_slack_flow'; patterns: RegExp[] }> = [
  {
    tag: 'active_resign_flow',
    patterns: [/离职|辞职|不干了|退出|跑路/gi, /拒绝协作|不配合|不推进/gi],
  },
  {
    tag: 'full_slack_flow',
    patterns: [/摆烂|躺平|随便|懒得管|烂掉/gi, /嘲讽|阴阳怪气|摆明不做/gi],
  },
]

let systemPromptTemplateCache: string | null = null

/**
 * 读取与 Edge Function 同包部署的系统提示词（须位于本函数目录内，见 prompts/system-prompt.txt）。
 */
async function loadSystemPromptTemplate(): Promise<string | null> {
  if (systemPromptTemplateCache !== null) {
    return systemPromptTemplateCache
  }

  try {
    const templatePath = new URL('./prompts/system-prompt.txt', import.meta.url)
    const content = await Deno.readTextFile(templatePath)
    systemPromptTemplateCache = content
    return content
  } catch {
    systemPromptTemplateCache = null
    return null
  }
}

/**
 * 用当前回合上下文替换系统提示词中的占位符。
 */
function buildSystemPrompt(template: string, context: LlmContext): string {
  const role = context.role ?? 'PM'
  const currentRound = context.currentRound ?? 1
  const theme = context.theme ?? '热身'
  const npcDialogue = context.npcDialogue ?? '请谨慎回应当前工作要求。'
  const kpi = context.stats?.kpi ?? 50
  const shield = context.stats?.shield ?? 50
  const mental = context.stats?.mental ?? 50

  return template
    .replaceAll('{{role}}', String(role))
    .replaceAll('{{currentRound}}', String(currentRound))
    .replaceAll('{{theme}}', String(theme))
    .replaceAll('{{npcDialogue}}', String(npcDialogue))
    .replaceAll('{{kpi}}', String(kpi))
    .replaceAll('{{shield}}', String(shield))
    .replaceAll('{{mental}}', String(mental))
}

function createJsonResponse(data: LlmResponse, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function inferHiddenEndingTag(input: string): LlmResponse['hiddenEndingTag'] {
  const trimmed = input.trim()
  for (const rule of hiddenEndingRules) {
    if (rule.patterns.some((pattern) => pattern.test(trimmed))) {
      return rule.tag
    }
  }
  return undefined
}

function clampDelta(value: number): number {
  return Math.max(-25, Math.min(25, Math.round(value)))
}

/**
 * 第一层规则过滤：在边缘函数层先兜住明显风险输入。
 */
function runFirstLayerFilter(input: string): LlmResponse | null {
  const trimmed = input.trim()

  if (trimmed.length === 0) {
    return {
      verdict: 'block',
      reply: '输入内容为空，无法进行判定。',
      effects: { kpiDelta: -8, shieldDelta: -8, mentalDelta: -8 },
      reasonCode: 'empty_input',
    }
  }

  if (trimmed.length > maxInputLength) {
    return {
      verdict: 'block',
      reply: '输入内容过长，已触发安全拦截。',
      effects: { kpiDelta: -8, shieldDelta: -8, mentalDelta: -8 },
      reasonCode: 'input_too_long',
    }
  }

  const hitInjection = firstLayerInjectionPatterns.some((pattern) => pattern.test(trimmed))
  if (hitInjection) {
    return {
      verdict: 'block',
      reply: '检测到潜在注入指令，已触发安全拦截。',
      effects: { kpiDelta: -8, shieldDelta: -8, mentalDelta: -8 },
      reasonCode: 'prompt_injection',
    }
  }

  const hitKeyword = firstLayerBlockKeywords.some((keyword) => trimmed.includes(keyword))
  if (hitKeyword) {
    return {
      verdict: 'block',
      reply: '当前输入超出本场景可处理范围，请更换表达方式。',
      effects: { kpiDelta: -8, shieldDelta: -8, mentalDelta: -8 },
      reasonCode: 'blocked_keyword',
    }
  }

  return null
}

/**
 * 从文本中提取 JSON 片段，兼容模型返回 Markdown code fence 的情况。
 */
function extractJsonString(raw: string): string {
  const fencedMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const objectMatch = raw.match(/\{[\s\S]*\}/)
  return objectMatch ? objectMatch[0] : raw
}

/**
 * 第二层语义审查：对模型输出做结构归一和风险兜底。
 */
function normalizeAndReviewModelResult(candidate: unknown): LlmResponse {
  if (!candidate || typeof candidate !== 'object') {
    return { ...fallbackResponse, reasonCode: 'invalid_json_payload' }
  }

  const parsed = candidate as Partial<LlmResponse>
  const allowedVerdicts: LlmVerdict[] = ['allow', 'penalty', 'block', 'fallback']
  const verdict = allowedVerdicts.includes(parsed.verdict as LlmVerdict)
    ? (parsed.verdict as LlmVerdict)
    : 'fallback'
  const reply = typeof parsed.reply === 'string' ? parsed.reply.trim() : ''
  const effects = parsed.effects ?? { kpiDelta: -6, shieldDelta: -6, mentalDelta: -6 }
  const reasonCode = typeof parsed.reasonCode === 'string' ? parsed.reasonCode : undefined

  if (!reply) {
    return { ...fallbackResponse, reasonCode: reasonCode ?? 'empty_reply' }
  }

  const reviewed: LlmResponse = {
    verdict,
    reply,
    effects: {
      kpiDelta: clampDelta(Number(effects.kpiDelta)),
      shieldDelta: clampDelta(Number(effects.shieldDelta)),
      mentalDelta: clampDelta(Number(effects.mentalDelta)),
    },
    reasonCode,
  }

  const hitUnsafeReply = secondLayerUnsafeReplyPatterns.some((pattern) => pattern.test(reviewed.reply))
  if (hitUnsafeReply || reviewed.verdict === 'block') {
    return {
      verdict: 'block',
      reply: '您的回复已超出本场考试范围，对不住了。',
      effects: {
        kpiDelta: Math.min(reviewed.effects.kpiDelta, -8),
        shieldDelta: Math.min(reviewed.effects.shieldDelta, -8),
        mentalDelta: Math.min(reviewed.effects.mentalDelta, -8),
      },
      reasonCode: hitUnsafeReply ? 'semantic_blocked' : reviewed.reasonCode ?? 'model_block',
    }
  }

  return reviewed
}

async function requestModel(systemPrompt: string, userInput: string): Promise<LlmResponse> {
  const endpoint = Deno.env.get('OPENCODE_API_URL')
  const apiKey = Deno.env.get('OPENCODE_API_KEY')

  if (!endpoint || !apiKey) {
    return {
      ...fallbackResponse,
      reasonCode: 'upstream_not_configured',
    }
  }

  const timeoutController = new AbortController()
  const timeoutId = setTimeout(() => timeoutController.abort('edge_timeout'), 14000)

  try {
    const upstreamResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: timeoutController.signal,
      body: JSON.stringify({
        model: 'qwen3.5-plus',
        temperature: 0.4,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userInput },
        ],
      }),
    })

    if (!upstreamResponse.ok) {
      const errorText = await upstreamResponse.text()
      console.error('【大模型报错回传】:', errorText)
      return {
        ...fallbackResponse,
        reasonCode: `upstream_http_${upstreamResponse.status}`,
      }
    }

    const payload = (await upstreamResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>
    }
    const content = payload.choices?.[0]?.message?.content ?? ''
    if (!content) {
      return {
        ...fallbackResponse,
        reasonCode: 'upstream_empty_content',
      }
    }

    const jsonText = extractJsonString(content)
    const parsedResult = JSON.parse(jsonText) as unknown
    return normalizeAndReviewModelResult(parsedResult)
  } catch (error) {
    const isTimeoutAbort = error instanceof DOMException && error.name === 'AbortError'
    return {
      ...fallbackResponse,
      reasonCode: isTimeoutAbort ? 'edge_timeout_fallback' : 'edge_request_error',
    }
  } finally {
    clearTimeout(timeoutId)
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (request.method !== 'POST') {
    return createJsonResponse(
      {
        ...fallbackResponse,
        reasonCode: 'method_not_allowed',
      },
      405,
    )
  }

  try {
    const body = (await request.json()) as ChatCompletionRequest
    const input = typeof body.input === 'string' ? body.input : ''
    const context = body.context ?? {}

    console.log('【请求Payload】', JSON.stringify({ input, context }))

    const firstLayerBlocked = runFirstLayerFilter(input)
    if (firstLayerBlocked) {
      return createJsonResponse(firstLayerBlocked)
    }

    const systemPromptTemplate = await loadSystemPromptTemplate()
    if (!systemPromptTemplate) {
      return createJsonResponse({
        ...fallbackResponse,
        reasonCode: 'prompt_template_missing',
      })
    }

    const systemPrompt = buildSystemPrompt(systemPromptTemplate, context)
    const reviewedResult = await requestModel(systemPrompt, input)
    const hiddenEndingTag = inferHiddenEndingTag(input)
    if (hiddenEndingTag && reviewedResult.verdict !== 'block') {
      return createJsonResponse({
        ...reviewedResult,
        hiddenEndingTag,
        hiddenContext: input.slice(0, 120),
      })
    }
    return createJsonResponse(reviewedResult)
  } catch {
    return createJsonResponse({
      ...fallbackResponse,
      reasonCode: 'edge_unhandled_error',
    })
  }
})
