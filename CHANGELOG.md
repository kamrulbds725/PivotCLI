# Changelog

## 3.0.7

- Removed Gemini CLI support (replaced by Antigravity CLI)

## 3.0.5

- Added Antigravity CLI support in the launcher with Normal mode (`agy`) and YOLO Mode (`agy --dangerously-skip-permissions`)
- Added in-panel **Custom CLI Manager** — add, edit, and delete custom CLIs directly from the sidebar without opening settings
- Custom CLI form now includes an optional **color picker** (swatch + hex input) so each custom CLI gets its own dot color
- Added **Edit** button for saved custom CLIs — pre-fills the form and updates the entry in place
- Fixed Custom CLI Manager not closing automatically after saving
- Fixed custom CLI buttons appearing narrower than built-in CLI buttons
- Fixed gaps missing between custom CLI buttons in the launcher
- Launcher list now scrolls when content is taller than the panel; buttons are vertically centered when the manager is closed

## 3.0.1

- **Fixed image paste double-send** — Ctrl+V image paste was sending two `paste-image` messages due to a microtask/macrotask race between the clipboard API and the browser paste event; now handled exclusively through the paste event listener
- **Image paste display** — pasted images now display as `image 1`, `image 2`, etc. in the terminal instead of the raw temp file path
- **Shorter temp filenames** — pasted images are saved as `img<tab>-<n>.<ext>` (e.g. `img1-1.png`) to avoid line-wrap in narrow terminals breaking path substitution
- **Removed duplicate paste handler** — eliminated a document-level paste listener that was causing triple paste on some Ctrl+V operations

## 3.0.0

- **Shift+Enter soft newline** — inserts a new line without submitting in all CLIs; Pi Coding uses the Kitty keyboard protocol sequence (`ESC[13;2u`) automatically
- **Ctrl+V image paste** — paste images from clipboard directly into any CLI that supports it; image is saved to a temp file and the path is sent to the PTY
- **Right-click Paste image support** — native context-menu Paste now also handles images, not just keyboard Ctrl+V

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
