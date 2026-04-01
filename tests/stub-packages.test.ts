/**
 * Tests for stub packages — verifies internal packages resolve
 * and provide clear error messages when invoked.
 *
 * These packages are Anthropic-internal and not available on npm.
 * The postinstall-stubs.sh script creates minimal stubs in node_modules
 * so that import resolution succeeds but runtime invocation throws.
 */
import { describe, expect, test } from 'bun:test'

describe('stub packages resolve without crashing', () => {
  test('@anthropic-ai/sandbox-runtime resolves', async () => {
    const mod = await import('@anthropic-ai/sandbox-runtime')
    expect(mod).toBeDefined()
    expect(mod.SandboxRuntimeConfigSchema).toBeDefined()
  })

  test('@anthropic-ai/sandbox-runtime throws on instantiation', async () => {
    const { SandboxManager } = await import('@anthropic-ai/sandbox-runtime')
    expect(() => new SandboxManager()).toThrow('restored snapshot')
  })

  test('@anthropic-ai/mcpb resolves', async () => {
    const mod = await import('@anthropic-ai/mcpb')
    expect(mod).toBeDefined()
  })

  test('@anthropic-ai/claude-agent-sdk resolves', async () => {
    const mod = await import('@anthropic-ai/claude-agent-sdk')
    expect(mod).toBeDefined()
    expect(mod.PermissionMode).toBeDefined()
  })

  test('@ant/claude-for-chrome-mcp resolves', async () => {
    const mod = await import('@ant/claude-for-chrome-mcp')
    expect(mod).toBeDefined()
    expect(Array.isArray(mod.BROWSER_TOOLS)).toBe(true)
  })

  test('@ant/computer-use-mcp resolves', async () => {
    const mod = await import('@ant/computer-use-mcp')
    expect(mod).toBeDefined()
    expect(() => mod.buildComputerUseTools()).toThrow('restored snapshot')
  })

  test('color-diff-napi resolves', async () => {
    const mod = await import('color-diff-napi')
    expect(mod).toBeDefined()
    expect(mod.ColorDiff).toBeDefined()
  })

  test('color-diff-napi throws on instantiation', async () => {
    const { ColorDiff } = await import('color-diff-napi')
    expect(() => new ColorDiff()).toThrow('restored snapshot')
  })

  test('modifiers-napi resolves and returns safe default', async () => {
    const mod = await import('modifiers-napi')
    expect(mod).toBeDefined()
    expect(mod.getModifiers()).toBe(0)
  })
})
