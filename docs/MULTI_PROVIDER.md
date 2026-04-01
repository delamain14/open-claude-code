# Multi-Provider LLM Support

Open Claude Code 支持多种 LLM 提供商，不仅限于 Anthropic Claude，还包括 OpenAI、DeepSeek、Qwen、Kimi、GLM、MiniMax 等 OpenAI 兼容的提供商。

## 架构概览

```
                         ┌─────────────────────────────────────┐
                         │         Agent Loop (query.ts)        │
                         │   tool_use / tool_result (Anthropic) │
                         └──────────────┬──────────────────────┘
                                        │
                         ┌──────────────▼──────────────────────┐
                         │    queryModelWithStreaming (claude.ts)│
                         └──┬───────────────────────────────┬──┘
                            │                               │
              ┌─────────────▼──────────┐     ┌──────────────▼──────────┐
              │   Anthropic API Path   │     │   OpenAI-Compatible Path │
              │   (原生 Claude 格式)    │     │   (openaiQuery.ts)       │
              │                        │     │                          │
              │  tool_use blocks       │     │  Anthropic ↔ OpenAI      │
              │  input_json_delta      │     │  双向格式转换              │
              │  tool_result blocks    │     │                          │
              └────────────────────────┘     └──────────────────────────┘
                                                        │
                                    ┌───────────────────┼───────────────┐
                                    │                   │               │
                               ┌────▼───┐        ┌─────▼──┐     ┌─────▼──┐
                               │ OpenAI  │        │DeepSeek│     │  Qwen  │ ...
                               └────────┘        └────────┘     └────────┘
```

核心设计原则：**在 OpenAI 路径做格式翻译，上层 agent loop 完全不需要改动**。

## 配置方式

支持三种配置方式（优先级从低到高）：

### 方式一：环境变量（最简单）

设置对应提供商的 API Key 环境变量即可，无需 `/login` 或编辑配置文件：

```bash
# OpenAI
export OPENAI_API_KEY=sk-xxx
export OPENAI_MODEL=gpt-4o          # 可选，默认 gpt-4o
export OPENAI_BASE_URL=https://...  # 可选，默认 https://api.openai.com/v1

# DeepSeek
export DEEPSEEK_API_KEY=sk-xxx
export DEEPSEEK_MODEL=deepseek-chat  # 可选

# Qwen (通义千问)
export QWEN_API_KEY=sk-xxx
export QWEN_MODEL=qwen-plus          # 可选

# MiniMax
export MINIMAX_API_KEY=xxx
export MINIMAX_MODEL=MiniMax-M1      # 可选

# Kimi (Moonshot)
export MOONSHOT_API_KEY=sk-xxx
export MOONSHOT_MODEL=moonshot-v1-auto  # 可选

# GLM (智谱)
export GLM_API_KEY=xxx
export GLM_MODEL=glm-4-plus          # 可选
```

设置后直接运行，自动检测并注册提供商。如果同时设置了多个提供商的 Key，第一个检测到的作为默认。

### 方式二：交互式登录 (`/login`)

运行后在交互界面中使用 `/login` 命令：

1. 选择 Provider（上下箭头选择，Enter 确认）
2. 输入 API Key
3. 确认 Base URL（回车使用默认值）
4. 确认 Model ID（回车使用默认值）

配置保存到 `~/.claude/settings.json`。

### 方式三：手动编辑 `~/.claude/settings.json`

```json
{
  "llm": {
    "providers": {
      "openai": {
        "sourceType": "openai",
        "apiKey": "sk-xxx",
        "baseUrl": "https://api.openai.com/v1"
      }
    },
    "models": {
      "openai": {
        "provider": "openai",
        "modelId": "gpt-4o"
      }
    },
    "defaultModel": "openai"
  }
}
```

支持 `${ENV_VAR}` 语法引用环境变量：

```json
{
  "llm": {
    "providers": {
      "openai": {
        "sourceType": "openai",
        "apiKey": "${OPENAI_API_KEY}",
        "baseUrl": "https://api.openai.com/v1"
      }
    }
  }
}
```

### 配置优先级

```
环境变量（最低） → ~/.claude/settings.json → .claude/settings.json（项目级，最高）
```

## 支持的提供商

| 提供商 | sourceType | 默认 Base URL | 默认模型 | 环境变量 |
|--------|-----------|---------------|---------|----------|
| Anthropic | `anthropic` | `https://api.anthropic.com` | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `https://api.openai.com/v1` | `gpt-4o` | `OPENAI_API_KEY` |
| DeepSeek | `openai` | `https://api.deepseek.com` | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| MiniMax | `openai` | `https://api.minimax.chat/v1` | `MiniMax-M1` | `MINIMAX_API_KEY` |
| Qwen | `openai` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | `QWEN_API_KEY` |
| Kimi | `openai` | `https://api.moonshot.cn/v1` | `moonshot-v1-auto` | `MOONSHOT_API_KEY` |
| GLM | `openai` | `https://open.bigmodel.cn/api/paas/v4/` | `glm-4-plus` | `GLM_API_KEY` |
| AWS Bedrock | `bedrock` | — | — | 通过 AWS 凭证 |
| Google Vertex | `vertex` | — | — | 通过 GCP 凭证 |
| Azure | `azure` | — | — | 通过 Azure 凭证 |

## 功能支持矩阵

| 功能 | Anthropic | OpenAI 兼容 |
|------|-----------|-------------|
| 文本对话 | ✅ | ✅ |
| 流式输出 | ✅ | ✅ |
| 工具调用 (Function Calling) | ✅ | ✅ |
| 多轮工具调用 | ✅ | ✅ |
| Agent 工作流 | ✅ | ✅ |
| `/model` 模型切换 | ✅ | ✅ |
| Thinking / Extended Thinking | ✅ | ❌ |
| 1M 上下文 | ✅ | ❌ |
| Fast Mode | ✅ | ❌ |
| Effort 级别 | ✅ | ❌ |
| Prompt Caching | ✅ | ❌ |

## 工具调用实现细节

OpenAI 兼容提供商的工具调用通过格式转换实现，上层 agent loop 无感知：

### 请求方向（Anthropic → OpenAI）

| Anthropic 格式 | OpenAI 格式 |
|----------------|-------------|
| `BetaToolUnion { name, description, input_schema }` | `{ type: "function", function: { name, description, parameters } }` |
| assistant 消息中的 `tool_use` 块 | assistant 消息的 `tool_calls` 数组 |
| user 消息中的 `tool_result` 块 | `role: "tool"` 消息 |

### 响应方向（OpenAI → Anthropic）

| OpenAI 格式 | Anthropic 格式 |
|-------------|----------------|
| `delta.tool_calls[].function` | `content_block_start { type: "tool_use", id, name }` |
| `delta.tool_calls[].function.arguments` (流式) | `content_block_delta { type: "input_json_delta", partial_json }` |
| `finish_reason: "tool_calls"` | `stop_reason: "tool_use"` |

## 关键文件

| 文件 | 说明 |
|------|------|
| `src/services/llm/types.ts` | Provider / Model 配置 Schema |
| `src/services/llm/registry.ts` | Provider 注册与管理 |
| `src/services/llm/configLoader.ts` | 配置加载、环境变量检测、深度合并 |
| `src/services/llm/index.ts` | 全局单例 Registry |
| `src/services/llm/providers/openai.ts` | OpenAI 兼容提供商实现 + 类型 |
| `src/services/api/openaiQuery.ts` | OpenAI 查询路径 + 工具格式双向转换 |
| `src/services/api/claude.ts` | 主查询入口，OpenAI 路径拦截 |
| `src/components/ConsoleOAuthFlow.tsx` | `/login` 交互式配置 |
| `src/utils/model/modelOptions.ts` | `/model` 选择器适配 |
| `src/hooks/useApiKeyVerification.ts` | 登录状态检测 |
