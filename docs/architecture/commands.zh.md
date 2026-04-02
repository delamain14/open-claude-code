# 命令系统

## 命令类型

```typescript
type Command = CommandBase & (PromptCommand | LocalCommand | LocalJSXCommand)

// Prompt: 生成提示文本供模型处理
type PromptCommand = {
  type: 'prompt'
  getPromptForCommand(args, context): Promise<ContentBlockParam[]>
  progressMessage: string
  contentLength: number
  allowedTools?: string[]
}

// Local command: 直接执行并返回文本结果
type LocalCommand = {
  type: 'local'
  supportsNonInteractive: boolean
  load(): Promise<{ call: LocalCommandCall }>
}

// Local JSX command: 渲染 React 组件
type LocalJSXCommand = {
  type: 'local-jsx'
  load(): Promise<{ call: LocalJSXCommandCall }>
}
```

## 命令加载流程

```
getCommands(cwd)
  ↓
loadAllCommands(cwd)  [memoized]
  ├─ getBundledSkills()          # 内置技能
  ├─ getBuiltinPluginSkillCommands()  # 内置插件技能
  ├─ getSkillDirCommands(cwd)    # 技能目录
  ├─ getWorkflowCommands(cwd)    # 工作流命令
  ├─ getPluginCommands()         # 插件命令
  ├─ getPluginSkills()           # 插件技能
  └─ COMMANDS()                  # 内置命令
  ↓
过滤: meetsAvailabilityRequirement() + isCommandEnabled()
  ↓
合并动态技能: getDynamicSkills()
```

## 命令分类

### 会话管理

| 命令 | 类型 | 功能 |
|------|------|------|
| `/help` | local | 显示帮助信息 |
| `/clear` | local | 清除屏幕 |
| `/compact` | local | 手动压缩上下文 |
| `/exit` | local | 退出 CLI |
| `/resume` | local-jsx | 恢复历史会话 |
| `/session` | local-jsx | 会话管理（QR码、URL） |
| `/status` | local | 显示当前状态 |
| `/cost` | local | 显示 API 成本 |

### 开发工具

| 命令 | 类型 | 功能 |
|------|------|------|
| `/commit` | prompt | 引导式 Git 提交 |
| `/diff` | local | 显示代码差异 |
| `/branch` | local-jsx | 分支管理 |
| `/review` | prompt | 代码审查 |
| `/pr_comments` | prompt | PR 评论处理 |
| `/files` | local | 列出追踪的文件 |
| `/rewind` | local-jsx | 撤销更改 |
| `/init` | prompt | 初始化项目 |

### 配置与设置

| 命令 | 类型 | 功能 |
|------|------|------|
| `/config` | local-jsx | 编辑设置 |
| `/model` | local-jsx | 选择模型 |
| `/theme` | local-jsx | 选择主题 |
| `/color` | local-jsx | 选择 agent 颜色 |
| `/keybindings` | local-jsx | 键盘快捷键 |
| `/permissions` | local-jsx | 权限管理 |
| `/vim` | local | 切换 Vim 模式 |
| `/effort` | local | 调整努力级别 |
| `/output-style` | local-jsx | 输出样式 |
| `/statusline` | local | 状态栏开关 |
| `/fast` | local | 快速模式开关 |

### 扩展管理

| 命令 | 类型 | 功能 |
|------|------|------|
| `/mcp` | local-jsx | MCP 服务器管理 |
| `/plugin` | local-jsx | 插件管理 |
| `/skills` | local-jsx | 技能浏览 |
| `/reload-plugins` | local | 重新加载插件 |
| `/agents` | local | 列出 agent |
| `/hooks` | local-jsx | 钩子管理 |

### 计划与任务

| 命令 | 类型 | 功能 |
|------|------|------|
| `/plan` | local | 计划模式开关 |
| `/tasks` | local-jsx | 任务列表管理 |

### 认证

| 命令 | 类型 | 功能 |
|------|------|------|
| `/login` | local-jsx | OAuth/API Key 登录 |
| `/logout` | local | 注销 |

### 信息

| 命令 | 类型 | 功能 |
|------|------|------|
| `/usage` | local | Token 使用统计 |
| `/doctor` | local-jsx | 健康检查 |
| `/upgrade` | local | 检查更新 |
| `/release-notes` | local | 显示更新日志 |
| `/feedback` | prompt | 发送反馈 |
| `/copy` | local | 复制上一条消息 |
| `/stats` | local-jsx | 会话统计图表 |

### 其他

| 命令 | 类型 | 功能 |
|------|------|------|
| `/memory` | prompt | 管理记忆 |
| `/context` | local-jsx | 上下文管理 |
| `/add-dir` | local | 添加工作目录 |
| `/desktop` | local | 桌面应用集成 |
| `/mobile` | local-jsx | 移动端 QR 码 |
| `/ide` | local-jsx | IDE 集成 |
| `/export` | local | 导出会话 |
| `/tag` | local | 会话标签 |

### 内部命令（仅 Anthropic 员工）

`ant-trace`, `autofix-pr`, `backfill-sessions`, `break-cache`, `bughunter`, `ctx_viz`, `debug-tool-call`, `env`, `good-claude`, `issue`, `mock-limits`, `oauth-refresh`, `onboarding`, `perf-issue`, `reset-limits`, `share`, `summary`, `teleport`

在恢复版中这些命令返回"不可用"提示。

### Feature-Gated 命令

| 命令 | Feature Gate |
|------|-------------|
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

## 特殊命令集合

### REMOTE_SAFE_COMMANDS

远程模式（CCR）下安全的命令：`session`, `exit`, `clear`, `help`, `theme`, `color`, `vim`, `cost`, `usage`, `copy`, `btw`, `feedback`, `plan`, `keybindings`, `statusline`, `stickers`, `mobile`

### BRIDGE_SAFE_COMMANDS

移动/网络客户端可执行的命令：`compact`, `clear`, `cost`, `summary`, `release-notes`, `files`
