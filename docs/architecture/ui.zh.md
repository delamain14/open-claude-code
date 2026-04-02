# UI 层

## 自定义 Ink 渲染器 (`src/ink/`)

Claude Code 使用自定义的 React-to-Terminal 渲染引擎，**不依赖 npm 的 `ink` 包**。

### 核心架构

```
React 组件树
  ↓
React Reconciler (react-reconciler)
  ↓
虚拟 DOM 树 (dom.ts)
  ↓
Yoga 布局计算 (layout/yoga.ts) — 纯 TS 实现
  ↓
渲染节点到输出 (render-node-to-output.ts)
  ↓
虚拟屏幕 (screen.ts) — 差分渲染
  ↓
ANSI 转义序列 → 终端输出
```

### 目录结构

```
src/ink/
├── ink.tsx              # 核心 Ink 类（251KB）—— 生命周期、渲染循环
├── reconciler.ts        # React Reconciler 配置
├── renderer.ts          # 渲染管道
├── dom.ts               # 虚拟 DOM 节点管理
├── screen.ts            # 虚拟屏幕 + 差分渲染
├── output.ts            # 输出缓冲管理
├── selection.ts         # 文本选择逻辑
├── styles.ts            # ANSI 样式处理
├── render-node-to-output.ts  # 节点→输出转换
├── Ansi.tsx             # ANSI 代码处理
│
├── components/          # 内置组件
│   ├── App.tsx          # 根组件（98KB）
│   ├── Box.tsx          # 布局容器（Yoga flexbox）
│   ├── Text.tsx         # 文本元素
│   ├── ScrollBox.tsx    # 可滚动容器
│   ├── Button.tsx       # 交互按钮
│   ├── Link.tsx         # 超链接（OSC 8）
│   ├── RawAnsi.tsx      # 原始 ANSI 输出
│   ├── NoSelect.tsx     # 不可选择区域
│   └── ErrorOverview.tsx # 错误展示
│
├── hooks/               # 自定义 Hooks
│   ├── use-input.ts     # 键盘输入（支持方向键、修饰键）
│   ├── use-stdin.ts     # stdin 原始流
│   ├── use-app.ts       # 应用上下文
│   ├── use-animation-frame.ts  # 动画帧
│   ├── use-selection.ts # 文本选择
│   ├── use-tab-status.ts # Tab 焦点状态
│   └── use-terminal-viewport.ts # 视口尺寸
│
├── layout/              # 布局引擎
│   ├── yoga.ts          # Yoga 接口适配
│   ├── engine.ts        # 布局计算引擎
│   ├── node.ts          # 布局节点
│   └── geometry.ts      # 几何计算
│
└── termio/              # 终端 I/O
    ├── parser.ts        # 输入解析
    ├── csi.ts           # CSI 控制序列
    ├── dec.ts           # DEC 私有序列
    ├── osc.ts           # OSC 操作系统命令
    └── sgr.ts           # SGR 样式参数
```

### Yoga 布局引擎

使用 `src/native-ts/yoga-layout/` 的纯 TypeScript 实现（非 C++ 绑定），支持：
- flex-direction（row/column/reverse）
- flex-grow / flex-shrink / flex-basis
- align-items / justify-content
- margin / padding / border / gap
- position（relative/absolute）
- display（flex/none/contents）
- flex-wrap（wrap/wrap-reverse）
- 自定义 measure 函数（文本节点宽度测量）

## ink.ts — 公共 API

```typescript
export async function render(node: ReactNode, options?: RenderOptions): Promise<Instance>
export async function createRoot(options?: RenderOptions): Promise<Root>

// 主题感知组件（自动继承当前主题）
export { default as Box }   // ThemedBox
export { default as Text }  // ThemedText

// 基础组件
export { BaseBox, Button, Link, Spacer, BaseText, Ansi, RawAnsi, NoSelect }

// Hooks
export { useInput, useStdin, useApp, useAnimation, useInterval, useSelection }
export { useTerminalViewport, useTerminalTitle, useTerminalFocus, useTabStatus }

// 事件
export { InputEvent, Event, ClickEvent, FocusManager }
```

所有渲染自动包裹 `ThemeProvider`。

## React 组件层次 (`src/components/`)

```
App.tsx                      # 顶层包装器（FPS、Stats、AppState）
├── REPL.tsx (screens/)      # 主交互屏幕（895KB）
│   ├── Messages.tsx         # 消息列表容器
│   │   └── MessageRow.tsx   # 单条消息
│   │       └── Message.tsx  # 消息内容渲染
│   │           ├── messages/UserTextMessage
│   │           ├── messages/AssistantTextMessage
│   │           ├── messages/AssistantThinkingMessage
│   │           ├── messages/AssistantToolUseMessage
│   │           ├── messages/SystemTextMessage
│   │           └── ...（20+ 消息类型组件）
│   ├── PromptInput/         # 输入框组件
│   ├── Spinner.tsx          # 加载/思考指示器
│   ├── StatusLine.tsx       # 底部状态栏
│   └── StructuredDiff/      # 代码差异渲染
├── Doctor.tsx (screens/)    # 健康检查屏幕
└── ResumeConversation.tsx   # 会话恢复屏幕
```

### 关键组件

| 组件 | 大小 | 功能 |
|------|------|------|
| **REPL.tsx** | 895KB | 主循环：输入处理、消息管理、工具调用、MCP、会话持久化 |
| **App.tsx** | 98KB | Ink 根组件：状态提供、错误边界、全局事件 |
| **Messages.tsx** | 147KB | 消息列表：虚拟滚动、消息分组、折叠 |
| **Spinner.tsx** | 87KB | 进度指示：thinking、responding、tool use |
| **Message.tsx** | 34KB | 消息渲染分发：根据类型选择渲染组件 |
| **StatusLine.tsx** | 49KB | 状态栏：模型、Token、成本、Vim 模式 |

### 组件子目录

```
components/
├── agents/              # Agent 相关 UI
├── design-system/       # UI 设计系统
├── diff/                # Diff 渲染
├── mcp/                 # MCP 服务器管理 UI
├── messages/            # 消息类型组件（20+）
├── permissions/         # 权限对话框（17 个子目录）
├── settings/            # 设置编辑 UI
├── tasks/               # 任务列表 UI
├── PromptInput/         # 输入框
├── StructuredDiff/      # 结构化差异
├── FeedbackSurvey/      # 反馈调查
├── wizard/              # 向导流程
└── ...
```

## 状态管理 (`src/state/`)

使用 **Zustand** 状态存储 + **React Context**。

```typescript
// AppState 核心字段
type AppState = {
  messages: Message[]
  toolPermissionContext: ToolPermissionContext
  mcp: { clients, tools, commands, resources }
  tasks: Record<string, TaskStateBase>
  effortValue: EffortValue
  fastMode: boolean
  thinkingEnabled: boolean
  // ... 更多字段
}
```

| 文件 | 功能 |
|------|------|
| `AppState.tsx` | 状态 Provider + useAppState hook |
| `AppStateStore.ts` | Zustand store 定义 + 操作函数 |
| `onChangeAppState.ts` | 状态变更监听 |
| `selectors.ts` | 选择器函数 |

## 键盘快捷键 (`src/keybindings/`)

| 文件 | 功能 |
|------|------|
| `defaultBindings.ts` | 默认快捷键定义 |
| `loadUserBindings.ts` | 用户自定义加载（`~/.claude/keybindings.json`） |
| `KeybindingContext.tsx` | 快捷键上下文 Provider |
| `resolver.ts` | 快捷键解析器 |
| `parser.ts` | 按键序列解析 |
| `match.ts` | 匹配算法 |
| `validate.ts` | 配置验证 |

支持 chord 快捷键（如 `Ctrl+K Ctrl+S`）和上下文绑定（不同场景不同快捷键）。
