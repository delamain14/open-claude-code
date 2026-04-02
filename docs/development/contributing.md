# Contributing Guide

Thank you for your interest in Open Claude Code! This document explains how to participate in project development.

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming development environment. All participants should respect and be inclusive of each other.

## Ways to Contribute

### 1. Reporting Bugs

#### Pre-submission Checklist

- [ ] Search existing Issues to confirm the bug hasn't been reported
- [ ] Check if the issue still exists in the latest version
- [ ] Prepare clear reproduction steps

#### Issue Template

```markdown
## Description
Clearly describe the problem.

## Steps to Reproduce
1. ...
2. ...
3. ...

## Expected Behavior
What should happen.

## Actual Behavior
What actually happened.

## Environment Information
- Operating System: [e.g., Linux, macOS, Windows]
- Bun Version: [output of `bun --version`]
- Project Version: [e.g., v1.0.0]
- Node.js Version: [e.g., 20.0.0]

## Additional Information
Any other relevant information.
```

### 2. Suggesting Features

#### Issue Template

```markdown
## Feature Description
Clearly describe the feature you want.

## Use Case
Explain the use case and value of this feature.

## Suggested Implementation
(Optional) Explain how you think it should be implemented.

## Alternative Options
Are there other ways to solve this problem?
```

### 3. Submitting Code

#### Development Workflow

1. **Fork the repository**
   ```bash
   # Fork the project on GitHub
   ```

2. **Clone your Fork**
   ```bash
   git clone https://github.com/your-username/open-claude-code.git
   cd open-claude-code
   ```

3. **Add upstream repository**
   ```bash
   git remote add upstream https://github.com/original-owner/open-claude-code.git
   ```

4. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

5. **Make changes**
   ```bash
   # Edit files
   # Run tests
   bun run test
   ```

6. **Commit changes**
   ```bash
   git add .
   git commit -m "feat: add your feature"
   ```

7. **Push to your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request**
   - Open PR on GitHub
   - Fill in PR template
   - Wait for review

#### Commit Message Convention

Use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code style (doesn't affect logic)
- `refactor`: Refactoring (doesn't affect functionality)
- `perf`: Performance optimization
- `test`: Test-related
- `chore`: Build, dependencies, etc.

**Example**:
```
feat(commands): add new advisor command

This adds a new advisor command that helps users with code review.

Fixes #123
```

## Code Style

### TypeScript Style Guide

1. **Naming Conventions**
   ```typescript
   // Constants: SCREAMING_SNAKE_CASE
   const MAX_RETRIES = 3

   // Functions and variables: camelCase
   function processData() {}
   let isLoading = false

   // Classes and types: PascalCase
   class UserService {}
   type UserConfig = {}

   // Interfaces: PascalCase, usually prefixed with I
   interface IUserRepository {}
   ```

2. **Type Annotations**
   ```typescript
   // Always specify return types explicitly
   function getUserName(id: number): string {
     return "John"
   }

   // Use interfaces for complex objects
   interface User {
     id: number
     name: string
   }
   ```

3. **Arrow Functions**
   ```typescript
   // Simple one-liner
   const add = (a: number, b: number) => a + b

   // Multi-line needs braces and return
   const process = (data: string) => {
     const result = data.trim()
     return result
   }
   ```

### Code Quality Tools

```bash
# ESLint check
bun run lint

# Auto-fix
bun run lint --fix

# Code formatting
bun run format

# Type checking
bun run typecheck
```

## Testing

### Writing Tests

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

### Test Coverage

```bash
# Run tests with coverage
bun run test --coverage

# Minimum coverage standards
# Statements: 80%
# Branches: 75%
# Functions: 80%
# Lines: 80%
```

### Test Types

1. **Unit Tests** (`tests/unit/`)
   - Test individual functions or modules
   - Should execute quickly
   - Mock external dependencies

2. **Integration Tests** (`tests/integration/`)
   - Test interaction between multiple components
   - May involve real databases

3. **End-to-End Tests** (`tests/e2e/`)
   - Test complete user flows
   - Simulate real scenarios

## Documentation

### Updating Documentation

If your changes involve new features or API changes, please:

1. **Update relevant documentation**
   - Add or modify files in the `docs/` directory
   - Update `mkdocs.yml` navigation (if needed)

2. **Add code examples**
   ```markdown
   ## Example

   \`\`\`typescript
   import { MyFeature } from "@open-claude-code/core"

   const feature = new MyFeature()
   await feature.initialize()
   \`\`\`
   ```

3. **Local preview**
   ```bash
   mkdocs serve
   ```

## PR Review Process

### Review Standards

Your PR needs:

- [ ] Pass all CI/CD checks
- [ ] At least one maintainer approval
- [ ] Code coverage not below 80%
- [ ] All tests passing
- [ ] Consistent code style
- [ ] Complete documentation updates

### Common Feedback

| Feedback | How to Handle |
|----------|---------------|
| "Please add tests" | Write unit or integration tests for your code |
| "Type check failed" | Run `bun run typecheck` and fix |
| "Please update docs" | Add relevant documentation in `docs/` |
| "Performance concerns" | Check performance with `bun run test --benchmark` |

## Release Process

### Version Number Convention

Use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Incompatible API changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

Example: `1.2.3` (major.minor.patch)

### Release Steps

1. Update `CHANGELOG.md`
2. Update version number in `package.json`
3. Create Git tag: `git tag v1.2.3`
4. Push to GitHub
5. Publish in GitHub Releases

## Getting Help

- **Discussions**: [GitHub Discussions](https://github.com/your-username/open-claude-code/discussions)
- **Issues**: [GitHub Issues](https://github.com/your-username/open-claude-code/issues)
- **Community**: Follow the project's Discord/Slack community (if exists)

## Related Resources

- [Development Environment Setup](setup.md)
- [Architecture Documentation](../architecture/overview.md)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

Thank you for your contribution!
