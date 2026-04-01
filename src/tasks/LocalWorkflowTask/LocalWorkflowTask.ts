/**
 * LocalWorkflowTask - Background task for local workflow scripts (stub).
 * Gated behind WORKFLOW_SCRIPTS feature flag.
 */

import type { Task } from '../../Task.js'

export type LocalWorkflowTaskState = {
  type: 'local_workflow'
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  label: string
  scriptPath?: string
  agentId?: string
  [key: string]: any
}

export const LocalWorkflowTask: Task = {
  type: 'local_workflow',
  spawn() {
    throw new Error('LocalWorkflowTask is not available in this build')
  },
} as unknown as Task
