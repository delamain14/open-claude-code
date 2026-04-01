/**
 * LSP service types (stub).
 */

export type LspServerConfig = {
  command: string
  args?: string[]
  env?: Record<string, string>
  initializationOptions?: any
  rootUri?: string
  capabilities?: any
  [key: string]: any
}

export type ScopedLspServerConfig = LspServerConfig & {
  scope?: string
  pluginId?: string
}

export type LspServerState = 'stopped' | 'starting' | 'running' | 'error'
