import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

export const resetLimits = {
  type: 'local',
  name: 'reset-limits',
  description: 'Reset rate limits (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export const resetLimitsNonInteractive = {
  type: 'local',
  name: 'reset-limits-non-interactive',
  description: 'Reset rate limits non-interactively (internal)',
  isHidden: true,
  supportsNonInteractive: true,
  load: () => Promise.resolve({ call }),
} satisfies Command
