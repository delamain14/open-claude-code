# Entry Points and Startup Process

## File Structure

```
src/entrypoints/
├── cli.tsx          # CLI main entry (directly executed by bun)
├── init.ts          # Application initialization (config, network, proxy)
├── mcp.ts           # MCP server mode entry
├── agentSdkTypes.ts # Agent SDK type definitions
├── sandboxTypes.ts  # Sandbox type definitions
└── sdk/             # SDK-related types
    ├── controlTypes.ts
    ├── coreSchemas.ts
    ├── coreTypes.generated.ts
    ├── runtimeTypes.ts
    ├── sdkUtilityTypes.ts
    ├── settingsTypes.generated.ts
    └── toolTypes.ts
```

## cli.tsx — CLI Main Entry

File directly executed by `bun src/entrypoints/cli.tsx`. Designed to minimize initial load — most functionality loaded on-demand via dynamic `import()`.

### Fast Paths (Zero/Minimal Imports)

| Path | Condition | Behavior |
|------|-----------|----------|
| `--version` | Parameter match | Output `MACRO.VERSION`, no imports |
| `--dump-system-prompt` | feature gate | Output system prompt text |
| `--claude-in-chrome-mcp` | Parameter match | Start Chrome MCP server |
| `remote-control` | feature(BRIDGE_MODE) | Start Bridge mode |
| `daemon` | feature(DAEMON) | Start daemon process |
| `ps/logs/attach/kill` | feature(BG_SESSIONS) | Background session management |
| `--tmux --worktree` | Parameter match | exec into tmux worktree |

### Default Path

```typescript
async function main(): Promise<void> {
  // 1. Environment variable presets (COREPACK, CCR heap size, ablation)
  // 2. Fast path detection
  // 3. Capture early input → startCapturingEarlyInput()
  // 4. Dynamic import main.tsx → cliMain()
}

void main()  // Top-level execution
```

## init.ts — Application Initialization

Called by `main.tsx`'s `preAction` hook, performs one-time initialization (memoized).

### Initialization Sequence

```
enableConfigs()                    # Enable config system
  ↓
applySafeConfigEnvironmentVariables()  # Safe environment variables
  ↓
applyExtraCACertsFromConfig()      # TLS CA certificates
  ↓
setupGracefulShutdown()            # Graceful shutdown registration
  ↓
initialize1PEventLogging()         # First-party event logging (async)
  ↓
populateOAuthAccountInfoIfNeeded() # OAuth info population (async)
  ↓
initJetBrainsDetection()           # JetBrains IDE detection (async)
  ↓
detectCurrentRepository()          # Git repository detection (async)
  ↓
initializeRemoteManagedSettingsLoadingPromise()  # Remote settings
  ↓
initializePolicyLimitsLoadingPromise()           # Policy limits
  ↓
recordFirstStartTime()             # First start time
  ↓
configureGlobalMTLS()              # mTLS configuration
  ↓
configureGlobalAgents()            # HTTP proxy configuration
  ↓
preconnectAnthropicApi()           # API TCP+TLS pre-connect (async)
  ↓
setShellIfWindows()                # Windows shell setup
  ↓
registerCleanup(...)               # Cleanup function registration (LSP, teams)
  ↓
ensureScratchpadDir()              # Sandbox directory (if enabled)
```

### initializeTelemetryAfterTrust()

Called after trust is established, initializes OpenTelemetry telemetry:
- Remote settings users: Wait for settings load → Reapply env vars → Initialize
- Non-remote settings users: Initialize directly

## mcp.ts — MCP Server Mode

Runs Claude Code as an MCP server, exposing tools to external MCP clients.

```typescript
export async function startMCPServer(cwd, debug, verbose): Promise<void>
```

### Handlers

| Request Type | Behavior |
|-------------|----------|
| `ListToolsRequest` | Return all tool names, descriptions, JSON Schema |
| `CallToolRequest` | Validate tool → Validate input → Execute → Return result |

### Tool Schema Conversion

```
Zod Schema → zodToJsonSchema() → Filter incompatible fields → MCP Tool Schema
```

## main.tsx — Main Application (4694 lines)

Core application orchestrator, includes CLI configuration, session management, REPL launch.

### Main Functions

| Function | Purpose |
|----------|---------|
| `main()` | Application entry, handles URL schema, SSH, subcommands |
| `run()` | Create Commander program, register 100+ options |
| `getInputPrompt()` | Parse stdin input (text / stream-json) |
| `startDeferredPrefetches()` | Start deferred prefetches (skill index, MCP, model cost) |
| `logSessionTelemetry()` | Record session telemetry |
| `runMigrations()` | Execute model string migrations |

### Interactive Mode Core Path

```
run()'s action handler
  ↓
setup() → Session initialization
  ↓
Load commands (commands.ts)
Load tools (tools.ts)
Load MCP config
  ↓
createRoot() → Ink root instance
  ↓
showSetupScreens()
  ├─ trust dialog
  ├─ API key confirmation
  ├─ Permission mode confirmation
  └─ Onboarding
  ↓
validateForceLoginOrg()
  ↓
initializeLspServerManager()
  ↓
initializeVersionedPlugins() (async)
  ↓
launchRepl() → Render <App><REPL/></App>
```

## setup.ts — Session Initialization

```typescript
export async function setup(
  cwd, permissionMode, allowDangerouslySkipPermissions,
  worktreeEnabled, worktreeName, tmuxEnabled,
  customSessionId?, worktreePRNumber?, messagingSocketPath?,
): Promise<void>
```

### Processing Order

1. Node.js version check (≥ 18)
2. Custom session ID setup
3. UDS messaging initialization (agent swarms)
4. Teammate snapshot capture
5. Terminal backup/restore (iTerm2 / Terminal.app)
6. Git repository initialization
7. File change watcher
8. Hook configuration snapshot
9. Worktree creation + tmux session

## replLauncher.tsx — REPL Launcher

```typescript
export async function launchRepl(
  root: Root,
  appProps: { getFpsMetrics, stats, initialState },
  replProps: REPLProps,
  renderAndRun: (root, element) => Promise<void>,
): Promise<void> {
  const { App } = await import('./components/App.js')
  const { REPL } = await import('./screens/REPL.js')
  await renderAndRun(root, <App {...appProps}><REPL {...replProps} /></App>)
}
```

Dynamically imports App and REPL to reduce initial load time. `renderAndRun` provided by `interactiveHelpers.tsx`, renders UI and waits for user exit.
