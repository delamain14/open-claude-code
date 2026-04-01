import { z } from 'zod/v4'

// ── Provider 配置 Schema ──

export const ProviderConfigSchema = z
  .object({
    sourceType: z.string().describe('认证方式：anthropic / openai / bedrock / vertex / azure'),
    apiKey: z.string().optional().describe('API Key，支持 ${ENV_VAR} 语法'),
    baseUrl: z.string().optional().describe('API 端点 URL'),
    timeout: z.number().optional().default(180).describe('请求超时（秒）'),
    maxRetries: z.number().optional().default(3).describe('最大重试次数'),
    // 云平台专有字段
    region: z.string().optional().describe('AWS/GCP 区域'),
    profile: z.string().optional().describe('AWS profile 名称'),
    projectId: z.string().optional().describe('GCP 项目 ID'),
    resourceName: z.string().optional().describe('Azure 资源名称'),
    apiVersion: z.string().optional().describe('Azure API 版本'),
  })
  .passthrough()

export type ProviderConfig = z.infer<typeof ProviderConfigSchema>

// ── Model 配置 Schema ──

export const ModelConfigSchema = z
  .object({
    provider: z.string().describe('引用 providers 中的 key'),
    modelId: z.string().describe('模型 ID，如 claude-sonnet-4-6'),
    maxTokens: z.number().optional().describe('最大输入 token 数'),
    maxOutputTokens: z.number().optional().describe('最大输出 token 数'),
  })
  .passthrough()

export type ModelConfig = z.infer<typeof ModelConfigSchema>

// ── 顶层 LLM 配置 Schema ──

// 内部 schema（不带 optional/default，供 SettingsSchema 使用）
export const LLMConfigObjectSchema = z
  .object({
    providers: z.record(z.string(), ProviderConfigSchema).optional().default({}),
    models: z.record(z.string(), ModelConfigSchema).optional().default({}),
    defaultModel: z.string().optional().nullable().describe('默认模型名（引用 models 中的 key）'),
  })

// 顶层 schema（带 optional/default，供 configLoader 独立使用）
export const LLMConfigSchema = LLMConfigObjectSchema
  .optional()
  .default({})

export type LLMConfig = z.infer<typeof LLMConfigSchema>

// ── 认证配置类型（provider.getAuthConfig() 返回值）──

export type AuthConfig =
  | { type: 'apiKey'; apiKey: string; baseUrl: string }
  | { type: 'cloudToken'; token: string; baseUrl: string }
  | { type: 'bedrock'; region: string; credentials: unknown }
  | { type: 'vertex'; projectId: string; region: string; token: string }
  | { type: 'azure'; resourceName: string; token: string }

// ── LLM Provider 接口 ──

export interface LLMProvider {
  readonly name: string
  readonly sourceType: string
  getAuthConfig(): Promise<AuthConfig>
  createClient(): Promise<unknown>
  validateCredentials(): Promise<{ valid: boolean; error?: string }>
}
