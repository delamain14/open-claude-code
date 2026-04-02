# Service Layer

## Directory Structure

```
src/services/
├── api/                  # Anthropic API client
├── analytics/            # Analytics and feature flags
├── mcp/                  # MCP protocol client
├── oauth/                # OAuth authentication
├── compact/              # Session compaction
├── lsp/                  # LSP language server
├── policyLimits/         # Enterprise policy limits
├── remoteManagedSettings/ # Remote managed settings
├── plugins/              # Plugin management
├── SessionMemory/        # Session memory
├── MagicDocs/            # Document auto-loading
├── settingsSync/         # Settings synchronization
├── skillSearch/          # Skill search
├── tips/                 # Tips system
├── voice.ts              # Voice recording
├── voiceStreamSTT.ts     # Voice-to-text
├── awaySummary.ts        # Away summary
├── claudeAiLimits.ts     # Claude.ai rate limits
├── rateLimitMessages.ts  # Rate limit messages
├── tokenEstimation.ts    # Token estimation
└── vcr.ts                # HTTP record/replay (testing)
```

## API Service (`services/api/`)

### client.ts — API Client Factory

```typescript
export async function getAnthropicClient({
  source, model, signal, ...
}): Promise<Anthropic>
```

**Supported Providers**:

| Provider | Authentication | Client Type |
|----------|---------------|-------------|
| firstParty | API Key / OAuth | `new Anthropic()` |
| bedrock | AWS IAM | `new AnthropicBedrock()` |
| vertex | Google Auth | `new AnthropicVertex()` |
| foundry | Azure Token | `new AnthropicFoundry()` |

**Configuration Source**: `ANTHROPIC_API_KEY`, `ANTHROPIC_BASE_URL`, OAuth tokens, AWS/GCP credentials

### claude.ts — API Message Processing Core

```typescript
export function queryModelWithStreaming(config): AsyncGenerator<StreamEvent>
```

**Core Features**:
- Internal message format → API format conversion
- Streaming response handling (SSE)
- Tool call detection and serialization
- Prompt caching support
- Token statistics (input/output/cache hits)
- Retry logic (with fallback model)

**Data Flow**:
```
messages → normalizeForAPI() → API request → Streaming response
  → Parse content blocks → Tool call detection
  → Generate StreamEvent → Return to QueryEngine
```

### errors.ts — API Error Handling

```typescript
export function categorizeRetryableAPIError(error): RetryCategory
```

**Error Categories**:

| Category | Handling |
|----------|----------|
| `overloaded` | Exponential backoff retry |
| `rate_limited` | Wait + retry |
| `authentication` | Prompt user to check key |
| `invalid_request` | No retry, report error |
| `network` | Retry |
| `context_length` | Trigger compaction |

### logging.ts — API Logging

Records detailed metadata for each API call: model, token usage, cache hit rate, latency, etc.

---

## Analytics Service (`services/analytics/`)

### index.ts — Event Queue

```typescript
export function logEvent(name: string, metadata?: Record<string, any>): void
export function attachAnalyticsSink(sink: AnalyticsSink): void
```

**Design**: Events are queued before sink attachment to avoid import cycles. All metadata fields require `AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS` type validation.

### growthbook.ts — Feature Flags

```typescript
export function getFeatureValue_CACHED_MAY_BE_STALE<T>(feature, default): T
export async function getFeatureValue_DEPRECATED<T>(feature, default): Promise<T>
export async function getDynamicConfig_BLOCKS_ON_INIT<T>(config, default): Promise<T>
```

**Mechanism**:
- GrowthBook SDK integration
- User attributes: ID, deviceID, subscription type, API provider
- Local disk cache + background refresh (1 hour)
- Environment variable override support

---

## MCP Service (`services/mcp/`)

### client.ts — MCP Client

```typescript
export function initializeMcpClient(config): Promise<MCPClient>
export function callMcpTool(client, toolName, args): Promise<ToolResult>
export function listMcpResources(client): Promise<Resource[]>
```

**Supported Transport Types**:

| Type | Protocol | Use Case |
|------|----------|----------|
| `stdio` | Child process stdin/stdout | Local MCP server |
| `sse` | Server-Sent Events | Remote MCP server |
| `http` | HTTP POST | Streamable HTTP |
| `ws` | WebSocket | Real-time bidirectional |

**OAuth Support**: XAA (Cross-Application Access) authentication flow

**Configuration Scope** (`ConfigScope`):
- `local` / `user` / `project` — Local configuration
- `enterprise` / `managed` — Enterprise management
- `claudeai` — Claude.ai built-in connectors
- `dynamic` — SDK dynamic injection

---

## OAuth Service (`services/oauth/`)

### client.ts — OAuth Flow

```typescript
export function buildAuthUrl(provider): string
export function exchangeAuthCode(code): Promise<OAuthTokenExchangeResponse>
export function refreshOAuthToken(refreshToken): Promise<OAuthTokens>
```

**Support**:
- Claude.ai OAuth (Pro/Max/Team/Enterprise)
- Console OAuth
- PKCE authorization code flow
- Local callback server (`auth-code-listener.ts`)
- Automatic token refresh

### Core Types

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

## Session Compaction (`services/compact/`)

### compact.ts — Compaction Engine

```typescript
export function compactMessagesIfNeeded(messages, config): Promise<CompactionResult>
```

**Compaction Strategies**:
- **autoCompact**: Automatically triggered when tokens exceed threshold
- **microCompact**: Lightweight incremental compaction
- **sessionMemoryCompact**: Compaction combined with session memory

**Compaction Result**:
```typescript
type CompactionResult = {
  messages: Message[]          // Compacted messages
  compactedCount: number       // Number of messages compacted
  summaryTokens: number        // Summary token count
  savedTokens: number          // Tokens saved
}
```

---

## LSP Service (`services/lsp/`)

### manager.ts — LSP Server Management

```typescript
export function initializeLspServerManager(): void
export function getLspServerManager(): LSPServerManager | null
```

**States**: `not-started` → `pending` → `success` / `failed`

**Features**: Manages multiple LSP server connections, aggregates diagnostic information, supports code navigation

---

## Policy Limits (`services/policyLimits/`)

```typescript
export function isPolicyAllowed(feature: string): boolean
export function waitForPolicyLimitsToLoad(): Promise<void>
```

**Features**:
- Console API Key users (all) + OAuth users (Team/Enterprise)
- Fail-open (non-blocking)
- ETag caching + background polling (1 hour)

---

## Remote Managed Settings (`services/remoteManagedSettings/`)

```typescript
export function waitForRemoteManagedSettingsToLoad(): Promise<void>
```

**Sync Mechanism**:
- Checksum verification minimizes network traffic
- File cache: `~/.claude/managed-settings.json`
- Supports plugin allow list, setting overrides, security checks

---

## Plugin Service (`services/plugins/`)

### pluginOperations.ts — Pure Library Functions

```typescript
export function installPlugin(spec): Promise<PluginResult>
export function uninstallPlugin(name): Promise<PluginResult>
export function updatePlugin(name): Promise<PluginResult>
export function enablePlugin(name): Promise<PluginResult>
export function disablePlugin(name): Promise<PluginResult>
```

**Design Principles**: No `process.exit()` calls, no console writes, returns result objects.

---

## Other Services

| Service | File | Function |
|---------|------|----------|
| **claudeAiLimits** | claudeAiLimits.ts | Claude.ai user rate limit checks and warnings |
| **tokenEstimation** | tokenEstimation.ts | Message token count estimation |
| **voice** | voice.ts | Microphone recording (CPAL / SoX) |
| **voiceStreamSTT** | voiceStreamSTT.ts | Audio stream voice-to-text (OpenAI Whisper) |
| **SessionMemory** | SessionMemory/ | Session memory persistence |
| **settingsSync** | settingsSync/ | User settings cloud sync |
| **vcr** | vcr.ts | HTTP record/replay (testing) |
