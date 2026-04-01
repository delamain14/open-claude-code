import type { AuthConfig, LLMProvider, ProviderConfig } from '../types.js'

export abstract class BaseLLMProvider implements LLMProvider {
  readonly name: string
  readonly sourceType: string
  protected config: ProviderConfig

  constructor(name: string, config: ProviderConfig) {
    this.name = name
    this.sourceType = config.sourceType
    this.config = config
  }

  abstract getAuthConfig(): Promise<AuthConfig>
  abstract createClient(): Promise<unknown>
  abstract validateCredentials(): Promise<{ valid: boolean; error?: string }>
}
