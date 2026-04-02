# Open Claude Code Documentation

Welcome to the official documentation for Open Claude Code! This is a complete TypeScript/TSX CLI application built on the Bun runtime, integrated with the Anthropic API, MCP protocol, web search, and rich TUI interaction interface.

## Quick Navigation

- **[Getting Started](getting-started/installation.md)** - Learn how to install and configure the project
- **[Architecture Documentation](architecture/overview.md)** - Deep dive into the overall architecture and design
- **[Development Guide](development/setup.md)** - Local development environment setup and contribution guide

## Project Features

- **High-Performance CLI** - Modern CLI application based on Bun runtime
- **Rich Interactive UI** - Modern terminal interface built with React and Ink
- **50+ Tool Collection** - Including file operations, code analysis, Git operations, and more
- **88+ Command Support** - Covering various development and operations scenarios
- **API Integration** - Anthropic API and MCP protocol support
- **Web Search** - Integrated with serper.dev and Anthropic native search
- **Extensible Architecture** - Modular design, easy to extend and maintain

## Project Scale

- **Lines of Code**: ~145,503 lines of TypeScript/TSX
- **Source Files**: 1,951 .ts/.tsx files
- **UI Components**: 140+ React components
- **Tool Implementations**: 50+ tools
- **Command Support**: 88+ slash commands

## Core Tech Stack

| Technology | Description |
|------------|-------------|
| **Runtime** | Bun |
| **Language** | TypeScript + TSX |
| **UI Framework** | React + Ink |
| **API Client** | Anthropic SDK |
| **CLI Tool** | Commander.js |

## Documentation Structure

```
docs/
├── index.md                    # Home (you are here)
├── getting-started/            # Getting Started
│   ├── installation.md         # Installation Guide
│   └── configuration.md        # Configuration Guide
├── architecture/               # Architecture Documentation
│   ├── overview.md            # Architecture Overview
│   ├── entrypoints.md         # Entry Points
│   ├── services.md            # Service Layer
│   ├── tools.md               # Tool System
│   ├── commands.md            # Command System
│   ├── ui.md                  # UI Layer
│   ├── types.md               # Type Definitions
│   └── utils.md               # Utility Functions
└── development/                # Development Guide
    ├── setup.md               # Environment Setup
    └── contributing.md        # Contribution Guide
```

## Getting Started

### Installation

```bash
git clone <repository-url>
cd open-claude-code
bun install
```

### Local Documentation Preview

```bash
mkdocs serve
```

Then open `http://127.0.0.1:8000` in your browser.

### Build Documentation

```bash
mkdocs build
```

The generated static site will be in the `site/` directory.

## Need Help?

- Check [Getting Started](getting-started/installation.md) for basic information
- Browse [Architecture Documentation](architecture/overview.md) to understand the project structure in depth
- Read [Contribution Guide](development/contributing.md) to participate in development

Enjoy using it!
