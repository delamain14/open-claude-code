/**
 * Install GitHub App command types (stub).
 */

export type Workflow = 'claude' | 'claude-review'

export type Warning = {
  message: string
  severity?: 'info' | 'warning' | 'error'
}

export type State = {
  step: string
  selectedRepoName: string
  currentRepo: string
  useCurrentRepo: boolean
  apiKeyOrOAuthToken: string
  useExistingKey: boolean
  currentWorkflowInstallStep: number
  warnings: Warning[]
  secretExists: boolean
  secretName: string
  useExistingSecret: boolean
  workflowExists: boolean
  selectedWorkflows: Workflow[]
  selectedApiKeyOption: 'existing' | 'new' | 'oauth'
  authType: string
  workflowAction?: string
  errorReason?: string
  [key: string]: any
}
