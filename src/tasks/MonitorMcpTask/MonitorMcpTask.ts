/**
 * MonitorMcpTask - Background task for MCP server monitoring (stub).
 * Gated behind MONITOR_TOOL feature flag.
 */

import type { Task } from '../../Task.js'
import type { AppState } from '../../state/AppStateStore.js'
import type { SetAppState } from '../../state/types.js'

export type MonitorMcpTaskState = {
  type: 'monitor_mcp'
  id: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  label: string
  serverName?: string
  agentId?: string
  [key: string]: any
}

export const MonitorMcpTask: Task = {
  type: 'monitor_mcp',
  spawn() {
    throw new Error('MonitorMcpTask is not available in this build')
  },
} as unknown as Task

export function killMonitorMcpTasksForAgent(
  _agentId: string,
  _getAppState: () => AppState,
  _setAppState: SetAppState,
): void {
  // stub
}
