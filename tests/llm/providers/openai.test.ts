import { describe, test, expect } from 'bun:test'
import { OpenAICompatibleProvider } from '../../../src/services/llm/providers/openai.js'

describe('OpenAICompatibleProvider', () => {
  test('getAuthConfig returns apiKey config', async () => {
    const provider = new OpenAICompatibleProvider('openai', {
      sourceType: 'openai',
      apiKey: 'sk-oai-test',
      baseUrl: 'https://api.openai.com/v1',
    })
    const auth = await provider.getAuthConfig()
    expect(auth).toEqual({
      type: 'apiKey',
      apiKey: 'sk-oai-test',
      baseUrl: 'https://api.openai.com/v1',
    })
  })

  test('works for deepseek with custom baseUrl', async () => {
    const provider = new OpenAICompatibleProvider('deepseek', {
      sourceType: 'openai',
      apiKey: 'sk-deepseek-test',
      baseUrl: 'https://api.deepseek.com',
    })
    const auth = await provider.getAuthConfig()
    expect(auth.type).toBe('apiKey')
    if (auth.type === 'apiKey') {
      expect(auth.baseUrl).toBe('https://api.deepseek.com')
    }
  })

  test('validateCredentials checks apiKey', async () => {
    const valid = new OpenAICompatibleProvider('openai', {
      sourceType: 'openai',
      apiKey: 'sk-test',
    })
    expect((await valid.validateCredentials()).valid).toBe(true)

    const invalid = new OpenAICompatibleProvider('openai', {
      sourceType: 'openai',
    })
    expect((await invalid.validateCredentials()).valid).toBe(false)
  })
})
