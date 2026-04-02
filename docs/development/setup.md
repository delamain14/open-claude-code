# Development Environment Setup

## System Requirements

### Required Software

| Tool | Minimum Version | Recommended Version |
|------|---------|---------|
| Bun | 1.0.0 | Latest |
| Node.js | 18.0.0 | 20.0.0+ |
| TypeScript | 5.0.0 | Latest |
| Git | 2.0.0 | Latest |
| Python | 3.8 | 3.11+ |

### Optional Tools

- **Visual Studio Code** - Recommended code editor
- **Docker** - For containerized deployment
- **PostgreSQL** - For database support if needed

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/your-username/open-claude-code.git
cd open-claude-code
bun install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env, add your API keys
```

### 3. Start Development Server

```bash
bun run dev
```

## Development Tools Setup

### Visual Studio Code

#### Recommended Extensions

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

#### VS Code Settings

Create `.vscode/settings.json`:

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

### Code Quality Tools

#### ESLint

```bash
bun run lint
```

#### Prettier

```bash
bun run format
```

#### TypeScript Check

```bash
bun run typecheck
```

## Common Development Commands

### Build and Run

```bash
# Development mode (with hot reload)
bun run dev

# Production build
bun run build

# Run built code
bun run start

# Watch mode
bun run watch
```

### Testing

```bash
# Run all tests
bun run test

# Run specific test
bun run test src/tests/specific.test.ts

# Run tests in watch mode
bun run test --watch

# Generate coverage report
bun run test --coverage
```

### Code Quality

```bash
# Run ESLint
bun run lint

# Fix code style
bun run format

# Type checking
bun run typecheck

# All checks
bun run check
```

### Documentation

```bash
# Preview documentation locally
mkdocs serve

# Build documentation
mkdocs build

# Deploy documentation to GitHub Pages
mkdocs gh-deploy
```

## Project Structure

```
open-claude-code/
├── src/
│   ├── components/         # React components
│   ├── screens/           # TUI screens
│   ├── commands/          # Command implementations
│   ├── services/          # Business logic layer
│   ├── tools/             # Tool implementations
│   ├── types/             # TypeScript types
│   ├── utils/             # Utility functions
│   └── main.tsx           # Entry point
├── tests/
│   ├── unit/              # Unit tests
│   ├── integration/       # Integration tests
│   └── e2e/               # End-to-end tests
├── docs/                  # Documentation directory
├── .github/
│   └── workflows/         # GitHub Actions
├── .vscode/              # VS Code configuration
├── mkdocs.yml            # Documentation configuration
├── tsconfig.json         # TypeScript configuration
├── bunfig.toml          # Bun configuration
├── package.json          # Dependency configuration
└── README.md             # Project description
```

## Workflow

### Creating New Feature

1. **Create branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Develop code**
   ```bash
   bun run dev
   ```

3. **Run tests**
   ```bash
   bun run test
   ```

4. **Code checks**
   ```bash
   bun run lint
   bun run format
   bun run typecheck
   ```

5. **Commit code**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   git push origin feature/your-feature-name
   ```

6. **Create Pull Request**
   - Create PR on GitHub
   - Wait for CI/CD checks
   - Wait for code review

### Bug Fixing

1. **Create branch**
   ```bash
   git checkout -b fix/bug-name
   ```

2. **Locate issue**
   ```bash
   # Enable debug mode
   DEBUG=* bun run dev
   ```

3. **Write test**
   - Write test to reproduce bug
   - Then fix code

4. **Verify fix**
   ```bash
   bun run test
   bun run lint
   ```

5. **Submit PR**

## Debug Tips

### Enable Verbose Logging

```bash
DEBUG=* bun run dev
```

### Debug Specific Module

```bash
DEBUG=open-claude-code:* bun run dev
```

### VS Code Debugging

Configure in `.vscode/launch.json`:

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

## FAQ

### Q: How to clean build cache?

**A**:
```bash
bun cache clean
rm -rf .bun dist build node_modules
bun install
```

### Q: TypeScript error but code runs?

**A**:
```bash
# Update TypeScript
bun update typescript

# Regenerate type definitions
bun run typecheck
```

### Q: How to handle dependency conflicts?

**A**:
```bash
# Update all dependencies
bun update

# Or specific dependency
bun update @types/node
```

### Q: Hot reload not working?

**A**:
```bash
# Restart development server
# Press Ctrl+C to stop, then
bun run dev
```

## Performance Optimization

### Dependency Optimization

```bash
# Analyze dependency size
bun run analyze

# Remove unused dependencies
bun audit
```

### Build Optimization

```bash
# Use --minify flag
bun build src/main.tsx --minify

# Generate source maps
bun build src/main.tsx --sourcemap
```

## CI/CD Integration

Project uses GitHub Actions for automated testing and deployment. See `.github/workflows/` for details.

## Get Help

- See [Contributing Guide](contributing.md) for community standards
- Submit [Issue](https://github.com/your-username/open-claude-code/issues)
- Participate in [Discussions](https://github.com/your-username/open-claude-code/discussions)

## Next Steps

- Read [Contributing Guide](contributing.md)
- Check [Architecture Documentation](../architecture/overview.md)
- Browse [Code Examples](../api/tools.md)
