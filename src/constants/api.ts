/**
 * Core API constants.
 *
 * Replaces the OAuth config's BASE_API_URL and related constants.
 */

export const BASE_API_URL = 'https://api.anthropic.com'

export const CLAUDE_AI_ORIGIN = 'https://claude.ai'

export const MCP_PROXY_URL = 'https://mcp.anthropic.com'
export const MCP_PROXY_PATH = '/sse'

export const MCP_CLIENT_METADATA_URL =
  'https://platform.claude.com/.well-known/oauth-client-metadata/claude-code-mcp.json' as const

/** Kept for API-header compatibility; no longer tied to OAuth. */
export const OAUTH_BETA_HEADER = 'oauth-2025-04-20' as const

export const CLAUDE_AI_INFERENCE_SCOPE = 'user:inference' as const
export const CLAUDE_AI_PROFILE_SCOPE = 'user:profile' as const
