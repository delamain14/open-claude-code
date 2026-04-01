/**
 * Tests for bundled skill content — verifies .md files load
 * as text via Bun's built-in text loader.
 */
import { describe, expect, test } from 'bun:test'

describe('bundled skill content', () => {
  test('verifyContent.ts loads skill markdown', async () => {
    const mod = await import('../src/skills/bundled/verifyContent.js')
    expect(typeof mod.SKILL_MD).toBe('string')
    expect(mod.SKILL_MD.length).toBeGreaterThan(0)
    expect(typeof mod.SKILL_FILES).toBe('object')
    expect(Object.keys(mod.SKILL_FILES).length).toBeGreaterThan(0)
    for (const [key, value] of Object.entries(mod.SKILL_FILES)) {
      expect(typeof key).toBe('string')
      expect(typeof value).toBe('string')
    }
  })

  test('claudeApiContent.ts loads skill markdown', async () => {
    const mod = await import('../src/skills/bundled/claudeApiContent.js')
    expect(typeof mod.SKILL_PROMPT).toBe('string')
    expect(mod.SKILL_PROMPT.length).toBeGreaterThan(0)
    expect(typeof mod.SKILL_FILES).toBe('object')
    expect(Object.keys(mod.SKILL_FILES).length).toBeGreaterThan(0)
    expect(mod.SKILL_MODEL_VARS).toBeDefined()
    expect(typeof mod.SKILL_MODEL_VARS.OPUS_ID).toBe('string')
    expect(typeof mod.SKILL_MODEL_VARS.SONNET_ID).toBe('string')
  })
})
