/**
 * Core message types used throughout the Claude Code CLI.
 *
 * This is a type-stub restoration file. The original types were lost and have
 * been reconstructed from 183 consuming call-sites.
 */

import type { APIError } from '@anthropic-ai/sdk'
import type {
  BetaContentBlock,
  BetaMessage,
  BetaRawMessageStreamEvent,
  BetaToolUseBlock,
} from '@anthropic-ai/sdk/resources/beta/messages/messages.mjs'
import type {
  ContentBlockParam,
} from '@anthropic-ai/sdk/resources/index.mjs'
import type { UUID } from 'crypto'
import type { ToolProgressData } from './tools.js'
import type { HookProgress } from './hooks.js'
// NOTE: Attachment is defined in utils/attachments.ts which also imports from
// this module. For type-only imports, TypeScript handles this circular
// reference correctly at compile time (types are erased at runtime).
import type { Attachment } from '../utils/attachments.js'
import type { PermissionMode } from './permissions.js'
import type { BranchAction, CommitKind, PrAction } from '../tools/shared/gitOperationTracking.js'

/**
 * SDK-level assistant message error codes.
 * Matches the SDKAssistantMessageErrorSchema enum from coreSchemas.ts.
 * Re-exported here because the schema-inferred type may not be directly
 * available from agentSdkTypes.
 */
export type SDKAssistantMessageError =
  | 'authentication_failed'
  | 'billing_error'
  | 'rate_limit'
  | 'invalid_request'
  | 'server_error'
  | 'unknown'
  | 'max_output_tokens'

// ---------------------------------------------------------------------------
// Shared primitives
// ---------------------------------------------------------------------------

/** Base timestamp + uuid fields shared by most message types. */
interface MessageBase {
  uuid: UUID
  timestamp: string
}

/**
 * Origin of a user message. `undefined` means human (keyboard).
 */
export type MessageOrigin =
  | { kind: 'task-notification' }
  | { kind: 'channel'; server: string }
  | { kind: 'coordinator' }
  | { kind: 'human' }
  | { kind: string } // extensible

/** Severity level for system messages. */
export type SystemMessageLevel = 'info' | 'warning' | 'error'

/** Direction hint used by partial (directional) compaction. */
export type PartialCompactDirection = 'top' | 'bottom'

// ---------------------------------------------------------------------------
// AssistantMessage
// ---------------------------------------------------------------------------

export interface AssistantMessage extends MessageBase {
  type: 'assistant'
  message: BetaMessage
  requestId: string | undefined
  /** True when the message was synthesised locally (not from the API). */
  isApiErrorMessage?: boolean
  apiError?: APIError
  error?: SDKAssistantMessageError
  errorDetails?: string
  /** True for messages that should not be sent to the API. */
  isMeta?: true
  /** True for virtual/synthetic messages not from real API responses. */
  isVirtual?: true
  /** When present, identifies the advisor model that generated this response. */
  advisorModel?: string
}

// ---------------------------------------------------------------------------
// UserMessage
// ---------------------------------------------------------------------------

export interface UserMessage extends MessageBase {
  type: 'user'
  message: {
    role: 'user'
    content: string | ContentBlockParam[]
  }
  /** True for messages that should not be shown in the transcript. */
  isMeta?: true
  /** True for messages that should only appear in the transcript, not sent to API. */
  isVisibleInTranscriptOnly?: true
  /** True for virtual/synthetic messages. */
  isVirtual?: true
  /** True for compaction summary messages. */
  isCompactSummary?: true
  /** Metadata about the compaction that produced this summary. */
  summarizeMetadata?: {
    messagesSummarized: number
    userContext?: string
    direction?: PartialCompactDirection
  }
  /** Raw tool output, matches the tool's Output type. */
  toolUseResult?: unknown
  /** MCP protocol metadata (never sent to model). */
  mcpMeta?: {
    _meta?: Record<string, unknown>
    structuredContent?: Record<string, unknown>
  }
  /** IDs of pasted images in this message (positional, parallel to image content blocks). */
  imagePasteIds?: number[]
  /** UUID of the assistant message containing the matching tool_use. */
  sourceToolAssistantUUID?: UUID
  /** For tool results: transient ID used to pair with streaming tool use. */
  sourceToolUseID?: string
  /** Permission mode when this message was sent (for rewind). */
  permissionMode?: PermissionMode
  /** Provenance. undefined = human (keyboard). */
  origin?: MessageOrigin
}

// ---------------------------------------------------------------------------
// AttachmentMessage
// ---------------------------------------------------------------------------

export interface AttachmentMessage extends MessageBase {
  type: 'attachment'
  attachment: Attachment
}

// ---------------------------------------------------------------------------
// ProgressMessage
// ---------------------------------------------------------------------------

/** Re-export Progress from its constituent parts to avoid circular dependency with Tool.ts. */
type Progress = ToolProgressData | HookProgress

export interface ProgressMessage<P extends Progress = Progress> extends MessageBase {
  type: 'progress'
  data: P
  toolUseID: string
  parentToolUseID: string
}

// ---------------------------------------------------------------------------
// SystemMessage (discriminated union on `subtype`)
// ---------------------------------------------------------------------------

interface SystemMessageBase extends MessageBase {
  type: 'system'
  isMeta?: boolean
}

export interface SystemInformationalMessage extends SystemMessageBase {
  subtype: 'informational'
  content: string
  level: SystemMessageLevel
  toolUseID?: string
  preventContinuation?: boolean
}

export interface SystemPermissionRetryMessage extends SystemMessageBase {
  subtype: 'permission_retry'
  content: string
  commands: string[]
  level: SystemMessageLevel
}

export interface SystemBridgeStatusMessage extends SystemMessageBase {
  subtype: 'bridge_status'
  content: string
  url: string
  upgradeNudge?: string
}

export interface SystemScheduledTaskFireMessage extends SystemMessageBase {
  subtype: 'scheduled_task_fire'
  content: string
}

export interface StopHookInfo {
  hookName: string
  hookCommand: string
  exitCode: number | null
  stdout: string
  stderr: string
  durationMs?: number
}

export interface SystemStopHookSummaryMessage extends SystemMessageBase {
  subtype: 'stop_hook_summary'
  hookCount: number
  hookInfos: StopHookInfo[]
  hookErrors: string[]
  preventedContinuation: boolean
  stopReason: string | undefined
  hasOutput: boolean
  level: SystemMessageLevel
  toolUseID?: string
  hookLabel?: string
  totalDurationMs?: number
}

export interface SystemTurnDurationMessage extends SystemMessageBase {
  subtype: 'turn_duration'
  durationMs: number
  budgetTokens?: number
  budgetLimit?: number
  budgetNudges?: number
  messageCount?: number
}

export interface SystemAwaySummaryMessage extends SystemMessageBase {
  subtype: 'away_summary'
  content: string
}

export interface SystemMemorySavedMessage extends SystemMessageBase {
  subtype: 'memory_saved'
  writtenPaths: string[]
}

export interface SystemAgentsKilledMessage extends SystemMessageBase {
  subtype: 'agents_killed'
}

export interface SystemApiMetricsMessage extends SystemMessageBase {
  subtype: 'api_metrics'
  ttftMs: number
  otps: number
  isP50?: boolean
  hookDurationMs?: number
  turnDurationMs?: number
  toolDurationMs?: number
  classifierDurationMs?: number
  toolCount?: number
  hookCount?: number
  classifierCount?: number
  configWriteCount?: number
}

export interface SystemLocalCommandMessage extends SystemMessageBase {
  subtype: 'local_command'
  content: string
  level: SystemMessageLevel
}

export interface CompactMetadata {
  trigger: 'manual' | 'auto'
  preTokens: number
  userContext?: string
  messagesSummarized?: number
}

export interface SystemCompactBoundaryMessage extends SystemMessageBase {
  subtype: 'compact_boundary'
  content: string
  level: SystemMessageLevel
  compactMetadata: CompactMetadata
  logicalParentUuid?: UUID
}

export interface SystemMicrocompactBoundaryMessage extends SystemMessageBase {
  subtype: 'microcompact_boundary'
  content: string
  level: SystemMessageLevel
  microcompactMetadata: {
    trigger: 'auto'
    preTokens: number
    tokensSaved: number
    compactedToolIds: string[]
    clearedAttachmentUUIDs: string[]
  }
}

export interface SystemAPIErrorMessage extends SystemMessageBase {
  subtype: 'api_error'
  level: 'error'
  cause?: Error
  error: APIError
  retryInMs: number
  retryAttempt: number
  maxRetries: number
}

export interface SystemThinkingMessage extends SystemMessageBase {
  subtype: 'thinking'
}

export interface SystemFileSnapshotMessage extends SystemMessageBase {
  subtype: 'file_snapshot'
  content: string
  level: SystemMessageLevel
  snapshotFiles: Array<{
    key: string
    path: string
    content: string
  }>
}

/**
 * Union of all system message subtypes.
 */
export type SystemMessage =
  | SystemInformationalMessage
  | SystemPermissionRetryMessage
  | SystemBridgeStatusMessage
  | SystemScheduledTaskFireMessage
  | SystemStopHookSummaryMessage
  | SystemTurnDurationMessage
  | SystemAwaySummaryMessage
  | SystemMemorySavedMessage
  | SystemAgentsKilledMessage
  | SystemApiMetricsMessage
  | SystemLocalCommandMessage
  | SystemCompactBoundaryMessage
  | SystemMicrocompactBoundaryMessage
  | SystemAPIErrorMessage
  | SystemThinkingMessage
  | SystemFileSnapshotMessage

// ---------------------------------------------------------------------------
// Aggregate Message union
// ---------------------------------------------------------------------------

/**
 * The core Message type used throughout the application.
 * Every message stored in the conversation array is one of these.
 */
export type Message =
  | AssistantMessage
  | UserMessage
  | AttachmentMessage
  | ProgressMessage
  | SystemMessage

// ---------------------------------------------------------------------------
// HookResultMessage
// ---------------------------------------------------------------------------

/**
 * Messages produced by session-start / setup hooks.
 * They can be either user messages (context injections) or attachment messages
 * (hook additional context, file attachments, etc.).
 */
export type HookResultMessage = UserMessage | AttachmentMessage

// ---------------------------------------------------------------------------
// Normalized messages (one content block per message for UI rendering)
// ---------------------------------------------------------------------------

/**
 * An AssistantMessage normalised to contain exactly one content block.
 * Generic parameter `C` defaults to BetaContentBlock but can be narrowed
 * (e.g. BetaToolUseBlock) for type-safe access.
 */
export type NormalizedAssistantMessage<
  C extends BetaContentBlock = BetaContentBlock,
> = Omit<AssistantMessage, 'message'> & {
  message: Omit<BetaMessage, 'content'> & { content: [C] }
}

/**
 * A UserMessage normalised to contain exactly one content block (array form).
 */
export type NormalizedUserMessage = Omit<UserMessage, 'message'> & {
  message: { role: 'user'; content: ContentBlockParam[] }
}

/**
 * Union of all normalised message types (after splitting multi-block messages).
 */
export type NormalizedMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | AttachmentMessage
  | ProgressMessage
  | SystemMessage

// ---------------------------------------------------------------------------
// Stream / request events (ephemeral, not stored in conversation)
// ---------------------------------------------------------------------------

/**
 * Wrapper around raw Anthropic stream events, enriched with optional TTFT metric.
 */
export interface StreamEvent {
  type: 'stream_event'
  event: BetaRawMessageStreamEvent
  ttftMs?: number
}

/**
 * Emitted at the start of an API request (before any stream events).
 */
export interface RequestStartEvent {
  type: 'stream_request_start'
}

// ---------------------------------------------------------------------------
// Tombstone message (remove a message from the conversation)
// ---------------------------------------------------------------------------

/**
 * A synthetic message that signals removal of another message.
 */
export interface TombstoneMessage {
  type: 'tombstone'
  message: Message
}

// ---------------------------------------------------------------------------
// ToolUseSummaryMessage (SDK-only, human-readable progress after tool batches)
// ---------------------------------------------------------------------------

export interface ToolUseSummaryMessage {
  type: 'tool_use_summary'
  summary: string
  precedingToolUseIds: string[]
  uuid: UUID
  timestamp: string
}

// ---------------------------------------------------------------------------
// Grouped / collapsed rendering types (UI-only, not stored in conversation)
// ---------------------------------------------------------------------------

/**
 * A group of same-type tool uses from the same API response,
 * collapsed into a single renderable unit.
 */
export interface GroupedToolUseMessage {
  type: 'grouped_tool_use'
  toolName: string
  messages: NormalizedAssistantMessage<BetaToolUseBlock>[]
  toolResults: NormalizedUserMessage[]
  uuid: UUID
  timestamp: string
}

/**
 * A collapsed group of read/search operations displayed as a summary.
 */
export interface CollapsedReadSearchGroup {
  type: 'collapsed_read_search'
  searchCount: number
  readCount: number
  listCount: number
  replCount: number
  memorySearchCount: number
  memoryReadCount: number
  memoryWriteCount: number
  readFilePaths: string[]
  searchArgs: string[]
  latestDisplayHint?: string
  messages: RenderableMessage[]
  displayMessage: RenderableMessage
  uuid: UUID
  timestamp: string
  /** Team memory fields (only when TEAMMEM feature is enabled) */
  teamMemorySearchCount?: number
  teamMemoryReadCount?: number
  teamMemoryWriteCount?: number
  /** MCP tool call counts */
  mcpCallCount?: number
  mcpServerNames?: string[]
  /** Fullscreen mode bash/git fields */
  bashCount?: number
  gitOpBashCount?: number
  commits?: CommitKind[]
  pushes?: string[]
  branches?: BranchAction[]
  prs?: PrAction[]
  /** Hook summary fields within collapsed groups */
  hookTotalMs?: number
  hookCount?: number
  hookInfos?: StopHookInfo[]
  /** Relevant memory attachments absorbed into this group */
  relevantMemories?: unknown[]
}

/**
 * A collapsible message is one that can be folded into a CollapsedReadSearchGroup.
 * In practice, this is a normalised assistant tool_use, a grouped tool_use,
 * or a normalised user tool_result for a collapsible tool.
 */
export type CollapsibleMessage =
  | NormalizedAssistantMessage
  | GroupedToolUseMessage
  | NormalizedUserMessage

/**
 * Any message type that can appear in the rendered message list.
 * Includes the core message types plus UI-only grouped/collapsed types.
 */
export type RenderableMessage =
  | NormalizedAssistantMessage
  | NormalizedUserMessage
  | AttachmentMessage
  | SystemMessage
  | ProgressMessage
  | GroupedToolUseMessage
  | CollapsedReadSearchGroup
