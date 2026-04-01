# 命令 API 参考

Open Claude Code 提供了 88+ 个斜杠命令，用于各种开发任务。本文档介绍主要命令的使用方法。

## 命令格式

所有命令使用以下格式：

```bash
bun run cli [command] [options] [arguments]
```

**示例**:
```bash
bun run cli advisor "How to optimize React performance?"
bun run cli commit --message "feat: add new feature"
bun run cli debug "path/to/file.ts"
```

## 代码生成和 AI 命令

### advisor - AI 顾问

与 AI 助手进行对话，获取建议和帮助。

```bash
bun run cli advisor "Your question or request"
```

**参数**:
- `query` (string) - 你的问题或请求

**示例**:
```bash
bun run cli advisor "How should I structure my TypeScript project?"
bun run cli advisor "Explain the difference between interfaces and types"
bun run cli advisor "Best practices for React hooks"
```

### autofix - 自动修复

自动检测并修复代码问题。

```bash
bun run cli autofix "path/to/file.ts"
```

**参数**:
- `file_path` (string) - 要修复的文件路径
- `--strict` (boolean) - 严格模式，修复更多问题

**示例**:
```bash
bun run cli autofix "src/utils.ts"
bun run cli autofix "src/components/Button.tsx" --strict
```

### agent - 运行代理

启动专门的 AI 代理处理复杂任务。

```bash
bun run cli agent "Task description"
```

**参数**:
- `description` (string) - 任务简述（3-5 字）
- `--type` (string) - 代理类型（general, explore, plan）

**示例**:
```bash
bun run cli agent "Analyzing codebase structure"
bun run cli agent "Planning feature implementation" --type plan
```

## Git 和版本控制命令

### branch - 管理分支

列出、创建或删除 Git 分支。

```bash
bun run cli branch [options]
```

**参数**:
- `--list` - 列出所有分支
- `--create NAME` - 创建新分支
- `--delete NAME` - 删除分支
- `--rename OLD NEW` - 重命名分支

**示例**:
```bash
bun run cli branch --list
bun run cli branch --create feature/new-feature
bun run cli branch --delete old-feature
```

### commit - 提交更改

创建 Git 提交。

```bash
bun run cli commit [options]
```

**参数**:
- `--message "msg"` - 提交信息
- `--files "file1,file2"` - 指定文件
- `--amend` - 修改上次提交

**示例**:
```bash
bun run cli commit --message "feat: add new feature"
bun run cli commit --message "fix: resolve bug" --files "src/bug.ts"
bun run cli commit --message "docs: update README" --amend
```

### debug - 调试代码

启动代码调试器。

```bash
bun run cli debug "file_path"
```

**参数**:
- `file_path` (string) - 要调试的文件
- `--line NUMBER` - 设置断点行号

**示例**:
```bash
bun run cli debug "src/main.ts"
bun run cli debug "src/service.ts" --line 42
```

### review-pr - 代码审查

审查 Pull Request 的更改。

```bash
bun run cli review-pr "PR_NUMBER"
```

**参数**:
- `pr_number` (string) - PR 号码
- `--detailed` - 详细审查

**示例**:
```bash
bun run cli review-pr "123"
bun run cli review-pr "456" --detailed
```

## 文件和目录命令

### ls - 列出文件

列出目录内容。

```bash
bun run cli ls "path" [options]
```

**参数**:
- `path` (string) - 目录路径
- `--long` - 详细格式
- `--recursive` - 递归列出

**示例**:
```bash
bun run cli ls "src"
bun run cli ls "src" --long --recursive
```

### find - 查找文件

搜索匹配条件的文件。

```bash
bun run cli find "pattern" [options]
```

**参数**:
- `pattern` (string) - 搜索模式（glob 或正则）
- `--type FILE|DIR` - 文件类型
- `--size +10k` - 文件大小条件

**示例**:
```bash
bun run cli find "*.ts" --type FILE
bun run cli find "test/*" --type DIR
```

### cat - 查看文件内容

显示文件内容。

```bash
bun run cli cat "file_path"
```

**参数**:
- `file_path` (string) - 文件路径
- `--lines 10` - 显示前 N 行

**示例**:
```bash
bun run cli cat "README.md"
bun run cli cat "package.json" --lines 20
```

## 测试和质量命令

### test - 运行测试

执行单元测试。

```bash
bun run cli test [options]
```

**参数**:
- `--file "path"` - 特定测试文件
- `--watch` - 监视模式
- `--coverage` - 生成覆盖率报告

**示例**:
```bash
bun run cli test
bun run cli test --file "src/tests/utils.test.ts"
bun run cli test --watch --coverage
```

### lint - 代码检查

运行 ESLint 检查代码。

```bash
bun run cli lint [options]
```

**参数**:
- `--fix` - 自动修复问题
- `--file "path"` - 检查特定文件
- `--strict` - 严格模式

**示例**:
```bash
bun run cli lint
bun run cli lint --fix
bun run cli lint --file "src/main.ts" --strict
```

### format - 代码格式化

使用 Prettier 格式化代码。

```bash
bun run cli format [options]
```

**参数**:
- `--file "path"` - 格式化特定文件
- `--check` - 只检查，不修改

**示例**:
```bash
bun run cli format
bun run cli format --file "src/utils.ts"
bun run cli format --check
```

## 文档命令

### docs-serve - 本地文档服务

启动文档本地服务。

```bash
bun run cli docs-serve [options]
```

**参数**:
- `--port 8000` - 端口号
- `--open` - 自动打开浏览器

**示例**:
```bash
bun run cli docs-serve
bun run cli docs-serve --port 3000 --open
```

### docs-build - 构建文档

生成静态文档网站。

```bash
bun run cli docs-build [options]
```

**参数**:
- `--output "path"` - 输出目录

**示例**:
```bash
bun run cli docs-build
bun run cli docs-build --output "public/docs"
```

## 命令速查表

| 命令 | 描述 | 常见用法 |
|------|------|---------|
| advisor | AI 顾问 | 获取建议、回答问题 |
| agent | AI 代理 | 复杂任务、代码分析 |
| autofix | 自动修复 | 修复代码问题 |
| branch | 分支管理 | 创建/删除/列出分支 |
| commit | 提交代码 | 创建 Git 提交 |
| debug | 调试代码 | 代码调试、查找问题 |
| test | 运行测试 | 执行单元测试 |
| lint | 代码检查 | 检查代码质量 |
| format | 代码格式化 | 美化代码风格 |
| review-pr | 代码审查 | 审查 PR 变更 |
| docs-serve | 本地文档 | 预览文档 |
| docs-build | 构建文档 | 生成文档网站 |

## 常见用例

### 开发新功能

```bash
# 1. 创建功能分支
bun run cli branch --create feature/new-feature

# 2. 编码（使用编辑器）

# 3. 运行测试
bun run cli test

# 4. 检查代码
bun run cli lint --fix
bun run cli format

# 5. 提交更改
bun run cli commit --message "feat: implement new feature"
```

### 修复 Bug

```bash
# 1. 启动调试器找到问题
bun run cli debug "src/buggy-file.ts"

# 2. 自动修复
bun run cli autofix "src/buggy-file.ts"

# 3. 运行测试验证
bun run cli test --file "src/buggy-file.test.ts"

# 4. 提交修复
bun run cli commit --message "fix: resolve bug in feature X"
```

### 代码审查工作流

```bash
# 1. 审查 PR
bun run cli review-pr "123" --detailed

# 2. 运行测试确保没有破坏
bun run cli test

# 3. 检查代码质量
bun run cli lint

# 4. 生成覆盖率报告
bun run cli test --coverage
```

## 获取帮助

### 列出所有命令

```bash
bun run cli --help
```

### 特定命令帮助

```bash
bun run cli advisor --help
bun run cli test --help
```

### 更多信息

- 查看 [工具 API](tools.md)
- 浏览 [架构文档](../architecture/commands.md)
- 提交 [Issue](https://github.com/your-username/open-claude-code/issues)

## 命令开发

想要添加新命令？查看 [开发指南](../development/setup.md) 的"命令开发"部分。
