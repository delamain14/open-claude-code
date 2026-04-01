#!/usr/bin/env bash
# Creates stub packages for Anthropic-internal dependencies that are not
# available on npm. These stubs satisfy module resolution at import time
# and throw clear errors if the functionality is actually invoked.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NM="$ROOT/node_modules"

stub_pkg() {
  local pkg="$1"
  shift
  local dir="$NM/$pkg"
  mkdir -p "$dir"
  echo "{\"name\":\"$pkg\",\"version\":\"0.0.0-stub\",\"main\":\"index.js\",\"type\":\"module\"}" > "$dir/package.json"
  cat > "$dir/index.js"
}

# @anthropic-ai/sandbox-runtime
stub_pkg "@anthropic-ai/sandbox-runtime" << 'JS'
const noop = () => {}
const noopAsync = async () => {}
const returnFalse = () => false
const returnNull = () => null
const returnEmpty = () => ({ errors: [], warnings: [] })

export class SandboxManager {
  static isSupportedPlatform = returnFalse
  static checkDependencies = returnEmpty
  static initialize = noopAsync
  static reset = noop
  static updateConfig = noop
  static cleanupAfterCommand = noopAsync
  static wrapWithSandbox = async (_cmd, fn) => fn()
  static waitForNetworkInitialization = noopAsync
  static annotateStderrWithSandboxFailures = noop
  static getFsReadConfig = returnNull
  static getFsWriteConfig = returnNull
  static getNetworkRestrictionConfig = returnNull
  static getIgnoreViolations = returnNull
  static getAllowLocalBinding = returnFalse
  static getAllowUnixSockets = returnFalse
  static getEnableWeakerNestedSandbox = returnFalse
  static getLinuxHttpSocketPath = returnNull
  static getLinuxSocksSocketPath = returnNull
  static getProxyPort = returnNull
  static getSocksProxyPort = returnNull
  static getSandboxViolationStore = returnNull
  constructor() { throw new Error('[restored snapshot] SandboxManager is not available') }
}
export class SandboxViolationStore {
  constructor() { throw new Error('[restored snapshot] SandboxViolationStore is not available') }
  getViolations() { return [] }
  addViolation() {}
  clear() {}
}
export const SandboxRuntimeConfigSchema = {}
JS

# @anthropic-ai/mcpb
stub_pkg "@anthropic-ai/mcpb" << 'JS'
export class McpbManager { constructor() { throw new Error('[restored snapshot] McpbManager is not available') } }
JS

# @anthropic-ai/claude-agent-sdk
stub_pkg "@anthropic-ai/claude-agent-sdk" << 'JS'
export const PermissionMode = { DEFAULT: 'default', PLAN: 'plan', AUTOACCEPT: 'autoaccept' }
JS

# @ant/claude-for-chrome-mcp
stub_pkg "@ant/claude-for-chrome-mcp" << 'JS'
export const BROWSER_TOOLS = []
export function createClaudeForChromeMcpServer() { throw new Error('[restored snapshot] not available') }
export function registerBrowserTools() { throw new Error('[restored snapshot] not available') }
JS

# @ant/computer-use-mcp
stub_pkg "@ant/computer-use-mcp" << 'JS'
export function buildComputerUseTools() { throw new Error('[restored snapshot] not available') }
export function bindSessionContext() { throw new Error('[restored snapshot] not available') }
export const DEFAULT_GRANT_FLAGS = {}
JS

# @ant/computer-use-mcp subpaths
for sub in types sentinelApps; do
  mkdir -p "$NM/@ant/computer-use-mcp/$sub"
  echo "{\"name\":\"@ant/computer-use-mcp/$sub\",\"version\":\"0.0.0-stub\",\"main\":\"index.js\",\"type\":\"module\"}" > "$NM/@ant/computer-use-mcp/$sub/package.json"
done
echo "export const CoordinateMode = {}" > "$NM/@ant/computer-use-mcp/types/index.js"
echo "export const sentinelApps = []" > "$NM/@ant/computer-use-mcp/sentinelApps/index.js"

# @ant/computer-use-input
stub_pkg "@ant/computer-use-input" << 'JS'
export function loadComputerUseInput() { throw new Error('[restored snapshot] not available') }
JS

# @ant/computer-use-swift
stub_pkg "@ant/computer-use-swift" << 'JS'
export function loadComputerUse() { throw new Error('[restored snapshot] not available') }
JS

# color-diff-napi
stub_pkg "color-diff-napi" << 'JS'
export class ColorDiff { constructor() { throw new Error('[restored snapshot] color-diff-napi is not available') } }
export class ColorFile { constructor() { throw new Error('[restored snapshot] color-diff-napi is not available') } }
export function getSyntaxTheme() { return null }
JS

# audio-capture-napi
stub_pkg "audio-capture-napi" << 'JS'
export default null
JS

# modifiers-napi
stub_pkg "modifiers-napi" << 'JS'
export function getModifiers() { return 0 }
export default { getModifiers() { return 0 } }
JS

echo "[postinstall-stubs] Created stub packages for internal dependencies"
