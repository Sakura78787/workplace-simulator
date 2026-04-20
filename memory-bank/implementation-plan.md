# 实施计划 (Implementation Plan) - 沉浸式岗位试跑模拟器

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> **核心警示**：禁止企业后台风。所有按钮胶囊化（rounded-full），卡片高圆角（rounded-2xl/3xl），动效统一 spring，不使用线性硬切；PC 端固定 414 宽居中壳。

**Goal:** 在 MVP 范围内打通"选角 -> 5 回合生存决策 -> 死亡/通关 -> 海报导出 -> 本地图鉴"的完整闭环，并满足安卓优先验收。

**Architecture:** React + Tailwind + Framer Motion 承载交互与视觉；Zustand + LocalStorage 管理状态与续玩；Supabase Edge Function 作为 Opencode(qwen3.5-plus) 代理与双层过滤入口。路由采用 react-router-dom v6 Hash Router。

**Tech Stack:** React, Tailwind CSS, Vite, Zustand, framer-motion, html2canvas, recharts, qrcode.react, react-router-dom, lucide-react

**补充规约：** 所有实施必须遵循文档优先顺序：PRD -> design-document.md -> tech-stack.md -> implementation-plan.md。若存在冲突，以前序文档为准；规格参数统一以《规格补充文档》为准。

---

## 阶段一：视觉骨架与基础约束

### Task 1: 初始化与主题令牌
**来源：** PRD §3(P0-2)、PRD §6.2、design-document §0/§1、规格补充文档 §3/§4/§5
- [✔] **Step 1: 初始化项目与依赖**
  执行 Vite React TS 初始化，安装 `tailwindcss`, `postcss`, `autoprefixer`, `framer-motion`, `zustand`, `html2canvas`, `recharts`, `qrcode.react`, `react-router-dom`, `lucide-react`。
- [✔] **Step 2: 注入颜色与字体令牌**
  在 Tailwind 中配置 `cream/mint/babyblue/sunset/critical/text-primary/text-secondary/card-bg` 等色值（详见《规格补充文档》§4.1），并接入开源字体 `Smiley Sans`（标题）与 `Noto Sans SC`（正文）。字体层级见《规格补充文档》§5。
- [✔] **Step 3: 锁定移动壳布局与路由**
  根容器强制 `max-w-[414px]` + `h-[100dvh]` + 居中。配置 Hash Router：`/` Landing, `/survival` Survival, `/result` Result。转场动画规格见《规格补充文档》§3。
- **测试方法**：桌面全屏时内容仍居中手机壳，视觉不扩成企业官网布局。路由切换可跳转。

### Task 2: 全局视觉组件
**来源：** PRD §3(P0-2)、design-document §0/§1、规格补充文档 §4/§9
- [x] **Step 1: BlobBackground**
  实现 2-3 个有机光晕，长周期漂浮（非线性）。
- [x] **Step 2: CapsuleButton 组件化**
  提供 `default/warning/disabled` 变体，统一按压 spring 反馈。详细参数见《规格补充文档》§4.2。
- [x] **Step 3: Toast 组件化**
  支持 `info/warn/error` 三种语义，用于续玩、违规、断网提示。文案见《规格补充文档》§9。
- **测试方法**：按钮和气泡按压手感一致，背景与提示不抢主线阅读。

---

## 阶段二：核心玩法主链路

### Task 3: LandingView 与选角入局
**来源：** PRD §3(P0-1)、PRD §4(Onboarding)、PRD §7(验收2)
- [x] **Step 1: 实现免责声明强制勾选**
  未勾选时主 CTA 禁用。文案见《规格补充文档》§9.5。
- [x] **Step 2: 实现 PM/Ops 选角卡片**
  卡片风格统一，选中态清晰。
- [x] **Step 3: 入局状态写入 Store**
  写入角色、回合初始值和新局标识。
- **测试方法**：未勾选无法开局；勾选后可进入生存页。

### Task 4: 剧本骨架与状态机
**来源：** PRD §3(P0-3/P0-4)、PRD §4(决策循环)、规格补充文档 §6/§13
- [x] **Step 1: 建立 `storyNodes.json`**
  配置 PM 和 Ops 各 5 个节点（热身/甩锅/插单/死线/背锅），每节点固定 3 个选项及效果值。完整数据以结构化真源（game-data.json）与《规格补充文档》一致为准。
- [x] **Step 2: 建立 `gameStore.ts` 核心状态**
  包含 `currentRound`、三维数值（初始50）、`eventLog`、`reviveUsed`、`lastRoundSnapshot`（每回合选择前保存）。数值边界 clamp [0, 100]。
- [x] **Step 3: 实现回合推进与结算**
  每次决策都推进"选择 -> 数值变化(clamp) -> 死活判定 -> 下一轮/结算"。死亡判定流程见《规格补充文档》§13.2。
- **测试方法**：可稳定跑完 5 回合；任一维度 <=0 立即触发死局。

### Task 5: SurvivalView 交互区
**来源：** PRD §3(P0-2)、PRD §7(验收5/8)、design-document §1.3/§3
- [x] **Step 1: StatusBar + 红框暴跌警报**
  三条并列胶囊进度条，单次跌幅 >20 触发短促红框快闪(120ms×3)。
- [x] **Step 2: StoryCard 拖拽与滑选**
  实现 StoryCard 的拖拽交互：轻拖(< 60px)为视觉反馈(偏转+旋转)；拖过阈值(≥ 60px)触发滑选确认：左滑→Chip1，右滑→Chip3。松手未达阈值spring回弹。卡片旋转 = `dx * 8 / cardWidth`(最大±8°)。完整规格见《规格补充文档》§2。
- [x] **Step 3: DecisionArea 输入机制**
  2-3 个 QuickChips；短按发送，长按(400ms)填入输入框；输入框聚焦时 Chips 以 opacity+translateY 渐隐。
- **测试方法**：可滑可点且不退化为纯聊天框；滑选阈值响应正确。

### Task 6: NPC 打字机与交互锁
**来源：** PRD §3(P0-2)、design-document §1.3/§3.4
- [x] **Step 1: `NPCMessage` 逐字输出**
  每秒约 15-20 字节奏，光标为 2px 落日橘闪烁竖线。
- [x] **Step 2: 打字期间锁定决策区**
  `isTyping=true` 时禁用输入和快捷项。
- **测试方法**：打字结束前用户无法插入新决策。

### Task 7: 复活机制完整分支
**来源：** PRD §3(P0-4)、PRD §4(死亡判定)、PRD §7(验收6)
- [x] **Step 1: 实现首次死局弹窗**
  显示"使用复活"与"放弃复活直接结算"。文案见《规格补充文档》§9.6。
- [x] **Step 2: 使用复活逻辑**
  从 `lastRoundSnapshot` 回滚到本回合选择前状态，并标记 `reviveUsed=true`。保留 eventLog 不删除。
- [x] **Step 3: 放弃复活逻辑**
  直接进入死亡结算，不回滚。
- **测试方法**：两条分支均稳定，无回合错乱或重复复活。

---

## 阶段三：LLM 接入、安全与降级

### Task 8: 前端 LLM 调用层（OpenCode）
**来源：** PRD §3(P0-6)、PRD §6.1/§6.3、规格补充文档 §7/§9/§11
- [x] **Step 1: 建立 `useLLM.ts` 与请求封装**
  约定统一返回结构：`reply + effects + verdict + reasonCode`。请求体格式见《规格补充文档》§7.2。
- [x] **Step 2: 3 秒提示 + 5 秒硬切**
  超过 3 秒显示趣味文案（文案池见《规格补充文档》§9.1）；到 5 秒直接切固定不可用提示并走本地兜底。
- [x] **Step 3: 成功慢响应与失败响应分离**
  成功但慢：继续趣味等待；失败/超时：固定不可用提示（见《规格补充文档》§9.2）。
- [x] **Step 4: 前端第一层规则过滤**
  实现 length、injection、block 三类正则拦截（规则列表见《规格补充文档》§11.1）。命中时前端直接返回 block，不发请求。
- **测试方法**：模拟慢接口与失败接口，UI 分支正确且不白屏。

### Task 9: Supabase Edge Function 双层过滤
**来源：** PRD §3(P0-6)、PRD §6.3、tech-stack §3.2
- [x] **Step 1: 创建 `chat-completion` 函数**
  接入 Opencode API，模型固定 `qwen3.5-plus`。System Prompt 模板见《规格补充文档》§7.3。
- [x] **Step 2: 第一层规则过滤（Edge Function 端）**
  拦截 Prompt Injection、明显违规输入、异常长度输入（与前端双重保障）。
- [x] **Step 3: 第二层语义审查**
  对模型输出做 allow/penalty/block 结构化判定，命中风险时输出安全文案与惩罚值。校验函数见《规格补充文档》§11.2。
- [x] **Step 4: 失败兜底**
  API 错误或超时时统一返回本地可消费的 fallback 结构（见《规格补充文档》§7.6）。
- **测试方法**：注入越权提示词、辱骂词、正常文本，三类返回符合预期。

---

## 阶段四：结算传播与存档

### Task 10: ResultView 与海报导出
**来源：** PRD §3(P0-5)、PRD §4(Result)、PRD §7(验收4)
- [x] **Step 1: 小票风版式**
  包含称号、雷达图(recharts)、致命金句、热力百分比。版式参数见《规格补充文档》§4.7。
- [x] **Step 2: 二维码接入**
  使用 `qrcode.react` 的 `<QRCodeSVG>`，尺寸 80×80，内容为 deployHomeUrl。
- [x] **Step 3: html2canvas 导出**
  离屏 720×1280 渲染，处理 SVG 转 canvas，确保 Android 端长按保存稳定。完整规格见《规格补充文档》§12。
- **测试方法**：Android 端可稳定生成并保存海报，二维码可扫码打开首页。

### Task 11: 本地续玩与图鉴策略
**来源：** PRD §3(P0-5)、PRD §4(缓存分支)、PRD §7(验收2)
- [x] **Step 1: 续玩缓存**
  `visibilitychange` + `pagehide` 时持久化进行中会话。微信 X5 兼容见《规格补充文档》§10.4。
- [x] **Step 2: 图鉴存储最小化**
  仅存 `GameResult` 元数据，不长期存整图 base64。若触发隐藏结局，元数据必须包含隐藏结局标签与触发语境摘要。
- [x] **Step 3: 图鉴展示**
  支持查看历史死亡/通关记录，按需重生成海报。
- **测试方法**：强退后可续玩；多局记录不爆 LocalStorage。

---

## 阶段五：安卓优先验收

### Task 12: MVP 终验清单（Android）
**来源：** PRD §7(全部验收项)、PRD §6.2、design-document §5
- [ ] **Step 1: 主链路回归**
  开局 -> 5 回合(Chip点击 + 滑卡选择 + 自由输入) -> 死亡/通关 -> 海报导出 -> 重开局。
- [ ] **Step 2: 异常回归**
  违规输入、接口慢响应、接口失败、第三回合强退续玩。
- [ ] **Step 3: 视觉回归**
  检查胶囊按钮、卡片偏转、滑卡阈值、红框警报、输入聚焦隐藏Chips。
- [ ] **Step 4: 范围确认**
  A/B 分享按钮不纳入 MVP，本期只保留单分享方案。
- [ ] **Step 5: 反模式检查**
  逐条自检《规格补充文档》§14 反模式清单，确保无企业官网风、无深色大面积、无不退化为纯聊天框。
- **测试方法（P0 终极验收）**：在 Android Chrome 与 Android 微信 X5 完成全链路演示并录屏留档。