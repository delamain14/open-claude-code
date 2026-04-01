/**
 * Stub: Input type for the fileSuggestion hook command.
 *
 * Serialised to JSON and piped to the hook's stdin so external
 * scripts can produce context-aware file suggestions.
 */
export type FileSuggestionCommandInput = {
  /** Partial path the user has typed so far. */
  query: string
  /** Current working directory. */
  cwd: string
  /** Project / git root directory. */
  project_dir: string
  /** Session identifier. */
  session_id: string
  [key: string]: unknown
}
