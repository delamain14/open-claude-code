/**
 * TungstenTool - Tmux-based terminal tool (stub).
 * Only available for ant (internal) users.
 */

import type { Tool } from '../../Tool.js'

export const TungstenTool: Tool = {
  name: 'Tungsten',
  async description() {
    return 'Terminal tool using tmux (internal only)'
  },
  async prompt() {
    return ''
  },
  isReadOnly() {
    return false
  },
  isEnabled() {
    return process.env.USER_TYPE === 'ant'
  },
  async validateInput() {
    return { result: true as const }
  },
  async call() {
    throw new Error('TungstenTool is not available in this build')
  },
} as unknown as Tool

export function clearSessionsWithTungstenUsage(): void {
  // stub
}

export function resetInitializationState(): void {
  // stub
}
