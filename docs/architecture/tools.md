# Tool System

## Tool Infrastructure

### Tool.ts — Tool Interface

Each tool implements the `ToolDef` interface:

```typescript
type ToolDef<InputSchema, Output, Progress> = {
  name: string
  inputSchema: ZodSchema
  outputSchema?: ZodSchema
  isEnabled(): boolean
  prompt?(): Promise<string>
  call(input, context, canUseTool, parentMessage, onProgress): Promise<{ data: Output }>
  validateInput?(input): Promise<ValidationResult>
  checkPermissions?(input): Promise<PermissionResult>
  renderToolUseMessage(input, options): ReactNode
  renderToolResultMessage(output): ReactNode
  renderToolUseProgressMessage?(progress): ReactNode
  mapToolResultToToolResultBlockParam(output, toolUseID): ToolResultBlockParam
  description(input): Promise<string>
  userFacingName(): string
  isReadOnly(): boolean
  isConcurrencySafe(): boolean
}
```

### ToolUseContext — Tool Execution Context

```typescript
type ToolUseContext = {
  abortController: AbortController
  options: {
    commands: Command[]
    tools: Tools
    mainLoopModel: string
    thinkingConfig: ThinkingConfig
    mcpClients: MCPServerConnection[]
    isNonInteractiveSession: boolean
    agentDefinitions: AgentDefinitionsResult
  }
  getAppState: () => AppState
  setAppState: (f: (prev: AppState) => AppState) => void
  messages: Message[]
  readFileState: FileStateCache
  agentId?: string
}
```

### Tool Execution Flow

```
Model returns tool_use block
  ↓
validateInput() — Zod schema validation
  ↓
checkPermissions() — Permission rule matching
  ├─ allow → Continue
  ├─ deny → Return error
  └─ ask → User confirmation dialog
  ↓
call() — Execute tool logic
  ├─ onProgress() — Progress callback
  └─ Return { data: Output }
  ↓
mapToolResultToToolResultBlockParam() — Format as API result
  ↓
Return to model as tool_result
```

## Tool Categories

### File Operation Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **FileReadTool** | Read file content | `file_path`, `offset?`, `limit?` |
| **FileWriteTool** | Create/overwrite file | `file_path`, `content` |
| **FileEditTool** | Precise string replacement | `file_path`, `old_string`, `new_string`, `replace_all?` |
| **GlobTool** | File pattern matching search | `pattern`, `path?` |
| **GrepTool** | Regular expression content search | `pattern`, `path?`, `glob?`, `output_mode?` |
| **NotebookEditTool** | Jupyter notebook editing | `notebook_path`, `cell_index`, `new_source` |

### Command Execution Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **BashTool** | Execute shell command | `command`, `timeout?`, `description?` |
| **PowerShellTool** | Execute PowerShell (Windows) | `command` |
| **REPLTool** | Run REPL (JS/Python/Ruby) | `language`, `code` |

### AI/Agent Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **AgentTool** | Launch sub-agent | `prompt`, `description`, `subagent_type?`, `model?` |
| **SkillTool** | Invoke skill/command | `skill`, `args?` |
| **AskUserQuestionTool** | Ask user a question | `question` |

### Web Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **WebFetchTool** | HTTP GET + HTML→Markdown | `url` |
| **WebSearchTool** | Web search (Anthropic native / serper.dev) | `query`, `allowed_domains?`, `blocked_domains?` |

### MCP Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **MCPTool** | Call MCP server tool | Dynamic (depends on MCP tool definition) |
| **ListMcpResourcesTool** | List MCP resources | `server_name?` |
| **ReadMcpResourceTool** | Read MCP resource | `server_name`, `uri` |

### Task Management Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **TaskCreateTool** | Create task | `subject`, `description` |
| **TaskListTool** | List tasks | — |
| **TaskGetTool** | Get task details | `taskId` |
| **TaskUpdateTool** | Update task status | `taskId`, `status?`, `subject?` |
| **TaskOutputTool** | View background task output | `taskId` |
| **TaskStopTool** | Stop background task | `taskId` |
| **TodoWriteTool** | Write todo list | `todos` |

### Session Management Tools

| Tool | Function | Input Parameters |
|------|----------|------------------|
| **EnterPlanModeTool** | Enter plan mode | — |
| **ExitPlanModeTool** | Exit plan mode | `plan` |
| **EnterWorktreeTool** | Create Git worktree | `name?` |
| **ExitWorktreeTool** | Exit worktree | — |
| **ConfigTool** | Read/write configuration | `action`, `key?`, `value?` |

### Other Tools

| Tool | Function | Condition |
|------|----------|-----------|
| **ToolSearchTool** | Search available tools | When optimization mode enabled |
| **LSPTool** | Call language server | — |
| **BriefTool** | Session summary upload | feature(KAIROS) |
| **SleepTool** | Delay execution | feature(PROACTIVE/KAIROS) |
| **RemoteTriggerTool** | Trigger remote agent | feature(AGENT_TRIGGERS_REMOTE) |
| **CronCreateTool** | Create scheduled task | feature(AGENT_TRIGGERS) |
| **CronDeleteTool** | Delete scheduled task | feature(AGENT_TRIGGERS) |
| **CronListTool** | List scheduled tasks | feature(AGENT_TRIGGERS) |
| **SendMessageTool** | Team messaging | Lazy load |
| **TeamCreateTool** | Create team | Lazy load |
| **TeamDeleteTool** | Delete team | Lazy load |
| **SyntheticOutputTool** | Structured output | — |
| **TungstenTool** | Real-time monitoring | stub (restored version) |

### tools.ts — Tool Assembly

```typescript
export function getTools(permissionContext): Tools
```

In `--bare` mode only returns: Bash, Read, Edit (+ REPL if enabled). Full mode returns all 50+ tools. Uses `uniqBy(tools, 'name')` for deduplication.
