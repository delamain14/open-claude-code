/**
 * Stub: Centralized progress types for tools.
 *
 * Each tool emits progress events during execution so the UI (and SDK) can
 * display incremental output. The union type ToolProgressData is the
 * discriminated union consumed by Tool.ts.
 */

/** Progress emitted by BashTool during shell command execution. */
export type BashProgress = {
  output: string
  fullOutput: string
  elapsedTimeSeconds?: number
  totalLines?: number
  totalBytes?: number
  timeoutMs?: number
  taskId?: string
}

/** Alias used when the progress is forwarded through agents / bash-mode. */
export type ShellProgress = BashProgress

/** Progress emitted by PowerShellTool. */
export type PowerShellProgress = BashProgress

/** Progress emitted by AgentTool (sub-agent orchestration). */
export type AgentToolProgress = {
  type: 'agent'
  message?: string
  taskId?: string
}

/** Progress emitted by MCPTool. */
export type MCPProgress = {
  type: 'mcp'
  message?: string
}

/** Progress emitted by the REPL tool. */
export type REPLToolProgress = {
  output: string
  fullOutput: string
}

/** Progress emitted by SkillTool. */
export type SkillToolProgress = {
  type: 'skill'
  message?: string
}

/** Progress emitted by TaskOutputTool. */
export type TaskOutputProgress = {
  type: 'task_output'
  message?: string
}

/** Progress emitted by WebSearchTool. */
export type WebSearchProgress = {
  type: 'web_search'
  message?: string
}

/** Progress emitted by SDK workflow tasks. */
export type SdkWorkflowProgress = {
  task_id: string
  status: string
  description?: string
}

/** Discriminated union of all tool progress types. */
export type ToolProgressData =
  | BashProgress
  | AgentToolProgress
  | MCPProgress
  | REPLToolProgress
  | SkillToolProgress
  | TaskOutputProgress
  | WebSearchProgress
  | PowerShellProgress
  | SdkWorkflowProgress
