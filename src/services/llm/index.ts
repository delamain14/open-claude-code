import { ProviderRegistry } from './registry.js'
import { loadLLMConfig } from './configLoader.js'
import type { LLMProvider, ModelConfig } from './types.js'

export { resolveEnvVars, mergeLLMConfigs, loadLLMConfig } from './configLoader.js'
export { ProviderRegistry } from './registry.js'
export { AnthropicProvider } from './providers/anthropic.js'
export { OpenAICompatibleProvider } from './providers/openai.js'
export { BedrockProvider } from './providers/bedrock.js'
export { VertexProvider } from './providers/vertex.js'
export { AzureProvider } from './providers/azure.js'
export { BaseLLMProvider } from './providers/base.js'
export type { LLMProvider, LLMConfig, ProviderConfig, ModelConfig, AuthConfig } from './types.js'
export {
  ProviderConfigSchema,
  ModelConfigSchema,
  LLMConfigSchema,
} from './types.js'

// ── 全局单例 ──

let globalRegistry: ProviderRegistry | null = null

// Lazy import to avoid circular dependency
let _logForDebugging: ((msg: string) => void) | null = null
function debugLog(msg: string): void {
  if (!_logForDebugging) {
    try { _logForDebugging = require('../../utils/debug.js').logForDebugging } catch { _logForDebugging = () => {} }
  }
  _logForDebugging!(msg)
}

export function initializeLLMRegistry(
  globalLLMSettings?: Record<string, unknown>,
  projectLLMSettings?: Record<string, unknown>,
): void {
  const config = loadLLMConfig(globalLLMSettings, projectLLMSettings)
  globalRegistry = new ProviderRegistry()
  globalRegistry.initialize(config)
  const providers = globalRegistry.listProviders()
  const defaultModel = globalRegistry.getDefaultModel()
  debugLog(`[LLM] Registry initialized: ${providers.length} provider(s) [${providers.map(p => `${p.name}(${p.sourceType})`).join(', ')}], defaultModel="${defaultModel ?? 'none'}"`)
}

export function getLLMRegistry(): ProviderRegistry {
  if (!globalRegistry) {
    globalRegistry = new ProviderRegistry()
    globalRegistry.initialize({ providers: {}, models: {} })
  }
  return globalRegistry
}

export function getProvider(name: string): LLMProvider | undefined {
  return getLLMRegistry().getProvider(name)
}

export function getProviderForModel(modelName: string): LLMProvider | undefined {
  return getLLMRegistry().getProviderForModel(modelName)
}

export function getModel(name: string): ModelConfig | undefined {
  return getLLMRegistry().getModel(name)
}

export function getDefaultModel(): string | null | undefined {
  return getLLMRegistry().getDefaultModel()
}

/**
 * Returns true when the LLM registry contains at least one non-Anthropic
 * provider (e.g. OpenAI, DeepSeek, Qwen …).  Used to skip Anthropic-specific
 * auth checks when the user has configured a third-party provider via /login.
 */
export function hasNonAnthropicProvider(): boolean {
  try {
    const registry = getLLMRegistry()
    return registry.listProviders().some(p => p.sourceType !== 'anthropic')
  } catch {
    return false
  }
}

export function resetLLMRegistry(): void {
  globalRegistry?.reset()
  globalRegistry = null
}
