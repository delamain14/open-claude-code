# 工具函数库

`src/utils/` 包含 33 个子目录、200+ 个文件的工具函数库。

## 目录分类索引

### 认证与安全

| 文件/目录 | 功能 |
|----------|------|
| `auth.ts` (65KB) | OAuth/API Key 认证、Token 管理、提供者检测 |
| `authPortable.ts` | 便携式认证函数（API Key 规范化） |
| `authFileDescriptor.ts` | 文件描述符 Token 读取 |
| `secureStorage/` | 安全存储（macOS Keychain、明文回退） |
| `sessionIngressAuth.ts` | 会话入口认证 |
| `mtls.ts` | mTLS 证书配置 |
| `caCerts.ts` / `caCertsConfig.ts` | CA 证书管理 |
| `proxy.ts` | HTTP/HTTPS 代理配置 |

### 模型与 API

| 文件/目录 | 功能 |
|----------|------|
| `model/` | 模型选择、能力检测、配置 |
| `model/model.ts` | 默认模型、用户覆盖、解析 |
| `model/configs.ts` | 所有模型配置（ID、别名、上下文窗口） |
| `model/providers.ts` | Provider 检测（firstParty/bedrock/vertex/foundry） |
| `model/modelSupportOverrides.ts` | 3P 模型能力覆盖 |
| `modelCost.ts` | 模型成本计算 |
| `api.ts` | API 调用辅助函数 |
| `apiPreconnect.ts` | TCP+TLS 预连接 |
| `betas.ts` | Beta header 管理 |
| `tokens.ts` | Token 计数与预算 |
| `tokenBudget.ts` | Token 预算管理 |

### Git 与版本控制

| 文件/目录 | 功能 |
|----------|------|
| `git.ts` (30KB) | Git 操作（分支、状态、日志） |
| `gitDiff.ts` (16KB) | Diff 生成与处理 |
| `git/` | Git 子工具（stash、merge、rebase） |
| `gitSettings.ts` | Git 配置读取 |
| `commitAttribution.ts` | 提交归因（Co-Authored-By） |
| `worktree.ts` | Git worktree 管理 |
| `getWorktreePaths.ts` | Worktree 路径解析 |
| `detectRepository.ts` | 仓库检测（GitHub/GitLab） |

### 文件系统操作

| 文件/目录 | 功能 |
|----------|------|
| `file.ts` (18KB) | 文件读写、类型检测 |
| `fileHistory.ts` (34KB) | 文件变更历史追踪 |
| `fileStateCache.ts` | 文件状态缓存 |
| `fileRead.ts` | 文件读取（编码检测） |
| `fileReadCache.ts` | 文件读取缓存 |
| `filePersistence/` | 文件持久化（上传/同步） |
| `glob.ts` | Glob 模式匹配 |
| `ripgrep.ts` | ripgrep 集成 |
| `fsOperations.ts` | 原子文件操作 |
| `tempfile.ts` | 临时文件管理 |

### Shell 与命令执行

| 文件/目录 | 功能 |
|----------|------|
| `bash/` | Bash 解析器、命令分析 |
| `bash/bashParser.ts` | Bash 语法解析 |
| `bash/commands.ts` | 命令分类与安全检查 |
| `Shell.ts` (16KB) | Shell 会话管理 |
| `ShellCommand.ts` (14KB) | 命令执行封装 |
| `shell/` | Shell 检测与配置 |
| `shellConfig.ts` | Shell 配置 |
| `powershell/` | PowerShell 支持 |
| `findExecutable.ts` | 可执行文件查找 |
| `which.ts` | which 命令实现 |

### 设置与配置

| 文件/目录 | 功能 |
|----------|------|
| `config.ts` (63KB) | 配置加载/保存（`~/.claude.json`） |
| `configConstants.ts` | 配置常量 |
| `settings/` | 分层设置系统 |
| `settings/settings.ts` | 设置合并（MDM > user > project > local） |
| `settings/settingsCache.ts` | 设置缓存 |
| `settings/constants.ts` | 设置源定义 |
| `settings/types.ts` | 设置类型 |
| `settings/mdm/` | MDM（移动设备管理）设置 |
| `managedEnv.ts` | 受管环境变量 |

### 消息处理

| 文件/目录 | 功能 |
|----------|------|
| `messages.ts` (193KB) | 消息创建、规范化、过滤、序列化 |
| `messages/` | 消息类型特定处理 |
| `messageQueueManager.ts` | 消息队列（命令排队） |
| `messagePredicates.ts` | 消息类型判断 |
| `contentArray.ts` | Content block 操作 |

### 会话管理

| 文件/目录 | 功能 |
|----------|------|
| `sessionStorage.ts` (180KB) | 会话持久化（JSONL 文件） |
| `sessionStoragePortable.ts` | 便携式会话存储 |
| `sessionState.ts` | 会话运行时状态 |
| `sessionStart.ts` | 会话启动钩子 |
| `sessionActivity.ts` | 会话活动追踪 |
| `sessionTitle.ts` | 会话标题管理 |
| `sessionRestore.ts` | 会话恢复 |
| `sessionUrl.ts` | 会话 URL |
| `sessionEnvVars.ts` | 会话环境变量 |
| `conversationRecovery.ts` | 会话恢复逻辑 |

### 权限系统

| 文件/目录 | 功能 |
|----------|------|
| `permissions/` | 权限检查框架 |
| `permissions/filesystem.ts` | 文件系统权限 |
| `classifierApprovals.ts` | 分类器批准 |
| `autoModeDenials.ts` | 自动模式拒绝 |

### 遥测与诊断

| 文件/目录 | 功能 |
|----------|------|
| `telemetry/` | OpenTelemetry 集成 |
| `telemetry/instrumentation.ts` | OTLP 指标/日志/追踪 |
| `telemetry/betaSessionTracing.ts` | Beta 会话追踪 |
| `telemetryAttributes.ts` | 遥测属性 |
| `stats.ts` (33KB) | 统计数据收集 |
| `diagLogs.ts` | 诊断日志 |
| `debug.ts` | 调试日志 |
| `log.ts` | 错误日志 |
| `sinks.ts` | 日志 sink 管理 |

### MCP 支持

| 文件/目录 | 功能 |
|----------|------|
| `mcp/` | MCP 工具支持函数 |
| `mcpValidation.ts` | MCP 输入验证 |
| `mcpOutputStorage.ts` | MCP 输出存储 |
| `mcpWebSocketTransport.ts` | WebSocket 传输 |
| `mcpInstructionsDelta.ts` | MCP 指令增量 |

### 技能与插件

| 文件/目录 | 功能 |
|----------|------|
| `skills/` | 技能发现与加载 |
| `plugins/` | 插件管理工具函数 |
| `plugins/loadPluginCommands.ts` | 插件命令加载 |
| `toolSearch.ts` | 工具搜索（ToolSearch 优化） |

### 记忆系统

| 文件/目录 | 功能 |
|----------|------|
| `memory/` | 自动记忆提取与管理 |
| `claudemd.ts` | CLAUDE.md 文件解析与加载 |

### UI 辅助

| 文件/目录 | 功能 |
|----------|------|
| `format.ts` | 文本格式化 |
| `markdown.ts` | Markdown 处理 |
| `cliHighlight.ts` | CLI 语法高亮 |
| `ansiToSvg.ts` / `ansiToPng.ts` | ANSI → 图像转换 |
| `hyperlink.ts` | 终端超链接（OSC 8） |
| `theme.ts` | 主题管理 |
| `terminal.ts` | 终端检测 |
| `sliceAnsi.ts` | ANSI 字符串切片 |

### 其他

| 文件/目录 | 功能 |
|----------|------|
| `errors.ts` | 错误类型与工具函数 |
| `envUtils.ts` | 环境变量工具（isBareMode 等） |
| `sleep.ts` | 延迟函数 |
| `signal.ts` | 信号/事件系统 |
| `cleanupRegistry.ts` | 清理注册表 |
| `gracefulShutdown.ts` | 优雅关闭 |
| `platform.ts` | 平台检测 |
| `xdg.ts` | XDG 目录规范 |
| `uuid.ts` / `crypto.ts` | UUID 生成、加密 |
| `semver.ts` | 语义化版本比较 |
| `json.ts` / `yaml.ts` / `xml.ts` | 数据格式解析 |
| `zodToJsonSchema.ts` | Zod → JSON Schema 转换 |
| `diff.ts` | Diff 算法 |
| `treeify.ts` | 树形输出 |
| `CircularBuffer.ts` | 环形缓冲区 |
| `LRUCache` | 使用 `lru-cache` 包 |

## 其他顶层模块

| 目录 | 功能 |
|------|------|
| `bridge/` | IDE Bridge 远程连接（115KB bridgeMain.ts） |
| `buddy/` | AI 伙伴 UI（CompanionSprite） |
| `coordinator/` | 多 Agent 协调模式 |
| `memdir/` | 记忆目录管理 |
| `migrations/` | 配置/数据迁移 |
| `moreright/` | 权限系统核心 |
| `native-ts/` | 纯 TS 原生实现（yoga-layout、color-diff、file-index） |
| `outputStyles/` | 输出样式定义 |
| `plugins/` | 插件加载器 |
| `query/` | 查询辅助（transitions） |
| `remote/` | 远程会话管理 |
| `restoration/` | 恢复兼容层（本项目添加） |
| `skills/` | 技能加载与管理 |
| `ssh/` | SSH 连接管理 |
| `upstreamproxy/` | 上游代理（CCR） |
| `vim/` | Vim 模式实现 |
| `voice/` | 语音输入模式 |
| `server/` | HTTP 服务器 |
