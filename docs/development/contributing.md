# 贡献指南

感谢你对 Open Claude Code 的兴趣！本文档说明如何参与项目开发。

## 行为准则

我们致力于提供友好、安全和受欢迎的开发环境。所有参与者应该相互尊重和包容。

## 贡献方式

### 1. 报告 Bug

#### 提交 Issue 前的检查清单

- [ ] 搜索现有 Issues，确认 bug 尚未被报告
- [ ] 检查最新版本是否仍存在该问题
- [ ] 准备清晰的重现步骤

#### Issue 模板

```markdown
## 描述
清楚地描述问题。

## 重现步骤
1. ...
2. ...
3. ...

## 预期行为
应该发生什么。

## 实际行为
实际发生了什么。

## 环境信息
- 操作系统: [如 Linux, macOS, Windows]
- Bun 版本: [输出 `bun --version`]
- 项目版本: [如 v1.0.0]
- Node.js 版本: [如 20.0.0]

## 附加信息
任何其他相关信息。
```

### 2. 建议功能

#### Issue 模板

```markdown
## 功能描述
清楚地描述你想要的功能。

## 使用场景
说明这个功能的使用场景和价值。

## 建议的实现
（可选）说明你认为应该如何实现。

## 其他选项
是否有其他方式可以解决这个问题？
```

### 3. 提交代码

#### 开发工作流

1. **Fork 仓库**
   ```bash
   # 在 GitHub 上 Fork 项目
   ```

2. **克隆你的 Fork**
   ```bash
   git clone https://github.com/your-username/open-claude-code.git
   cd open-claude-code
   ```

3. **添加上游仓库**
   ```bash
   git remote add upstream https://github.com/original-owner/open-claude-code.git
   ```

4. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **进行更改**
   ```bash
   # 编辑文件
   # 运行测试
   bun run test
   ```

6. **提交更改**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

7. **推送到你的 Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **创建 Pull Request**
   - 在 GitHub 上打开 PR
   - 填写 PR 模板
   - 等待审查

#### 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 格式：

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型** (type):
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码风格（不影响逻辑）
- `refactor`: 重构（不影响功能）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建、依赖等其他

**示例**:
```
feat(commands): add new advisor command

This adds a new advisor command that helps users with code review.

Fixes #123
```

## 代码风格

### TypeScript 风格指南

1. **命名约定**
   ```typescript
   // 常量: SCREAMING_SNAKE_CASE
   const MAX_RETRIES = 3

   // 函数和变量: camelCase
   function processData() {}
   let isLoading = false

   // 类和类型: PascalCase
   class UserService {}
   type UserConfig = {}

   // 接口: PascalCase，通常以 I 开头
   interface IUserRepository {}
   ```

2. **类型注解**
   ```typescript
   // 总是明确指定返回类型
   function getUserName(id: number): string {
     return "John"
   }

   // 为复杂对象使用接口
   interface User {
     id: number
     name: string
   }
   ```

3. **箭头函数**
   ```typescript
   // 简单单行
   const add = (a: number, b: number) => a + b

   // 多行需要大括号和返回
   const process = (data: string) => {
     const result = data.trim()
     return result
   }
   ```

### 代码质量工具

```bash
# ESLint 检查
bun run lint

# 自动修复
bun run lint --fix

# 代码格式化
bun run format

# 类型检查
bun run typecheck
```

## 测试

### 编写测试

```typescript
import { describe, it, expect } from "bun:test"

describe("UserService", () => {
  it("should get user by id", () => {
    const user = getUserById(1)
    expect(user.name).toBe("John")
  })

  it("should handle missing user", () => {
    const user = getUserById(999)
    expect(user).toBeNull()
  })
})
```

### 测试覆盖率

```bash
# 运行带覆盖率的测试
bun run test --coverage

# 最低覆盖率标准
# 语句: 80%
# 分支: 75%
# 函数: 80%
# 行: 80%
```

### 测试类型

1. **单元测试** (`tests/unit/`)
   - 测试单个函数或模块
   - 应该快速执行
   - 模拟外部依赖

2. **集成测试** (`tests/integration/`)
   - 测试多个组件的交互
   - 可能涉及真实数据库

3. **端到端测试** (`tests/e2e/`)
   - 测试完整用户流程
   - 模拟真实场景

## 文档

### 更新文档

如果你的更改涉及新功能或 API 变化，请：

1. **更新相关文档**
   - 在 `docs/` 目录中添加或修改文件
   - 更新 `mkdocs.yml` 导航（如果需要）

2. **添加代码示例**
   ```markdown
   ## 示例

   \`\`\`typescript
   import { MyFeature } from "@open-claude-code/core"

   const feature = new MyFeature()
   await feature.initialize()
   \`\`\`
   ```

3. **本地预览**
   ```bash
   mkdocs serve
   ```

## PR 审查流程

### 审查标准

你的 PR 需要：

- [ ] 通过所有 CI/CD 检查
- [ ] 至少一名维护者批准
- [ ] 代码覆盖率不低于 80%
- [ ] 所有测试通过
- [ ] 代码风格一致
- [ ] 文档更新完整

### 常见反馈

| 反馈 | 处理方式 |
|------|---------|
| "请添加测试" | 为你的代码编写单元或集成测试 |
| "类型检查失败" | 运行 `bun run typecheck` 并修复 |
| "请更新文档" | 在 `docs/` 中添加相关文档 |
| "性能考虑" | 使用 `bun run test --benchmark` 检查性能 |

## 发布流程

### 版本号规范

使用 [语义化版本](https://semver.org/)：

- **主版本** (MAJOR): 不兼容的 API 变化
- **次版本** (MINOR): 向后兼容的新功能
- **补丁** (PATCH): 向后兼容的错误修复

示例: `1.2.3` (主.次.补)

### 发布步骤

1. 更新 `CHANGELOG.md`
2. 更新 `package.json` 中的版本号
3. 创建 Git tag: `git tag v1.2.3`
4. 推送到 GitHub
5. 在 GitHub Releases 中发布

## 获取帮助

- **讨论**: [GitHub Discussions](https://github.com/your-username/open-claude-code/discussions)
- **问题**: [GitHub Issues](https://github.com/your-username/open-claude-code/issues)
- **社区**: 关注项目的 Discord/Slack 社区（如果存在）

## 相关资源

- [开发环境设置](setup.md)
- [架构文档](../architecture/overview.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

感谢你的贡献！
