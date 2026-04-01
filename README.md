<div align="center">

# Open Claude Code

[![GitHub License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![GitHub Stars](https://img.shields.io/github/stars/delamain14/open-claude-code?style=social)](https://github.com/delamain14/open-claude-code)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20-green)](https://nodejs.org/)
[![Bun Runtime](https://img.shields.io/badge/runtime-bun-1abc9c)](https://bun.sh)
[![TypeScript](https://img.shields.io/badge/language-TypeScript-blue)](https://www.typescriptlang.org/)

**🚀 多 LLM Provider 支持 | 🤖 完整 Agent 工作流 | 🔧 本地可用功能 | 🌍 多语言支持**

基于 Anthropic Claude Code 的开源 fork，支持多种 LLM 提供商（OpenAI、DeepSeek、Qwen、Kimi、GLM、MiniMax 等），完整保留 Agent 工作流和工具调用能力。

[📖 完整文档](#完整文档) • [⚡ 快速开始](#快速开始) • [🌟 快速导航](#快速导航) • [🤝 贡献](#贡献)

</div>

## ✨ 主要特性

| 特性 | 说明 |
|------|------|
| 🔐 **API Key 认证** | 移除 OAuth，直接配置 API Key |
| 🌐 **多 Provider 支持** | OpenAI、DeepSeek、Qwen、Kimi、GLM、MiniMax 等 |
| 🔄 **运行时切换模型** | `/model` 和 `/login` 命令轻松切换 |
| 🌍 **环境变量自动检测** | 设置 `OPENAI_API_KEY` 等即可直接使用 |
| 🚀 **无外部依赖** | 所有功能本地可用，不依赖 Anthropic 后端 |
| 🔍 **Web 搜索支持** | 集成 Serper.dev，支持实时网络搜索 |
| 🤖 **完整 Agent 工作流** | 保留文件读写、代码执行、工具调用等能力 |

---

## 📖 完整文档

本项目拥有完备的在线文档，托管在 GitHub Pages 上，包含详细的安装指南、配置说明、API 文档等内容。

<div align="center">

### 🌐 [**访问完整文档** →](https://delamain14.github.io/open-claude-code/)

</div>

### 📚 文档包含

- 📖 **[快速开始](https://delamain14.github.io/open-claude-code/getting-started/)** — 5分钟快速上手指南
- ⚙️ **[配置指南](https://delamain14.github.io/open-claude-code/getting-started/configuration/)** — 详细的环境配置说明
- 🌐 **[多 Provider 支持](https://delamain14.github.io/open-claude-code/core/multi-provider/)** — 各个 LLM 提供商的配置方法
- 🤖 **[Agent 工作流](https://delamain14.github.io/open-claude-code/agents/)** — Agent 功能详解
- 🔧 **[高级配置](https://delamain14.github.io/open-claude-code/advanced/)** — 高级用法和最佳实践
- 📝 **[API 参考](https://delamain14.github.io/open-claude-code/api/)** — 完整的 API 文档
- 🏗️ **[架构设计](https://delamain14.github.io/open-claude-code/architecture/)** — 项目架构和设计理念

---

## 🚀 安装

### 前置要求

- **Node.js** >= 20 或 **Bun** >= 1.0
- **Git** 用于克隆仓库

### 安装步骤

```bash
# 1️⃣ 安装 Bun（如果未安装）
curl -fsSL https://bun.sh/install | bash

# 2️⃣ 克隆项目
git clone https://github.com/delamain14/open-claude-code.git
cd open-claude-code

# 3️⃣ 安装依赖
bun install

# 4️⃣ 运行
bun src/entrypoints/cli.tsx
```

## ⚡ 快速开始

### 📌 方式一：环境变量（推荐）

最简单的方式，适合快速体验：

```bash
# 选择一个提供商，设置对应的 API Key
export OPENAI_API_KEY=sk-xxx              # OpenAI
# export DEEPSEEK_API_KEY=sk-xxx          # DeepSeek
# export QWEN_API_KEY=sk-xxx              # Qwen（通义千问）
# export MOONSHOT_API_KEY=sk-xxx          # Kimi（Moonshot）
# export GLM_API_KEY=xxx                  # GLM（智谱）
# export MINIMAX_API_KEY=xxx              # MiniMax

# 运行
bun src/entrypoints/cli.tsx
```

**可选配置**（覆盖默认 Base URL 和模型）：

```bash
export OPENAI_BASE_URL=https://your-proxy.com/v1   # 自定义 API 地址
export OPENAI_MODEL=gpt-4o-mini                     # 自定义模型名称
```

### 💬 方式二：交互式登录

首次运行时会出现引导界面：

```bash
bun src/entrypoints/cli.tsx
# 按提示选择提供商并输入 API Key
# 后续可用 /login 命令添加更多提供商
```

### ⚙️ 方式三：配置文件

在以下位置创建 `.claude/settings.json`：

- **全局**：`~/.claude/settings.json` — 对所有项目生效
- **项目级**（优先级更高）：`.claude/settings.json` — 仅对当前项目生效

**配置示例**（以 DeepSeek 为例）：

```json
{
  "llm": {
    "providers": {
      "deepseek": {
        "sourceType": "openai",
        "apiKey": "${DEEPSEEK_API_KEY}",
        "baseUrl": "https://api.deepseek.com"
      }
    },
    "models": {
      "deepseek": {
        "provider": "deepseek",
        "modelId": "deepseek-chat"
      }
    },
    "defaultModel": "deepseek"
  }
}
```

> 💡 **提示**：`apiKey` 支持 `${ENV_VAR}` 语法引用环境变量，避免明文存储密钥。

## 🌐 支持的提供商

| 提供商 | 环境变量 | 默认模型 | 工具调用 | 文档 |
|--------|---------|---------|---------|------|
| Anthropic | `ANTHROPIC_API_KEY` | `claude-sonnet-4-6` | ✅ | [官网](https://www.anthropic.com) |
| OpenAI | `OPENAI_API_KEY` | `gpt-4o` | ✅ | [官网](https://platform.openai.com) |
| DeepSeek | `DEEPSEEK_API_KEY` | `deepseek-chat` | ✅ | [官网](https://www.deepseek.com) |
| Qwen | `QWEN_API_KEY` | `qwen-plus` | ✅ | [官网](https://www.aliyun.com/product/alidns) |
| MiniMax | `MINIMAX_API_KEY` | `MiniMax-M1` | ✅ | [官网](https://www.minimaxi.com) |
| Kimi | `MOONSHOT_API_KEY` | `moonshot-v1-auto` | ✅ | [官网](https://kimi.moonshot.cn) |
| GLM | `GLM_API_KEY` | `glm-4-plus` | ✅ | [官网](https://open.bigmodel.cn) |

所有 OpenAI 兼容提供商均支持完整的 Agent 工作流（文件读写、代码执行、搜索等工具调用）。

📚 **详细配置文档**：[docs/MULTI_PROVIDER.md](docs/MULTI_PROVIDER.md)

## 🎯 运行方式

### 交互模式（TUI - 推荐）

长期对话、调试代码的最佳选择：

```bash
bun src/entrypoints/cli.tsx
```

### 非交互模式（一次性问答）

快速查询，输出结果到 stdout：

```bash
bun src/entrypoints/cli.tsx -p "你的问题"
```

### 常用命令选项

```bash
# 禁用 thinking（某些模型如 MiniMax、OpenAI 兼容模型可能需要）
bun src/entrypoints/cli.tsx --thinking disabled

# 组合使用
bun src/entrypoints/cli.tsx -p --thinking disabled "你的问题"

# 查看所有选项
bun src/entrypoints/cli.tsx --help
```

### 交互模式快速命令

运行交互模式后，在提示符处输入：

```
/login          # 添加新的 Provider 或切换登录信息
/model          # 切换 LLM 模型
/help           # 查看帮助信息
```

> 💡 首次运行时会弹出 API Key 确认框，按 `↑` 选择 **Yes** 后按 `Enter` 确认即可。

## 🔍 配置网络搜索（Serper.dev）

启用 Google 搜索功能，让 AI 获取实时信息：

```bash
export SERPER_API_KEY=your-serper-api-key
```

设置后模型在需要搜索时会自动调用 Serper.dev。支持以下搜索参数：

| 参数 | 说明 | 示例 |
|------|------|------|
| `q` | 搜索关键词 | `apple inc` |
| `gl` | 地区代码 | `cn`、`us`、`jp` |
| `hl` | 语言 | `zh-cn`、`en`、`ja` |
| `tbs` | 时间过滤 | `qdr:h`（1小时）、`qdr:d`（1天）、`qdr:w`（1周）、`qdr:m`（1月）、`qdr:y`（1年） |
| `page` | 分页 | `1`、`2`、`3` |

## 🔄 切换模型

### 方式一：运行时切换（推荐）

在交互模式中输入 `/model` 命令：

```
输入命令: /model
```

上下箭头选择模型 → 按 `Enter` 确认。选择立即生效，仅对当前会话有效。

### 方式二：编辑配置文件

修改 `~/.claude/settings.json` 中的 `defaultModel` 字段：

```json
{
  "llm": {
    "providers": {
      "openai": {
        "sourceType": "openai",
        "apiKey": "${OPENAI_API_KEY}",
        "baseUrl": "https://api.openai.com/v1"
      }
    },
    "models": {
      "openai": {
        "provider": "openai",
        "modelId": "gpt-4o-mini"
      }
    },
    "defaultModel": "openai"
  }
}
```

### 高级：配置多个模型

在同一个 provider 下配置多个模型，通过修改 `defaultModel` 快速切换：

```json
{
  "llm": {
    "providers": {
      "deepseek": {
        "sourceType": "openai",
        "apiKey": "${DEEPSEEK_API_KEY}",
        "baseUrl": "https://api.deepseek.com"
      }
    },
    "models": {
      "deepseek-chat": {
        "provider": "deepseek",
        "modelId": "deepseek-chat"
      },
      "deepseek-coder": {
        "provider": "deepseek",
        "modelId": "deepseek-coder"
      },
      "deepseek-reasoner": {
        "provider": "deepseek",
        "modelId": "deepseek-reasoner"
      }
    },
    "defaultModel": "deepseek-chat"
  }
}
```

配置多个模型后，`/model` 命令会列出所有已配置的模型供快速选择。

---

## 📋 配置优先级

配置项的优先级顺序（从低到高）：

```
环境变量（最低）
   ↓
~/.claude/settings.json（全局配置）
   ↓
.claude/settings.json（项目级配置，最高）
```

## 🔧 MiniMax 配置指南

MiniMax 提供两种兼容模式，选择一种即可：

### ✨ 方式一：OpenAI 兼容模式（推荐）

支持完整的 Agent 工作流和工具调用：

```bash
export MINIMAX_API_KEY=your-minimax-api-key
export MINIMAX_BASE_URL=https://api.minimax.chat/v1  # 可选，这是默认值
export MINIMAX_MODEL=MiniMax-M1                      # 可选，默认为 MiniMax-M1
```

### 🔗 方式二：Anthropic 兼容模式

MiniMax 也提供 Anthropic 兼容 API：

```bash
export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
export ANTHROPIC_API_KEY=your-minimax-api-key
export ANTHROPIC_MODEL=MiniMax-M2.7-highspeed
export DISABLE_INTERLEAVED_THINKING=1
```

| 环境变量 | 说明 |
|---------|------|
| `ANTHROPIC_BASE_URL` | MiniMax 的 Anthropic 兼容 API 地址 |
| `ANTHROPIC_API_KEY` | MiniMax 平台的 API Key |
| `ANTHROPIC_MODEL` | 模型名称（使用 `MiniMax-M2.7-highspeed`） |
| `DISABLE_INTERLEAVED_THINKING` | 设为 `1`（MiniMax 不完全支持 interleaved thinking） |

## 📝 环境变量完整示例

将以下内容添加到 `~/.bashrc` 或 `~/.zshrc`：

```bash
# ===== LLM 提供商配置（任选一个） =====

# --- OpenAI ---
export OPENAI_API_KEY=your-api-key
# export OPENAI_BASE_URL=https://your-proxy.com/v1   # 可选
# export OPENAI_MODEL=gpt-4o                          # 可选

# --- DeepSeek ---
# export DEEPSEEK_API_KEY=your-api-key

# --- MiniMax（OpenAI 兼容模式） ---
# export MINIMAX_API_KEY=your-api-key

# --- MiniMax（Anthropic 兼容模式） ---
# export ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
# export ANTHROPIC_API_KEY=your-minimax-api-key
# export ANTHROPIC_MODEL=MiniMax-M2.7-highspeed
# export DISABLE_INTERLEAVED_THINKING=1

# ===== 可选服务 =====

# 网络搜索
export SERPER_API_KEY=your-serper-api-key
```

然后运行：

```bash
source ~/.bashrc
cd open-claude-code
bun src/entrypoints/cli.tsx
```

## 🧪 运行测试

```bash
bun test
```

---

## 🌟 快速导航

- 🚀 [GitHub 仓库](https://github.com/delamain14/open-claude-code)
- 📖 [在线文档](https://delamain14.github.io/open-claude-code/)
- 🐛 [报告 Issue](https://github.com/delamain14/open-claude-code/issues)
- 💬 [讨论和建议](https://github.com/delamain14/open-claude-code/discussions)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！请查看我们的[贡献指南](https://delamain14.github.io/open-claude-code/development/)了解更多信息。

## 📄 许可证

本项目仅供学习研究用途。Claude Code 的所有权利归 [Anthropic](https://www.anthropic.com/) 所有。