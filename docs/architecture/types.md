# 核心数据结构与类型定义

## Message — 消息类型体系

```typescript
// 顶层联合类型
type Message =
  | UserMessage
  | AssistantMessage
  | AttachmentMessage
  | ProgressMessage<any>
  | SystemMessage

// ---------- 用户消息 ----------
type UserMessage = {
  type: 'user'
  content: ContentBlockParam[]
  origin?: MessageOrigin        // 'user' | 'tool_result' | 'hook' | ...
  permissionMode?: PermissionMode
  summarizeMetadata?: CompactMetadata
  isMeta?: boolean              // 对模型可见但 UI 隐藏
  isVirtual?: boolean
}

// ---------- 助手消息 ----------
type AssistantMessage = {
  type: 'assistant'
  message: BetaMessage          // Anthropic SDK 原始响应
  requestId?: string
  apiError?: SDKAssistantMessageError
  isVirtual?: boolean
  costUSD?: number
  durationMs?: number
}

// ---------- 系统消息（15 种子类型）----------
type SystemMessage = {
  type: 'system'
  subtype:
    | 'informational'           // 一般通知
    | 'permission_retry'        // 权限重试
    | 'bridge_status'           // Bridge 状态
    | 'scheduled_task_fire'     // 定时任务触发
    | 'stop_hook_summary'       // 停止钩子摘要
    | 'turn_duration'           // 轮次耗时
    | 'away_summary'            // 离开摘要
    | 'memory_saved'            // 记忆保存
    | 'agents_killed'           // Agent 终止
    | 'api_metrics'             // API 指标
    | 'local_command'           // 本地命令结果
    | 'compact_boundary'        // 压缩边界
    | 'microcompact_boundary'   // 微压缩边界
    | 'api_error'               // API 错误
    | 'thinking'                // 思考消息
    | 'file_snapshot'           // 文件快照
  level?: 'info' | 'warning' | 'error'
  content: string
}

// ---------- 附件消息 ----------
type AttachmentMessage = {
  type: 'attachment'
  attachment: Attachment        // 文件、目录、钩子上下文等
}

// ---------- 进度消息 ----------
type ProgressMessage<P> = {
  type: 'progress'
  toolUseID: string
  data: P                       // 工具特定的进度数据
}
```

### 规范化消息（UI 渲染用）

```typescript
// 每个 content block 一个消息
type NormalizedAssistantMessage<C> = {
  type: 'assistant'
  content: C                    // 单个 content block
  message: BetaMessage
  costUSD?: number
}

type NormalizedMessage =
  | NormalizedAssistantMessage<TextBlock>
  | NormalizedAssistantMessage<ThinkingBlock>
  | NormalizedAssistantMessage<ToolUseBlock>
  | NormalizedUserMessage
  | SystemMessage
  | AttachmentMessage
```

## Command — 命令类型

```typescript
type CommandBase = {
  name: string
  description: string
  aliases?: string[]
  isHidden?: boolean
  isEnabled?: () => boolean
  availability?: ('claude-ai' | 'console')[]
  whenToUse?: string            // 模型调用时的场景描述
  disableModelInvocation?: boolean
  userInvocable?: boolean
  loadedFrom?: 'commands_DEPRECATED' | 'skills' | 'plugin' | 'managed' | 'bundled' | 'mcp'
  kind?: 'workflow'
  immediate?: boolean           // 跳过排队，立即执行
  isSensitive?: boolean         // 参数脱敏
}

type Command = CommandBase & (PromptCommand | LocalCommand | LocalJSXCommand)
```

## Tool 相关类型

### ToolPermissionContext — 权限上下文

```typescript
type ToolPermissionContext = DeepImmutable<{
  mode: PermissionMode
  additionalWorkingDirectories: Map<string, AdditionalWorkingDirectory>
  alwaysAllowRules: ToolPermissionRulesBySource
  alwaysDenyRules: ToolPermissionRulesBySource
  alwaysAskRules: ToolPermissionRulesBySource
  isBypassPermissionsModeAvailable: boolean
  isAutoModeAvailable?: boolean
  shouldAvoidPermissionPrompts?: boolean
}>

type PermissionMode =
  | 'default'
  | 'plan'              // 只读操作自动通过
  | 'acceptEdits'       // 编辑操作自动通过
  | 'bypassPermissions' // 跳过所有权限检查
  | 'auto'              // 自动模式（分类器判断）
```

### ToolProgressData — 工具进度

```typescript
type ToolProgressData =
  | BashProgress          // { type: 'bash', output: string }
  | ShellProgress
  | AgentToolProgress     // { type: 'agent', message: string }
  | MCPProgress           // { type: 'mcp', status: string }
  | WebSearchProgress     // { type: 'query_update' | 'search_results_received' }
  | REPLToolProgress
  | SkillToolProgress
  | TaskOutputProgress
```

## Task — 任务类型

```typescript
type TaskType =
  | 'local_bash'
  | 'local_agent'
  | 'remote_agent'
  | 'in_process_teammate'
  | 'local_workflow'
  | 'monitor_mcp'
  | 'dream'

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'killed'

type TaskStateBase = {
  id: string               // 前缀+8字符（b=bash, a=agent, r=remote...）
  type: TaskType
  status: TaskStatus
  description: string
  startTime: number
  endTime?: number
  outputFile: string
  outputOffset: number
  notified: boolean
}
```

## AppState — 应用状态

```typescript
type AppState = {
  messages: Message[]
  toolPermissionContext: ToolPermissionContext
  mcp: {
    clients: MCPServerConnection[]
    tools: MCPTool[]
    commands: Command[]
    resources: Record<string, ServerResource>
  }
  tasks: Record<string, TaskStateBase>
  effortValue: EffortValue         // 'low' | 'medium' | 'high' | 'max'
  fastMode: boolean
  thinkingEnabled: boolean
  kairosEnabled?: boolean
  // ... 更多字段
}
```

## QuerySource — 查询来源

```typescript
type QuerySource =
  | 'repl_main_thread'       // 主交互循环
  | 'compact'                // 压缩查询
  | 'session_memory'         // 会话记忆
  | 'sdk'                    // SDK 调用
  | 'hook_agent'             // 钩子 agent
  | 'verification_agent'     // 验证 agent
  | 'web_search_tool'        // 网络搜索
  | 'dream'                  // 后台思考
  | (string & {})            // 可扩展
```

## OAuth 类型

```typescript
type OAuthTokens = {
  accessToken: string
  refreshToken?: string
  expiresAt?: number
}

type SubscriptionType = 'free' | 'pro' | 'max' | 'team' | 'enterprise'
type BillingType = 'free' | 'pro' | 'max' | 'team' | 'enterprise'
type RateLimitTier = 'standard' | 'high' | 'unlimited'
```

## MCP 配置类型

```typescript
type ScopedMcpServerConfig = {
  type: 'stdio' | 'sse' | 'http' | 'ws'
  command?: string             // stdio 命令
  args?: string[]
  url?: string                 // HTTP/SSE/WS URL
  env?: Record<string, string>
  scope: ConfigScope
  // ... OAuth、headers 等
}

type ConfigScope =
  | 'local' | 'user' | 'project'
  | 'enterprise' | 'managed' | 'claudeai'
  | 'dynamic'
```

## Hook 类型

```typescript
type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'Notification'
  | 'Stop'
  | 'SessionStart'
  | 'SessionEnd'
  | 'Setup'

type HookResult = {
  exitCode: number
  stdout: string
  stderr: string
  duration: number
  // 结构化输出（JSON）
  decision?: 'approve' | 'deny' | 'skip'
  reason?: string
  additionalContext?: string
}
```

## 文件相关类型

```typescript
type FilePersistenceOptions = { path: string; encoding?: BufferEncoding }
type FilePersistenceResult = { success: boolean; error?: string }

type SecureStorage = {
  read(key: string): Promise<string | null>
  write(key: string, value: string): Promise<void>
  clear(key: string): Promise<void>
  name: string
}
```
