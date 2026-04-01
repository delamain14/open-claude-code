/**
 * Global constants that are normally inlined at build time by the Bun bundler.
 * This preload file defines them as runtime globals so they are available
 * everywhere without imports.
 */

declare global {
  const MACRO: {
    VERSION: string
    BUILD_TIME: string
    FEEDBACK_CHANNEL: string
    ISSUES_EXPLAINER: string
    PACKAGE_URL: string
    NATIVE_PACKAGE_URL: string
    VERSION_CHANGELOG: string
  }
}

;(globalThis as any).MACRO = {
  VERSION: '99.0.0-restored',
  BUILD_TIME: new Date().toISOString(),
  FEEDBACK_CHANNEL: 'https://github.com/anthropics/claude-code/issues',
  ISSUES_EXPLAINER:
    'report the issue at https://github.com/anthropics/claude-code/issues',
  PACKAGE_URL: 'https://www.npmjs.com/package/@anthropic-ai/claude-code',
  NATIVE_PACKAGE_URL:
    'https://www.npmjs.com/package/@anthropic-ai/claude-code',
  VERSION_CHANGELOG: 'https://github.com/anthropics/claude-code/releases',
}

export {}
