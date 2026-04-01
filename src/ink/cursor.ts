/**
 * Ink cursor utilities (stub).
 */

export function showCursor(): void {
  process.stderr.write('\x1b[?25h')
}

export function hideCursor(): void {
  process.stderr.write('\x1b[?25l')
}
