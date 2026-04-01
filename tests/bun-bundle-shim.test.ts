/**
 * Tests for the bun:bundle shim — verifies feature() behavior.
 *
 * Bun restricts direct use of feature() outside of if/ternary conditions.
 * We test the shim by importing it via the restoration module directly,
 * and by verifying the CLI subprocess behavior with CLAUDE_FEATURES.
 */
import { describe, expect, test } from 'bun:test'
import { resolve } from 'path'

const CLI = resolve(import.meta.dir, '../src/entrypoints/cli.tsx')
const PROJECT_ROOT = resolve(import.meta.dir, '..')

async function runCLI(
  args: string[],
  env?: Record<string, string>,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(['bun', 'run', CLI, ...args], {
    cwd: PROJECT_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, ...env },
  })
  const timer = setTimeout(() => proc.kill(), 30_000)
  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const exitCode = await proc.exited
  clearTimeout(timer)
  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

describe('bun:bundle shim', () => {
  test('feature() shim implementation is correct', async () => {
    // Test the underlying shim function directly
    const mod = await import('../src/restoration/bun-bundle.js')
    expect(typeof mod.feature).toBe('function')
    expect(mod.feature('NONEXISTENT')).toBe(false)
  })

  test('feature() respects CLAUDE_FEATURES env var', async () => {
    const mod = await import('../src/restoration/bun-bundle.js')
    const original = process.env.CLAUDE_FEATURES
    try {
      process.env.CLAUDE_FEATURES = 'FLAG_A,FLAG_B'
      expect(mod.feature('FLAG_A')).toBe(true)
      expect(mod.feature('FLAG_B')).toBe(true)
      expect(mod.feature('FLAG_C')).toBe(false)
    } finally {
      if (original === undefined) delete process.env.CLAUDE_FEATURES
      else process.env.CLAUDE_FEATURES = original
    }
  })

  test('feature() handles empty CLAUDE_FEATURES', async () => {
    const mod = await import('../src/restoration/bun-bundle.js')
    const original = process.env.CLAUDE_FEATURES
    try {
      process.env.CLAUDE_FEATURES = ''
      expect(mod.feature('ANYTHING')).toBe(false)
    } finally {
      if (original === undefined) delete process.env.CLAUDE_FEATURES
      else process.env.CLAUDE_FEATURES = original
    }
  })

  test('CLI --version works (bun:bundle loaded via preload)', async () => {
    const { stdout, exitCode } = await runCLI(['--version'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Claude Code')
  })

  test('feature flags are off by default (no gated features appear)', async () => {
    // With no CLAUDE_FEATURES, gated subcommands should not appear in --help
    const { stdout } = await runCLI(['--help'])
    // 'daemon' is behind feature('DAEMON') — should not show
    expect(stdout).not.toContain('daemon')
  })
})
