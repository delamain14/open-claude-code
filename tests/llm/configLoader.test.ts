import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import {
  resolveEnvVars,
  mergeLLMConfigs,
  loadLLMConfig,
} from '../../src/services/llm/configLoader.js'

describe('resolveEnvVars', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    process.env.TEST_API_KEY = 'sk-test-12345'
    process.env.TEST_BASE_URL = 'https://test.api.com'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  test('resolves ${ENV_VAR} in string values', () => {
    const config = {
      providers: {
        anthropic: {
          apiKey: '${TEST_API_KEY}',
          baseUrl: '${TEST_BASE_URL}',
          sourceType: 'anthropic',
        },
      },
    }
    const resolved = resolveEnvVars(config)
    expect(resolved.providers.anthropic.apiKey).toBe('sk-test-12345')
    expect(resolved.providers.anthropic.baseUrl).toBe('https://test.api.com')
  })

  test('leaves non-template strings unchanged', () => {
    const config = {
      providers: {
        openai: {
          apiKey: 'sk-hardcoded',
          sourceType: 'openai',
        },
      },
    }
    const resolved = resolveEnvVars(config)
    expect(resolved.providers.openai.apiKey).toBe('sk-hardcoded')
  })

  test('resolves to empty string for undefined env vars', () => {
    const config = {
      providers: {
        openai: {
          apiKey: '${NONEXISTENT_VAR}',
          sourceType: 'openai',
        },
      },
    }
    const resolved = resolveEnvVars(config)
    expect(resolved.providers.openai.apiKey).toBe('')
  })
})

describe('mergeLLMConfigs', () => {
  test('project config overrides global for same provider fields', () => {
    const global = {
      providers: {
        openai: {
          apiKey: 'sk-global',
          baseUrl: 'https://api.openai.com/v1',
          sourceType: 'openai',
          timeout: 180,
        },
      },
      models: {},
      defaultModel: 'claude-sonnet',
    }
    const project = {
      providers: {
        openai: {
          baseUrl: 'https://my-proxy.com/v1',
        },
      },
      defaultModel: 'gpt-4o',
    }
    const merged = mergeLLMConfigs(global, project)
    expect(merged.providers.openai.apiKey).toBe('sk-global')
    expect(merged.providers.openai.baseUrl).toBe('https://my-proxy.com/v1')
    expect(merged.providers.openai.sourceType).toBe('openai')
    expect(merged.defaultModel).toBe('gpt-4o')
  })

  test('project config adds new providers', () => {
    const global = {
      providers: {
        anthropic: { sourceType: 'anthropic', apiKey: 'sk-ant' },
      },
      models: {},
    }
    const project = {
      providers: {
        openai: { sourceType: 'openai', apiKey: 'sk-oai' },
      },
    }
    const merged = mergeLLMConfigs(global, project)
    expect(merged.providers.anthropic).toBeDefined()
    expect(merged.providers.openai).toBeDefined()
  })

  test('handles undefined project config', () => {
    const global = {
      providers: { anthropic: { sourceType: 'anthropic' } },
      models: {},
      defaultModel: 'claude-sonnet',
    }
    const merged = mergeLLMConfigs(global, undefined)
    expect(merged.defaultModel).toBe('claude-sonnet')
  })
})
