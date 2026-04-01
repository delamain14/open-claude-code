/**
 * Stub: MCP component types for the settings UI.
 */

import type {
  McpStdioServerConfig,
  McpSSEServerConfig,
  McpHTTPServerConfig,
  McpClaudeAIProxyServerConfig,
} from '../../services/mcp/types.js'
import type { MCPServerConnection } from '../../services/mcp/types.js'

/** Info about a stdio-transport MCP server for the settings panel. */
export type StdioServerInfo = {
  name: string
  client: MCPServerConnection
  scope: string
  transport: 'stdio'
  config: McpStdioServerConfig
}

/** Info about an SSE-transport MCP server. */
export type SSEServerInfo = {
  name: string
  client: MCPServerConnection
  scope: string
  transport: 'sse'
  isAuthenticated: boolean | undefined
  config: McpSSEServerConfig
}

/** Info about an HTTP-transport MCP server. */
export type HTTPServerInfo = {
  name: string
  client: MCPServerConnection
  scope: string
  transport: 'http'
  isAuthenticated: boolean | undefined
  config: McpHTTPServerConfig
}

/** Info about a Claude AI proxy MCP server. */
export type ClaudeAIServerInfo = {
  name: string
  client: MCPServerConnection
  scope: string
  transport: 'claudeai-proxy'
  isAuthenticated: boolean | undefined
  config: McpClaudeAIProxyServerConfig
}

/** Union of all transport-specific server info types. */
export type ServerInfo =
  | StdioServerInfo
  | SSEServerInfo
  | HTTPServerInfo
  | ClaudeAIServerInfo

/** Info about MCP servers sourced from agent definitions. */
export type AgentMcpServerInfo = {
  name: string
  transport: 'stdio' | 'sse' | 'http'
  agents: string[]
  config: McpStdioServerConfig | McpSSEServerConfig | McpHTTPServerConfig
}

/** View state discriminated union for MCPSettings navigation. */
export type MCPViewState =
  | { type: 'list' }
  | { type: 'stdio'; server: StdioServerInfo }
  | { type: 'remote'; server: SSEServerInfo | HTTPServerInfo | ClaudeAIServerInfo }
  | { type: 'agent'; server: AgentMcpServerInfo }
  | { type: 'tools'; server: ServerInfo | AgentMcpServerInfo }
  | { type: 'tool_detail'; server: ServerInfo | AgentMcpServerInfo; toolName: string }
