import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

const summary = {
  type: 'local',
  name: 'summary',
  description: 'Summarize conversation (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default summary
