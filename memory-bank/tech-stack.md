# 技术栈推荐与架构设计 (Tech Stack & Architecture)

基于《产品需求文档 (PRD)》、《产品设计文档》与《规格补充文档》，为确保"沉浸式岗位试跑模拟器"能够以极简、高质、快速迭代的方式落地，本项目优先采用 **BaaS (Backend-as-a-Service)** 架构。此方案大幅削减了传统后端的开发与运维成本，使团队能将核心精力聚焦于前端交互（动画、滑卡、打字机特效）与 LLM 提示词工程。

> **规则优先级**：技术实现必须遵循 PRD -> 设计文档 -> 技术栈文档 -> 执行计划文档。若出现冲突，以前序文档为准。

---

## 1. 核心技术栈推荐

### 1.1 前端 (Frontend): React + Tailwind CSS + Vite
* **React 18+ (UI 框架)**：
  * **选型理由**：本项目具有复杂的 UI 状态流转（生命限制、剧本骨架节点、局部特效）。React 的组件化与生态体系能完美支撑"滑卡交互"、"动态数据绑定"等需求。配合较轻量的状态管理（如 Zustand），可有效管理单局游戏的声明周期。
* **Tailwind CSS (样式方案)**：
  * **选型理由**：原子化 CSS。对于《设计规约》中要求的"奶油黄、落日橘"等特定马卡龙配色系统，在 Tailwind `tailwind.config.js` 中配置主题变量后，能实现极高效率的复用；方便快速堆叠大圆角、轻阴影，且打包体积极小。
* **React Router DOM v6 (路由)**：
  * **选型理由**：SPA 路由管理，使用 Hash Router 模式兼容微信 X5 浏览器。路由配置：`/` Landing, `/survival` Survival, `/result` Result。转场动画由 Framer Motion 控制。
* **开源字体 (Smiley Sans + Noto Sans SC)**：
  * **选型理由**：满足"圆润有性格标题 + 高可读正文"双目标，同时规避版权纠纷，便于商业化发布。
* **Vite (构建工具)**：
  * **选型理由**：替代 Webpack，极速冷启动和 HMR（热更新），极大提升前端开发体验，配合 Vercel 部署丝滑。

### 1.2 后端与核心服务 (Backend / BaaS): Supabase + OpenCode API
* **Supabase Edge Functions (边缘函数)**：
  * **选型理由**：由于纯前端直连 LLM 会暴露 API Key，必须有中间层。Supabase Edge Functions 支持 Deno + TypeScript，适合做 OpenCode API 转发、双层过滤、超时兜底和结构化响应封装。
* **OpenCode API（qwen3.5-plus）**：
  * **选型理由**：已确定供应商与模型。通过 Edge Function 承载"3 秒趣味提示 + 5 秒硬切兜底"策略，并与游戏数值系统直接联动。System Prompt 规约见《规格补充文档》§7.3。
* **Supabase PostgreSQL (数据库)**：
  * **选型理由**：虽然 MVP 主要走 `LocalStorage` 无需登录，但考虑到 P1 图鉴云同步、埋点和排行榜，保留平滑升级空间。
* **Supabase Auth (身份认证)**：
  * **选型理由**：随时应对未来从"免登试玩"向"微信授权/手机号注册"的升级需求，无需重构现有代码。

### 1.3 部署基建 (Deployment)
* **Vercel (前端应用托管)**：
  * **选型理由**：不仅与 Vite/React 完美契合，且自带极为优秀的全球 CDN 加速。针对 PRD 中要求"首屏加载时间 < 2秒"，Vercel 的静态资源分发能力是 H5 裂变传播的强力保障。
* **Supabase (后端托管)**：
  * **选型理由**：全托管的 BaaS，无需自行维护任何服务器实例或 Docker 环境。

### 1.4 关键第三方依赖库
* **动画引擎：`framer-motion`**
  * 支持卡片 3°-8° 微偏转、支持拖拽 (drag)、手势释放时的 Spring（弹簧）缓动反馈，完美契合《设计规约》的动效要求。
* **状态管理：`zustand`**
  * 相比 Redux 更加轻量、极简，没有样板代码，适合管理当前周期的 KPI/护盾/精神状态以及同步 LocalStorage。
* **截图分享：`html2canvas`**
  * 按照 PRD 规划，将特定 DOM 节点转换为 Canvas 并生成 base64 图片供用户长按保存。
* **雷达图表：`recharts`**
  * 结算海报中的三维雷达图。使用 `<RadarChart>` 组件，薄荷绿填充，尺寸 200×200。详见《规格补充文档》§12.1。
* **二维码生成：`qrcode.react`**
  * 生成引流二维码，使用 `<QRCodeSVG>` 组件，尺寸 80×80，指向部署首页。
* **图标：`lucide-react`**
  * 轻量 SVG 图标库，用于 UI 中的通用图标。

---

## 2. 项目目录结构建议

推荐采用 `Feature-based` 或职责分离的目录结构：

```text
├── .env.local                  # 环境变量（Vite端口、Supabase URL/Key等）
├── index.html                  # 入口 HTML
├── package.json                # 依赖管理
├── tailwind.config.js          # Tailwind 主题配置（统一步伐和UI变量）
├── vite.config.ts              # Vite 配置
├── src/
│   ├── assets/                 # 静态资源 (图片、字体、Icon)
│   ├── components/             # 全局复用组件
│   │   ├── common/             # 基础 UI：Button, Toast, BlobBackground
│   │   ├── game/               # 局内组件：StatusBar(数值条), StoryCard(卡片), QuickChips, FreeInput
│   │   └── result/             # 结算组件：ReceiptPoster(小票海报), RadarChart(雷达图)
│   ├── config/                 # 静态配置文件
│   │   ├── theme.ts            # UI 设计规约中的色值、动画参数、字体层级映射
│   │   └── storyNodes.json     # PM/Ops 的 5 个标准骨架节点配置（完整数据见《规格补充文档》§6）
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useGameLoop.ts      # 核心游戏循环逻辑
│   │   └── useLLM.ts           # 与 Supabase Edge Function 通信的钩子（含3秒/5秒策略）
│   ├── services/               # 服务层
│   │   ├── llmClient.ts        # 前端 LLM 请求编排（3秒提示/5秒硬切）
│   │   └── safety.ts           # 前端基础规则过滤与错误码映射（规则见《规格补充文档》§11.1）
│   ├── store/                  # 状态管理 (zustand)
│   │   └── gameStore.ts        # 全局状态 (LocalStorage挂载) 及局内数值
│   ├── utils/                  # 工具函数
│   │   ├── request.ts          # Axios / Fetch 封装
│   │   ├── screenshot.ts       # html2canvas 封装
│   │   ├── clamp.ts            # 数值 clamp 工具（限制 0-100）
│   │   └── titles.ts           # 称号映射与热力百分比计算（逻辑见《规格补充文档》§8）
│   ├── views/                  # 页面级组件
│   │   ├── LandingView.tsx     # 落地与职业选择页
│   │   ├── SurvivalView.tsx    # 职场生存决策流页
│   │   └── ResultView.tsx      # 结算与图鉴页
│   ├── App.tsx                 # 根组件（Hash Router 路由分发）
│   └── main.tsx                # React 挂载点
└── supabase/                   # Supabase 配置文件与函数代码
    └── functions/              # Edge Functions 源码
        └── chat-completion/    # 封装处理对话的大模型代理路由
            └── index.ts        
```

---

## 3. 核心实现策略补充

### 3.1 LLM 调用范围（MVP）
* **预设选项（点击 Chip / 滑卡）**：走本地 `storyNodes.json` 数据，**不调用 LLM**。效果值硬编码在 JSON 中。
* **自由文本输入**：调用 Supabase Edge Function → qwen3.5-plus，返回 `LLMJudgeResult` 结构化数据。
* 此策略保证断网时预设选项依然可玩，LLM 仅增强自由输入体验。

### 3.2 双层过滤策略（MVP）
1. **第一层规则过滤**：前端+Edge Function 双重拦截 Prompt Injection、明显违规词、异常长度输入。正则规则见《规格补充文档》§11.1。
2. **第二层语义审查**：对模型回复做 allow/penalty/block 结构化判定；block 时输出安全文案，不回传原始高风险内容。校验函数见《规格补充文档》§11.2。
3. **规则主维护位**：双层过滤规则与阈值统一维护在《规格补充文档》，本文件仅说明技术实现映射，避免规则双写漂移。

### 3.3 超时与降级策略（MVP）
1. 请求 3 秒未完成：前端显示趣味 Loading 文案（文案池见《规格补充文档》§9.1）。
2. 请求 5 秒未完成或 API 失败：返回固定不可用提示与本地兜底结果（见《规格补充文档》§7.6），避免白屏。

### 3.4 图鉴存储策略（MVP）
1. LocalStorage 仅保存结算元数据（`GameResult`），不长期保存整张 base64 海报。
2. 海报在用户查看或分享时按需重渲染，降低容量风险与损坏概率。
3. 若触发隐藏结局，元数据需包含隐藏结局标签与触发来源，用于结果页展示与后续分析。

### 3.5 路由方案
* 使用 `react-router-dom v6` 的 `HashRouter`（兼容微信 X5）。
* 路由表：`/` → LandingView, `/survival` → SurvivalView, `/result` → ResultView。
* 转场动画规格见《规格补充文档》§3。

---

## 4. 架构优势总结

1. **防范 Key 泄露**：将 LLM 请求封底于 `supabase/functions/chat-completion` 中，前端只暴露 Supabase 的匿名 Key。这是合规与安全底线。
2. **体验可控**：通过"3 秒提示 + 5 秒硬切 + 本地兜底"，在模型慢响应和失败场景下仍可保持游戏流程连续。
3. **断网可玩**：预设选项走本地数据不依赖 LLM，保证核心游戏链路在无网络时仍可体验。
4. **极简运维**：团队中只需专注"写 React" 和 "调 Prompt"，所有扩容、防攻击、CDN 交由 Vercel 和 Supabase 托管。
5. **平滑迭代**：Zustand + LocalStorage 先打通游客体验，后续可无缝演进到云端图鉴和排行榜。