# 安装指南

## 前置要求

在开始之前，请确保你的系统已安装以下软件：

- **Node.js** 18.0+ 或 **Bun** 1.0+
- **Git** 2.0+
- **Python** 3.8+ (用于文档构建)

## 安装步骤

### 1. 克隆仓库

```bash
git clone https://github.com/your-username/open-claude-code.git
cd open-claude-code
```

### 2. 安装依赖

使用 Bun（推荐）：

```bash
bun install
```

或使用 npm：

```bash
npm install
```

### 3. 配置环境变量

创建 `.env` 文件并配置必要的环境变量：

```bash
cp .env.example .env
```

编辑 `.env` 文件，添加以下配置：

```env
# Anthropic API 配置
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com

# MiniMax 配置（可选）
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1

# serper.dev 网络搜索（可选）
SERPER_API_KEY=your_serper_api_key_here

# 其他配置
NODE_ENV=development
```

### 4. 验证安装

```bash
bun run cli --version
```

如果成功输出版本号，说明安装完成。

## 常见问题

### Q: 我应该使用 Bun 还是 npm？

**A**: 强烈推荐使用 Bun，因为：
- 更快的依赖安装速度
- 更好的 TypeScript 支持
- 这个项目专为 Bun 优化

### Q: 如何安装 Bun？

**A**: 访问 [bun.sh](https://bun.sh) 获取安装说明，或运行：

```bash
curl -fsSL https://bun.sh/install | bash
```

### Q: 依赖安装失败怎么办？

**A**: 尝试以下步骤：

```bash
# 清除缓存
bun cache clean

# 重新安装依赖
rm -rf node_modules
bun install
```

### Q: 如何更新到最新版本？

**A**:

```bash
git pull origin main
bun install
```

## 下一步

- 查看 [配置指南](configuration.md) 了解详细配置
- 浏览 [架构文档](../architecture/overview.md) 了解项目结构
- 阅读 [开发环境](../development/setup.md) 设置本地开发环境

## 获取帮助

如果遇到问题，请：

1. 检查 [常见问题](#常见问题) 部分
2. 查看 [GitHub Issues](https://github.com/your-username/open-claude-code/issues)
3. 提交新的 Issue 或讨论
