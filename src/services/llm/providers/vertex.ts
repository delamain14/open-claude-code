import type { AuthConfig, ProviderConfig } from '../types.js'
import { BaseLLMProvider } from './base.js'

export class VertexProvider extends BaseLLMProvider {
  constructor(name: string, config: ProviderConfig) {
    super(name, config)
  }

  async getAuthConfig(): Promise<AuthConfig> {
    return {
      type: 'vertex',
      projectId: this.config.projectId ?? '',
      region: this.config.region ?? 'us-central1',
      token: '', // GCP token obtained at runtime
    }
  }

  async createClient(): Promise<unknown> {
    try {
      const mod = await import('@anthropic-ai/vertex-sdk')
      const AnthropicVertex = mod.default ?? mod.AnthropicVertex
      return new AnthropicVertex({
        projectId: this.config.projectId,
        region: this.config.region ?? 'us-central1',
      })
    } catch {
      throw new Error('Vertex SDK not available. Install @anthropic-ai/vertex-sdk')
    }
  }

  async validateCredentials(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.projectId) {
      return { valid: false, error: `Vertex provider "${this.name}": projectId 未配置` }
    }
    return { valid: true }
  }
}
