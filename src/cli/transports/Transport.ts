/**
 * Transport interface for CLI remote IO (stub).
 */

export interface Transport {
  connect(): Promise<void>
  send(data: string): void
  close(): void
  onMessage(handler: (data: string) => void): void
  onClose(handler: () => void): void
  onError(handler: (error: Error) => void): void
}
