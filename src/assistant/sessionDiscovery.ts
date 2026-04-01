/**
 * Assistant session discovery (stub).
 */

export type AssistantSession = {
  id: string
  name?: string
  environment?: string
  status?: string
  createdAt?: string
  [key: string]: any
}

export async function discoverAssistantSessions(): Promise<AssistantSession[]> {
  throw new Error('Assistant session discovery is not available in this build')
}
