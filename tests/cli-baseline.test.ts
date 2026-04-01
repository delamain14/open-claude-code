/**
 * Baseline CLI tests — verifies the restored snapshot boots correctly.
 *
 * These tests correspond to the "Baseline checks" section of the
 * Bun CLI Restoration Design (docs/superpowers/specs/).
 *
 * All tests run the CLI as a subprocess to test the real entrypoint,
 * including preload scripts, module resolution, and startup.
 */
import { describe, expect, test } from 'bun:test'
import { resolve } from 'path'

const CLI = resolve(import.meta.dir, '../src/entrypoints/cli.tsx')
const PROJECT_ROOT = resolve(import.meta.dir, '..')

async function runCLI(
  args: string[],
  options?: { timeout?: number; env?: Record<string, string> },
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  const proc = Bun.spawn(['bun', 'run', CLI, ...args], {
    cwd: PROJECT_ROOT,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { ...process.env, ...options?.env },
  })

  const timeout = options?.timeout ?? 30_000
  const timer = setTimeout(() => proc.kill(), timeout)

  const [stdout, stderr] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
  ])
  const exitCode = await proc.exited
  clearTimeout(timer)

  return { stdout: stdout.trim(), stderr: stderr.trim(), exitCode }
}

// ---------------------------------------------------------------------------
// 1. Version command
// ---------------------------------------------------------------------------
describe('--version', () => {
  test('prints version string and exits 0', async () => {
    const { stdout, exitCode } = await runCLI(['--version'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Claude Code')
    expect(stdout).toMatch(/^\d+\.\d+\.\d+/)
  })

  test('-v is an alias for --version', async () => {
    const { stdout, exitCode } = await runCLI(['-v'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Claude Code')
  })
})

// ---------------------------------------------------------------------------
// 2. Help command
// ---------------------------------------------------------------------------
describe('--help', () => {
  test('prints usage information and exits 0', async () => {
    const { stdout, exitCode } = await runCLI(['--help'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Usage: claude')
    expect(stdout).toContain('Options:')
  })

  test('lists subcommands', async () => {
    const { stdout } = await runCLI(['--help'])
    expect(stdout).toContain('Commands:')
    expect(stdout).toContain('mcp')
    expect(stdout).toContain('doctor')
  })

  test('lists common options', async () => {
    const { stdout } = await runCLI(['--help'])
    expect(stdout).toContain('--model')
    expect(stdout).toContain('--print')
    expect(stdout).toContain('--version')
    expect(stdout).toContain('--help')
    expect(stdout).toContain('--resume')
    expect(stdout).toContain('--continue')
  })
})

// ---------------------------------------------------------------------------
// 3. Subcommand help
// ---------------------------------------------------------------------------
describe('subcommand help', () => {
  test('mcp --help prints MCP usage', async () => {
    const { stdout, exitCode } = await runCLI(['mcp', '--help'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('Configure and manage MCP servers')
    expect(stdout).toContain('add')
  })

  test('agents --help prints agents usage', async () => {
    const { stdout, exitCode } = await runCLI(['agents', '--help'])
    expect(exitCode).toBe(0)
    expect(stdout).toContain('agents')
  })
})

// ---------------------------------------------------------------------------
// 4. Unknown options are rejected
// ---------------------------------------------------------------------------
describe('error handling', () => {
  test('unknown option exits with non-zero', async () => {
    const { exitCode } = await runCLI(['--nonexistent-flag-12345'])
    expect(exitCode).not.toBe(0)
  })
})
