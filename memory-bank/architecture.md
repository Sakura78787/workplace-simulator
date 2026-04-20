# 项目架构 (Architecture)

## 1. 文档治理顺序（最高准则）
1. PRD.md（需求真源）
2. memory-bank/design-document.md（体验与交互约束）
3. memory-bank/tech-stack.md（技术实现与架构约束）
4. memory-bank/implementation-plan.md（执行步骤与验收路径）
5. memory-bank 治理文档（进度、结构、决策、规格补充等）

## 2. 根目录结构
- PRD.md：完整产品需求文档，业务范围与验收标准唯一来源
- memory-bank/：项目文档知识库与治理资产目录

## 3. memory-bank 核心文档职责
- design-document.md：视觉语言、交互规范、组件行为与响应式策略
- tech-stack.md：技术选型、架构边界、服务依赖与实现策略
- implementation-plan.md：分阶段执行任务与测试回归清单
- progress.md：本轮及后续里程碑进度记录
- architecture.md：文档结构与职责说明（本文件）

## 4. memory-bank 扩展文档职责
- spec-supplement.md：规格参数单一规范源（阈值、规则、文案池）
- decision-log.md：决策与变更历史归档
- 根目录 prd-quick-reference.md：面向产品运营的简版需求速览
- game-data.md：游戏数据说明层（人类可读）
- game-data.json：游戏结构化数据真源（程序可读）
- supabase/functions/chat-completion/prompts/system-prompt.txt：LLM 系统提示词真源（与 Edge Function 同包部署）

## 5. 依赖规则
- 后序文档不得反向改写前序文档规则
- 同一规则只允许在一个主维护文档定义，其他文档仅引用
- 出现冲突时按“文档治理顺序”回溯并修订
