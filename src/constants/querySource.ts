/**
 * Stub: QuerySource identifies the origin / purpose of an API query.
 *
 * The string union is intentionally broad so that new sources can be added
 * without touching every consumer.
 */
export type QuerySource =
  | 'repl_main_thread'
  | 'compact'
  | 'session_memory'
  | 'sdk'
  | 'hook_agent'
  | 'verification_agent'
  | 'side_query'
  | 'model_validation'
  | 'marble_origami'
  | (string & {})
