import Anthropic from '@anthropic-ai/sdk'
import type { AuthConfig, ProviderConfig } from '../types.js'
import { BaseLLMProvider } from './base.js'

const DEFAULT_BASE_URL = 'https://api.anthropic.com'

export class AnthropicProvider extends BaseLLMProvider {
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

  async createClient(): Promise<Anthropic> {
    const auth = await this.getAuthConfig()
    if (auth.type !== 'apiKey') {
      throw new Error(`Unexpected auth type for Anthropic provider: ${auth.type}`)
    }
    return new Anthropic({
      apiKey: auth.apiKey,
      baseURL: auth.baseUrl,
      maxRetries: this.config.maxRetries ?? 3,
      timeout: (this.config.timeout ?? 180) * 1000,
    })
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    const apiKey = this.config.apiKey
    if (!apiKey) {
      return { valid: false, error: `Anthropic provider "${this.name}": apiKey 未配置` }
    }
    return { valid: true }
  }
}
