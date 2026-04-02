# 服务层

## 目录结构

```
src/services/
├── api/                  # Anthropic API 客户端
├── analytics/            # 分析与特性开关
├── mcp/                  # MCP 协议客户端
├── oauth/                # OAuth 认证
├── compact/              # 会话压缩
├── lsp/                  # LSP 语言服务器
├── policyLimits/         # 企业策略限制
├── remoteManagedSettings/ # 远程托管设置
├── plugins/              # 插件管理
├── SessionMemory/        # 会话记忆
├── MagicDocs/            # 文档自动加载
├── settingsSync/         # 设置同步
├── skillSearch/          # 技能搜索
├── tips/                 # 提示系统
├── voice.ts              # 语音录制
├── voiceStreamSTT.ts     # 语音转文字
├── awaySummary.ts        # 离开摘要
├── claudeAiLimits.ts     # Claude.ai 限速
├── rateLimitMessages.ts  # 限速消息
├── tokenEstimation.ts    # Token 估算
└── vcr.ts                # HTTP 录制/回放（测试）
```

## API 服务 (`services/api/`)

### client.ts — API 客户端工厂

```typescript
export async function getAnthropicClient({
  source, model, signal, ...
}): Promise<Anthropic>
```

**支持的 Provider**:

| Provider | 认证方式 | 客户端类型 |
|----------|---------|-----------|
| firstParty | API Key / OAuth | `new Anthropic()` |
| bedrock | AWS IAM | `new AnthropicBedrock()` |
| vertex | Google Auth | `new AnthropicVertex()` |
| foundry | Azure Token | `new AnthropicFoundry()` |

**配置来源**: `ANTHROPIC_API_KEY`、`ANTHROPIC_BASE_URL`、OAuth tokens、AWS/GCP 凭证

### claude.ts — API 消息处理核心

```typescript
export function queryModelWithStreaming(config): AsyncGenerator<StreamEvent>
```

**核心功能**:
- 内部消息格式 → API 格式转换
- 流式响应处理（SSE）
- 工具调用检测与序列化
- Prompt caching 支持
- Token 统计（输入/输出/缓存命中）
- 重试逻辑（含 fallback 模型）

**数据流**:
```
messages → normalizeForAPI() → API 请求 → 流式响应
  → 解析 content blocks → 工具调用检测
  → 生成 StreamEvent → 返回给 QueryEngine
```

### errors.ts — API 错误处理

```typescript
export function categorizeRetryableAPIError(error): RetryCategory
```

**错误分类**:

| 类别 | 处理方式 |
|------|---------|
| `overloaded` | 指数退避重试 |
| `rate_limited` | 等待 + 重试 |
| `authentication` | 提示用户检查 key |
| `invalid_request` | 不重试，报错 |
| `network` | 重试 |
| `context_length` | 触发压缩 |

### logging.ts — API 日志记录

记录每次 API 调用的详细元数据：模型、Token 使用、缓存命中率、延迟等。

---

## 分析服务 (`services/analytics/`)

### index.ts — 事件队列

```typescript
export function logEvent(name: string, metadata?: Record<string, any>): void
export function attachAnalyticsSink(sink: AnalyticsSink): void
```

**设计**: 事件在 sink 附加前排队，避免导入循环。所有元数据字段需经 `AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS` 类型验证。

### growthbook.ts — 特性开关

```typescript
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(feature, default): T
export async function getFeatureValue_DEPRECATED<T>(feature, default): Promise<T>
export async function getDynamicConfig_BLOCKS_ON_INIT<T>(config, default): Promise<T>
```

**机制**:
- GrowthBook SDK 集成
- 用户属性：ID、deviceID、订阅类型、API provider
- 本地磁盘缓存 + 后台刷新（1 小时）
- 支持环境变量覆盖

---

## MCP 服务 (`services/mcp/`)

### client.ts — MCP 客户端

```typescript
export function initializeMcpClient(config): Promise<MCPClient>
export function callMcpTool(client, toolName, args): Promise<ToolResult>
export function listMcpResources(client): Promise<Resource[]>
```

**支持的传输类型**:

| 类型 | 协议 | 使用场景 |
|------|------|---------|
| `stdio` | 子进程 stdin/stdout | 本地 MCP 服务器 |
| `sse` | Server-Sent Events | 远程 MCP 服务器 |
| `http` | HTTP POST | Streamable HTTP |
| `ws` | WebSocket | 实时双向 |

**OAuth 支持**: XAA（跨应用访问）认证流程

**配置范围** (`ConfigScope`):
- `local` / `user` / `project` — 本地配置
- `enterprise` / `managed` — 企业管理
- `claudeai` — Claude.ai 内置连接器
- `dynamic` — SDK 动态注入

---

## OAuth 服务 (`services/oauth/`)

### client.ts — OAuth 流程

```typescript
export function buildAuthUrl(provider): string
export function exchangeAuthCode(code): Promise<OAuthTokenExchangeResponse>
export function refreshOAuthToken(refreshToken): Promise<OAuthTokens>
```

**支持**:
- Claude.ai OAuth（Pro/Max/Team/Enterprise）
- Console OAuth
- PKCE 认证码流程
- 本地回调服务器（`auth-code-listener.ts`）
- Token 自动刷新

### 核心类型

```typescript
type OAuthTokens = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

type SubscriptionType = 'free' | 'pro' | 'max' | 'team' | 'enterprise'
type RateLimitTier = 'standard' | 'high' | 'unlimited'
```

---

## 会话压缩 (`services/compact/`)

### compact.ts — 压缩引擎

```typescript
export function compactMessagesIfNeeded(messages, config): Promise<CompactionResult>
```

**压缩策略**:
- **autoCompact**: Token 超过阈值时自动触发
- **microCompact**: 轻量级增量压缩
- **sessionMemoryCompact**: 结合会话记忆的压缩

**压缩结果**:
```typescript
type CompactionResult = {
  messages: Message[]          // 压缩后的消息
  compactedCount: number       // 被压缩的消息数
  summaryTokens: number        // 摘要 token 数
  savedTokens: number          // 节省的 token 数
}
```

---

## LSP 服务 (`services/lsp/`)

### manager.ts — LSP 服务器管理

```typescript
export function initializeLspServerManager(): void
export function getLspServerManager(): LSPServerManager | null
```

**状态**: `not-started` → `pending` → `success` / `failed`

**功能**: 管理多个 LSP 服务器连接，聚合诊断信息，支持代码导航

---

## 策略限制 (`services/policyLimits/`)

```typescript
export function isPolicyAllowed(feature: string): boolean
export function waitForPolicyLimitsToLoad(): Promise<void>
```

**特性**:
- Console API Key 用户（全部）+ OAuth 用户（Team/Enterprise）
- 故障打开（non-blocking）
- ETag 缓存 + 后台轮询（1 小时）

---

## 远程托管设置 (`services/remoteManagedSettings/`)

```typescript
export function waitForRemoteManagedSettingsToLoad(): Promise<void>
```

**同步机制**:
- Checksum 验证最小化网络流量
- 文件缓存：`~/.claude/managed-settings.json`
- 支持插件允许列表、设置覆盖、安全检查

---

## 插件服务 (`services/plugins/`)

### pluginOperations.ts — 纯库函数

```typescript
export function installPlugin(spec): Promise<PluginResult>
export function uninstallPlugin(name): Promise<PluginResult>
export function updatePlugin(name): Promise<PluginResult>
export function enablePlugin(name): Promise<PluginResult>
export function disablePlugin(name): Promise<PluginResult>
```

**设计原则**: 不调用 `process.exit()`，不写控制台，返回结果对象。

---

## 其他服务

| 服务 | 文件 | 功能 |
|------|------|------|
| **claudeAiLimits** | claudeAiLimits.ts | Claude.ai 用户限速检查和警告 |
| **tokenEstimation** | tokenEstimation.ts | 消息 Token 计数估算 |
| **voice** | voice.ts | 麦克风录音（CPAL / SoX） |
| **voiceStreamSTT** | voiceStreamSTT.ts | 音频流语音转文字（OpenAI Whisper） |
| **SessionMemory** | SessionMemory/ | 会话记忆持久化 |
| **settingsSync** | settingsSync/ | 用户设置云同步 |
| **vcr** | vcr.ts | HTTP 录制/回放（测试用） |
