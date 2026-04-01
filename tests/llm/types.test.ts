import { describe, test, expect } from 'bun:test'
import {
  ProviderConfigSchema,
  ModelConfigSchema,
  LLMConfigSchema,
} from '../../src/services/llm/types.js'

describe('ProviderConfigSchema', () => {
  test('validates anthropic provider config', () => {
    const result = ProviderConfigSchema.safeParse({
      apiKey: 'sk-ant-test',
      baseUrl: 'https://api.anthropic.com',
      sourceType: 'anthropic',
      timeout: 180,
      maxRetries: 3,
    })
    expect(result.success).toBe(true)
  })

  test('validates bedrock provider config without apiKey', () => {
    const result = ProviderConfigSchema.safeParse({
      sourceType: 'bedrock',
      region: 'us-east-1',
      profile: 'default',
      timeout: 180,
    })
    expect(result.success).toBe(true)
  })

  test('validates vertex provider config', () => {
    const result = ProviderConfigSchema.safeParse({
      sourceType: 'vertex',
      projectId: 'my-project',
      region: 'us-central1',
      timeout: 180,
    })
    expect(result.success).toBe(true)
  })

  test('validates azure provider config', () => {
    const result = ProviderConfigSchema.safeParse({
      sourceType: 'azure',
      resourceName: 'my-resource',
      apiVersion: '2024-02-15-preview',
      timeout: 180,
    })
    expect(result.success).toBe(true)
  })

  test('rejects config without sourceType', () => {
    const result = ProviderConfigSchema.safeParse({
      apiKey: 'sk-test',
    })
    expect(result.success).toBe(false)
  })
})

describe('ModelConfigSchema', () => {
  test('validates model config', () => {
    const result = ModelConfigSchema.safeParse({
      provider: 'anthropic',
      modelId: 'claude-sonnet-4-6',
      maxTokens: 200000,
      maxOutputTokens: 16384,
    })
    expect(result.success).toBe(true)
  })

  test('requires provider and modelId', () => {
    const result = ModelConfigSchema.safeParse({
      maxTokens: 200000,
    })
    expect(result.success).toBe(false)
  })
})

describe('LLMConfigSchema', () => {
  test('validates full llm config', () => {
    const result = LLMConfigSchema.safeParse({
      providers: {
        anthropic: {
          apiKey: 'sk-test',
          baseUrl: 'https://api.anthropic.com',
          sourceType: 'anthropic',
        },
      },
      models: {
        'claude-sonnet': {
          provider: 'anthropic',
          modelId: 'claude-sonnet-4-6',
        },
      },
      defaultModel: 'claude-sonnet',
    })
    expect(result.success).toBe(true)
  })

  test('allows empty config', () => {
    const result = LLMConfigSchema.safeParse({})
    expect(result.success).toBe(true)
  })
})
