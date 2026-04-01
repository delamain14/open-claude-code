# 工具 API 参考

Open Claude Code 提供了 50+ 个工具，用于处理各种开发任务。本文档介绍主要工具的 API。

## 基础工具

### Bash - 执行 Shell 命令

执行任意 bash 命令。

```typescript
// 使用方式
bun run cli bash "ls -la"

// 参数
command: string           // 要执行的命令
timeout?: number         // 超时时间（毫秒）
description?: string     // 命令描述
```

**示例**:
```bash
# 列出目录
bun run cli bash "ls -la /home/user"

# 执行 git 命令
bun run cli bash "git status"

# 带超时的命令
bun run cli bash "sleep 10" --timeout 5000
```

### Read - 读取文件

读取文件内容。

```typescript
// 参数
file_path: string        // 文件路径（绝对路径）
offset?: number         // 开始行号（可选）
limit?: number          // 读取行数（可选）
```

**示例**:
```bash
# 读取整个文件
bun run cli read "path/to/file.txt"

# 读取特定行范围
bun run cli read "path/to/file.txt" --offset 10 --limit 20
```

### Write - 创建/写入文件

创建或覆盖文件。

```typescript
// 参数
file_path: string        // 文件路径（绝对路径）
content: string         // 文件内容
```

**示例**:
```bash
bun run cli write "output.txt" "Hello, World!"
```

### Edit - 编辑文件

在文件中进行精确的字符串替换。

```typescript
// 参数
file_path: string        // 文件路径
old_string: string      // 要替换的内容
new_string: string      // 新内容
replace_all?: boolean   // 是否替换所有（默认 false）
```

**示例**:
```bash
# 单次替换
bun run cli edit "app.ts" \
  --old_string "const x = 1" \
  --new_string "const x = 2"

# 替换所有
bun run cli edit "config.json" \
  --old_string "debug: false" \
  --new_string "debug: true" \
  --replace_all true
```

### Glob - 文件匹配

使用 glob 模式查找文件。

```typescript
// 参数
pattern: string         // glob 模式（如 "**/*.ts"）
path?: string          // 搜索路径（默认当前目录）
```

**示例**:
```bash
# 查找所有 TypeScript 文件
bun run cli glob "**/*.ts"

# 查找特定目录
bun run cli glob "src/**/*.tsx"

# 查找特定后缀
bun run cli glob "*.{js,ts,jsx,tsx}"
```

### Grep - 内容搜索

在文件中搜索文本（支持正则表达式）。

```typescript
// 参数
pattern: string         // 搜索模式（支持正则）
path?: string          // 搜索路径
glob?: string          // 文件过滤模式
output_mode?: string   // 输出格式：content|files_with_matches|count
```

**示例**:
```bash
# 基本搜索
bun run cli grep "function.*export" "src/"

# 搜索特定文件类型
bun run cli grep "TODO" "src/" --glob "**/*.ts"

# 只显示文件列表
bun run cli grep "error" "src/" --output_mode files_with_matches

# 显示匹配数统计
bun run cli grep "import" "src/" --output_mode count
```

## 代码分析工具

### AST - 抽象语法树分析

解析和分析代码的 AST。

```typescript
// 参数
file_path: string       // 代码文件路径
language?: string      // 编程语言（自动检测）
```

**示例**:
```bash
bun run cli ast "src/main.ts"
```

### LSP - 语言服务器协议

获取代码智能信息（类型、定义、引用等）。

```typescript
// 参数
file_path: string       // 文件路径
position: number       // 字符位置
command: string        // 命令：definition|references|hover
```

## Git 工具

### Git Branch - 管理分支

```bash
# 列出分支
bun run cli "git branch"

# 创建分支
bun run cli "git checkout -b feature/new-feature"

# 删除分支
bun run cli "git branch -d old-branch"
```

### Git Commit - 提交更改

```bash
# 查看状态
bun run cli "git status"

# 添加文件
bun run cli "git add ."

# 提交
bun run cli "git commit -m 'feat: add new feature'"

# 查看日志
bun run cli "git log --oneline -10"
```

## 代码生成和转换工具

### Agent - 运行 AI 代理

启动一个独立的 AI 代理来处理复杂任务。

```typescript
// 参数
description: string     // 任务描述（3-5 字）
prompt: string         // 详细任务说明
subagent_type: string  // 代理类型（见下表）
```

**代理类型**:
- `general-purpose` - 通用代理，可执行任何任务
- `Explore` - 代码库探索代理
- `Plan` - 规划代理，用于设计实现方案
- `bash` - Bash 命令专家

**示例**:
```bash
bun run cli agent \
  --description "Exploring codebase structure" \
  --prompt "Find all TypeScript files in src/ directory" \
  --subagent_type Explore
```

## UI/UX 工具

### Task 工具

创建和管理任务列表。

```typescript
// 参数
subject: string        // 任务标题
description: string   // 任务描述
activeForm?: string   // 进行中状态文本
```

## 实用工具

### WebFetch - 获取网页内容

从 URL 获取并处理网页内容。

```typescript
// 参数
url: string            // URL 地址
prompt: string        // 处理提示
```

**示例**:
```bash
bun run cli webfetch \
  "https://example.com/api/docs" \
  "Extract the API endpoint documentation"
```

### WebSearch - 网络搜索

搜索网页内容。

```typescript
// 参数
query: string          // 搜索关键词
allowed_domains?: string[] // 限制搜索域名
blocked_domains?: string[] // 排除搜索域名
```

**示例**:
```bash
bun run cli websearch "TypeScript types tutorial"
```

## 命令速查表

| 工具 | 用途 | 常见场景 |
|------|------|---------|
| Bash | 执行命令 | Git 操作、系统命令 |
| Read | 读文件 | 查看代码、配置 |
| Write | 创建文件 | 新建文件、输出结果 |
| Edit | 编辑文件 | 修改代码、配置 |
| Glob | 查找文件 | 文件搜索、批量操作 |
| Grep | 搜索内容 | 代码搜索、模式匹配 |
| Agent | AI 代理 | 复杂任务、代码生成 |
| WebFetch | 网页获取 | API 文档、网页分析 |
| WebSearch | 网络搜索 | 信息查询、学习 |

## 最佳实践

### 1. 组合使用工具

```bash
# 先 Glob 找到文件，再用 Read/Grep 分析
bun run cli glob "src/**/*.ts" | xargs bun run cli grep "export"
```

### 2. 错误处理

```bash
# 检查文件是否存在后再读取
bun run cli glob "config.json" && bun run cli read "config.json"
```

### 3. 性能优化

```bash
# 使用具体的 glob 模式而不是 **/*
bun run cli glob "src/components/**/*.tsx"  # 更快
```

### 4. 链式操作

```bash
# 使用管道或连续命令
bun run cli bash "cd src && ls -la | grep test"
```

## 获取帮助

- 查看 [命令 API](commands.md)
- 浏览 [架构文档](../architecture/tools.md)
- 提交 [Issue](https://github.com/your-username/open-claude-code/issues)
