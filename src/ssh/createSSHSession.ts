/**
 * SSH session creation (stub).
 */

export type SSHSession = {
  host: string
  process: any
  stdin: NodeJS.WritableStream
  stdout: NodeJS.ReadableStream
  close: () => void
  onMessage: (handler: (data: string) => void) => void
  onClose: (handler: () => void) => void
  onError: (handler: (error: Error) => void) => void
  [key: string]: any
}

export class SSHSessionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SSHSessionError'
  }
}

export async function createSSHSession(
  _options: {
    host: string
    cwd?: string
    localVersion?: string
    permissionMode?: string
    dangerouslySkipPermissions?: boolean
    extraCliArgs?: string[]
  },
  _callbacks?: {
    onProgress?: (msg: string) => void
  },
): Promise<SSHSession> {
  throw new Error('SSH sessions are not available in this build')
}

export function createLocalSSHSession(
  _options: {
    cwd?: string
    permissionMode?: string
    dangerouslySkipPermissions?: boolean
  },
): SSHSession {
  throw new Error('Local SSH sessions are not available in this build')
}
