import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

const breakCache = {
  type: 'local',
  name: 'break-cache',
  description: 'Break prompt cache (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default breakCache
