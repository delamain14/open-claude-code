/**
 * SDK Tool Types (stub).
 * All marked @internal until SDK API stabilizes.
 */

/** @internal */
export type ToolDefinition = {
  name: string
  description: string
  inputSchema: any
}

/** @internal */
export type ToolResult = {
  content: any[]
  isError?: boolean
}
