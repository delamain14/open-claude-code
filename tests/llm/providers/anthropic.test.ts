import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { AnthropicProvider } from '../../../src/services/llm/providers/anthropic.js'

describe('AnthropicProvider', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('getAuthConfig returns apiKey config', async () => {
    const provider = new AnthropicProvider('anthropic', {
      sourceType: 'anthropic',
      apiKey: 'sk-ant-test-key',
      baseUrl: 'https://api.anthropic.com',
    })
    const auth = await provider.getAuthConfig()
    expect(auth).toEqual({
      type: 'apiKey',
      apiKey: 'sk-ant-test-key',
      baseUrl: 'https://api.anthropic.com',
    })
  })

  test('getAuthConfig uses default baseUrl if not provided', async () => {
    const provider = new AnthropicProvider('anthropic', {
      sourceType: 'anthropic',
      apiKey: 'sk-ant-test',
    })
    const auth = await provider.getAuthConfig()
    expect(auth.type).toBe('apiKey')
    if (auth.type === 'apiKey') {
      expect(auth.baseUrl).toBe('https://api.anthropic.com')
    }
  })

  test('validateCredentials returns valid when apiKey is set', async () => {
    const provider = new AnthropicProvider('anthropic', {
      sourceType: 'anthropic',
      apiKey: 'sk-ant-test',
    })
    const result = await provider.validateCredentials()
    expect(result.valid).toBe(true)
  })

  test('validateCredentials returns invalid when apiKey is empty', async () => {
    const provider = new AnthropicProvider('anthropic', {
      sourceType: 'anthropic',
      apiKey: '',
    })
    const result = await provider.validateCredentials()
    expect(result.valid).toBe(false)
    expect(result.error).toBeDefined()
  })

  test('validateCredentials returns invalid when apiKey is missing', async () => {
    const provider = new AnthropicProvider('anthropic', {
      sourceType: 'anthropic',
    })
    const result = await provider.validateCredentials()
    expect(result.valid).toBe(false)
  })

  test('name and sourceType are set correctly', () => {
    const provider = new AnthropicProvider('my-anthropic', {
      sourceType: 'anthropic',
      apiKey: 'sk-test',
    })
    expect(provider.name).toBe('my-anthropic')
    expect(provider.sourceType).toBe('anthropic')
  })
})
