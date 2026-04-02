# 工具系统

## 工具基础架构

### Tool.ts — 工具接口

每个工具实现 `ToolDef` 接口：

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

### ToolUseContext — 工具执行上下文

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

### 工具执行流程

```
模型返回 tool_use block
  ↓
validateInput() — Zod schema 验证
  ↓
checkPermissions() — 权限规则匹配
  ├─ allow → 继续
  ├─ deny → 返回错误
  └─ ask → 用户确认对话框
  ↓
call() — 执行工具逻辑
  ├─ onProgress() — 进度回调
  └─ 返回 { data: Output }
  ↓
mapToolResultToToolResultBlockParam() — 格式化为 API 结果
  ↓
回传给模型作为 tool_result
```

## 工具分类

### 文件操作工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **FileReadTool** | 读取文件内容 | `file_path`, `offset?`, `limit?` |
| **FileWriteTool** | 创建/覆盖文件 | `file_path`, `content` |
| **FileEditTool** | 精确字符串替换 | `file_path`, `old_string`, `new_string`, `replace_all?` |
| **GlobTool** | 文件模式匹配搜索 | `pattern`, `path?` |
| **GrepTool** | 正则表达式内容搜索 | `pattern`, `path?`, `glob?`, `output_mode?` |
| **NotebookEditTool** | Jupyter 笔记本编辑 | `notebook_path`, `cell_index`, `new_source` |

### 命令执行工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **BashTool** | 执行 shell 命令 | `command`, `timeout?`, `description?` |
| **PowerShellTool** | 执行 PowerShell（Windows） | `command` |
| **REPLTool** | 运行 REPL（JS/Python/Ruby） | `language`, `code` |

### AI/Agent 工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **AgentTool** | 启动子 agent | `prompt`, `description`, `subagent_type?`, `model?` |
| **SkillTool** | 调用技能/命令 | `skill`, `args?` |
| **AskUserQuestionTool** | 向用户提问 | `question` |

### Web 工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **WebFetchTool** | HTTP GET + HTML→Markdown | `url` |
| **WebSearchTool** | 网络搜索（Anthropic 原生 / serper.dev） | `query`, `allowed_domains?`, `blocked_domains?` |

### MCP 工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **MCPTool** | 调用 MCP 服务器工具 | 动态（取决于 MCP 工具定义） |
| **ListMcpResourcesTool** | 列出 MCP 资源 | `server_name?` |
| **ReadMcpResourceTool** | 读取 MCP 资源 | `server_name`, `uri` |

### 任务管理工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **TaskCreateTool** | 创建任务 | `subject`, `description` |
| **TaskListTool** | 列出任务 | — |
| **TaskGetTool** | 获取任务详情 | `taskId` |
| **TaskUpdateTool** | 更新任务状态 | `taskId`, `status?`, `subject?` |
| **TaskOutputTool** | 查看后台任务输出 | `taskId` |
| **TaskStopTool** | 停止后台任务 | `taskId` |
| **TodoWriteTool** | 写入待办事项列表 | `todos` |

### 会话管理工具

| 工具 | 功能 | 输入参数 |
|------|------|---------|
| **EnterPlanModeTool** | 进入计划模式 | — |
| **ExitPlanModeTool** | 退出计划模式 | `plan` |
| **EnterWorktreeTool** | 创建 Git 工作树 | `name?` |
| **ExitWorktreeTool** | 退出工作树 | — |
| **ConfigTool** | 读写配置 | `action`, `key?`, `value?` |

### 其他工具

| 工具 | 功能 | 条件 |
|------|------|------|
| **ToolSearchTool** | 搜索可用工具 | 优化模式启用时 |
| **LSPTool** | 调用语言服务器 | — |
| **BriefTool** | 会话摘要上传 | feature(KAIROS) |
| **SleepTool** | 延迟执行 | feature(PROACTIVE/KAIROS) |
| **RemoteTriggerTool** | 触发远程 agent | feature(AGENT_TRIGGERS_REMOTE) |
| **CronCreateTool** | 创建定时任务 | feature(AGENT_TRIGGERS) |
| **CronDeleteTool** | 删除定时任务 | feature(AGENT_TRIGGERS) |
| **CronListTool** | 列出定时任务 | feature(AGENT_TRIGGERS) |
| **SendMessageTool** | 团队消息 | 懒加载 |
| **TeamCreateTool** | 创建团队 | 懒加载 |
| **TeamDeleteTool** | 删除团队 | 懒加载 |
| **SyntheticOutputTool** | 结构化输出 | — |
| **TungstenTool** | 实时监控 | stub（恢复版） |

### tools.ts — 工具组装

```typescript
export function getTools(permissionContext): Tools
```

`--bare` 模式下仅返回：Bash、Read、Edit（+ REPL 如启用）。
完整模式返回全部 50+ 工具。使用 `uniqBy(tools, 'name')` 去重。
