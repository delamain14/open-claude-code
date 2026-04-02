# Installation Guide

## Prerequisites

Before starting, ensure your system has the following software installed:

- **Node.js** 18.0+ or **Bun** 1.0+
- **Git** 2.0+
- **Python** 3.8+ (for documentation build)

## Installation Steps

### 1. Clone Repository

```bash
git clone https://github.com/your-username/open-claude-code.git
cd open-claude-code
```

### 2. Install Dependencies

Using Bun (recommended):

```bash
bun install
```

Or using npm:

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file and configure necessary environment variables:

```bash
cp .env.example .env
```

Edit the `.env` file and add the following configuration:

```env
# Anthropic API Configuration
ANTHROPIC_API_KEY=your_api_key_here
ANTHROPIC_BASE_URL=https://api.anthropic.com

# MiniMax Configuration (Optional)
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1

# serper.dev Web Search (Optional)
SERPER_API_KEY=your_serper_api_key_here

# Other Configuration
NODE_ENV=development
```

### 4. Verify Installation

```bash
bun run cli --version
```

If it successfully outputs the version number, installation is complete.

## FAQ

### Q: Should I use Bun or npm?

**A**: Bun is strongly recommended because:
- Faster dependency installation
- Better TypeScript support
- This project is optimized for Bun

### Q: How to install Bun?

**A**: Visit [bun.sh](https://bun.sh) for installation instructions, or run:

```bash
curl -fsSL https://bun.sh/install | bash
```

### Q: What if dependency installation fails?

**A**: Try the following steps:

```bash
# Clear cache
bun cache clean

# Reinstall dependencies
rm -rf node_modules
bun install
```

### Q: How to update to the latest version?

**A**:

```bash
git pull origin main
bun install
```

## Next Steps

- Check [Configuration Guide](configuration.md) for detailed configuration
- Browse [Architecture Documentation](../architecture/overview.md) to understand project structure
- Read [Development Environment](../development/setup.md) to set up local development

## Getting Help

If you encounter issues:

1. Check the [FAQ](#faq) section
2. View [GitHub Issues](https://github.com/your-username/open-claude-code/issues)
3. Submit a new Issue or discussion
