import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

const ctx_viz = {
  type: 'local',
  name: 'ctx_viz',
  description: 'Visualize context (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default ctx_viz
