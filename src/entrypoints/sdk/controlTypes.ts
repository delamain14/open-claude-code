/**
 * Stub: SDK control protocol types.
 *
 * These types model the JSON messages exchanged between the SDK host process
 * and the Claude Code REPL over stdin/stdout (or WebSocket for remote
 * sessions). The canonical shapes are defined by the Zod schemas in
 * controlSchemas.ts; these hand-written types are kept in sync.
 */

import type { z } from 'zod/v4'
import type {
  SDKControlRequestSchema,
  SDKControlResponseSchema,
  SDKControlCancelRequestSchema,
  SDKControlPermissionRequestSchema,
  SDKControlRequestInnerSchema,
  SDKControlMcpSetServersResponseSchema,
  SDKControlReloadPluginsResponseSchema,
  StdoutMessageSchema,
  StdinMessageSchema,
} from './controlSchemas.js'
import type { SDKPartialAssistantMessageSchema } from './coreSchemas.js'

// ---------------------------------------------------------------------------
// Infer from Zod schemas when available, with fallback structural types
// ---------------------------------------------------------------------------

export type SDKControlRequest = z.infer<ReturnType<typeof SDKControlRequestSchema>>

export type SDKControlResponse = z.infer<ReturnType<typeof SDKControlResponseSchema>>

export type SDKControlCancelRequest = z.infer<ReturnType<typeof SDKControlCancelRequestSchema>>

export type SDKControlPermissionRequest = z.infer<ReturnType<typeof SDKControlPermissionRequestSchema>>

export type SDKControlRequestInner = z.infer<ReturnType<typeof SDKControlRequestInnerSchema>>

export type SDKControlMcpSetServersResponse = z.infer<ReturnType<typeof SDKControlMcpSetServersResponseSchema>>

export type SDKControlReloadPluginsResponse = z.infer<ReturnType<typeof SDKControlReloadPluginsResponseSchema>>

export type StdoutMessage = z.infer<ReturnType<typeof StdoutMessageSchema>>

export type StdinMessage = z.infer<ReturnType<typeof StdinMessageSchema>>

/** Partial assistant message streamed to SDK consumers. */
export type SDKPartialAssistantMessage = z.infer<ReturnType<typeof SDKPartialAssistantMessageSchema>>
