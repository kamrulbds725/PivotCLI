# PivotCLI

A VS Code extension that gives you a sidebar panel to launch AI coding CLI tools — right inside your editor. Run multiple sessions in tabs, switch between them, and multitask.

Supports Gemini, Claude, Codex, OpenCode, KiloCode, and CommandCode.

<p align="center">
  <img src="images/icon.png" alt="PivotCLI" width="128">
</p>

## Supported CLIs

| CLI | Normal | YOLO Mode |
|-----|--------|-----------|
| [Gemini CLI](https://github.com/google-gemini/gemini-cli) | `gemini` | `gemini -y` |
| [Claude Code](https://docs.anthropic.com/en/docs/claude-code) | `claude` | `claude --dangerously-skip-permissions` |
| [Codex CLI](https://github.com/openai/codex) | `codex` | `codex --dangerously-bypass-approvals-and-sandbox` |
| [OpenCode](https://github.com/opencode-ai/opencode) | `opencode` | — |
| [KiloCode](https://github.com/kilocode/kilo) | `kilo` | — |
| [CommandCode](https://github.com/CommandCode/command-code) | `npx command-code` | — |

## Features

- Launch any supported CLI from a clean homepage
- Multi-tab support — run multiple CLIs simultaneously
- Chrome-style tab bar with activity indicators
- YOLO mode for Gemini, Claude, and Codex
- Embedded terminal powered by xterm.js with full PTY support
- Session history — quickly relaunch previous sessions
- Works on Windows, macOS, and Linux

## Requirements

The CLI tools you want to use must be installed and available on your PATH.

## Installation

### From VS Code Marketplace

Search for **PivotCLI** in the Extensions panel, or install from the [Marketplace page](https://marketplace.visualstudio.com/items?itemName=KamrulHasan.pivotcli).

### From Source

```bash
git clone https://github.com/kamrulbds725/PivotCLI.git
cd PivotCLI
npm install
npm run compile
npx @vscode/vsce package
```

Then install the generated `.vsix` file.

## Usage

1. Click the **PivotCLI** icon in the Activity Bar
2. Choose a CLI from the homepage (click to expand YOLO options)
3. Click `+` to open more tabs while existing sessions keep running
4. Switch between tabs — activity spinner shows which CLIs are working
5. Use the history icon to relaunch previous sessions

## License

[MIT](LICENSE)
