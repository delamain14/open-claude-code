import { mergeWith } from 'lodash-es'
import { LLMConfigSchema, type LLMConfig } from './types.js'

// ── Environment variable auto-detection ──

/**
 * Well-known environment variable mappings for OpenAI-compatible providers.
 * Each entry maps env var prefixes to provider config defaults.
 *
 * Detection priority: first match wins (order matters).
 * Settings from ~/.claude/settings.json always take precedence over env vars.
 */
const ENV_PROVIDER_MAP = [
  {
    name: 'openai',
    sourceType: 'openai',
    keyEnv: 'OPENAI_API_KEY',
    baseUrlEnv: 'OPENAI_BASE_URL',
    modelEnv: 'OPENAI_MODEL',
    defaultBaseUrl: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
  },
  {
    name: 'deepseek',
    sourceType: 'openai',
    keyEnv: 'DEEPSEEK_API_KEY',
    baseUrlEnv: 'DEEPSEEK_BASE_URL',
    modelEnv: 'DEEPSEEK_MODEL',
    defaultBaseUrl: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
  },
  {
    name: 'qwen',
    sourceType: 'openai',
    keyEnv: 'QWEN_API_KEY',
    baseUrlEnv: 'QWEN_BASE_URL',
    modelEnv: 'QWEN_MODEL',
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
  },
  {
    name: 'minimax',
    sourceType: 'openai',
    keyEnv: 'MINIMAX_API_KEY',
    baseUrlEnv: 'MINIMAX_BASE_URL',
    modelEnv: 'MINIMAX_MODEL',
    defaultBaseUrl: 'https://api.minimax.chat/v1',
    defaultModel: 'MiniMax-M1',
  },
  {
    name: 'kimi',
    sourceType: 'openai',
    keyEnv: 'MOONSHOT_API_KEY',
    baseUrlEnv: 'MOONSHOT_BASE_URL',
    modelEnv: 'MOONSHOT_MODEL',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-auto',
  },
  {
    name: 'glm',
    sourceType: 'openai',
    keyEnv: 'GLM_API_KEY',
    baseUrlEnv: 'GLM_BASE_URL',
    modelEnv: 'GLM_MODEL',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4/',
    defaultModel: 'glm-4-plus',
  },
] as const

/**
 * Build LLM config from well-known environment variables.
 * Returns a partial config that can be merged (at lowest priority) with
 * settings from ~/.claude/settings.json.
 */
export function buildConfigFromEnvVars(): Record<string, unknown> {
  const providers: Record<string, unknown> = {}
  const models: Record<string, unknown> = {}
  let defaultModel: string | null = null

  for (const entry of ENV_PROVIDER_MAP) {
    const apiKey = process.env[entry.keyEnv]
    if (!apiKey) continue

    const baseUrl = process.env[entry.baseUrlEnv] || entry.defaultBaseUrl
    const modelId = process.env[entry.modelEnv] || entry.defaultModel

    providers[entry.name] = {
      sourceType: entry.sourceType,
      apiKey,
      baseUrl,
    }
    models[entry.name] = {
      provider: entry.name,
      modelId,
    }

    // First detected provider becomes the default
    if (!defaultModel) {
      defaultModel = entry.name
    }
  }

  if (Object.keys(providers).length === 0) {
    return {}
  }

  return { providers, models, defaultModel }
}

/**
 * 递归解析对象中所有 string 值里的 ${ENV_VAR} 引用。
 * 未定义的环境变量解析为空字符串。
 */
export function resolveEnvVars<T>(obj: T): T {
  if (typeof obj === 'string') {
    return obj.replace(/\$\{([^}]+)\}/g, (_, varName: string) => {
      return process.env[varName] ?? ''
    }) as unknown as T
  }
  if (Array.isArray(obj)) {
    return obj.map(item => resolveEnvVars(item)) as unknown as T
  }
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = resolveEnvVars(value)
    }
    return result as T
  }
  return obj
}

/**
 * 深度合并两个 LLM 配置。project 配置覆盖 global 中的同名字段。
 */
export function mergeLLMConfigs(
  global: Record<string, unknown>,
  project: Record<string, unknown> | undefined,
): Record<string, unknown> {
  if (!project) return { ...global }
  return mergeWith({}, global, project, (objValue: unknown, srcValue: unknown) => {
    if (Array.isArray(srcValue)) return srcValue
    return undefined
  })
}

/**
 * 从 settings 中加载并合并 LLM 配置。
 * Priority (lowest → highest): env vars → global settings → project settings.
 */
export function loadLLMConfig(
  globalSettings?: Record<string, unknown>,
  projectSettings?: Record<string, unknown>,
): LLMConfig {
  // Start with env-var-detected config (lowest priority)
  const envConfig = buildConfigFromEnvVars()
  // Merge: env → global → project (each layer overrides the previous)
  const withGlobal = mergeLLMConfigs(envConfig, globalSettings)
  const merged = mergeLLMConfigs(withGlobal, projectSettings)
  const resolved = resolveEnvVars(merged)
  const parsed = LLMConfigSchema.safeParse(resolved)
  if (!parsed.success) {
    return { providers: {}, models: {}, defaultModel: null }
  }
  return parsed.data
}
