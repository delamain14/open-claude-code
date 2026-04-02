# Multi-Provider LLM Support

Open Claude Code supports multiple LLM providers, not limited to Anthropic Claude, but also including OpenAI, DeepSeek, Qwen, Kimi, GLM, MiniMax, OpenRouter, and other OpenAI-compatible providers.

## Architecture Overview

```
                         ┌─────────────────────────────────────┐
                         │         Agent Loop (query.ts)       │
                         │   tool_use / tool_result (Anthropic)│
                         └──────────────┬──────────────────────┘
                                        │
                         ┌──────────────▼──────────────────────┐
                         │  queryModelWithStreaming (claude.ts)│
                         └──┬───────────────────────────────┬──┘
                            │                               │
              ┌─────────────▼──────────┐     ┌──────────────▼──────────┐
              │   Anthropic API Path   │     │   OpenAI-Compatible Path│
              │  (Native Claude format)│     │   (openaiQuery.ts)      │
              │                        │     │                         │
              │  tool_use blocks       │     │  Anthropic ↔ OpenAI     │
              │  input_json_delta      │     │  Format conversion      │
              │  tool_result blocks    │     │                         │
              └────────────────────────┘     └─────────────────────────┘
                                                        │
                                    ┌───────────────────┼───────────────┐
                                    │                   │               │
                               ┌────▼───┐         ┌─────▼──┐      ┌─────▼──┐
                               │ OpenAI │         │DeepSeek│      │  Qwen  │ ...
                               └────────┘         └────────┘      └────────┘
```

Core Design Principle: **Format translation is done in the OpenAI path, the upper-layer agent loop requires no changes**.

## Configuration Methods

Three configuration methods are supported (priority from low to high):

### Method 1: Environment Variables (Simplest)

Set the corresponding provider's API Key environment variable, no need for `/login` or editing configuration files:

```bash
# OpenAI
export OPENAI_API_KEY=sk-xxx
export OPENAI_MODEL=gpt-4o          # Optional, default gpt-4o
export OPENAI_BASE_URL=https://...  # Optional, default https://api.openai.com/v1

# DeepSeek
export DEEPSEEK_API_KEY=sk-xxx
export DEEPSEEK_MODEL=deepseek-chat  # Optional

# Qwen
export QWEN_API_KEY=sk-xxx
export QWEN_MODEL=qwen-plus          # Optional

# MiniMax
export MINIMAX_API_KEY=xxx
export MINIMAX_MODEL=MiniMax-M1      # Optional

# Kimi (Moonshot)
export MOONSHOT_API_KEY=sk-xxx
export MOONSHOT_MODEL=moonshot-v1-auto  # Optional

# GLM
export GLM_API_KEY=xxx
export GLM_MODEL=glm-4-plus          # Optional
```

After setting, run directly and providers will be automatically detected and registered. If multiple provider keys are set simultaneously, the first one detected becomes the default.

### Method 2: Interactive Login (`/login`)

After running, use the `/login` command in the interactive interface:

1. Select Provider (use arrow keys, confirm with Enter)
2. Enter API Key
3. Confirm Base URL (press Enter to use default)
4. Confirm Model ID (press Enter to use default)

Configuration is saved to `~/.claude/settings.json`.

### Method 3: Manual Edit of `~/.claude/settings.json`

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

Supports `${ENV_VAR}` syntax to reference environment variables:

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

### Configuration Priority

```
Environment Variables (lowest) → ~/.claude/settings.json → .claude/settings.json (project-level, highest)
```

## Supported Providers

| Provider | sourceType | Default Base URL | Default Model | Environment Variable |
|----------|-----------|------------------|---------------|---------------------|
| Anthropic | `anthropic` | `https://api.anthropic.com` | `claude-sonnet-4-6` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `https://api.openai.com/v1` | `gpt-4o` | `OPENAI_API_KEY` |
| DeepSeek | `openai` | `https://api.deepseek.com` | `deepseek-chat` | `DEEPSEEK_API_KEY` |
| MiniMax | `openai` | `https://api.minimax.chat/v1` | `MiniMax-M1` | `MINIMAX_API_KEY` |
| Qwen | `openai` | `https://dashscope.aliyuncs.com/compatible-mode/v1` | `qwen-plus` | `QWEN_API_KEY` |
| Kimi | `openai` | `https://api.moonshot.cn/v1` | `moonshot-v1-auto` | `MOONSHOT_API_KEY` |
| GLM | `openai` | `https://open.bigmodel.cn/api/paas/v4/` | `glm-4-plus` | `GLM_API_KEY` |
| AWS Bedrock | `bedrock` | — | — | Via AWS credentials |
| Google Vertex | `vertex` | — | — | Via GCP credentials |
| Azure | `azure` | — | — | Via Azure credentials |

## Feature Support Matrix

| Feature | Anthropic | OpenAI Compatible |
|---------|-----------|-------------------|
| Text Conversation | ✅ | ✅ |
| Streaming Output | ✅ | ✅ |
| Tool Calling (Function Calling) | ✅ | ✅ |
| Multi-turn Tool Calling | ✅ | ✅ |
| Agent Workflow | ✅ | ✅ |
| `/model` Model Switching | ✅ | ✅ |
| Thinking / Extended Thinking | ✅ | ❌ |
| 1M Context | ✅ | ❌ |
| Fast Mode | ✅ | ❌ |
| Effort Level | ✅ | ❌ |
| Prompt Caching | ✅ | ❌ |

## Tool Calling Implementation Details

Tool calling for OpenAI-compatible providers is implemented through format conversion, transparent to the upper-layer agent loop:

### Request Direction (Anthropic → OpenAI)

| Anthropic Format | OpenAI Format |
|------------------|---------------|
| `BetaToolUnion { name, description, input_schema }` | `{ type: "function", function: { name, description, parameters } }` |
| `tool_use` blocks in assistant messages | `tool_calls` array in assistant messages |
| `tool_result` blocks in user messages | `role: "tool"` messages |

### Response Direction (OpenAI → Anthropic)

| OpenAI Format | Anthropic Format |
|--------------|------------------|
| `delta.tool_calls[].function` | `content_block_start { type: "tool_use", id, name }` |
| `delta.tool_calls[].function.arguments` (streaming) | `content_block_delta { type: "input_json_delta", partial_json }` |
| `finish_reason: "tool_calls"` | `stop_reason: "tool_use"` |

## Key Files

| File | Description |
|------|-------------|
| `src/services/llm/types.ts` | Provider / Model configuration Schema |
| `src/services/llm/registry.ts` | Provider registration and management |
| `src/services/llm/configLoader.ts` | Configuration loading, environment variable detection, deep merge |
| `src/services/llm/index.ts` | Global singleton Registry |
| `src/services/llm/providers/openai.ts` | OpenAI-compatible provider implementation + types |
| `src/services/api/openaiQuery.ts` | OpenAI query path + bidirectional tool format conversion |
| `src/services/api/claude.ts` | Main query entry, OpenAI path interception |
| `src/components/ConsoleOAuthFlow.tsx` | `/login` interactive configuration |
| `src/utils/model/modelOptions.ts` | `/model` selector adaptation |
| `src/hooks/useApiKeyVerification.ts` | Login status detection |
