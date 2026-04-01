# 整体架构概览

## 代码规模

- **总行数**: ~206,000 行 TypeScript/TSX
- **核心组件**: 140+ 个 React 组件
- **工具**: 50+ 个工具实现
- **命令**: 88+ 个斜杠命令
- **工具函数**: 200+ 个文件（33 个子目录）

## 架构层次

```
┌────────────────────────────────────────────────────┐
│                    CLI 入口                         │
│           entrypoints/cli.tsx → main.tsx            │
├────────────────────────────────────────────────────┤
│                    命令层                           │
│       commands.ts (注册表) + commands/ (实现)       │
├────────────────────────────────────────────────────┤
│                    查询引擎                         │
│         query.ts + QueryEngine.ts                  │
│       消息处理 → API 调用 → 工具执行 → 压缩        │
├────────────────────────────────────────────────────┤
│                    工具层                           │
│      Tool.ts (基类) + tools.ts (组装) + tools/     │
│   Bash | Edit | Read | Write | Grep | Agent | ...  │
├──────────────────────┬─────────────────────────────┤
│      UI 层           │        服务层                │
│  ink/ (自定义渲染器)  │   services/api/ (API 客户端) │
│  components/ (组件)  │   services/mcp/ (MCP 协议)   │
│  screens/ (屏幕)     │   services/analytics/ (分析)  │
│  state/ (状态管理)   │   services/oauth/ (认证)      │
├──────────────────────┴─────────────────────────────┤
│                   基础设施                          │
│  utils/ | constants/ | types/ | bootstrap/         │
│  skills/ | plugins/ | keybindings/ | hooks/         │
└────────────────────────────────────────────────────┘
```

## 启动流程

```
entrypoints/cli.tsx
  │
  ├─ --version → 直接输出版本号（零导入）
  ├─ --help → 加载 main.tsx → Commander 帮助
  ├─ 特殊模式 → bridge / daemon / bg sessions / templates
  │
  └─ 默认路径
      │
      main.tsx::main()
        │
        ├─ 并行预取: MDM 设置 + macOS 钥匙链
        │
        ├─ run() → 创建 Commander 程序
        │   │
        │   ├─ preAction 钩子:
        │   │   ├─ 等待 MDM + 钥匙链加载
        │   │   ├─ init() → 配置、网络、代理、TLS
        │   │   ├─ 初始化日志 sinks
        │   │   ├─ 加载远程设置 + 策略限制
        │   │   └─ 运行迁移
        │   │
        │   └─ 注册 100+ 命令行选项和子命令
        │
        ├─ setup() → 会话初始化
        │   ├─ UDS 消息传递
        │   ├─ 终端备份恢复
        │   ├─ Git 仓库初始化
        │   └─ 文件监视器 + 钩子快照
        │
        ├─ 加载命令 + 工具 + MCP 配置
        │
        └─ 分支:
            ├─ 非交互 (-p) → print.ts → runHeadless()
            └─ 交互模式 → showSetupScreens() → launchRepl()
                             │
                             ├─ API Key 确认对话框
                             ├─ 权限模式确认
                             └─ 渲染 <App><REPL/></App>
```

## 核心数据流

### 用户查询处理

```
用户输入
  ↓
命令解析（/ 开头 → 命令分发，否则 → 查询）
  ↓
QueryEngine 配置
  ├─ 系统提示构建（context.ts）
  ├─ 消息历史规范化
  ├─ 工具列表组装
  └─ Token 预算计算
  ↓
API 调用（services/api/claude.ts）
  ├─ 流式响应处理
  ├─ 工具调用检测
  └─ 成本追踪
  ↓
工具执行（如 BashTool、FileEditTool）
  ├─ 输入验证
  ├─ 权限检查 → 用户确认（如需）
  ├─ 执行操作
  └─ 结果格式化
  ↓
结果回传 → 下一轮 API 调用（多轮循环）
  ↓
最终响应 → UI 渲染
  ↓
可选: 自动压缩（Token 超过阈值时）
```

### 权限检查流程

```
工具调用请求
  ↓
输入 Schema 验证（Zod）
  ↓
权限规则匹配
  ├─ alwaysAllowRules → 直接通过
  ├─ alwaysDenyRules → 直接拒绝
  └─ 默认 → 询问用户
  ↓
权限模式判断
  ├─ bypassPermissions → 跳过所有检查
  ├─ plan → 只读操作自动通过
  ├─ acceptEdits → 编辑自动通过
  └─ default → 按规则处理
  ↓
用户确认对话框（如需）
  ↓
执行工具
```

### 会话压缩流程

```
监控 Token 使用量
  ↓
达到阈值（~70% 上下文窗口）
  ↓
执行 preCompaction 钩子
  ↓
分析消息历史 → 选择压缩边界
  ↓
创建子查询生成摘要
  ↓
插入 CompactBoundaryMessage
  ↓
替换旧消息 + 保留边界后的消息
  ↓
执行 postCompaction 钩子
```

## 关键设计模式

| 模式 | 应用场景 |
|------|---------|
| **Memoization** | 命令加载、上下文构建、技能索引 |
| **Feature Gates** | `feature()` 条件编译（KAIROS、BRIDGE_MODE 等） |
| **权限上下文** | 工具执行前的多层权限验证 |
| **流式处理** | API 响应、JSON 输出、工具进度 |
| **优雅关闭** | 清理注册表、资源释放 |
| **并行预取** | 启动时并行加载（MDM、钥匙链、API 预连接） |
| **故障打开** | 策略限制、远程设置获取失败时继续运行 |
| **延迟导入** | 大模块按需加载（print.ts、REPL.js） |
