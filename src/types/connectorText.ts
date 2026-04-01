/**
 * Restoration stub: ConnectorText types.
 * These represent connector-injected text blocks in the message stream.
 */

export interface ConnectorTextBlock {
  type: 'connector_text'
  text: string
  source?: string
}

export interface ConnectorTextDelta {
  type: 'connector_text_delta'
  text: string
}

export function isConnectorTextBlock(block: unknown): block is ConnectorTextBlock {
  return (
    typeof block === 'object' &&
    block !== null &&
    (block as any).type === 'connector_text'
  )
}

export function isConnectorTextDelta(delta: unknown): delta is ConnectorTextDelta {
  return (
    typeof delta === 'object' &&
    delta !== null &&
    (delta as any).type === 'connector_text_delta'
  )
}
