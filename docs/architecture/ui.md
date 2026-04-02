# UI Layer

## Custom Ink Renderer (`src/ink/`)

Claude Code uses a custom React-to-Terminal rendering engine that **does not depend on npm's `ink` package**.

### Core Architecture

```
React Component Tree
  ↓
React Reconciler (react-reconciler)
  ↓
Virtual DOM Tree (dom.ts)
  ↓
Yoga Layout Calculation (layout/yoga.ts) — Pure TypeScript implementation
  ↓
Render Nodes to Output (render-node-to-output.ts)
  ↓
Virtual Screen (screen.ts) — Differential rendering
  ↓
ANSI Escape Sequences → Terminal Output
```

### Directory Structure

```
src/ink/
├── ink.tsx              # Core Ink class (251KB) — lifecycle, render loop
├── reconciler.ts        # React Reconciler configuration
├── renderer.ts          # Rendering pipeline
├── dom.ts               # Virtual DOM node management
├── screen.ts            # Virtual screen + differential rendering
├── output.ts            # Output buffer management
├── selection.ts         # Text selection logic
├── styles.ts            # ANSI style handling
├── render-node-to-output.ts  # Node → output conversion
├── Ansi.tsx             # ANSI code handling
│
├── components/          # Built-in components
│   ├── App.tsx          # Root component (98KB)
│   ├── Box.tsx          # Layout container (Yoga flexbox)
│   ├── Text.tsx         # Text element
│   ├── ScrollBox.tsx    # Scrollable container
│   ├── Button.tsx       # Interactive button
│   ├── Link.tsx         # Hyperlink (OSC 8)
│   ├── RawAnsi.tsx      # Raw ANSI output
│   ├── NoSelect.tsx     # Non-selectable area
│   └── ErrorOverview.tsx # Error display
│
├── hooks/               # Custom Hooks
│   ├── use-input.ts     # Keyboard input (supports arrow keys, modifiers)
│   ├── use-stdin.ts     # stdin raw stream
│   ├── use-app.ts       # App context
│   ├── use-animation-frame.ts  # Animation frame
│   ├── use-selection.ts # Text selection
│   ├── use-tab-status.ts # Tab focus status
│   └── use-terminal-viewport.ts # Viewport size
│
├── layout/              # Layout engine
│   ├── yoga.ts          # Yoga interface adapter
│   ├── engine.ts        # Layout calculation engine
│   ├── node.ts          # Layout node
│   └── geometry.ts      # Geometry calculations
│
└── termio/              # Terminal I/O
    ├── parser.ts        # Input parsing
    ├── csi.ts           # CSI control sequences
    ├── dec.ts           # DEC private sequences
    ├── osc.ts           # OSC operating system commands
    └── sgr.ts           # SGR style parameters
```

### Yoga Layout Engine

Uses pure TypeScript implementation from `src/native-ts/yoga-layout/` (not C++ bindings), supports:
- flex-direction (row/column/reverse)
- flex-grow / flex-shrink / flex-basis
- align-items / justify-content
- margin / padding / border / gap
- position (relative/absolute)
- display (flex/none/contents)
- flex-wrap (wrap/wrap-reverse)
- Custom measure function (text node width measurement)

## ink.ts — Public API

```typescript
export async function render(node: ReactNode, options?: RenderOptions): Promise<Instance>
export async function createRoot(options?: RenderOptions): Promise<Root>

// Theme-aware components (auto-inherit current theme)
export { default as Box }   // ThemedBox
export { default as Text }  // ThemedText

// Base components
export { BaseBox, Button, Link, Spacer, BaseText, Ansi, RawAnsi, NoSelect }

// Hooks
export { useInput, useStdin, useApp, useAnimation, useInterval, useSelection }
export { useTerminalViewport, useTerminalTitle, useTerminalFocus, useTabStatus }

// Events
export { InputEvent, Event, ClickEvent, FocusManager }
```

All rendering automatically wraps with `ThemeProvider`.

## React Component Hierarchy (`src/components/`)

```
App.tsx                      # Top-level wrapper (FPS, Stats, AppState)
├── REPL.tsx (screens/)      # Main interaction screen (895KB)
│   ├── Messages.tsx         # Message list container
│   │   └── MessageRow.tsx   # Single message
│   │       └── Message.tsx  # Message content rendering
│   │           ├── messages/UserTextMessage
│   │           ├── messages/AssistantTextMessage
│   │           ├── messages/AssistantThinkingMessage
│   │           ├── messages/AssistantToolUseMessage
│   │           ├── messages/SystemTextMessage
│   │           └── ...(20+ message type components)
│   ├── PromptInput/         # Input box component
│   ├── Spinner.tsx          # Loading/thinking indicator
│   ├── StatusLine.tsx       # Bottom status bar
│   └── StructuredDiff/      # Code diff rendering
├── Doctor.tsx (screens/)    # Health check screen
└── ResumeConversation.tsx   # Session recovery screen
```

### Key Components

| Component | Size | Function |
|-----------|------|----------|
| **REPL.tsx** | 895KB | Main loop: input handling, message management, tool invocation, MCP, session persistence |
| **App.tsx** | 98KB | Ink root component: state provision, error boundary, global events |
| **Messages.tsx** | 147KB | Message list: virtual scrolling, message grouping, collapsing |
| **Spinner.tsx** | 87KB | Progress indicator: thinking, responding, tool use |
| **Message.tsx** | 34KB | Message rendering dispatch: select render component by type |
| **StatusLine.tsx** | 49KB | Status bar: model, tokens, cost, Vim mode |

### Component Subdirectories

```
components/
├── agents/              # Agent-related UI
├── design-system/       # UI design system
├── diff/                # Diff rendering
├── mcp/                 # MCP server management UI
├── messages/            # Message type components (20+)
├── permissions/         # Permission dialogs (17 subdirectories)
├── settings/            # Settings editing UI
├── tasks/               # Task list UI
├── PromptInput/         # Input box
├── StructuredDiff/      # Structured diff
├── FeedbackSurvey/      # Feedback survey
├── wizard/              # Wizard flow
└── ...
```

## State Management (`src/state/`)

Uses **Zustand** state store + **React Context**.

```typescript
// AppState core fields
type AppState = {
  messages: Message[]
  toolPermissionContext: ToolPermissionContext
  mcp: { clients, tools, commands, resources }
  tasks: Record<string, TaskStateBase>
  effortValue: EffortValue
  fastMode: boolean
  thinkingEnabled: boolean
  // ... more fields
}
```

| File | Function |
|------|----------|
| `AppState.tsx` | State Provider + useAppState hook |
| `AppStateStore.ts` | Zustand store definition + operation functions |
| `onChangeAppState.ts` | State change listener |
| `selectors.ts` | Selector functions |

## Keyboard Shortcuts (`src/keybindings/`)

| File | Function |
|------|----------|
| `defaultBindings.ts` | Default shortcut definitions |
| `loadUserBindings.ts` | User custom loading (`~/.claude/keybindings.json`) |
| `KeybindingContext.tsx` | Shortcut context Provider |
| `resolver.ts` | Shortcut resolver |
| `parser.ts` | Key sequence parsing |
| `match.ts` | Matching algorithm |
| `validate.ts` | Configuration validation |

Supports chord shortcuts (e.g., `Ctrl+K Ctrl+S`) and context bindings (different shortcuts in different scenarios).
