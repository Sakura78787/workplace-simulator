# 产品设计文档 (Design Document) - 沉浸式岗位试跑模拟器

基于《产品需求文档 (PRD)》、风格定义手册与《规格补充文档》，将"视觉治愈系 + 剧情毒打系 + 游戏化交互"转化为可执行的前端设计规约。

> **规则优先级**：本文件为设计实现约束文档，业务规则与功能范围以 PRD 为唯一上位来源；若有冲突，以 PRD 为准。

> **布局定稿（勘误）**：核心交互模型为**中央卡片游戏决策流**，非群聊滚动流。中央区域为当前事件卡，NPC对话在卡内打字机展现；底部为Chips+输入框；整个流程不需上下滚动。详见《规格补充文档》§1。

---

## 0. 风格与品牌落地约束 (Style Guardrails)

### 0.0 硬性反模式清单 (Anti-Patterns)
* **严禁企业后台风**：禁用大面积深色、数据表格主视图、侧边栏管理台布局。
* **组件必须圆润化**：所有按钮强制胶囊形（rounded-full），卡片需高圆角（rounded-2xl 或 rounded-3xl）。
* **动效必须 Spring**：页面切换、卡片回弹、按钮按压禁用生硬线性动画。
* **固定移动壳**：PC 端严格锁定 414 宽居中展示，不允许横向拉伸为桌面布局。

### 0.1 品牌关键词
* 灵动、柔和、Q弹、戏谑、荒诞、轻黑色幽默。
* 体验目标：看起来轻松，玩起来紧张。

### 0.2 视觉与色彩
* 主风格：Playful Pop + Organic Macaron。
* 主题色：奶油黄 `#FFF6D9`、薄荷绿 `#A8E6CF`、婴儿蓝 `#A2D2FF`、落日橘 `#FFAAA5`。
* 补充色：危急红 `#FF6B6B`、主文本 `#2D2D2D`、次文本 `#9CA3AF`、卡片白 `#FFFFFF`。
* 用色原则：大面积低饱和，小面积高对比，警报使用橘到红快闪。

### 0.3 字体与版权
* 标题字体：优先使用 `Smiley Sans`（开源可商用）。
* 正文字体：优先使用 `Noto Sans SC`（开源可商用）。
* 字体回退：`system-ui, sans-serif`。
* 要求：不得使用授权不明的商用字体，避免版权纠纷。
* 完整字体层级见《规格补充文档》§5。

### 0.4 组件变体矩阵 (必须实现)
* `CapsuleButton`：Default / Pressed / Disabled / Warning。
* `StoryCard`：Default / Dragging / Settling / Locked。
* `QuickChip`：Default / Hover / Selected / Hidden。
* `StatusBar`：Safe / Mid / Warning / CriticalFlash。

---

## 1. 页面结构清单 (Page Structure List)

本项目采用 SPA 架构（Hash Router），划分为三大核心视图与常驻全局组件。路由：`/` Landing → `/survival` Survival → `/result` Result。

### 1.1 全局组件 (Global Components)
* **背景容器 (`BlobBackground`)**：大面积奶油黄背景 + 缓慢漂浮有机 Blob。
* **全局提醒 (`Toast`)**：胶囊提示，用于存档恢复、违规拦截、网络降级。详见《规格补充文档》§4.9。

### 1.2 落地与选角页 (Landing & Onboarding View)
* **免责声明区块 (`DisclaimerAlert`)**：
  * 未勾选时主按钮禁用。
  * 强警示文案（见《规格补充文档》§9.5）。
* **角色选择 (`RoleCarousel` / `RoleCard`)**：PM 与 Ops 两条剧情分支入口。
* **主动作按钮 (`PlayButton`)**：大号落日橘胶囊，文案"开始受虐/一键入职"。

### 1.3 生存决策页 (Survival Flow View)

> **布局定稿：中央卡片游戏流**，非聊天滚动流。

```
┌──────────────────────────┐
│     StatusBar（顶部固钉）  │  ← 三指标胶囊条，常驻
├──────────────────────────┤
│                          │
│    ┌──────────────────┐  │
│    │   StoryCard       │  │  ← 中央事件卡，NPC打字机在此
│    │   (可拖拽/滑选)    │  │
│    └──────────────────┘  │
│                          │  ← 弹性区域，卡片居中
├──────────────────────────┤
│  [Chip1] [Chip2] [Chip3] │  ← QuickChips 快捷选项
│  ┌──────────────────┐     │
│  │  自由输入框       │     │  ← 吸底输入框
│  └──────────────────┘     │
└──────────────────────────┘
```

* **顶部指标看板 (`StatusBar`)**：三条并列胶囊进度条（大饼进度/免喷护盾/精神状态）。详见《规格补充文档》§4.4。
* **中央事件区 (`EventDisplay`)**：
  * `NPCMessage`：打字机逐字输出。
  * `StoryCard`：支持轻拖旋转视觉反馈与滑选确认。拖拽交互规范详见《规格补充文档》§2。
* **底部交互区 (`DecisionArea`)**：
  * `QuickChips`：每轮 2-3 个快捷选项，短按发送，长按填入输入框。向左滑卡选中 Chip1，向右滑卡选中 Chip3。
  * `FreeInput`：吸底输入框，聚焦后 Chips 渐隐不占位。
* **复活弹窗 (`ReviveModal`)**：首次死亡时可选"使用复活"或"放弃并直接结算"。详见《规格补充文档》§4.8。

### 1.4 结算与图鉴页 (Result & Pokedex View)
* **结算海报面板 (`ReceiptPoster`)**：
  * 小票风视觉 + 大号称号 + 雷达图(`recharts`) + 致命金句 + 热力百分比 + 二维码(`qrcode.react`)。
  * 海报渲染规格见《规格补充文档》§12。
* **底部操作栏 (`ResultActions`)**：重新入职、生成/保存海报、分享。
* **图鉴抽屉 (`PokedexDrawer`)**：MVP 先做本地记录浏览；云端同步属于 P1。

---

## 2. 数据结构定义 (Data Structure Definitions)

建议使用 Zustand + LocalStorage 持久化。

```typescript
interface GlobalState {
  userId: string;
  currentRole: 'PM' | 'Ops' | null;
  hasAgreedDisclaimer: boolean;
  historyPokedex: GameResult[];
  deployHomeUrl: string; // 二维码默认跳转地址
}

interface StatState {
  kpi: number;    // 老板画的大饼（显示名）
  shield: number; // 免喷护盾（显示名）
  mental: number; // 精神状态（显示名）
}

interface RoundSnapshot {
  round: number;
  stats: StatState;
  eventLog: ChatHistory[];
}

interface ChatHistory {
  role: 'npc' | 'player' | 'system';
  content: string;
  at: number;
}

interface GameSession {
  status: 'onboarding' | 'playing' | 'dead' | 'cleared';
  currentRound: 1 | 2 | 3 | 4 | 5;
  reviveUsed: boolean;
  stats: StatState;
  eventLog: ChatHistory[];
  lastRoundSnapshot?: RoundSnapshot; // 每回合选择前保存，用于复活回滚
  isTyping: boolean;
  isAwaitingLLM: boolean;
}

interface StoryOption {
  id: string;
  text: string;
  effects: {
    kpiDelta: number;
    shieldDelta: number;
    mentalDelta: number;
  };
}

interface StoryNode {
  stepId: 1 | 2 | 3 | 4 | 5;
  theme: '热身' | '甩锅' | '插单' | '死线' | '背锅';
  role: 'PM' | 'Ops';
  npcDialogue: string;
  presetOptions: [StoryOption, StoryOption, StoryOption];
}

interface LLMJudgeResult {
  verdict: 'allow' | 'penalty' | 'block' | 'fallback';
  reply: string;
  effects: {
    kpiDelta: number;
    shieldDelta: number;
    mentalDelta: number;
  };
  reasonCode?: string;
  hiddenEndingTag?: string; // 隐藏结局标识（如触发，则附带标签）
}

interface GameResult {
  resultId: string;
  resultType: 'dead' | 'cleared'; // 隐藏结局统一归为 'dead' 结算（轻量化方案）
  finalStats: StatState;
  fatalQuote?: string;
  achievedTitle: string;
  heatPercentage: string;
  qrTarget: string;
  createdAt: number;
  isHiddenEnding?: boolean; // 标识是否为隐藏结局
  hiddenEndingTag?: string; // 隐藏结局标签（如"主动离职流"）
  hiddenContext?: string; // 触发语境摘要
}
```

> **完整 storyNodes 数据**见《规格补充文档》§6。**LLM Prompt 工程规约**见《规格补充文档》§7。**称号映射**见《规格补充文档》§8。

---

## 3. 交互逻辑说明 (Interaction Logic)

### 3.1 动效节奏
* 胶囊按钮按压：`scale(0.96~0.98)`，释放 spring 回弹。
* 卡片拖拽与滑选：详见《规格补充文档》§2。
* 时长建议：常规 180-260ms，强调 280-360ms，警报 120-180ms。
* 页面转场动画：详见《规格补充文档》§3。

### 3.2 核心输入流
* 快捷芯片短按：立即发送并结算。
* 快捷芯片长按（400ms）：填充到输入框，允许二次编辑。
* 输入框聚焦：QuickChips opacity 渐隐上移，不占位挤压内容区。
* 滑卡选择：左滑→Chip1，右滑→Chip3，中间选项仅点击。

### 3.3 LLM 调用范围（MVP）
* 预设选项（点击 Chip / 滑卡）：走本地 `presetOptions` 数据，**不调用 LLM**。
* 自由输入：调用 LLM，返回 `LLMJudgeResult`。
* 此策略保证断网时预设选项依然可玩。

### 3.4 LLM 交互时序
* 提交后立即锁定决策区。
* 0-3 秒：常规等待。
* 超过 3 秒：显示趣味 Loading 文案（见《规格补充文档》§9.1）。
* 到达 5 秒：若仍无有效返回，硬切固定不可用文案并走本地兜底结果。

### 3.5 数值与代价感
* 每次决策后进度条平滑变化（360ms ease-out）。
* 任一指标单次下降大于 20，触发红框快闪（120ms on/off × 3）。
* 任一指标小于等于 0，进入死亡判定。
* 所有 delta 计算后 clamp 到 [0, 100]。

### 3.6 复活分支
* 首次死亡触发复活弹窗。
* 选"使用复活"：回滚到 `lastRoundSnapshot`（本回合选择前的状态），并标记 `reviveUsed=true`。
* 选"放弃复活"：直接进入死亡结算页。
* 快照保存时机：每回合选择前保存。详见《规格补充文档》§10。

### 3.7 缓存与续玩
* 页面隐藏/切出时持久化当前局（`visibilitychange` + `pagehide` 兜底）。
* 回到应用发现未完局，弹出"继续收拾/重新入职"。
* 微信 X5 兼容：详见《规格补充文档》§10.4。

---

## 4. 状态管理说明 (State Management)

### 4.1 LLM 请求与锁定状态
* `isAwaitingLLM=true` 时，`DecisionArea` 禁用。
* `isTyping=true` 时，输入区和快捷芯片均禁用。

### 4.2 双层过滤策略
* **第一层（规则防线）**：详见《规格补充文档》§11.1。
* **第二层（语义审查）**：详见《规格补充文档》§11.2。

### 4.3 降级策略
* API 失败或 5 秒超时：统一返回固定提示与本地兜底结果。见《规格补充文档》§7.6。
* 为保持流程连续，使用本地兜底回复推进回合并给轻度惩罚。

### 4.4 图鉴存储策略
* 本地持久化 `GameResult` 元数据。
* 结算海报按需生成，不长期缓存完整 base64 图片。

---

## 5. 响应式设计要求 (Responsive Design Requirements)

坚持严格 Mobile-First。

### 5.1 尺寸策略
* 基准宽度：390-414。
* 高度策略：`100dvh`。
* 布局：Top 固定、Center 弹性、Bottom 吸底。

### 5.2 跨端适配优先级
* MVP 优先 Android Chrome 与 Android 微信 X5。
* 桌面端仅做 414 宽居中手机壳，不扩展为桌面布局。

### 5.3 海报导出适配
* 离屏渲染容器：`absolute; left: -9999px; top: 0;`。
* 输出比例固定 9:16（720×1280）。
* 保障 Android 长按保存稳定。

---

## 6. 组件视觉参数速查

> 完整参数详见《规格补充文档》§4，以下为关键摘要。

| 组件 | 关键参数 |
|------|----------|
| CapsuleButton | rounded-full, px-8 py-3.5, font-smiley 16px/600, spring按压回弹 |
| StoryCard | rounded-3xl, max-w-[340px], min-h-[200px], p-6, 3°-8°偏转 |
| StatusBar | 三条并列胶囊, h-7, rounded-full, 色值见§0.2 |
| QuickChips | rounded-full, px-4.5 py-2.5, 14px/500, 400ms长按阈值 |
| FreeInput | rounded-full, h-11, px-4.5, 聚焦时Chips opacity渐隐 |
| Toast | rounded-full, 顶部居中 top-20, 3s自动消失 |
| ReceiptPoster | 720×1280离屏, 小票白底rounded-2xl, recharts雷达图200×200 |
| ReviveModal | 遮罩blur+弹窗rounded-3xl, spring弹入bounce:0.4 |