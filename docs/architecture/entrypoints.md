# 入口点与启动流程

## 文件结构

```
src/entrypoints/
├── cli.tsx          # CLI 主入口（被 bun 直接执行）
├── init.ts          # 应用初始化（配置、网络、代理）
├── mcp.ts           # MCP 服务器模式入口
├── agentSdkTypes.ts # Agent SDK 类型定义
├── sandboxTypes.ts  # 沙箱类型定义
└── sdk/             # SDK 相关类型
    ├── controlTypes.ts
    ├── coreSchemas.ts
    ├── coreTypes.generated.ts
    ├── runtimeTypes.ts
    ├── sdkUtilityTypes.ts
    ├── settingsTypes.generated.ts
    └── toolTypes.ts
```

## cli.tsx — CLI 主入口

被 `bun src/entrypoints/cli.tsx` 直接执行的文件。设计为最小化初始加载——大部分功能通过动态 `import()` 按需加载。

### 快速路径（零/最小导入）

| 路径 | 条件 | 行为 |
|------|------|------|
| `--version` | 参数匹配 | 输出 `MACRO.VERSION`，无任何 import |
| `--dump-system-prompt` | feature gate | 输出系统提示文本 |
| `--claude-in-chrome-mcp` | 参数匹配 | 启动 Chrome MCP 服务器 |
| `remote-control` | feature(BRIDGE_MODE) | 启动 Bridge 模式 |
| `daemon` | feature(DAEMON) | 启动守护进程 |
| `ps/logs/attach/kill` | feature(BG_SESSIONS) | 后台会话管理 |
| `--tmux --worktree` | 参数匹配 | exec 进入 tmux 工作树 |

### 默认路径

```typescript
async function main(): Promise<void> {
  // 1. 环境变量预设（COREPACK、CCR heap size、ablation）
  // 2. 快速路径检测
  // 3. 捕获早期输入 → startCapturingEarlyInput()
  // 4. 动态导入 main.tsx → cliMain()
}

void main()  // 顶层执行
```

## init.ts — 应用初始化

由 `main.tsx` 的 `preAction` 钩子调用，执行一次性初始化（memoized）。

### 初始化顺序

```
enableConfigs()                    # 配置系统启用
  ↓
applySafeConfigEnvironmentVariables()  # 安全环境变量
  ↓
applyExtraCACertsFromConfig()      # TLS CA 证书
  ↓
setupGracefulShutdown()            # 优雅关闭注册
  ↓
initialize1PEventLogging()         # 第一方事件日志（异步）
  ↓
populateOAuthAccountInfoIfNeeded() # OAuth 信息填充（异步）
  ↓
initJetBrainsDetection()           # JetBrains IDE 检测（异步）
  ↓
detectCurrentRepository()          # Git 仓库检测（异步）
  ↓
initializeRemoteManagedSettingsLoadingPromise()  # 远程设置
  ↓
initializePolicyLimitsLoadingPromise()           # 策略限制
  ↓
recordFirstStartTime()             # 首次启动时间
  ↓
configureGlobalMTLS()              # mTLS 配置
  ↓
configureGlobalAgents()            # HTTP 代理配置
  ↓
preconnectAnthropicApi()           # API TCP+TLS 预连接（异步）
  ↓
setShellIfWindows()                # Windows shell 设置
  ↓
registerCleanup(...)               # 清理函数注册（LSP、团队）
  ↓
ensureScratchpadDir()              # 沙箱目录（如启用）
```

### initializeTelemetryAfterTrust()

信任建立后调用，初始化 OpenTelemetry 遥测：
- 远程设置用户：等待设置加载 → 重新应用环境变量 → 初始化
- 非远程设置用户：直接初始化

## mcp.ts — MCP 服务器模式

将 Claude Code 作为 MCP 服务器运行，向外部 MCP 客户端暴露工具。

```typescript
export async function startMCPServer(cwd, debug, verbose): Promise<void>
```

### 处理器

| 请求类型 | 行为 |
|---------|------|
| `ListToolsRequest` | 返回所有工具的名称、描述、JSON Schema |
| `CallToolRequest` | 验证工具 → 验证输入 → 执行 → 返回结果 |

### 工具 Schema 转换

```
Zod Schema → zodToJsonSchema() → 过滤不兼容字段 → MCP Tool Schema
```

## main.tsx — 主应用（4694 行）

应用的核心编排器，包含命令行配置、会话管理、REPL 启动。

### 主要函数

| 函数 | 用途 |
|------|------|
| `main()` | 应用入口，处理 URL schema、SSH、子命令 |
| `run()` | 创建 Commander 程序，注册 100+ 选项 |
| `getInputPrompt()` | 解析 stdin 输入（text / stream-json） |
| `startDeferredPrefetches()` | 启动延迟预取（技能索引、MCP、模型成本） |
| `logSessionTelemetry()` | 记录会话遥测 |
| `runMigrations()` | 执行模型字符串迁移 |

### 交互模式核心路径

```
run() 的 action handler
  ↓
setup() → 会话初始化
  ↓
加载命令 (commands.ts)
加载工具 (tools.ts)
加载 MCP 配置
  ↓
createRoot() → Ink 根实例
  ↓
showSetupScreens()
  ├─ trust 对话框
  ├─ API key 确认
  ├─ 权限模式确认
  └─ 入职引导
  ↓
validateForceLoginOrg()
  ↓
initializeLspServerManager()
  ↓
initializeVersionedPlugins()（异步）
  ↓
launchRepl() → 渲染 <App><REPL/></App>
```

## setup.ts — 会话初始化

```typescript
export async function setup(
  cwd, permissionMode, allowDangerouslySkipPermissions,
  worktreeEnabled, worktreeName, tmuxEnabled,
  customSessionId?, worktreePRNumber?, messagingSocketPath?,
): Promise<void>
```

### 处理顺序

1. Node.js 版本检查（≥ 18）
2. 自定义会话 ID 设置
3. UDS 消息传递初始化（agent swarms）
4. 队友快照捕获
5. 终端备份恢复（iTerm2 / Terminal.app）
6. Git 仓库初始化
7. 文件变更监视器
8. 钩子配置快照
9. Worktree 创建 + tmux 会话

## replLauncher.tsx — REPL 启动器

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

动态导入 App 和 REPL 以减少初始加载时间。`renderAndRun` 由 `interactiveHelpers.tsx` 提供，渲染 UI 并等待用户退出。
