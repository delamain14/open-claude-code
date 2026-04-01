/**
 * Bun preload script — loaded before any application code.
 *
 * 1. Injects MACRO globals (build-time constants)
 * 2. Registers a Bun plugin that intercepts `bun:bundle` imports
 *    and provides stub modules for unavailable internal packages.
 */

// --- 1. MACRO globals ---
import './globals.js'

// --- 2. Module resolution plugin ---
import { plugin } from 'bun'

plugin({
  name: 'claude-code-restoration',
  setup(build) {
    // Shim bun:bundle — provides feature() for dead-code elimination gates
    build.module('bun:bundle', () => {
      return {
        exports: {
          feature(name: string): boolean {
            const enabled = new Set(
              (process.env.CLAUDE_FEATURES ?? '').split(',').filter(Boolean),
            )
            return enabled.has(name)
          },
        },
        loader: 'object',
      }
    })

    // Internal packages are stubbed as real packages in node_modules/
    // via the postinstall-stubs.sh script, so no plugin shims needed.
  },
})
