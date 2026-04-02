# 开发环境设置

## 系统要求

### 必需软件

| 工具 | 最低版本 | 推荐版本 |
|------|---------|---------|
| Bun | 1.0.0 | 最新 |
| Node.js | 18.0.0 | 20.0.0+ |
| TypeScript | 5.0.0 | 最新 |
| Git | 2.0.0 | 最新 |
| Python | 3.8 | 3.11+ |

### 可选工具

- **Visual Studio Code** - 推荐的代码编辑器
- **Docker** - 用于容器化部署
- **PostgreSQL** - 如果需要数据库支持

## 快速启动

### 1. 克隆并安装

```bash
git clone https://github.com/your-username/open-claude-code.git
cd open-claude-code
bun install
```

### 2. 配置环境

```bash
cp .env.example .env
# 编辑 .env，添加你的 API 密钥
```

### 3. 启动开发服务器

```bash
bun run dev
```

## 开发工具设置

### Visual Studio Code

#### 推荐扩展

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "github.copilot",
    "eamodio.gitlens",
    "ms-azuretools.vscode-docker",
    "hashicorp.terraform"
  ]
}
```

#### VS Code 设置

创建 `.vscode/settings.json`：

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

### 代码质量工具

#### ESLint

```bash
bun run lint
```

#### Prettier

```bash
bun run format
```

#### TypeScript 检查

```bash
bun run typecheck
```

## 常用开发命令

### 构建和运行

```bash
# 开发模式（带热重载）
bun run dev

# 生产构建
bun run build

# 运行构建后的代码
bun run start

# 监视模式
bun run watch
```

### 测试

```bash
# 运行所有测试
bun run test

# 运行特定测试
bun run test src/tests/specific.test.ts

# 监视模式运行测试
bun run test --watch

# 生成覆盖率报告
bun run test --coverage
```

### 代码质量

```bash
# 运行 ESLint
bun run lint

# 修复代码风格
bun run format

# 类型检查
bun run typecheck

# 所有检查
bun run check
```

### 文档

```bash
# 本地预览文档
mkdocs serve

# 构建文档
mkdocs build

# 部署文档到 GitHub Pages
mkdocs gh-deploy
```

## 项目结构

```
open-claude-code/
├── src/
│   ├── components/         # React 组件
│   ├── screens/           # TUI 屏幕
│   ├── commands/          # 命令实现
│   ├── services/          # 业务逻辑层
│   ├── tools/             # 工具实现
│   ├── types/             # TypeScript 类型
│   ├── utils/             # 工具函数
│   └── main.tsx           # 入口文件
├── tests/
│   ├── unit/              # 单元测试
│   ├── integration/       # 集成测试
│   └── e2e/               # 端到端测试
├── docs/                  # 文档目录
├── .github/
│   └── workflows/         # GitHub Actions
├── .vscode/              # VS Code 配置
├── mkdocs.yml            # 文档配置
├── tsconfig.json         # TypeScript 配置
├── bunfig.toml          # Bun 配置
├── package.json          # 依赖配置
└── README.md             # 项目说明
```

## 工作流程

### 创建新功能

1. **创建分支**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **开发代码**
   ```bash
   bun run dev
   ```

3. **运行测试**
   ```bash
   bun run test
   ```

4. **代码检查**
   ```bash
   bun run lint
   bun run format
   bun run typecheck
   ```

5. **提交代码**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

6. **创建 Pull Request**
   - 在 GitHub 上创建 PR
   - 等待 CI/CD 检查通过
   - 等待代码审查

### 修复 Bug

1. **创建分支**
   ```bash
   git checkout -b fix/bug-name
   ```

2. **定位问题**
   ```bash
   # 启用调试模式
   DEBUG=* bun run dev
   ```

3. **编写测试**
   - 先写测试复现 bug
   - 然后修复代码

4. **验证修复**
   ```bash
   bun run test
   bun run lint
   ```

5. **提交 PR**

## 调试技巧

### 启用详细日志

```bash
DEBUG=* bun run dev
```

### 调试特定模块

```bash
DEBUG=open-claude-code:* bun run dev
```

### VS Code 调试

在 `.vscode/launch.json` 中配置：

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Launch Bun",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["run", "src/main.tsx"],
      "console": "integratedTerminal"
    }
  ]
}
```

## 常见问题

### Q: 如何清理构建缓存？

**A**:
```bash
bun cache clean
rm -rf .bun dist build node_modules
bun install
```

### Q: TypeScript 报错但代码可以运行？

**A**:
```bash
# 更新 TypeScript
bun update typescript

# 重新生成类型定义
bun run typecheck
```

### Q: 如何处理依赖冲突？

**A**:
```bash
# 更新所有依赖
bun update

# 或特定依赖
bun update @types/node
```

### Q: 热重载不工作？

**A**:
```bash
# 重启开发服务器
# Ctrl+C 停止，然后
bun run dev
```

## 性能优化

### 依赖优化

```bash
# 分析依赖大小
bun run analyze

# 移除未使用的依赖
bun audit
```

### 构建优化

```bash
# 使用 --minify 标志
bun build src/main.tsx --minify

# 生成 source maps
bun build src/main.tsx --sourcemap
```

## CI/CD 集成

项目使用 GitHub Actions 进行自动化测试和部署。查看 `.github/workflows/` 了解详情。

## 获取帮助

- 查看 [贡献指南](contributing.md) 了解社区规范
- 提交 [Issue](https://github.com/your-username/open-claude-code/issues)
- 参与 [讨论](https://github.com/your-username/open-claude-code/discussions)

## 下一步

- 阅读 [贡献指南](contributing.md)
- 查看 [架构文档](../architecture/overview.md)
- 浏览 [代码示例](../api/tools.md)
