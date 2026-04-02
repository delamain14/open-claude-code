# 配置指南

## 环境变量

所有配置都通过环境变量进行。创建 `.env` 文件或直接设置系统环境变量。

### Anthropic API 配置

**必需配置**：

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**可选配置**（使用自定义 API 端点）：

```env
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_API_VERSION=2023-06-01
```

### MiniMax 配置

如果使用 MiniMax 作为模型提供商，配置如下：

```env
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1
ANTHROPIC_API_KEY=your_minimax_api_key
```

### Serper.dev 网络搜索

启用 Serper.dev 作为网络搜索引擎：

```env
SERPER_API_KEY=your_serper_api_key
```

**注**: 如果不配置此项，将使用 Anthropic 原生搜索功能。

### 禁用 Interleaved Thinking

如果要禁用模型的交错思考功能：

```env
ANTHROPIC_DISABLE_INTERLEAVED_THINKING=true
```

### 其他配置

```env
# 运行环境
NODE_ENV=development|production

# 日志级别
LOG_LEVEL=debug|info|warn|error

# 调试模式
DEBUG=*
```

## 配置优先级

环境变量的加载优先级（从高到低）：

1. **系统环境变量** - 直接在系统中设置的变量
2. **.env 文件** - 项目根目录的 `.env` 文件
3. **.env.local** - 本地环境文件（不提交到 Git）
4. **默认值** - 代码中的默认值

## 配置文件位置

### .env 文件

在项目根目录创建 `.env` 文件：

```
open-claude-code/
├── .env                 # 主配置文件
├── .env.local          # 本地覆盖（不提交）
├── .env.example        # 示例配置（已提交）
└── ...
```

### .gitignore 配置

确保以下文件在 `.gitignore` 中，不要提交含敏感信息的配置：

```
.env
.env.local
.env.*.local
```

## 常见配置场景

### 场景 1: 本地开发

```env
ANTHROPIC_API_KEY=your_api_key
NODE_ENV=development
LOG_LEVEL=debug
```

### 场景 2: 生产环境

```env
ANTHROPIC_API_KEY=your_prod_api_key
NODE_ENV=production
LOG_LEVEL=info
SERPER_API_KEY=your_serper_key
```

### 场景 3: MiniMax + Serper

```env
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1
ANTHROPIC_API_KEY=minimax_key
SERPER_API_KEY=serper_key
NODE_ENV=production
```

### 场景 4: 离线模式（仅使用本地工具）

```env
ANTHROPIC_API_KEY=placeholder_key
# 仅使用文件操作、Git 等本地工具
```

## 验证配置

### 1. 检查环境变量

```bash
# 显示所有已配置的 Anthropic 相关变量
env | grep ANTHROPIC
```

### 2. 测试 API 连接

```bash
bun run cli advisor "test connection"
```

### 3. 查看配置日志

启用调试模式查看配置加载过程：

```bash
DEBUG=* bun run cli --version
```

## 故障排除

### 问题: API 密钥无效

**解决方案**:
1. 验证密钥是否正确复制
2. 检查密钥是否过期
3. 确保密钥有正确的权限
4. 查看 API 文档确认密钥格式

### 问题: 网络搜索不工作

**解决方案**:
1. 验证 `SERPER_API_KEY` 是否配置
2. 检查 API 配额是否耗尽
3. 如果配置了自定义 URL，检查网络连接

### 问题: 模型响应缓慢

**解决方案**:
1. 检查网络连接
2. 如果使用自定义端点，验证端点可用性
3. 尝试禁用交错思考: `ANTHROPIC_DISABLE_INTERLEAVED_THINKING=true`

## 最佳实践

1. **不要提交敏感配置**
   - 使用 `.env.local` 存储本地覆盖
   - 确保 `.env` 和 `.env.local` 在 `.gitignore` 中

2. **使用配置示例**
   - 提交 `.env.example` 作为配置模板
   - 新开发者可从示例文件开始

3. **环境隔离**
   - 为不同环境（开发、测试、生产）使用不同的 API 密钥
   - 使用 `.env.development`、`.env.test` 等分离配置

4. **记录配置变更**
   - 在 CHANGELOG 中记录新配置选项
   - 在文档中更新配置说明

## 下一步

- 查看 [安装指南](installation.md) 完成基本设置
- 浏览 [开发环境](../development/setup.md) 了解开发工作流
- 阅读 [架构文档](../architecture/overview.md) 理解项目设计
