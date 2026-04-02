# Open Claude Code 文档

欢迎来到 Open Claude Code 的官方文档！这是一个完整的 TypeScript/TSX CLI 应用，基于 Bun 运行时，集成了 Anthropic API、MCP 协议、网络搜索和丰富的 TUI 交互界面。

## 快速导航

- **[快速开始](getting-started/installation.md)** - 了解如何安装和配置项目
- **[架构文档](architecture/overview.md)** - 深入了解项目的整体架构和设计
- **[开发指南](development/setup.md)** - 本地开发环境设置和贡献指南

## 项目特性

- 🚀 **高性能 CLI** - 基于 Bun 运行时的现代化 CLI 应用
- 🎨 **富交互 UI** - 使用 React 和 Ink 构建的现代化终端界面
- 🔧 **50+ 工具集合** - 包括文件操作、代码分析、Git 操作等
- 📚 **88+ 命令支持** - 覆盖各种开发和运维场景
- 🌐 **API 集成** - Anthropic API 和 MCP 协议支持
- 🔍 **网络搜索** - 集成 serper.dev 和 Anthropic 原生搜索
- 🎯 **可扩展架构** - 模块化设计，易于扩展和维护

## 项目规模

- **代码行数**: ~145,503 行 TypeScript/TSX
- **源文件数**: 1,951 个 .ts/.tsx 文件
- **UI 组件**: 140+ React 组件
- **工具实现**: 50+ 个工具
- **命令支持**: 88+ 个斜杠命令

## 核心技术栈

| 技术 | 描述 |
|------|------|
| **运行时** | Bun |
| **语言** | TypeScript + TSX |
| **UI 框架** | React + Ink |
| **API 客户端** | Anthropic SDK |
| **CLI 工具** | Commander.js |

## 文档结构

```
docs/
├── index.md                    # 主页（你在这里）
├── getting-started/            # 快速开始
│   ├── installation.md         # 安装指南
│   └── configuration.md        # 配置指南
├── architecture/               # 架构文档
│   ├── overview.md            # 架构概览
│   ├── entrypoints.md         # 入口点
│   ├── services.md            # 服务层
│   ├── tools.md               # 工具系统
│   ├── commands.md            # 命令系统
│   ├── ui.md                  # UI 层
│   ├── types.md               # 类型定义
│   └── utils.md               # 工具函数
└── development/                # 开发指南
    ├── setup.md               # 环境设置
    └── contributing.md        # 贡献指南
```

## 开始使用

### 安装

```bash
git clone <repository-url>
cd open-claude-code
bun install
```

### 本地预览文档

```bash
mkdocs serve
```

然后在浏览器中打开 `http://127.0.0.1:8000`

### 构建文档

```bash
mkdocs build
```

生成的静态网站将在 `site/` 目录中。

## 需要帮助？

- 查看 [快速开始](getting-started/installation.md) 了解基础信息
- 浏览 [架构文档](architecture/overview.md) 深入理解项目结构
- 阅读 [贡献指南](development/contributing.md) 参与开发

祝你使用愉快！
