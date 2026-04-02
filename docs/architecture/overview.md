# Overall Architecture Overview

## Code Scale

- **Total Lines**: ~206,000 lines of TypeScript/TSX
- **Core Components**: 140+ React components
- **Tools**: 50+ tool implementations
- **Commands**: 88+ slash commands
- **Utility Functions**: 200+ files (33 subdirectories)

## Architecture Layers

```
┌────────────────────────────────────────────────────┐
│                    CLI Entry                        │
│           entrypoints/cli.tsx → main.tsx            │
├────────────────────────────────────────────────────┤
│                  Command Layer                      │
│       commands.ts (registry) + commands/ (impl)     │
├────────────────────────────────────────────────────┤
│                   Query Engine                      │
│         query.ts + QueryEngine.ts                  │
│    Message Processing → API Call → Tool Exec → Compact│
├────────────────────────────────────────────────────┤
│                    Tool Layer                       │
│      Tool.ts (base) + tools.ts (assembly) + tools/ │
│   Bash | Edit | Read | Write | Grep | Agent | ...  │
├──────────────────────┬─────────────────────────────┤
│      UI Layer        │      Service Layer           │
│  ink/ (custom render)│   services/api/ (API client) │
│  components/         │   services/mcp/ (MCP)        │
│  screens/            │   services/analytics/        │
│  state/              │   services/oauth/            │
├──────────────────────┴─────────────────────────────┤
│                  Infrastructure                     │
│  utils/ | constants/ | types/ | bootstrap/         │
│  skills/ | plugins/ | keybindings/ | hooks/        │
└────────────────────────────────────────────────────┘
```

## Startup Flow

```
entrypoints/cli.tsx
  │
  ├─ --version → Output version directly (zero imports)
  ├─ --help → Load main.tsx → Commander help
  ├─ Special modes → bridge / daemon / bg sessions / templates
  │
  └─ Default path
      │
      main.tsx::main()
        │
        ├─ Parallel prefetch: MDM settings + macOS Keychain
        │
        ├─ run() → Create Commander program
        │   │
        │   ├─ preAction hook:
        │   │   ├─ Wait for MDM + Keychain load
        │   │   ├─ init() → Config, network, proxy, TLS
        │   │   ├─ Initialize log sinks
        │   │   ├─ Load remote settings + policy limits
        │   │   └─ Run migrations
        │   │
        │   └─ Register 100+ CLI options and subcommands
        │
        ├─ setup() → Session initialization
        │   ├─ UDS messaging
        │   ├─ Terminal backup/restore
        │   ├─ Git repo initialization
        │   └─ File watcher + hook snapshot
        │
        ├─ Load commands + tools + MCP config
        │
        └─ Branch:
            ├─ Non-interactive (-p) → print.ts → runHeadless()
            └─ Interactive → showSetupScreens() → launchRepl()
                             │
                             ├─ API Key confirmation dialog
                             ├─ Permission mode confirmation
                             └─ Render <App><REPL/></App>
```

## Core Data Flow

### User Query Processing

```
User Input
  ↓
Command parsing (/ prefix → command dispatch, else → query)
  ↓
QueryEngine configuration
  ├─ System prompt construction (context.ts)
  ├─ Message history normalization
  ├─ Tool list assembly
  └─ Token budget calculation
  ↓
API call (services/api/claude.ts)
  ├─ Streaming response handling
  ├─ Tool call detection
  └─ Cost tracking
  ↓
Tool execution (e.g., BashTool, FileEditTool)
  ├─ Input validation
  ├─ Permission check → User confirmation (if needed)
  ├─ Execute operation
  └─ Result formatting
  ↓
Result return → Next API call (multi-turn loop)
  ↓
Final response → UI rendering
  ↓
Optional: Auto-compact (when tokens exceed threshold)
```

### Permission Check Flow

```
Tool call request
  ↓
Input Schema validation (Zod)
  ↓
Permission rule matching
  ├─ alwaysAllowRules → Direct pass
  ├─ alwaysDenyRules → Direct deny
  └─ Default → Ask user
  ↓
Permission mode check
  ├─ bypassPermissions → Skip all checks
  ├─ plan → Read-only ops auto-pass
  ├─ acceptEdits → Edits auto-pass
  └─ default → Follow rules
  ↓
User confirmation dialog (if needed)
  ↓
Execute tool
```

### Session Compaction Flow

```
Monitor token usage
  ↓
Reach threshold (~70% of context window)
  ↓
Execute preCompaction hooks
  ↓
Analyze message history → Select compaction boundary
  ↓
Create sub-query to generate summary
  ↓
Insert CompactBoundaryMessage
  ↓
Replace old messages + keep messages after boundary
  ↓
Execute postCompaction hooks
```

## Key Design Patterns

| Pattern | Application |
|---------|-------------|
| **Memoization** | Command loading, context building, skill indexing |
| **Feature Gates** | `feature()` conditional compilation (KAIROS, BRIDGE_MODE, etc.) |
| **Permission Context** | Multi-layer permission validation before tool execution |
| **Streaming** | API responses, JSON output, tool progress |
| **Graceful Shutdown** | Cleanup registry, resource release |
| **Parallel Prefetch** | Parallel loading at startup (MDM, Keychain, API pre-connect) |
| **Fail Open** | Continue running when policy limits, remote settings fetch fails |
| **Lazy Import** | Large modules loaded on-demand (print.ts, REPL.js) |
