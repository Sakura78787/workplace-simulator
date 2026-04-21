# 沉浸式岗位试跑模拟器

[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF)](https://vite.dev)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres%20%26%20Functions-green)](https://supabase.com)

一个移动端优先的职场生存文字游戏。玩家在高压回合中做选择或自由输入，系统根据本地剧本与大模型判定更新三维生存数值，最终生成结算海报、沉淀本地图鉴，并支持匿名排行榜展示。

## 项目亮点
- 四角色可玩：PM、Ops、RD、QA。
- 双轨决策：预设选项走本地剧本，自由输入走大模型判定。
- 安全与降级：输入拦截、输出审查、慢响应提示与兜底回复。
- 结果可传播：结算页支持雷达图展示与海报导出。
- 游客可持续：本地持久化续玩、图鉴记录、匿名设备标识。
- 运营可观测：分享按钮分组埋点与匿名前二十排行榜。

## 技术栈
- 前端：React、TypeScript、Vite、Tailwind CSS、Framer Motion
- 状态：Zustand（含本地持久化）
- 图表与生成：Recharts、html2canvas、qrcode.react
- 服务：Vercel API 路由、Supabase 数据库与函数

## 当前实现概览
- 路由：Hash 路由，包含首页、生存页、结算页。
- 对局：回合数按场景节点动态决定，非固定轮数。
- 数值：kpi、shield、mental，范围固定在 0 到 100。
- 复活：单局一次，回滚到本回合选择前快照。
- 大模型：当前接口返回结构化 verdict、reply、effects。
- 榜单：仅暴露聚合结果，客户端不直接读取原始明细表。

## 本地开发

### 环境要求
- Node.js 18 及以上
- npm 9 及以上
- Supabase CLI（仅在你需要部署或调试 Supabase 函数时）

### 安装与启动
```bash
npm install
npm run dev
```

### 构建与预览
```bash
npm run build
npm run preview
```

## 环境变量
请在本地创建 `.env.local`，并通过部署平台配置同名变量。不要提交任何真实密钥。

前端公开变量：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

服务端变量（Vercel API 路由）：
- `OPENCODE_API_URL`
- `OPENCODE_API_KEY`

## 数据库与函数

### 推送数据库迁移
```bash
npx supabase db push
```

### 部署 Supabase 函数
```bash
npx supabase functions deploy chat-completion --project-ref <你的项目ID>
```

说明：当前前端默认调用站内 `/api/chat-completion`。Supabase 函数可作为独立部署能力保留。

## 项目结构
```text
src/
	components/      可复用组件与局内组件
	config/          剧本数据与文案常量
	hooks/           业务钩子（如 LLM 请求）
	services/        外部服务访问封装
	store/           状态管理
	utils/           工具函数
	views/           页面级视图
api/
	chat-completion.ts  站内大模型代理入口
supabase/
	functions/       Supabase 函数
	migrations/      数据库迁移脚本
```

## 安全与开源说明
- 仓库不应提交任何 `.env` 文件、密钥、个人隐私数据。
- 内部产品文档与研究过程文件已排除在开源提交范围外。
- 若你准备公开发布，请先补充正式许可证文件。

