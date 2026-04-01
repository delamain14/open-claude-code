/**
 * Tests for command registration — verifies the command table loads
 * and commands are enumerable.
 *
 * These tests correspond to the "Command Table Recovery" phase of the
 * restoration design.
 */
import { beforeAll, describe, expect, test } from 'bun:test'

// The commands module has heavy transitive imports; give it time
const IMPORT_TIMEOUT = 30_000

// The login command checks for an API key at registration time.
// Provide a dummy key so the command table can be fully enumerated.
// Also initialize the config system which must happen before commands load.
beforeAll(async () => {
  if (!process.env.ANTHROPIC_API_KEY && !process.env.CLAUDE_CODE_OAUTH_TOKEN) {
    process.env.ANTHROPIC_API_KEY = 'sk-ant-test-dummy-key-for-command-registration'
  }
  const { enableConfigs } = await import('../src/utils/config.js')
  enableConfigs()
})

describe('command registration', () => {
  test(
    'commands.ts imports without crashing',
    async () => {
      const mod = await import('../src/commands.js')
      expect(mod).toBeDefined()
      expect(mod.getCommands).toBeInstanceOf(Function)
      expect(mod.findCommand).toBeInstanceOf(Function)
      expect(mod.hasCommand).toBeInstanceOf(Function)
      expect(mod.getCommandName).toBeInstanceOf(Function)
    },
    IMPORT_TIMEOUT,
  )

  test(
    'getCommands() returns a non-empty array',
    async () => {
      const { getCommands } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())
      expect(Array.isArray(commands)).toBe(true)
      expect(commands.length).toBeGreaterThan(10)
    },
    IMPORT_TIMEOUT,
  )

  test(
    'every command has required fields',
    async () => {
      const { getCommands } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())
      for (const cmd of commands) {
        expect(typeof cmd.name).toBe('string')
        expect(cmd.name.length).toBeGreaterThan(0)
        expect(typeof cmd.description).toBe('string')
        expect(['prompt', 'local', 'local-jsx']).toContain(cmd.type)
      }
    },
    IMPORT_TIMEOUT,
  )

  test(
    'well-known commands are registered',
    async () => {
      const { getCommands, findCommand } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())

      const expectedNames = [
        'help',
        'clear',
        'compact',
        'config',
        'cost',
        'diff',
        'doctor',
        'memory',
        'model',
        'status',
        'theme',
        'vim',
        'mcp',
        'plan',
        'review',
        'skills',
        'branch',
        'agents',
        'plugin',
      ]

      for (const name of expectedNames) {
        const cmd = findCommand(name, commands)
        expect(cmd).toBeDefined()
      }
    },
    IMPORT_TIMEOUT,
  )

  test(
    'findCommand returns undefined for unknown commands',
    async () => {
      const { getCommands, findCommand } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())
      expect(findCommand('__nonexistent__', commands)).toBeUndefined()
    },
    IMPORT_TIMEOUT,
  )

  test(
    'hasCommand works correctly',
    async () => {
      const { getCommands, hasCommand } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())
      expect(hasCommand('help', commands)).toBe(true)
      expect(hasCommand('__nonexistent__', commands)).toBe(false)
    },
    IMPORT_TIMEOUT,
  )

  test(
    'builtInCommandNames returns a Set',
    async () => {
      const { builtInCommandNames } = await import('../src/commands.js')
      const names = builtInCommandNames()
      expect(names).toBeInstanceOf(Set)
      expect(names.size).toBeGreaterThan(10)
      expect(names.has('help')).toBe(true)
    },
    IMPORT_TIMEOUT,
  )

  test(
    'stub commands produce "not available" output',
    async () => {
      const { getCommands, findCommand } = await import('../src/commands.js')
      const commands = await getCommands(process.cwd())

      // These are internal-only stub commands
      const stubNames = ['ant-trace', 'backfill-sessions', 'break-cache']
      for (const name of stubNames) {
        const cmd = findCommand(name, commands)
        if (cmd && cmd.type === 'local') {
          const mod = await cmd.load()
          const result = await mod.call('', {} as any)
          expect(result.type).toBe('text')
          if (result.type === 'text') {
            expect(result.value).toContain('restored snapshot')
          }
        }
      }
    },
    IMPORT_TIMEOUT,
  )
})
