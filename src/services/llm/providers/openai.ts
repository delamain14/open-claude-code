import { getProxyFetchOptions } from '../../../utils/proxy.js'
import type { AuthConfig, ProviderConfig } from '../types.js'
import { BaseLLMProvider } from './base.js'

const DEFAULT_BASE_URL = 'https://api.openai.com/v1'

// ── OpenAI-compatible tool calling types ──

export type OpenAIToolFunction = {
  name: string
  description?: string
  parameters?: Record<string, unknown>
}

export type OpenAITool = {
  type: 'function'
  function: OpenAIToolFunction
}

export type OpenAIToolCall = {
  id: string
  type: 'function'
  function: {
    name: string
    arguments: string
  }
}

export type OpenAIToolCallDelta = {
  index: number
  id?: string
  type?: 'function'
  function?: {
    name?: string
    arguments?: string
  }
}

// ── OpenAI-compatible request/response types ──

export type OpenAICompatibleResponse = {
  choices?: Array<{
    message?: {
      content?: unknown
      tool_calls?: OpenAIToolCall[]
    }
  }>
}

export type OpenAICompatibleChunk = {
  choices?: Array<{
    delta?: {
      content?: string
      tool_calls?: OpenAIToolCallDelta[]
    }
    finish_reason?: string | null
  }>
}

export type OpenAICompatibleMessage =
  | { role: 'system'; content: string }
  | { role: 'user'; content: string }
  | { role: 'assistant'; content?: string; tool_calls?: OpenAIToolCall[] }
  | { role: 'tool'; tool_call_id: string; content: string }

type OpenAICompatibleRequest = Record<string, unknown> & {
  stream?: boolean
  tools?: OpenAITool[]
  tool_choice?: 'auto' | 'none' | { type: 'function'; function: { name: string } }
}

export interface OpenAICompatibleClient {
  baseURL: string
  chat: {
    completions: {
      create(
        request: OpenAICompatibleRequest,
        options?: { signal?: AbortSignal },
      ): Promise<OpenAICompatibleResponse | AsyncIterable<OpenAICompatibleChunk>>
    }
  }
}

function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  return new URL(path.replace(/^\/+/, ''), normalizedBase).toString()
}

function createHttpError(
  response: Response,
  body: string,
): Error & { status: number; headers: Headers } {
  const message = `OpenAI-compatible API error ${response.status} ${response.statusText}${body ? ` ${body}` : ''}`
  const error = new Error(message) as Error & {
    status: number
    headers: Headers
  }
  error.status = response.status
  error.headers = response.headers
  return error
}

async function* parseSSEStream(
  response: Response,
): AsyncGenerator<OpenAICompatibleChunk> {
  if (!response.body) {
    return
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const consumeBuffer = (
    flush: boolean,
  ): {
    chunks: OpenAICompatibleChunk[]
    done: boolean
    remaining: string
  } => {
    const segments = buffer.split(/\r?\n\r?\n/)
    const completeEvents = flush ? segments : segments.slice(0, -1)
    const remaining = flush ? '' : (segments[segments.length - 1] ?? '')
    const chunks: OpenAICompatibleChunk[] = []

    for (const event of completeEvents) {
      for (const line of event.split(/\r?\n/)) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (!data) continue
        if (data === '[DONE]') {
          return { chunks, done: true, remaining: '' }
        }
        chunks.push(JSON.parse(data) as OpenAICompatibleChunk)
      }
    }

    return { chunks, done: false, remaining }
  }

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const parsed = consumeBuffer(false)
      buffer = parsed.remaining
      for (const chunk of parsed.chunks) {
        yield chunk
      }
      if (parsed.done) {
        return
      }
    }

    buffer += decoder.decode()
    const parsed = consumeBuffer(true)
    for (const chunk of parsed.chunks) {
      yield chunk
    }
  } finally {
    reader.releaseLock()
  }
}

function createFetchClient(
  auth: Extract<AuthConfig, { type: 'apiKey' }>,
): OpenAICompatibleClient {
  return {
    baseURL: auth.baseUrl,
    chat: {
      completions: {
        async create(
          request: OpenAICompatibleRequest,
          options?: { signal?: AbortSignal },
        ): Promise<
          OpenAICompatibleResponse | AsyncIterable<OpenAICompatibleChunk>
        > {
          const response = await globalThis.fetch(
            joinUrl(auth.baseUrl, 'chat/completions'),
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${auth.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(request),
              signal: options?.signal,
              ...getProxyFetchOptions(),
            } as RequestInit,
          )

          if (!response.ok) {
            throw createHttpError(response, await response.text())
          }

          if (request.stream) {
            return parseSSEStream(response)
          }

          return (await response.json()) as OpenAICompatibleResponse
        },
      },
    },
  }
}

export class OpenAICompatibleProvider extends BaseLLMProvider {
  constructor(name: string, config: ProviderConfig) {
    super(name, config)
  }

  async getAuthConfig(): Promise<AuthConfig> {
    return {
      type: 'apiKey',
      apiKey: this.config.apiKey ?? '',
      baseUrl: this.config.baseUrl ?? DEFAULT_BASE_URL,
    }
  }

  async createClient(): Promise<OpenAICompatibleClient> {
    const auth = await this.getAuthConfig()
    if (auth.type !== 'apiKey') {
      throw new Error(`Unexpected auth type for OpenAI provider: ${auth.type}`)
    }
    return createFetchClient(auth)
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.apiKey) {
      return {
        valid: false,
        error: `OpenAI provider "${this.name}": apiKey 未配置`,
      }
    }
    return { valid: true }
  }
}
