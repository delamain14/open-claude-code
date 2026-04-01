/**
 * Tests for MACRO globals — verifies all build-time constants are defined.
 *
 * In production Claude Code, these are inlined by the Bun bundler.
 * In the restored snapshot, they're injected via the preload script.
 */
import { describe, expect, test } from 'bun:test'

describe('MACRO globals', () => {
  test('MACRO object exists on globalThis', () => {
    expect(typeof MACRO).toBe('object')
    expect(MACRO).not.toBeNull()
  })

  test('MACRO.VERSION is a semver-like string', () => {
    expect(typeof MACRO.VERSION).toBe('string')
    expect(MACRO.VERSION).toMatch(/^\d+\.\d+\.\d+/)
  })

  test('MACRO.BUILD_TIME is a valid ISO date string', () => {
    expect(typeof MACRO.BUILD_TIME).toBe('string')
    const parsed = new Date(MACRO.BUILD_TIME)
    expect(parsed.getTime()).not.toBeNaN()
  })

  test('MACRO.FEEDBACK_CHANNEL is a URL', () => {
    expect(typeof MACRO.FEEDBACK_CHANNEL).toBe('string')
    expect(MACRO.FEEDBACK_CHANNEL).toContain('http')
  })

  test('MACRO.ISSUES_EXPLAINER is a non-empty string', () => {
    expect(typeof MACRO.ISSUES_EXPLAINER).toBe('string')
    expect(MACRO.ISSUES_EXPLAINER.length).toBeGreaterThan(0)
  })

  test('MACRO.PACKAGE_URL is a URL', () => {
    expect(typeof MACRO.PACKAGE_URL).toBe('string')
    expect(MACRO.PACKAGE_URL).toContain('http')
  })

  test('MACRO.NATIVE_PACKAGE_URL is a URL', () => {
    expect(typeof MACRO.NATIVE_PACKAGE_URL).toBe('string')
    expect(MACRO.NATIVE_PACKAGE_URL).toContain('http')
  })

  test('MACRO.VERSION_CHANGELOG is a URL', () => {
    expect(typeof MACRO.VERSION_CHANGELOG).toBe('string')
    expect(MACRO.VERSION_CHANGELOG).toContain('http')
  })
})
