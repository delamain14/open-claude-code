# Configuration Guide

## Environment Variables

All configuration is done through environment variables. Create a `.env` file or set system environment variables directly.

### Anthropic API Configuration

**Required Configuration**:

```env
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
```

**Optional Configuration** (for custom API endpoints):

```env
ANTHROPIC_BASE_URL=https://api.anthropic.com
ANTHROPIC_API_VERSION=2023-06-01
```

### MiniMax Configuration

If using MiniMax as a model provider, configure as follows:

```env
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1
ANTHROPIC_API_KEY=your_minimax_api_key
```

### Serper.dev Web Search

Enable Serper.dev as a web search engine:

```env
SERPER_API_KEY=your_serper_api_key
```

**Note**: If not configured, Anthropic's native search functionality will be used.

### Disable Interleaved Thinking

To disable the model's interleaved thinking feature:

```env
ANTHROPIC_DISABLE_INTERLEAVED_THINKING=true
```

### Other Configuration

```env
# Runtime Environment
NODE_ENV=development|production

# Log Level
LOG_LEVEL=debug|info|warn|error

# Debug Mode
DEBUG=*
```

## Configuration Priority

Environment variable loading priority (from high to low):

1. **System Environment Variables** - Variables set directly in the system
2. **.env File** - `.env` file in project root
3. **.env.local** - Local environment file (not committed to Git)
4. **Default Values** - Default values in code

## Configuration File Locations

### .env File

Create a `.env` file in the project root:

```
open-claude-code/
├── .env                 # Main configuration file
├── .env.local          # Local overrides (not committed)
├── .env.example        # Example configuration (committed)
└── ...
```

### .gitignore Configuration

Ensure the following files are in `.gitignore` to avoid committing sensitive configurations:

```
.env
.env.local
.env.*.local
```

## Common Configuration Scenarios

### Scenario 1: Local Development

```env
ANTHROPIC_API_KEY=your_api_key
NODE_ENV=development
LOG_LEVEL=debug
```

### Scenario 2: Production Environment

```env
ANTHROPIC_API_KEY=your_prod_api_key
NODE_ENV=production
LOG_LEVEL=info
SERPER_API_KEY=your_serper_key
```

### Scenario 3: MiniMax + Serper

```env
ANTHROPIC_BASE_URL=https://api.minimaxi.chat/v1
ANTHROPIC_API_KEY=minimax_key
SERPER_API_KEY=serper_key
NODE_ENV=production
```

### Scenario 4: Offline Mode (Local Tools Only)

```env
ANTHROPIC_API_KEY=placeholder_key
# Use only local tools like file operations, Git, etc.
```

## Verify Configuration

### 1. Check Environment Variables

```bash
# Display all configured Anthropic-related variables
env | grep ANTHROPIC
```

### 2. Test API Connection

```bash
bun run cli advisor "test connection"
```

### 3. View Configuration Logs

Enable debug mode to view configuration loading process:

```bash
DEBUG=* bun run cli --version
```

## Troubleshooting

### Issue: Invalid API Key

**Solution**:
1. Verify the key is correctly copied
2. Check if the key has expired
3. Ensure the key has proper permissions
4. Review API documentation to confirm key format

### Issue: Web Search Not Working

**Solution**:
1. Verify `SERPER_API_KEY` is configured
2. Check if API quota is exhausted
3. If using custom URL, check network connection

### Issue: Slow Model Response

**Solution**:
1. Check network connection
2. If using custom endpoint, verify endpoint availability
3. Try disabling interleaved thinking: `ANTHROPIC_DISABLE_INTERLEAVED_THINKING=true`

## Best Practices

1. **Don't Commit Sensitive Configurations**
   - Use `.env.local` to store local overrides
   - Ensure `.env` and `.env.local` are in `.gitignore`

2. **Use Configuration Examples**
   - Commit `.env.example` as a configuration template
   - New developers can start from the example file

3. **Environment Isolation**
   - Use different API keys for different environments (development, testing, production)
   - Separate configurations using `.env.development`, `.env.test`, etc.

4. **Document Configuration Changes**
   - Record new configuration options in CHANGELOG
   - Update configuration instructions in documentation

## Next Steps

- Check [Installation Guide](installation.md) to complete basic setup
- Browse [Development Environment](../development/setup.md) to understand development workflow
- Read [Architecture Documentation](../architecture/overview.md) to understand project design
