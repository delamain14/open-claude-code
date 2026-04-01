import type { AuthConfig, ProviderConfig } from '../types.js'
import { BaseLLMProvider } from './base.js'

export class BedrockProvider extends BaseLLMProvider {
  constructor(name: string, config: ProviderConfig) {
    super(name, config)
  }

  async getAuthConfig(): Promise<AuthConfig> {
    return {
      type: 'bedrock',
      region: this.config.region ?? 'us-east-1',
      credentials: null, // AWS credentials obtained at runtime
    }
  }

  async createClient(): Promise<unknown> {
    try {
      const mod = await import('@anthropic-ai/bedrock-sdk')
      const AnthropicBedrock = mod.default ?? mod.AnthropicBedrock
      return new AnthropicBedrock({
        awsRegion: this.config.region ?? 'us-east-1',
      })
    } catch {
      throw new Error('AWS Bedrock SDK not available. Install @anthropic-ai/bedrock-sdk')
    }
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.region) {
      return { valid: false, error: `Bedrock provider "${this.name}": region 未配置` }
    }
    return { valid: true }
  }
}
