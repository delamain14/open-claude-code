import type { Command, LocalCommandCall } from '../../types/command.js'

const call: LocalCommandCall = async () => {
  return {
    type: 'text',
    value: '[restored snapshot] This command is not available',
  }
}

const backfillSessions = {
  type: 'local',
  name: 'backfill-sessions',
  description: 'Backfill session data (internal)',
  isHidden: true,
  supportsNonInteractive: false,
  load: () => Promise.resolve({ call }),
} satisfies Command

export default backfillSessions
