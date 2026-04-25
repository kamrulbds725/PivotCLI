# PivotCLI

A VS Code extension that gives you a sidebar panel to launch CLI-based AI coding tools — Gemini CLI, Opencode, and Kilo Code CLI — right inside your editor.

<p align="center">
  <img src="images/icon.png" alt="PivotCLI" width="128">
</p>

## Features

- Launch **Gemini CLI**, **Gemini CLI (YOLO mode)**, **Opencode**, or **Kilo Code CLI** from the sidebar
- Embedded terminal powered by xterm.js with full PTY support
- Session history — quickly relaunch previous sessions
- Works on Windows, macOS, and Linux

## Requirements

The CLI tools you want to use must be installed and available on your PATH:

- [Gemini CLI](https://github.com/google-gemini/gemini-cli) — `gemini`
- [Opencode](https://github.com/opencode-ai/opencode) — `opencode`
- [Kilo Code CLI](https://github.com/kilocode/kilo) — `kilo`

## Installation

### From VSIX

1. Download the latest `.vsix` from [Releases](../../releases)
2. In VS Code: `Extensions` → `...` → `Install from VSIX...`

### From Source

```bash
git clone https://github.com/kamrulbds725/PivotCLI.git
cd PivotCLI
npm install
npm run compile
npx vsce package
```

Then install the generated `.vsix` file.

## Usage

1. Click the **PivotCLI** icon in the Activity Bar
2. Choose a CLI tool from the buttons or the `+` menu
3. The tool launches in an embedded terminal inside the sidebar
4. Use the history icon to relaunch previous sessions

## Development

```bash
npm install
npm run compile    # build once
npm run watch      # build on changes
```

## License

[MIT](LICENSE)
