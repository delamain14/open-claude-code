/**
 * Stub: Types for the unified message/command queue.
 */

/** Describes a queue operation for diagnostics / session storage. */
export type QueueOperation =
  | 'enqueue'
  | 'dequeue'
  | 'clear'
  | 'reorder'
  | (string & {})

/** Serialisable record of a queue operation, persisted to session storage. */
export type QueueOperationMessage = {
  type: 'queue-operation'
  operation: QueueOperation
  timestamp: string
  sessionId: string
  content?: string
}
