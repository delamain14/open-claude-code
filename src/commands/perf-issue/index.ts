import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

const perfIssue = {
  type: 'local',
  name: 'perf-issue',
  description: 'Report a performance issue (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default perfIssue
