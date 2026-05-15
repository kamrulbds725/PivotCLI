# Changelog

## 2.5.1

- Removed "Saved to pivotcli.customCLIList in settings" hint text from the launcher panel
- Renamed setting key from `pivotcli.customCLIs` to `pivotcli.customCLIList` for correct display in VS Code Settings UI
- Reordered built-in CLIs: Claude and Codex now appear before Gemini

## 2.5.0

- **Custom CLI support** — add any CLI tool to the launcher via `pivotcli.customCLIs` in VS Code settings (name, command, optional YOLO command, optional color). No extension update needed as new tools launch.
- **+ Add Custom CLI button** — dashed-border button at the bottom of the homepage opens settings filtered to `pivotcli.customCLIs` in one click
- **Tab persistence** — open tabs are saved to workspace state and automatically restored after VS Code restarts
- **Added OpenClaude** — new built-in entry between Pi Coding and KiloCode (`openclaude` / `openclaude --dangerously-skip-permissions`)
- Redesigned tab bar
- Improved homepage text contrast — title, subtitle, and hint text are more legible

## 2.0.0

- Added Pi Coding support (`pi`) — install via `npm install -g @earendil-works/pi-coding-agent` or [pi.dev](https://pi.dev)

## 1.0.7

- Fixed activity bar icon showing as a white block — replaced PNG with a transparent SVG that renders correctly with VS Code themes

## 1.0.1

- Added CommandCode support

## 1.0.0

- Multi-tab support — run multiple CLI sessions simultaneously
- Chrome-style tab bar with activity spinner and close button
- New Tab page — click `+` to open the CLI picker without leaving your tabs
- Added Claude Code support (normal and YOLO mode)
- Added Codex CLI support (normal and YOLO mode)
- Expandable submenu for Gemini, Claude, and Codex with Normal / YOLO options
- Renamed Opencode → OpenCode, Kilo Code CLI → KiloCode
- Redesigned homepage with modern button layout and colored indicators
- Activity-based tab spinner — shows when a CLI is generating output
- Tab switching while on the New Tab page
- Updated icon

## 0.0.2

- Fixed README logo size
- Compressed icon

## 0.0.1

- Initial release
- Sidebar panel with Gemini CLI, Gemini CLI (YOLO), Opencode, and Kilo Code CLI
- Embedded xterm.js terminal with PTY support
- Session history with quick relaunch
