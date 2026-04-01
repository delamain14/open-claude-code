import { describe, test, expect, beforeEach } from 'bun:test'
import { ProviderRegistry } from '../../src/services/llm/registry.js'
import type { LLMConfig } from '../../src/services/llm/types.js'

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry

  beforeEach(() => {
    registry = new ProviderRegistry()
  })

  test('initializes providers from config', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: {
          sourceType: 'anthropic',
          apiKey: 'sk-test',
          baseUrl: 'https://api.anthropic.com',
          timeout: 180,
          maxRetries: 3,
        },
      },
      models: {
        'claude-sonnet': {
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-6',
        },
      },
      defaultModel: 'claude-sonnet',
    }
    registry.initialize(config)
    expect(registry.getProvider('anthropic')).toBeDefined()
    expect(registry.getProvider('anthropic')!.sourceType).toBe('anthropic')
  })

  test('getProvider returns undefined for unknown provider', () => {
    registry.initialize({ providers: {}, models: {} })
    expect(registry.getProvider('nonexistent')).toBeUndefined()
  })

  test('getModel returns model config', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-test', timeout: 180, maxRetries: 3 },
      },
      models: {
        'claude-sonnet': { provider: 'anthropic', modelId: 'claude-sonnet-4-6' },
      },
      defaultModel: 'claude-sonnet',
    }
    registry.initialize(config)
    const model = registry.getModel('claude-sonnet')
    expect(model).toBeDefined()
    expect(model!.modelId).toBe('claude-sonnet-4-6')
  })

  test('getDefaultModel returns default model name', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-test', timeout: 180, maxRetries: 3 },
      },
      models: {
        'claude-sonnet': { provider: 'anthropic', modelId: 'claude-sonnet-4-6' },
      },
      defaultModel: 'claude-sonnet',
    }
    registry.initialize(config)
    expect(registry.getDefaultModel()).toBe('claude-sonnet')
  })

  test('getProviderForModel returns provider for a model', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-test', timeout: 180, maxRetries: 3 },
      },
      models: {
        'claude-sonnet': { provider: 'anthropic', modelId: 'claude-sonnet-4-6' },
      },
      defaultModel: 'claude-sonnet',
    }
    registry.initialize(config)
    const provider = registry.getProviderForModel('claude-sonnet')
    expect(provider).toBeDefined()
    expect(provider!.name).toBe('anthropic')
  })

  test('listProviders returns all registered providers', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-ant', timeout: 180, maxRetries: 3 },
        openai: { sourceType: 'openai', apiKey: 'sk-oai', timeout: 180, maxRetries: 3 },
      },
      models: {},
    }
    registry.initialize(config)
    // Note: only 'anthropic' sourceType is registered in Phase 1, 'openai' will return null
    // So only anthropic should be in the list
    expect(registry.listProviders().length).toBeGreaterThanOrEqual(1)
  })

  test('reset clears all providers', () => {
    const config: LLMConfig = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-test', timeout: 180, maxRetries: 3 },
      },
      models: {},
    }
    registry.initialize(config)
    registry.reset()
    expect(registry.listProviders()).toHaveLength(0)
  })
})
