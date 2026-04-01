/**
 * Auto-generated SDK Core Types (stub).
 * In the real build these are generated from Zod schemas in coreSchemas.ts.
 */

// Usage & Model types
export type ModelUsage = {
  inputTokens: number
  outputTokens: number
  cacheReadInputTokens: number
  cacheCreationInputTokens: number
  webSearchRequests: number
  costUSD: number
  contextWindow: number
  maxOutputTokens: number
}

export type OutputFormatType = 'json_schema'
export type BaseOutputFormat = { type: OutputFormatType }
export type JsonSchemaOutputFormat = BaseOutputFormat & { schema: any }
export type OutputFormat = BaseOutputFormat | JsonSchemaOutputFormat

export type ApiKeySource = 'env' | 'config' | 'cli'
export type ConfigScope = 'user' | 'project' | 'enterprise'
export type SdkBeta = string

// Thinking types
export type ThinkingAdaptive = { type: 'enabled'; budget_tokens: number }
export type ThinkingEnabled = { type: 'enabled'; budget_tokens: number }
export type ThinkingDisabled = { type: 'disabled' }
export type ThinkingConfig = ThinkingEnabled | ThinkingDisabled | ThinkingAdaptive

// MCP types
export type McpStdioServerConfig = { type: 'stdio'; command: string; args?: string[]; env?: Record<string, string>; cwd?: string }
export type McpSSEServerConfig = { type: 'sse'; url: string; headers?: Record<string, string> }
export type McpHttpServerConfig = { type: 'http'; url: string; headers?: Record<string, string> }
export type McpSdkServerConfig = { type: 'sdk'; instance: any }
export type McpServerConfigForProcessTransport = McpStdioServerConfig
export type McpClaudeAIProxyServerConfig = { type: 'claude_ai_proxy'; project_uuid: string }
export type McpServerStatusConfig = any
export type McpServerStatus = any
export type McpSetServersResult = any

// Permission types
export type PermissionUpdateDestination = string
export type PermissionBehavior = 'allow' | 'deny' | 'ask'
export type PermissionRuleValue = any
export type PermissionUpdate = any
export type PermissionDecisionClassification = any
export type PermissionResult = any
export type PermissionMode = 'default' | 'plan' | 'bypassPermissions'

// Hook types
export type HookEvent = string

// Message types
export type SDKMessage = any
export type SDKUserMessage = any
export type SDKResultMessage = any
export type SDKSessionInfo = any
export type SDKStreamEvent = any
