/**
 * Compatibility shim for Bun's build-time `bun:bundle` module.
 *
 * In production Claude Code, `bun:bundle` provides a `feature()` function
 * used for dead-code elimination at bundle time. In this restored snapshot
 * we run the source directly, so feature flags default to false (disabled).
 *
 * Set environment variable CLAUDE_FEATURES to a comma-separated list of
 * feature names to enable specific flags, e.g.:
 *   CLAUDE_FEATURES=VOICE_MODE,BRIDGE_MODE bun run src/entrypoints/cli.tsx
 */

export function feature(name: string): boolean {
  const enabled = new Set(
    (process.env.CLAUDE_FEATURES ?? '').split(',').filter(Boolean),
  )
  return enabled.has(name)
}
