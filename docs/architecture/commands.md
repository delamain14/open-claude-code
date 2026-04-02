# Command System

## Command Types

```typescript
type Command = CommandBase & (PromptCommand | LocalCommand | LocalJSXCommand)

// Prompt: Generate prompt text for model processing
type PromptCommand = {
  type: 'prompt'
  getPromptForCommand(args, context): Promise<ContentBlockParam[]>
  progressMessage: string
  contentLength: number
  allowedTools?: string[]
}

// Local command: Execute directly and return text result
type LocalCommand = {
  type: 'local'
  supportsNonInteractive: boolean
  load(): Promise<{ call: LocalCommandCall }>
}

// Local JSX command: Render React component
type LocalJSXCommand = {
  type: 'local-jsx'
  load(): Promise<{ call: LocalJSXCommandCall }>
}
```

## Command Loading Flow

```
getCommands(cwd)
  ↓
loadAllCommands(cwd)  [memoized]
  ├─ getBundledSkills()          # Built-in skills
  ├─ getBuiltinPluginSkillCommands()  # Built-in plugin skills
  ├─ getSkillDirCommands(cwd)    # Skill directory
  ├─ getWorkflowCommands(cwd)    # Workflow commands
  ├─ getPluginCommands()         # Plugin commands
  ├─ getPluginSkills()           # Plugin skills
  └─ COMMANDS()                  # Built-in commands
  ↓
Filter: meetsAvailabilityRequirement() + isCommandEnabled()
  ↓
Merge dynamic skills: getDynamicSkills()
```

## Command Categories

### Session Management

| Command | Type | Function |
|---------|------|----------|
| `/help` | local | Show help information |
| `/clear` | local | Clear screen |
| `/compact` | local | Manually compact context |
| `/exit` | local | Exit CLI |
| `/resume` | local-jsx | Resume history session |
| `/session` | local-jsx | Session management (QR code, URL) |
| `/status` | local | Show current status |
| `/cost` | local | Show API cost |

### Development Tools

| Command | Type | Function |
|---------|------|----------|
| `/commit` | prompt | Guided Git commit |
| `/diff` | local | Show code differences |
| `/branch` | local-jsx | Branch management |
| `/review` | prompt | Code review |
| `/pr_comments` | prompt | PR comment handling |
| `/files` | local | List tracked files |
| `/rewind` | local-jsx | Undo changes |
| `/init` | prompt | Initialize project |

### Configuration & Settings

| Command | Type | Function |
|---------|------|----------|
| `/config` | local-jsx | Edit settings |
| `/model` | local-jsx | Select model |
| `/theme` | local-jsx | Select theme |
| `/color` | local-jsx | Select agent color |
| `/keybindings` | local-jsx | Keyboard shortcuts |
| `/permissions` | local-jsx | Permission management |
| `/vim` | local | Toggle Vim mode |
| `/effort` | local | Adjust effort level |
| `/output-style` | local-jsx | Output style |
| `/statusline` | local | Status line toggle |
| `/fast` | local | Fast mode toggle |

### Extension Management

| Command | Type | Function |
|---------|------|----------|
| `/mcp` | local-jsx | MCP server management |
| `/plugin` | local-jsx | Plugin management |
| `/skills` | local-jsx | Browse skills |
| `/reload-plugins` | local | Reload plugins |
| `/agents` | local | List agents |
| `/hooks` | local-jsx | Hook management |

### Planning & Tasks

| Command | Type | Function |
|---------|------|----------|
| `/plan` | local | Plan mode toggle |
| `/tasks` | local-jsx | Task list management |

### Authentication

| Command | Type | Function |
|---------|------|----------|
| `/login` | local-jsx | OAuth/API Key login |
| `/logout` | local | Logout |

### Information

| Command | Type | Function |
|---------|------|----------|
| `/usage` | local | Token usage statistics |
| `/doctor` | local-jsx | Health check |
| `/upgrade` | local | Check for updates |
| `/release-notes` | local | Show release notes |
| `/feedback` | prompt | Send feedback |
| `/copy` | local | Copy last message |
| `/stats` | local-jsx | Session statistics chart |

### Other

| Command | Type | Function |
|---------|------|----------|
| `/memory` | prompt | Manage memory |
| `/context` | local-jsx | Context management |
| `/add-dir` | local | Add working directory |
| `/desktop` | local | Desktop app integration |
| `/mobile` | local-jsx | Mobile QR code |
| `/ide` | local-jsx | IDE integration |
| `/export` | local | Export session |
| `/tag` | local | Session tags |

### Internal Commands (Anthropic employees only)

`ant-trace`, `autofix-pr`, `backfill-sessions`, `break-cache`, `bughunter`, `ctx_viz`, `debug-tool-call`, `env`, `good-claude`, `issue`, `mock-limits`, `oauth-refresh`, `onboarding`, `perf-issue`, `reset-limits`, `share`, `summary`, `teleport`

In the restored version, these commands return "unavailable" messages.

### Feature-Gated Commands

| Command | Feature Gate |
|---------|-------------|
| `/proactive` | PROACTIVE / KAIROS |
| `/brief` | KAIROS / KAIROS_BRIEF |
| `/assistant` | KAIROS |
| `/bridge` | BRIDGE_MODE |
| `/voice` | VOICE_MODE |
| `/force-snip` | HISTORY_SNIP |
| `/workflows` | WORKFLOW_SCRIPTS |
| `/remote-setup` | CCR_REMOTE_SETUP |
| `/ultraplan` | ULTRAPLAN |
| `/torch` | TORCH |
| `/peers` | UDS_INBOX |
| `/fork` | FORK_SUBAGENT |
| `/buddy` | BUDDY |

## Special Command Collections

### REMOTE_SAFE_COMMANDS

Safe commands in remote mode (CCR): `session`, `exit`, `clear`, `help`, `theme`, `color`, `vim`, `cost`, `usage`, `copy`, `btw`, `feedback`, `plan`, `keybindings`, `statusline`, `stickers`, `mobile`

### BRIDGE_SAFE_COMMANDS

Commands executable from mobile/web clients: `compact`, `clear`, `cost`, `summary`, `release-notes`, `files`
