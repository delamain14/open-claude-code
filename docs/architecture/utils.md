# Utility Functions Library

`src/utils/` contains 33 subdirectories with 200+ utility function files.

## Directory Classification Index

### Authentication and Security

| File/Directory | Function |
|----------|------|
| `auth.ts` (65KB) | OAuth/API Key authentication, token management, provider detection |
| `authPortable.ts` | Portable authentication functions (API Key normalization) |
| `authFileDescriptor.ts` | File descriptor token reading |
| `secureStorage/` | Secure storage (macOS Keychain, plaintext fallback) |
| `sessionIngressAuth.ts` | Session ingress authentication |
| `mtls.ts` | mTLS certificate configuration |
| `caCerts.ts` / `caCertsConfig.ts` | CA certificate management |
| `proxy.ts` | HTTP/HTTPS proxy configuration |

### Model and API

| File/Directory | Function |
|----------|------|
| `model/` | Model selection, capability detection, configuration |
| `model/model.ts` | Default model, user overrides, parsing |
| `model/configs.ts` | All model configurations (ID, aliases, context windows) |
| `model/providers.ts` | Provider detection (firstParty/bedrock/vertex/foundry) |
| `model/modelSupportOverrides.ts` | 3P model capability overrides |
| `modelCost.ts` | Model cost calculation |
| `api.ts` | API call helper functions |
| `apiPreconnect.ts` | TCP+TLS preconnection |
| `betas.ts` | Beta header management |
| `tokens.ts` | Token counting and budget |
| `tokenBudget.ts` | Token budget management |

### Git and Version Control

| File/Directory | Function |
|----------|------|
| `git.ts` (30KB) | Git operations (branches, status, logs) |
| `gitDiff.ts` (16KB) | Diff generation and handling |
| `git/` | Git sub-tools (stash, merge, rebase) |
| `gitSettings.ts` | Git configuration reading |
| `commitAttribution.ts` | Commit attribution (Co-Authored-By) |
| `worktree.ts` | Git worktree management |
| `getWorktreePaths.ts` | Worktree path resolution |
| `detectRepository.ts` | Repository detection (GitHub/GitLab) |

### File System Operations

| File/Directory | Function |
|----------|------|
| `file.ts` (18KB) | File read/write, type detection |
| `fileHistory.ts` (34KB) | File change history tracking |
| `fileStateCache.ts` | File state caching |
| `fileRead.ts` | File reading (encoding detection) |
| `fileReadCache.ts` | File read caching |
| `filePersistence/` | File persistence (upload/sync) |
| `glob.ts` | Glob pattern matching |
| `ripgrep.ts` | ripgrep integration |
| `fsOperations.ts` | Atomic file operations |
| `tempfile.ts` | Temporary file management |

### Shell and Command Execution

| File/Directory | Function |
|----------|------|
| `bash/` | Bash parser, command analysis |
| `bash/bashParser.ts` | Bash syntax parsing |
| `bash/commands.ts` | Command classification and security checks |
| `Shell.ts` (16KB) | Shell session management |
| `ShellCommand.ts` (14KB) | Command execution wrapper |
| `shell/` | Shell detection and configuration |
| `shellConfig.ts` | Shell configuration |
| `powershell/` | PowerShell support |
| `findExecutable.ts` | Executable file search |
| `which.ts` | which command implementation |

### Settings and Configuration

| File/Directory | Function |
|----------|------|
| `config.ts` (63KB) | Configuration loading/saving (`~/.claude.json`) |
| `configConstants.ts` | Configuration constants |
| `settings/` | Layered settings system |
| `settings/settings.ts` | Settings merging (MDM > user > project > local) |
| `settings/settingsCache.ts` | Settings caching |
| `settings/constants.ts` | Settings source definitions |
| `settings/types.ts` | Settings types |
| `settings/mdm/` | MDM (Mobile Device Management) settings |
| `managedEnv.ts` | Managed environment variables |

### Message Processing

| File/Directory | Function |
|----------|------|
| `messages.ts` (193KB) | Message creation, normalization, filtering, serialization |
| `messages/` | Message type-specific handling |
| `messageQueueManager.ts` | Message queue (command queuing) |
| `messagePredicates.ts` | Message type predicates |
| `contentArray.ts` | Content block operations |

### Session Management

| File/Directory | Function |
|----------|------|
| `sessionStorage.ts` (180KB) | Session persistence (JSONL files) |
| `sessionStoragePortable.ts` | Portable session storage |
| `sessionState.ts` | Session runtime state |
| `sessionStart.ts` | Session startup hooks |
| `sessionActivity.ts` | Session activity tracking |
| `sessionTitle.ts` | Session title management |
| `sessionRestore.ts` | Session restoration |
| `sessionUrl.ts` | Session URL |
| `sessionEnvVars.ts` | Session environment variables |
| `conversationRecovery.ts` | Session recovery logic |

### Permission System

| File/Directory | Function |
|----------|------|
| `permissions/` | Permission checking framework |
| `permissions/filesystem.ts` | File system permissions |
| `classifierApprovals.ts` | Classifier approvals |
| `autoModeDenials.ts` | Auto mode denials |

### Telemetry and Diagnostics

| File/Directory | Function |
|----------|------|
| `telemetry/` | OpenTelemetry integration |
| `telemetry/instrumentation.ts` | OTLP metrics/logs/tracing |
| `telemetry/betaSessionTracing.ts` | Beta session tracing |
| `telemetryAttributes.ts` | Telemetry attributes |
| `stats.ts` (33KB) | Statistics collection |
| `diagLogs.ts` | Diagnostic logs |
| `debug.ts` | Debug logging |
| `log.ts` | Error logging |
| `sinks.ts` | Log sink management |

### MCP Support

| File/Directory | Function |
|----------|------|
| `mcp/` | MCP tool support functions |
| `mcpValidation.ts` | MCP input validation |
| `mcpOutputStorage.ts` | MCP output storage |
| `mcpWebSocketTransport.ts` | WebSocket transport |
| `mcpInstructionsDelta.ts` | MCP instructions delta |

### Skills and Plugins

| File/Directory | Function |
|----------|------|
| `skills/` | Skill discovery and loading |
| `plugins/` | Plugin management functions |
| `plugins/loadPluginCommands.ts` | Plugin command loading |
| `toolSearch.ts` | Tool search (ToolSearch optimization) |

### Memory System

| File/Directory | Function |
|----------|------|
| `memory/` | Automatic memory extraction and management |
| `claudemd.ts` | CLAUDE.md file parsing and loading |

### UI Utilities

| File/Directory | Function |
|----------|------|
| `format.ts` | Text formatting |
| `markdown.ts` | Markdown processing |
| `cliHighlight.ts` | CLI syntax highlighting |
| `ansiToSvg.ts` / `ansiToPng.ts` | ANSI → image conversion |
| `hyperlink.ts` | Terminal hyperlinks (OSC 8) |
| `theme.ts` | Theme management |
| `terminal.ts` | Terminal detection |
| `sliceAnsi.ts` | ANSI string slicing |

### Other

| File/Directory | Function |
|----------|------|
| `errors.ts` | Error types and helper functions |
| `envUtils.ts` | Environment variable tools (isBareMode, etc.) |
| `sleep.ts` | Delay function |
| `signal.ts` | Signal/event system |
| `cleanupRegistry.ts` | Cleanup registry |
| `gracefulShutdown.ts` | Graceful shutdown |
| `platform.ts` | Platform detection |
| `xdg.ts` | XDG directory specification |
| `uuid.ts` / `crypto.ts` | UUID generation, encryption |
| `semver.ts` | Semantic version comparison |
| `json.ts` / `yaml.ts` / `xml.ts` | Data format parsing |
| `zodToJsonSchema.ts` | Zod → JSON Schema conversion |
| `diff.ts` | Diff algorithm |
| `treeify.ts` | Tree output |
| `CircularBuffer.ts` | Circular buffer |
| `LRUCache` | Uses `lru-cache` package |

## Other Top-Level Modules

| Directory | Function |
|------|------|
| `bridge/` | IDE Bridge remote connection (115KB bridgeMain.ts) |
| `buddy/` | AI companion UI (CompanionSprite) |
| `coordinator/` | Multi-agent coordination pattern |
| `memdir/` | Memory directory management |
| `migrations/` | Configuration/data migrations |
| `moreright/` | Permission system core |
| `native-ts/` | Pure TS native implementations (yoga-layout, color-diff, file-index) |
| `outputStyles/` | Output style definitions |
| `plugins/` | Plugin loader |
| `query/` | Query helpers (transitions) |
| `remote/` | Remote session management |
| `restoration/` | Recovery compatibility layer (added by this project) |
| `skills/` | Skill loading and management |
| `ssh/` | SSH connection management |
| `upstreamproxy/` | Upstream proxy (CCR) |
| `vim/` | Vim mode implementation |
| `voice/` | Voice input mode |
| `server/` | HTTP server |
