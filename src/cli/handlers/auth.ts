/* eslint-disable custom-rules/no-process-exit -- CLI subcommand handler intentionally exits */

import {
  clearAuthRelatedCaches,
  performLogout,
} from '../../commands/logout/logout.js'
import {
  type AnalyticsMetadata_I_VERIFIED_THIS_IS_NOT_CODE_OR_FILEPATHS,
  logEvent,
} from '../../services/analytics/index.js'
import {
  type OAuthTokens,
  clearOAuthTokenCache,
  getAnthropicApiKeyWithSource,
  getAuthTokenSource,
  getOauthAccountInfo,
  getSubscriptionType,
  isUsing3PServices,
  saveOAuthTokensIfNeeded,
} from '../../utils/auth.js'
import { isRunningOnHomespace } from '../../utils/envUtils.js'
import { getAPIProvider } from '../../utils/model/providers.js'
import { updateSettingsForSource } from '../../utils/settings/settings.js'
import { jsonStringify } from '../../utils/slowOperations.js'
import {
  buildAccountProperties,
  buildAPIProviderProperties,
} from '../../utils/status.js'

/**
 * Shared post-token-acquisition logic. Saves tokens, fetches profile/roles,
 * and sets up the local auth state.
 */
/** No-op — OAuth token installation has been removed. */
export async function installOAuthTokens(_tokens: OAuthTokens): Promise<void> {
  saveOAuthTokensIfNeeded(_tokens)
  clearOAuthTokenCache()
  await clearAuthRelatedCaches()
}

/**
 * 配置引导式登录 — 将 provider API Key 写入 settings.json
 */
export async function authLoginWithProvider({
  provider: providerName,
  apiKey,
}: {
  provider?: string
  apiKey?: string
}): Promise<void> {
  // 如果通过命令行参数直接提供了 provider 和 apiKey
  if (providerName && apiKey) {
    await updateSettingsForSource('userSettings', {
      llm: {
        providers: {
          [providerName]: {
            apiKey,
            sourceType: providerName,
          },
        },
      },
    } as any)
    console.log(`已保存 ${providerName} provider 的 API Key 到 ~/.claude/settings.json`)
    return
  }

  // 交互式模式
  const readline = await import('readline')
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

  const askQuestion = (question: string): Promise<string> =>
    new Promise(resolve => rl.question(question, resolve))

  try {
    const selectedProvider = providerName || await askQuestion(
      'Select provider (anthropic/openai/bedrock/vertex/azure): '
    )
    const selectedApiKey = apiKey || await askQuestion(`Enter API Key for ${selectedProvider}: `)

    await updateSettingsForSource('userSettings', {
      llm: {
        providers: {
          [selectedProvider]: {
            apiKey: selectedApiKey,
            sourceType: selectedProvider,
          },
        },
      },
    } as any)
    console.log(`已保存 ${selectedProvider} provider 的 API Key 到 ~/.claude/settings.json`)
  } finally {
    rl.close()
  }
}

export async function authLogin(_opts: {
  email?: string
  sso?: boolean
  console?: boolean
  claudeai?: boolean
}): Promise<void> {
  // OAuth flow has been removed. Direct users to configure API keys instead.
  process.stderr.write(
    'OAuth login has been removed. Please configure your API key:\n' +
    '  claude auth login --provider <provider> --api-key <key>\n' +
    '  or set ANTHROPIC_API_KEY environment variable.\n',
  )
  process.exit(1)
}

export async function authStatus(opts: {
  json?: boolean
  text?: boolean
}): Promise<void> {
  const { source: authTokenSource, hasToken } = getAuthTokenSource()
  const { source: apiKeySource } = getAnthropicApiKeyWithSource()
  const hasApiKeyEnvVar =
    !!process.env.ANTHROPIC_API_KEY && !isRunningOnHomespace()
  const oauthAccount = getOauthAccountInfo()
  const subscriptionType = getSubscriptionType()
  const using3P = isUsing3PServices()
  const loggedIn =
    hasToken || apiKeySource !== 'none' || hasApiKeyEnvVar || using3P

  // Determine auth method
  let authMethod: string = 'none'
  if (using3P) {
    authMethod = 'third_party'
  } else if (authTokenSource === 'claude.ai') {
    authMethod = 'claude.ai'
  } else if (authTokenSource === 'apiKeyHelper') {
    authMethod = 'api_key_helper'
  } else if (authTokenSource !== 'none') {
    authMethod = 'oauth_token'
  } else if (apiKeySource === 'ANTHROPIC_API_KEY' || hasApiKeyEnvVar) {
    authMethod = 'api_key'
  } else if (apiKeySource === '/login managed key') {
    authMethod = 'claude.ai'
  }

  if (opts.text) {
    const properties = [
      ...buildAccountProperties(),
      ...buildAPIProviderProperties(),
    ]
    let hasAuthProperty = false
    for (const prop of properties) {
      const value =
        typeof prop.value === 'string'
          ? prop.value
          : Array.isArray(prop.value)
            ? prop.value.join(', ')
            : null
      if (value === null || value === 'none') {
        continue
      }
      hasAuthProperty = true
      if (prop.label) {
        process.stdout.write(`${prop.label}: ${value}\n`)
      } else {
        process.stdout.write(`${value}\n`)
      }
    }
    if (!hasAuthProperty && hasApiKeyEnvVar) {
      process.stdout.write('API key: ANTHROPIC_API_KEY\n')
    }
    if (!loggedIn) {
      process.stdout.write(
        'Not logged in. Run claude auth login to authenticate.\n',
      )
    }
  } else {
    const apiProvider = getAPIProvider()
    const resolvedApiKeySource =
      apiKeySource !== 'none'
        ? apiKeySource
        : hasApiKeyEnvVar
          ? 'ANTHROPIC_API_KEY'
          : null
    const output: Record<string, string | boolean | null> = {
      loggedIn,
      authMethod,
      apiProvider,
    }
    if (resolvedApiKeySource) {
      output.apiKeySource = resolvedApiKeySource
    }
    if (authMethod === 'claude.ai') {
      output.email = oauthAccount?.emailAddress ?? null
      output.orgId = oauthAccount?.organizationUuid ?? null
      output.orgName = oauthAccount?.organizationName ?? null
      output.subscriptionType = subscriptionType ?? null
    }

    process.stdout.write(jsonStringify(output, null, 2) + '\n')
  }
  process.exit(loggedIn ? 0 : 1)
}

export async function authLogout(): Promise<void> {
  try {
    await performLogout({ clearOnboarding: false })
  } catch {
    process.stderr.write('Failed to log out.\n')
    process.exit(1)
  }
  process.stdout.write('Successfully logged out from your Anthropic account.\n')
  process.exit(0)
}
