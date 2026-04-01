/**
 * Tests for module resolution — verifies key source modules
 * can be imported without crashing.
 *
 * These tests correspond to the "Startup and Command Assembly" layer
 * of the restoration design. If any of these imports fail, the CLI
 * cannot boot.
 */
import { describe, expect, test } from 'bun:test'

describe('core module resolution', () => {
  test('types/command.ts imports', async () => {
    const mod = await import('../src/types/command.js')
    expect(mod.getCommandName).toBeInstanceOf(Function)
    expect(mod.isCommandEnabled).toBeInstanceOf(Function)
  })

  test('types/message.ts imports', async () => {
    const mod = await import('../src/types/message.js')
    expect(mod).toBeDefined()
    // Should export the isConnectorTextBlock type guard at minimum
  })

  test('types/tools.ts imports', async () => {
    const mod = await import('../src/types/tools.js')
    expect(mod).toBeDefined()
  })

  test('constants/querySource.ts imports', async () => {
    const mod = await import('../src/constants/querySource.js')
    expect(mod).toBeDefined()
  })

  test('restoration/globals.ts imports', async () => {
    await import('../src/restoration/globals.js')
    expect(MACRO).toBeDefined()
    expect(MACRO.VERSION).toBeDefined()
  })

  test('types/connectorText.ts imports', async () => {
    const mod = await import('../src/types/connectorText.js')
    expect(mod.isConnectorTextBlock).toBeInstanceOf(Function)
    expect(mod.isConnectorTextBlock({ type: 'connector_text', text: 'hi' })).toBe(true)
    expect(mod.isConnectorTextBlock({ type: 'text', text: 'hi' })).toBe(false)
  })
})

describe('tool module resolution', () => {
  test('Tool.ts imports', async () => {
    const mod = await import('../src/Tool.js')
    expect(mod).toBeDefined()
    expect(mod.toolMatchesName).toBeInstanceOf(Function)
  })

  test('tools/TungstenTool stub imports', async () => {
    const mod = await import('../src/tools/TungstenTool/TungstenTool.js')
    expect(mod).toBeDefined()
    expect(mod.TungstenTool).toBeDefined()
  })

  test('tools/WorkflowTool/constants stub imports', async () => {
    const mod = await import('../src/tools/WorkflowTool/constants.js')
    expect(mod.WORKFLOW_TOOL_NAME).toBeDefined()
  })
})

describe('command stub module resolution', () => {
  const stubCommands = [
    'ant-trace',
    'autofix-pr',
    'backfill-sessions',
    'break-cache',
    'bughunter',
    'ctx_viz',
    'debug-tool-call',
    'env',
    'good-claude',
    'issue',
    'mock-limits',
    'oauth-refresh',
    'onboarding',
    'perf-issue',
    'share',
    'summary',
    'teleport',
  ]

  for (const cmd of stubCommands) {
    test(`commands/${cmd}/index.ts imports`, async () => {
      const mod = await import(`../src/commands/${cmd}/index.js`)
      expect(mod.default).toBeDefined()
      expect(mod.default.name).toBe(cmd)
      expect(mod.default.type).toBe('local')
    })
  }

  test('commands/reset-limits/index.ts exports named commands', async () => {
    const mod = await import('../src/commands/reset-limits/index.js')
    expect(mod.resetLimits).toBeDefined()
    expect(mod.resetLimitsNonInteractive).toBeDefined()
  })
})

describe('SDK type module resolution', () => {
  test('entrypoints/sdk/controlTypes.ts imports', async () => {
    const mod = await import('../src/entrypoints/sdk/controlTypes.js')
    expect(mod).toBeDefined()
  })

  test('entrypoints/sdk/runtimeTypes.ts imports', async () => {
    const mod = await import('../src/entrypoints/sdk/runtimeTypes.js')
    expect(mod).toBeDefined()
  })

  test('entrypoints/sdk/sdkUtilityTypes.ts imports', async () => {
    const mod = await import('../src/entrypoints/sdk/sdkUtilityTypes.js')
    expect(mod).toBeDefined()
  })
})

describe('ink module resolution', () => {
  test('ink/cursor.ts imports', async () => {
    const mod = await import('../src/ink/cursor.js')
    expect(mod.showCursor).toBeInstanceOf(Function)
    expect(mod.hideCursor).toBeInstanceOf(Function)
  })
})

describe('infrastructure module resolution', () => {
  test('cli/transports/Transport.ts imports', async () => {
    const mod = await import('../src/cli/transports/Transport.js')
    expect(mod).toBeDefined()
  })

  test('keybindings/types.ts imports', async () => {
    const mod = await import('../src/keybindings/types.js')
    expect(mod).toBeDefined()
  })
})
