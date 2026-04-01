/**
 * Query loop transition types (stub).
 *
 * Terminal: the query loop has finished (returned to caller).
 * Continue: the query loop should continue with another iteration.
 */

export type Terminal = {
  type: 'terminal'
  reason?: string
}

export type Continue = {
  type: 'continue'
  reason?: string
}
