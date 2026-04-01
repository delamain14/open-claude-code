import type { AuthConfig, ProviderConfig } from '../types.js'
import { BaseLLMProvider } from './base.js'

export class AzureProvider extends BaseLLMProvider {
  constructor(name: string, config: ProviderConfig) {
    super(name, config)
  }

  async getAuthConfig(): Promise<AuthConfig> {
    return {
      type: 'azure',
      resourceName: this.config.resourceName ?? '',
      token: '', // Azure token obtained at runtime
    }
  }

  async createClient(): Promise<unknown> {
    try {
      const { AzureOpenAI } = await import('openai')
      return new AzureOpenAI({
        apiVersion: this.config.apiVersion ?? '2024-02-15-preview',
      })
    } catch {
      throw new Error('OpenAI SDK not available for Azure. Install openai')
    }
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.resourceName) {
      return { valid: false, error: `Azure provider "${this.name}": resourceName 未配置` }
    }
    return { valid: true }
  }
}
