# Agent Loop：Claude Code 的核心

## 概述

Agent Loop 是驱动 Claude Code 整个交互模型的核心执行引擎。它实现了一个连续的"感知 → 思考 → 行动"循环，处理用户请求、与外部 API 协调、管理工具执行并处理上下文管理。

## 架构

```
┌─────────────────────────────────────────────────────┐
│              User Request / Message                 │
└─────────────────────┬───────────────────────────────┘
                      ↓
        ┌─────────────────────────────────┐
        │   Message Normalization         │
        │ • Parse user input              │
        │ • Merge with conversation state │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Build System Prompt             │
        │ • Dynamic prompt generation     │
        │ • Include available tools       │
        │ • Context integration           │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ API Call to Claude              │
        │ • Stream response               │
        │ • Token tracking                │
        │ • Prompt caching                │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Parse Streaming Response        │
        │ • Extract tool calls            │
        │ • Collect text blocks           │
        │ • Build message object          │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Tool Execution (Concurrent)     │
        │ • Check permissions             │
        │ • Run tools in parallel         │
        │ • Collect results               │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Context Management              │
        │ • Check token usage             │
        │ • Trigger compaction if needed  │
        │ • Update message history        │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │ Should Continue?                │
        │ • All tools complete?           │
        │ • Budget remaining?             │
        │ • Loop again for next turn      │
        └─────────────────┬───────────────┘
                          ↓
        ┌─────────────────────────────────┐
        │     Return Results to User      │
        └─────────────────────────────────┘
```

## 关键组件

### 1. 查询引擎 (`src/query.ts`)

Agent Loop 的主要入口点和协调器。`query()` 函数：

- **接收**包含系统提示、消息和约束的配置对象
- **管理**多个循环迭代直到完成或预算耗尽
- **协调**工具执行、上下文压缩和结果聚合
- **跟踪**所有 API 调用的令牌使用情况

```typescript
query(config: QueryConfig): Promise<QueryResult>
```

**关键职责：**
- 初始化查询状态和令牌预算
- 为每次迭代构建完整的消息数组
- 使用流式传输调用 Claude API
- 解析和处理工具使用块
- 执行工具并集成结果
- 检测循环终止条件

### 2. 消息规范化

将用户输入转换为标准格式：
- 合并来自 UI 的待处理消息
- 验证消息结构
- 处理特殊消息类型（系统、用户、助手）
- 为 API 提交做准备

### 3. 系统提示构造

动态构建发送给 Claude 的提示：

**组件：**
1. **基础系统提示** - Claude Code 行为的核心指令
2. **工具定义** - OpenAI 兼容的工具架构
3. **权限规则** - 当前访问约束
4. **上下文** - 最近的相关信息
5. **功能** - 启用的实验性功能

工具通过 API 请求中的 `tools` 参数公开：
```typescript
{
  tools: [
    {
      name: "Bash",
      description: "Execute bash commands...",
      input_schema: {
        type: "object",
        properties: { /* ... */ }
      }
    },
    // More tools...
  ]
}
```

### 4. StreamingToolExecutor

管理单个 API 响应中调用的多个工具的并发执行：

**功能：**
- 使用 `Promise.all()` 进行非阻塞并行执行
- 处理工具权限检查
- 优雅地捕获和报告错误
- 将结果集成回消息流
- 支持每个工具的超时限制
- 维护顺序依赖关系的执行顺序

```typescript
// Multiple tool calls executed in parallel
const toolResults = await Promise.all(
  toolCalls.map(call => executeTool(call))
)
```

### 5. 令牌预算管理

跟踪和执行令牌消费限制：

**状态：**
- `NORMAL` - 使用预算的 < 80%
- `WARNING` - 使用 80-95% → 触发自动压缩
- `CRITICAL` - 使用 > 95% → 可能强制截断

**跟踪包括：**
- API 请求令牌（输入 + 输出）
- 工具执行成本
- 上下文压缩开销
- 缓存写入令牌（通过提示缓存更便宜）

### 6. 上下文压缩 (`autoCompact.ts`)

当令牌使用接近限制时自动压缩消息历史：

- **触发条件：** WARNING 状态或显式 `/compact` 命令
- **方法：** 总结旧工具调用，保留最近上下文
- **优点：** 允许预算内的无限对话长度
- **保留：** 任务状态、权限、最近的工作

## 循环迭代流程

### 迭代 N：

1. **准备消息**
   ```
   [system_prompt, ...conversation_history, user_message, ...tool_results]
   ```

2. **计算令牌**
   - 输入令牌：消息 + 系统提示
   - 保留输出令牌：通常为 4000
   - 对照预算进行验证

3. **API 调用**
   ```typescript
   const response = await client.messages.create({
     model: "claude-3-5-sonnet-20241022",
     max_tokens: reservedOutputTokens,
     system: systemPrompt,
     tools: toolDefinitions,
     messages: messageHistory
   })
   ```

4. **流式处理**
   - 收集文本内容块
   - 提取 tool_use 块
   - 构建响应消息

5. **工具执行**
   ```
   For each tool_use:
     - Check permissions (may prompt user)
     - Execute tool concurrently
     - Collect results
     - Add tool_result blocks
   ```

6. **继续检查**
   ```
   if (response.stop_reason === "end_turn"):
     return completed
   elif (response.stop_reason === "tool_use"):
     next_iteration = true
   elif (tokens_remaining < reserve):
     autoCompact() and continue
   else:
     return error
   ```

7. **下一次迭代**（如果继续）
   - 将当前消息和工具结果添加到历史
   - 循环回到第 1 步

## 状态管理

Agent Loop 维护多个关键状态变量：

```typescript
interface QueryState {
  messages: Message[]              // Conversation history
  usedTokens: number              // Running total
  budgetTokens: number            // Max allowed
  toolResults: ToolResult[]       // Current iteration results
  loopIteration: number           // Track attempts
  compactedAt?: Message           // Last compression point
  isCompacting: boolean           // Compression in progress
}
```

## 多Agent 交互

当工具执行包括生成子 Agent 时：

1. **父查询循环**暂停
2. **子 Agent** 获得自己的隔离上下文（通过 AsyncLocalStorage）
3. **子 Agent** 运行自己完整的查询循环
4. **结果**作为工具结果返回给父 Agent
5. **父 Agent** 继续处理合成输出

这种嵌套是无限的 - 子 Agent 可以生成他们自己的子 Agent。

## 错误处理

循环优雅地处理各种故障模式：

| 错误类型 | 恢复方式 |
|-----------|----------|
| 工具权限被拒绝 | 跳过工具，继续 |
| 工具执行失败 | 捕获错误，返回给 API |
| API 超时 | 使用减少的预算重试 |
| 无效的响应格式 | 记录错误，终止循环 |
| 预算耗尽 | 强制完成，警告用户 |

## 性能优化

### 1. 提示缓存
- 首个请求：完整系统提示和工具（创建缓存）
- 后续请求：引用缓存密钥（更便宜的令牌）
- 在 Agent 层级之间共享（父 Agent ↔ 子 Agent）

### 2. 并发工具执行
- 单个响应中的所有工具并行运行
- 减少实际运行时间 vs. 顺序执行

### 3. 上下文压缩
- 在接近令牌限制时自动进行
- 在摘要中保留语义信息
- 允许无限对话长度

### 4. 延迟初始化
- 工具按需加载
- 功能基于配置启用
- 减少启动开销

## 配置与自定义

Agent Loop 行为通过以下方式控制：

1. **环境变量**
   - `CLAUDE_COMPUTE_BUDGET` - 令牌限制
   - `EXPERIMENTAL_FEATURES` - 功能标志

2. **运行时选项**
   - 系统提示模板
   - 工具定义
   - 权限规则
   - 预算分配

3. **Hooks**
   - `on_loop_start` - 在首次迭代前调用
   - `on_iteration_complete` - 每次迭代后调用
   - `on_context_compact` - 压缩期间调用

## 示例

### 单个工具的简单查询
```
User: "What's in this file?"
  ↓ query(...)
  [API call with FileReadTool]
    ↓ API returns: tool_use(FileReadTool, path="file.txt")
  [Execute FileReadTool]
    ↓ Tool returns: file contents
  [API call with tool result]
    ↓ API returns: text response (stop_reason=end_turn)
  [Return result to user]
```

### 多次迭代的复杂查询
```
User: "Analyze this bug and propose a fix"
  ↓ [Iteration 1: API plans approach, calls FileReadTool]
  ↓ [Iteration 2: API analyzes code, calls GrepTool for similar patterns]
  ↓ [Iteration 3: API writes fix, calls FileEditTool]
  ↓ [Iteration 4: API verifies, calls BashTool to run tests]
  ↓ [API generates summary response]
  [Return to user]
```

### 上下文压缩场景
```
Long conversation: 20+ messages, 50,000 tokens used
  ↓ New user message arrives
  ↓ Query engine calculates: 45,000 used of 100,000 budget
  ↓ WARNING state triggered (45% buffer for this iteration)
  ↓ autoCompact() summarizes old tool calls
  ↓ Message history compressed to 25,000 tokens
  ↓ Continues normally with freed capacity
```

## 关键文件

| 文件 | 用途 |
|------|---------|
| `src/query.ts` | 主查询引擎和循环协调 |
| `src/QueryEngine.ts` | 初始化和配置 |
| `src/query/transitions.ts` | 状态转换逻辑 |
| `src/query/tokenBudget.ts` | 令牌跟踪和预算执行 |
| `src/services/tools/StreamingToolExecutor.ts` | 并发工具执行 |
| `src/services/compact/autoCompact.ts` | 上下文压缩逻辑 |

## 另请参见

- [Tool Use System](../core/tool-use.md) - 如何调用工具
- [Context Compaction](../concepts/context-compact.md) - 压缩机制
- [Subagents](../concepts/subagents.md) - 嵌套 Agent 执行
- [Tasks and TodoWrite](../tasks/tasks.md) - 任务管理集成
