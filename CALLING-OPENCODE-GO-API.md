# 从 OpenCode Go 调用大模型 API 的完整方法

> 这份文档总结了 GrowthPilot 项目成功调用 OpenCode Go 兼容 API 的完整链路。另一个项目（Vercel 部署）可以直接照着这个方法实现，只需把 Cloudflare 环境变量读取换成 Vercel 的方式即可。

---

## 一、核心原理

OpenCode Go 提供的是一个 **OpenAI 兼容接口**，端点是标准的 `/chat/completions`。任何能用 OpenAI SDK 或者直接 fetch 调 OpenAI API 的代码，只需要改 baseUrl 和 apiKey 就能调 OpenCode Go。

换句话说：**不需要任何 SDK，用原生 fetch 就行。**

---

## 二、环境变量（.env.example）

```env
LLM_API_KEY=你的密钥
LLM_BASE_URL=https://opencode.ai/zen/go/v1
LLM_MODEL=qwen3.5-plus
```

三个变量：

- `LLM_API_KEY`：必填。在 OpenCode Go 订阅后拿到的密钥。没有这个 key 就整个跳过 LLM，回退到规则模板。
- `LLM_BASE_URL`：API 根路径。默认 `https://opencode.ai/zen/go/v1`，代码会在后面自动拼 `/chat/completions`。
- `LLM_MODEL`：模型 ID。默认 `qwen3.5-plus`。这个短 ID 就是 OpenCode Go 文档里表格里的模型名，不需要加 `opencode-go/` 前缀。

---

## 三、配置解析（三层降级）

代码中有两层配置解析函数，区别是入口不同：

### llm-config.ts — 通用解析（从 process.env 读取）

```typescript
const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
const DEFAULT_MODEL = "qwen3.5-plus";

export type LlmConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function resolveLlmConfig(options?: {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): LlmConfig | null {
  const apiKey = options?.apiKey?.trim() || process.env.LLM_API_KEY?.trim();
  if (!apiKey) {
    return null;  // 没有 key 就返回 null，调用方据此决定是否走 LLM
  }

  const baseUrl = options?.baseUrl?.trim() || process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL;
  const model = options?.model?.trim() || process.env.LLM_MODEL?.trim() || DEFAULT_MODEL;

  return { apiKey, baseUrl, model };
}
```

**关键点：**
- 没有 apiKey 就返回 `null`，不是报错。调用方拿到 null 就走规则模板的兜底逻辑。
- 优先级：显式传参 > 环境变量 > 默认值。

### resolve-ai-options.ts — 适配 Cloudflare Workers 环境

```typescript
import type { LlmConfig } from "@/lib/ai/llm-config";
import type { CloudflareEnv } from "@/lib/cloudflare/env";

const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
const DEFAULT_MODEL = "qwen3.5-plus";

export function resolveAiOptionsFromEnv(env: Partial<CloudflareEnv> | undefined): {
  llm?: LlmConfig;
} {
  const apiKey = (env?.LLM_API_KEY as string | undefined) || process.env.LLM_API_KEY;
  if (!apiKey?.trim()) {
    return {};
  }

  return {
    llm: {
      apiKey: apiKey.trim(),
      baseUrl:
        (env?.LLM_BASE_URL as string | undefined)?.trim() ||
        process.env.LLM_BASE_URL?.trim() ||
        DEFAULT_BASE_URL,
      model:
        (env?.LLM_MODEL as string | undefined)?.trim() ||
        process.env.LLM_MODEL?.trim() ||
        DEFAULT_MODEL,
    },
  };
}
```

**为什么有两个？** 因为 Cloudflare Workers 里 `process.env` 读不到 Worker 绑定的环境变量，必须从 `env` 对象（通过 `getCloudflareContext().env` 获取）读。Vercel 没有这个问题，`process.env` 就够了，所以你只需要 `llm-config.ts` 那个就行。

**Vercel 项目的适配**：删掉 `resolve-ai-options.ts`，API route 里直接用 `resolveLlmConfig()` 即可：

```typescript
// Vercel 版本的 API route
import { resolveLlmConfig } from "@/lib/ai/llm-config";

export async function POST(request: NextRequest) {
  const config = resolveLlmConfig();  // 直接从 process.env 读
  if (!config) {
    // 没有 key，走规则模板
    return NextResponse.json({ ... });
  }
  // 用 config 调 LLM
}
```

---

## 四、实际调用（fetch 请求）

核心就是一段标准的 OpenAI 兼容 API 调用，用原生 fetch：

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 15_000);  // 15秒超时

try {
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: "system", content: "你是一条系统指令" },
        { role: "user", content: "用户的输入" },
      ],
      temperature: 0.4,
    }),
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("LLM API Error:", response.status, errorBody);
    // 走兜底逻辑
    return getFallbackResult(input);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    return getFallbackResult(input);
  }

  // 解析 content 中的 JSON
  const jsonSource = extractJsonObject(content);
  if (!jsonSource) {
    return getFallbackResult(input);
  }

  const parsed = JSON.parse(jsonSource);
  // 用 parsed 数据构建返回结果，逐字段用兜底值防错
  return buildResult(parsed, fallback);

} catch (error) {
  clearTimeout(timeoutId);
  console.error("LLM Fetch Exception:", error);
  return getFallbackResult(input);
}
```

**关键点：**

1. **超时必须加。** 加了 `AbortController` 配合 `setTimeout(15s)`，防止 LLM 卡死用户无限等待。
2. **兜底逻辑贯穿始终。** API 报错、返回空、JSON 解析失败、网络异常——任何一步出错都走规则模板兜底，绝不让用户看到白屏或报错。
3. **temperature 用 0.4。** 这个项目是生成结构化 JSON，不需要太高的随机性。0.4 既有一定多样性又不太离谱。
4. **Authorization 头用 `Bearer ${apiKey}` 格式。** 和 OpenAI 官方一模一样。

---

## 五、从 LLM 输出中提取 JSON

大模型经常会返回带 markdown 围栏的输出，比如：

````
```json
{"planReason": "...", "milestones": [...]}
```
````

或者干脆在一堆废话里夹一个 JSON。需要一个提取函数：

```typescript
export function extractJsonObject(raw: string): string | null {
  // 先尝试 ```json ... ``` 围栏
  const jsonFenced = raw.match(/```json\s*([\s\S]*?)```/i);
  let source: string;
  if (jsonFenced?.[1] !== undefined) {
    source = jsonFenced[1].trim();
  } else {
    // 再尝试任意围栏
    const anyFenced = raw.match(/```[a-z]*\s*([\s\S]*?)```/i);
    source = (anyFenced?.[1] ?? raw).trim();
  }

  // 找第一个 { 的位置
  const firstBrace = source.indexOf("{");
  if (firstBrace < 0) {
    return null;
  }

  // 从第一个 { 开始，逐字符匹配花括号深度，处理字符串内的花括号
  return sliceBalancedJsonObject(source, firstBrace);
}

function sliceBalancedJsonObject(source: string, start: number): string | null {
  if (source[start] !== "{") return null;

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < source.length; i++) {
    const c = source[i];

    if (inString) {
      if (escape) { escape = false; continue; }
      if (c === "\\") { escape = true; continue; }
      if (c === '"') { inString = false; }
      continue;
    }

    if (c === '"') { inString = true; continue; }
    if (c === "{") { depth++; }
    else if (c === "}") {
      depth--;
      if (depth === 0) return source.slice(start, i + 1);
    }
  }

  return null;
}
```

**为什么不用 `JSON.parse` 直接解析？** 因为 LLM 可能在 JSON 前后加文字说明，也可能用围栏包裹。`extractJsonObject` 先剥离围栏和多余文字，再通过花括号深度匹配找到完整的 JSON 对象。

---

## 六、响应规范化（逐字段兜底）

LLM 返回的 JSON 不一定完全符合你期望的结构，所以需要一层规范化：

```typescript
function normalizeGoalPlan(input: unknown, fallback: GoalPlanSeed): GoalPlanSeed {
  if (!input || typeof input !== "object") return fallback;

  const candidate = input as {
    milestones?: Array<{ title?: unknown; targetDateLabel?: unknown }>;
    tasks?: Array<{ title?: unknown; bucket?: unknown; suggestedDuration?: unknown }>;
  };

  const rawMilestones = (Array.isArray(candidate.milestones) ? candidate.milestones : []).slice(0, 4);
  const rawTasks = (Array.isArray(candidate.tasks) ? candidate.tasks : []).slice(0, 6);

  // 数量不对就走兜底
  if (rawMilestones.length < 2 || rawTasks.length < 3) return fallback;

  // 逐字段用兜底值
  const milestones = rawMilestones.map((item, index) => ({
    title: normalizeTitle(item?.title, fallback.milestones[index]?.title ?? "阶段 1"),
    targetDateLabel: normalizeTitle(item?.targetDateLabel, fallback.milestones[index]?.targetDateLabel ?? "第 1 周"),
  }));

  const tasks = rawTasks.map((item, index) => ({
    title: normalizeTitle(item?.title, fallback.tasks[index]?.title ?? "关键动作 1"),
    bucket: normalizeTitle(item?.bucket, fallback.tasks[index]?.bucket ?? "action"),
    suggestedDuration: normalizeDuration(item?.suggestedDuration, fallback.tasks[index]?.suggestedDuration ?? 20),
  }));

  return { milestones, tasks };
}
```

**关键原则：** LLM 返回的每个字段都可能缺、可能类型不对、可能空字符串。规范化函数逐字段检查，有任何问题的就用预先算好的规则模板兜底值填上。确保最终输出一定是完整合法的数据结构。

---

## 七、规则模板兜底（必须有）

无论 LLM 是否可用，都有一套纯 JS 的规则模板保证功能不中断：

```typescript
export function buildGoalPlannerFallback(input: GoalRequest): PersonalizedGoalPlan {
  const plan = buildGoalPlan(input);  // 根据目标类型生成固定的里程碑和任务
  return {
    plan,
    planSource: "rules",
    planReason: buildFallbackReason(input),
  };
}
```

`buildGoalPlan` 根据目标类型（自律/学习/求职）返回预设的里程碑和任务模板。虽然不个性化，但保证了产品在任何情况下都能用。

---

## 八、API Route 里的调用链路

```
用户点击"开始规划"
  → GoalForm 前端组件 fetch POST /api/goals
    → route.ts 解析参数
    → resolveLlmConfig() 从环境变量拿配置
    → generatePersonalizedGoalPlan() 调 LLM
        → 有 key？调 fetch，15秒超时
        → 没 key / 超时 / 报错？走规则模板
    → 返回 JSON 给前端
    → 前端存 localStorage，跳转 dashboard
```

---

## 九、Vercel 部署的适配要点

本项目跑在 Cloudflare Workers 上，所以有一个 `resolve-ai-options.ts` 从 Cloudflare 环境读取变量。**Vercel 项目不需要这一层**，只需要：

1. **环境变量**：在 Vercel Dashboard → Settings → Environment Variables 里设置 `LLM_API_KEY`、`LLM_BASE_URL`、`LLM_MODEL`。开发和部署环境都设置。

2. **配置解析**：只用 `llm-config.ts` 的 `resolveLlmConfig()` 就够了，它从 `process.env` 读取，Vercel 会自动注入。

3. **API Route**：Next.js App Router 的 Route Handler（`app/api/xxx/route.ts`）在 Vercel 上天然支持 `process.env`，不需要任何适配层。

4. **不需要 `getCloudflareContext()`**，不需要 `@opennextjs/cloudflare`，不需要 `wrangler.jsonc`。

5. **超时**：Vercel Serverless Functions 默认超时 10 秒（Pro 60 秒），你的 `AbortController` 的 15 秒超时在 Vercel hobby 计划下可能需要调低到 9 秒，确保在函数超时前先 abort 并返回兜底结果。

---

## 十、完整文件清单

本项目中与 LLM 调用相关的文件：

| 文件 | 作用 |
|---|---|
| `src/lib/ai/llm-config.ts` | 配置解析：从环境变量读取 apiKey/baseUrl/model |
| `src/lib/ai/resolve-ai-options.ts` | Cloudflare 环境适配层（Vercel 项目不需要） |
| `src/lib/ai/goal-planner.ts` | 目标拆解：调 LLM + 规则兜底 + 响应规范化 |
| `src/lib/ai/extract-json-object.ts` | 从 LLM 输出中提取完整 JSON 对象 |
| `src/lib/ai/rules.ts` | 规则模板兜底：纯 JS 逻辑，无外部依赖 |
| `src/lib/cloudflare/env.ts` | Cloudflare 环境上下文获取（Vercel 不需要） |
| `src/app/api/goals/route.ts` | API 路由：串联解析→调 LLM→持久化→返回 |
| `.env.example` | 环境变量模板 |

---

## 十一、最简实现（给你的另一个项目）

如果你只想从一个空白 Next.js + Vercel 项目开始调用 OpenCode Go，最小代码量大概是这样：

**.env.local:**
```env
LLM_API_KEY=sk-你的密钥
LLM_BASE_URL=https://opencode.ai/zen/go/v1
LLM_MODEL=qwen3.5-plus
```

**lib/llm-config.ts:**
```typescript
const DEFAULT_BASE_URL = "https://opencode.ai/zen/go/v1";
const DEFAULT_MODEL = "qwen3.5-plus";

export type LlmConfig = { apiKey: string; baseUrl: string; model: string };

export function resolveLlmConfig(): LlmConfig | null {
  const apiKey = process.env.LLM_API_KEY?.trim();
  if (!apiKey) return null;
  return {
    apiKey,
    baseUrl: process.env.LLM_BASE_URL?.trim() || DEFAULT_BASE_URL,
    model: process.env.LLM_MODEL?.trim() || DEFAULT_MODEL,
  };
}
```

**lib/call-llm.ts:**
```typescript
import { resolveLlmConfig } from "./llm-config";
import { extractJsonObject } from "./extract-json-object";  // 复用上面第五节的代码

export async function callLlm(systemPrompt: string, userPrompt: string): Promise<string | null> {
  const config = resolveLlmConfig();
  if (!config) return null;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.4,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) return null;

    const payload = await response.json();
    return payload.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    clearTimeout(timeoutId);
    return null;
  }
}
```

然后在你自己的业务代码里：

```typescript
const raw = await callLlm("只输出合法 JSON", "你的 prompt");
if (!raw) {
  // 走兜底逻辑
  return fallback;
}
const json = extractJsonObject(raw);
if (!json) return fallback;
const result = JSON.parse(json);
// 用 result 做你的事，别忘了逐字段兜底
```

完事。