# 规格补充文档（Spec Supplement）

> 角色：本文件是规则与阈值的单一规范源。PRD 描述业务目标，设计文档描述体验呈现，技术栈与执行计划只做实现映射，不重复定义本文件规则。

## §1 布局定稿
- 交互模型：中央卡片流，不是群聊滚动流
- 视口策略：移动优先，PC 固定手机壳宽 414px 居中
- 区域结构：Top 状态条 + Center 事件卡 + Bottom 决策区

## §2 滑卡交互参数
- 轻拖阈值：|dx| < 60px，仅视觉反馈
- 提交阈值：|dx| >= 60px，触发选择提交
- 左滑：映射 Chip1
- 右滑：映射 Chip3
- 中间选项：仅点击触发
- 旋转公式：rotate = dx * 8 / cardWidth，最大绝对值 8 度
- 回弹：未达阈值时 spring 回弹

## §3 转场与动效节奏
- 常规动效：180-260ms
- 强调动效：280-360ms
- 警报动效：120-180ms
- 原则：禁用线性硬切，使用 spring 或 ease-out

## §4 组件参数基线
- CapsuleButton：rounded-full，支持 default/warning/disabled
- StoryCard：rounded-3xl，max-w 340px，支持 dragging/settling/locked
- StatusBar：三指标并列胶囊条，高度建议 7
- QuickChips：支持短按发送与 400ms 长按填充
- FreeInput：聚焦时 chips 透明并下移，不占位挤压
- Toast：顶部居中，默认 3 秒消失
- ReviveModal：遮罩 + 弹窗 spring 弹入

## §5 字体层级
- 标题：Smiley Sans
- 正文：Noto Sans SC
- 回退：system-ui, sans-serif
- 合规：禁止授权不明字体

## §6 剧本静态数据规范
- 数据真源：memory-bank/game-data.json
- 数据对象：PM 与 Ops 各 5 回合，主题固定为热身/甩锅/插单/死线/背锅
- 每回合固定 3 个预设选项，每个选项包含 kpiDelta/shieldDelta/mentalDelta
- 预设选项全部本地结算，不触发 LLM

## §7 LLM 协议规范
- 模型：qwen3.5-plus（经 Edge Function 代理）
- 返回结构：verdict + reply + effects + reasonCode
- verdict 取值：allow/penalty/block/fallback
- effects 单项范围：-25 到 +25
- 非法返回处理：统一覆写 fallback 包

## §8 称号与隐藏结局映射
- 死亡称号基线：
  - mental=0：精神已读不回 / 确诊ICU的肝帝
  - shield=0：孤狼·没有人站你 / 公敌·全员拉黑
  - kpi=0：大饼碎了一地 / 画饼翻车现场
- 通关称号基线：
  - 三值均 >60：职场端水大师
  - 三值均 <=30：比死还惨的幸存者
- 隐藏结局基线：
  - 主动离职流：高频拒绝协作 + 消极回复
  - 彻底摆烂流：连续摆烂/嘲讽/放弃推进
- 热力百分比：精神权重 0.5，另外两项共 0.5

## §9 文案池
- 3 秒 loading 文案：
  - 老板正在打字...
  - 你的回复正在被HR审查...
- 5 秒兜底提示：
  - 职场服务器开小差了。不过别高兴，扣分照旧。
- 免责声明：
  - 本剧本纯属发癫虚构，请勿输入个人及公司真实涉密信息。

## §10 快照与续玩
- 快照时机：每回合选择前
- 快照内容：currentRound + stats + eventLog
- 复活限制：单局 1 次
- 续玩持久化：visibilitychange + pagehide 双事件

## §11 双层过滤规则（主维护位）
- 第一层（规则过滤，前端与 Edge 共用规则）：
  - 空输入拒绝
  - 超长输入拒绝（默认 >200 字）
  - 注入关键词拦截（忽略指令、system、instruction 等）
- 第二层（语义审查，Edge）：
  - 高风险输出替换为安全回复
  - block 场景不回传原文，转惩罚或 fallback

## §12 海报导出规格
- 输出尺寸：720 x 1280（9:16）
- 渲染：html2canvas 离屏容器
- 必备元素：称号、雷达图、致命金句、热力百分比、二维码
- 存储策略：长期仅存元数据，不长期存 base64 整图

## §13 判定流程
- 每次决策：应用 delta -> clamp 到 [0,100] -> 判死活
- 任一指标 <=0：死局分支
- 首次死局：可复活或直接结算
- 非法/风控输入：安全回复 + 惩罚结算 + 流程继续

## §14 反模式清单
- 禁止企业后台风
- 禁止桌面横向扩展布局
- 禁止把核心流程退化为纯聊天框
- 禁止多文档重复维护同一规则正文
