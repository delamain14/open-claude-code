import { execa } from 'execa'

const KEYCHAIN_SERVICE_NAME = 'claude-code'

export async function maybeRemoveApiKeyFromMacOSKeychainThrows(): Promise<void> {
  if (process.platform === 'darwin') {
    const result = await execa(
      `security delete-generic-password -a $USER -s "${KEYCHAIN_SERVICE_NAME}"`,
      { shell: true, reject: false },
    )
    if (result.exitCode !== 0) {
      throw new Error('Failed to delete keychain entry')
    }
  }
}

export function normalizeApiKeyForConfig(apiKey: string): string {
  return apiKey.slice(-20)
}
