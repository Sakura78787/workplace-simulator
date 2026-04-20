# 沉浸式岗位试跑模拟器 (Workplace Simulator)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2-blue)](https://react.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC)](https://tailwindcss.com)
[![Supabase](https://img.shields.io/badge/Supabase-Edge%20Functions-green)](https://supabase.com)

一款基于大语言模型（LLM）的移动优先轻量级职场文字生存游戏。化身“牛马”打工人，在老板画饼、跨部门扯皮与需求死线中艰难求生，体验职场压迫感并生成你的专属结算图鉴。

## ✨ 核心特性
- **四职岗位**: 包含 产品经理(PM)、运营(Ops)、研发(RD) 和 测试(QA) 多种打工体验。
- **大语言模型引擎**: 采用双重安全拦截的 LLM Agent 进行剧情渲染与发疯式自由对话评判。
- **生存雷达结算**: 附带 `recharts` 动态图表与趣味“职场诊断书”，支持一键生成海报分享。
- **全端自适应**: `Mobile-First` 丝滑组件，Framer Motion 手感交互赋能沉浸式体验。
- **离线残局兜底**: 突发断网或切屏也有本地缓存兜底与静默快照。

## 🚀 快速启动

### 前置要求
- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/local-development) (若需本地部署服务层)

### 前端本地运行
```bash
# 1. 安装依赖
npm install

# 2. 从示例创建环境变量配置
cp .env.example .env.local
# (填入你申请的 supabase 相关 key)

# 3. 启动开发服务器
npm run dev
```

## 📦 部署指南
本项目构建思路：前端托管至 **Vercel**，后端/代理大语言模型依托于 **Supabase (Edge Functions & Database)**。
1. **数据库层**：请通过 `supabase db push` 同步项目下 `supabase/migrations/` 内的记录表结构。
2. **边缘计算层**：通过 `supabase functions deploy chat-completion` 推送大语言代理脚本，并在后台设置对应模型渠道的环境变量。

## 📄 许可协议 (License)
本项目采用 [MIT License](LICENSE) 协议进行开源。

---
**作者**: Sakura
**邮箱**: jaysakura@163.com