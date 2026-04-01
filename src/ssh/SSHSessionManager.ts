/**
 * SSHSessionManager - manages lifecycle of SSH sessions (stub).
 */

import type { SSHSession } from './createSSHSession.js'

export class SSHSessionManager {
  private session: SSHSession

  constructor(session: SSHSession) {
    this.session = session
  }

  send(data: string): void {
    throw new Error('SSHSessionManager is not available in this build')
  }

  close(): void {
    throw new Error('SSHSessionManager is not available in this build')
  }

  onMessage(handler: (data: string) => void): void {
    this.session.onMessage(handler)
  }

  onClose(handler: () => void): void {
    this.session.onClose(handler)
  }
}
