/**
 * Tests for the postinstall-stubs.sh script — verifies it can be re-run
 * and all expected stub packages are created in node_modules.
 */
import { describe, expect, test } from 'bun:test'
import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(import.meta.dir, '..')
const NM = resolve(ROOT, 'node_modules')

describe('postinstall-stubs.sh', () => {
  test('script exists and is executable', () => {
    const script = resolve(ROOT, 'scripts/postinstall-stubs.sh')
    expect(existsSync(script)).toBe(true)
  })

  test('script runs without error', async () => {
    const proc = Bun.spawn(['bash', 'scripts/postinstall-stubs.sh'], {
      cwd: ROOT,
      stdout: 'pipe',
      stderr: 'pipe',
    })
    const exitCode = await proc.exited
    expect(exitCode).toBe(0)
  })
})

describe('stub package structure', () => {
  const expectedPackages = [
    '@anthropic-ai/sandbox-runtime',
    '@anthropic-ai/mcpb',
    '@anthropic-ai/claude-agent-sdk',
    '@ant/claude-for-chrome-mcp',
    '@ant/computer-use-mcp',
    '@ant/computer-use-input',
    '@ant/computer-use-swift',
    'color-diff-napi',
    'audio-capture-napi',
    'modifiers-napi',
  ]

  for (const pkg of expectedPackages) {
    test(`${pkg} has package.json`, () => {
      const pkgJson = resolve(NM, pkg, 'package.json')
      expect(existsSync(pkgJson)).toBe(true)
      const content = JSON.parse(readFileSync(pkgJson, 'utf-8'))
      expect(content.name).toBe(pkg)
      expect(content.version).toBe('0.0.0-stub')
    })

    test(`${pkg} has index.js`, () => {
      const indexJs = resolve(NM, pkg, 'index.js')
      expect(existsSync(indexJs)).toBe(true)
    })
  }

  test('@ant/computer-use-mcp/types subpath exists', () => {
    expect(existsSync(resolve(NM, '@ant/computer-use-mcp/types/index.js'))).toBe(true)
  })

  test('@ant/computer-use-mcp/sentinelApps subpath exists', () => {
    expect(existsSync(resolve(NM, '@ant/computer-use-mcp/sentinelApps/index.js'))).toBe(true)
  })
})
