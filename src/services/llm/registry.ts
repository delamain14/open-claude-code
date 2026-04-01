import type { LLMConfig, LLMProvider, ModelConfig, ProviderConfig } from './types.js'
import { AnthropicProvider } from './providers/anthropic.js'
import { OpenAICompatibleProvider } from './providers/openai.js'
import { BedrockProvider } from './providers/bedrock.js'
import { VertexProvider } from './providers/vertex.js'
import { AzureProvider } from './providers/azure.js'

function createProvider(name: string, config: ProviderConfig): LLMProvider | null {
  switch (config.sourceType) {
    case 'anthropic':
      return new AnthropicProvider(name, config)
    case 'openai':
    case 'deepseek':
    case 'kimi':
    case 'qwen':
    case 'glm':
    case 'minimax':
    case 'step':
      return new OpenAICompatibleProvider(name, config)
    case 'bedrock':
      return new BedrockProvider(name, config)
    case 'vertex':
      return new VertexProvider(name, config)
    case 'azure':
      return new AzureProvider(name, config)
    default:
      return null
  }
}

export class ProviderRegistry {
  private providers = new Map<string, LLMProvider>()
  private models = new Map<string, ModelConfig>()
  private defaultModelName: string | null | undefined = null

  initialize(config: LLMConfig): void {
    this.reset()
    for (const [name, providerConfig] of Object.entries(config.providers ?? {})) {
      const provider = createProvider(name, providerConfig)
      if (provider) {
        this.providers.set(name, provider)
      }
    }
    for (const [name, modelConfig] of Object.entries(config.models ?? {})) {
      this.models.set(name, modelConfig)
    }
    this.defaultModelName = config.defaultModel
  }

  getProvider(name: string): LLMProvider | undefined {
    return this.providers.get(name)
  }

  getModel(name: string): ModelConfig | undefined {
    return this.models.get(name)
  }

  getDefaultModel(): string | null | undefined {
    return this.defaultModelName
  }

  getProviderForModel(modelName: string): LLMProvider | undefined {
    const model = this.models.get(modelName)
    if (!model) return undefined
    return this.providers.get(model.provider)
  }

  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values())
  }

  listModels(): Array<{ name: string; config: ModelConfig }> {
    return Array.from(this.models.entries()).map(([name, config]) => ({ name, config }))
  }

  reset(): void {
    this.providers.clear()
    this.models.clear()
    this.defaultModelName = null
  }
}
