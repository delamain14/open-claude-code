/**
 * SDK Runtime Types (stub).
 * Non-serializable types with callbacks, interfaces, methods.
 */

import type { z } from 'zod/v4'

export type EffortLevel = 'low' | 'medium' | 'high' | 'max'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyZodRawShape = Record<string, z.ZodType<any>>

export type InferShape<T extends AnyZodRawShape> = {
  [K in keyof T]: z.infer<T[K]>
}

export type SdkMcpToolDefinition<Schema extends AnyZodRawShape = AnyZodRawShape> = {
  name: string
  description: string
  inputSchema: Schema
  handler: (args: InferShape<Schema>, extra: unknown) => Promise<any>
  annotations?: any
  searchHint?: string
  alwaysLoad?: boolean
}

export type McpSdkServerConfigWithInstance = {
  type: 'sdk'
  instance: any
}

export type Options = {
  model?: string
  maxTurns?: number
  systemPrompt?: string
  appendSystemPrompt?: string
  permissionMode?: string
  output?: any
  abortController?: AbortController
  cwd?: string
  mcpServers?: Record<string, any>
  [key: string]: any
}

export type InternalOptions = Options & {
  _internal?: boolean
}

export type Query = AsyncIterable<any> & {
  result: Promise<any>
  abort: () => void
}

export type InternalQuery = Query

export type SDKSession = {
  id: string
  send: (message: any) => Promise<any>
  close: () => Promise<void>
}

export type SDKSessionOptions = Options & {
  sessionId?: string
  resume?: boolean
}

export type SessionMessage = any

export type ListSessionsOptions = {
  limit?: number
  offset?: number
}

export type GetSessionInfoOptions = {
  sessionId: string
}

export type GetSessionMessagesOptions = {
  sessionId: string
  limit?: number
  offset?: number
}

export type SessionMutationOptions = {
  sessionId: string
}

export type ForkSessionOptions = {
  sessionId: string
  messageId?: string
}

export type ForkSessionResult = {
  sessionId: string
}
