import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import { getHtml, CustomCLI } from "./html";

function getCustomCLIs(): CustomCLI[] {
  return vscode.workspace
    .getConfiguration("pivotcli")
    .get<CustomCLI[]>("customCLIList", []);
}

function loadNodePty(): any {
  const appRoot = vscode.env.appRoot;
  const ptyPath = path.join(appRoot, "node_modules", "node-pty");
  return require(ptyPath);
}

interface Session {
  cmd: string;
  label: string;
  timestamp: number;
}

interface Tab {
  id: number;
  label: string;
  cmd: string;
  pty: any;
}

let ptyModule: any;

export function activate(context: vscode.ExtensionContext) {
  try {
    ptyModule = loadNodePty();
  } catch (err: any) {
    vscode.window.showErrorMessage(
      `PivotCLI: failed to load node-pty from VS Code: ${err.message}`
    );
    return;
  }

  const provider = new PivotCLIProvider(context);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("pivotcli.panel", provider, {
      webviewOptions: { retainContextWhenHidden: true },
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("pivotcli.newSession", async () => {
      const builtins = [
        { label: "Gemini", cmd: "gemini" },
        { label: "Gemini — YOLO", cmd: "gemini -y" },
        { label: "Claude", cmd: "claude" },
        { label: "Claude — YOLO", cmd: "claude --dangerously-skip-permissions" },
        { label: "Codex", cmd: "codex" },
        { label: "Codex — YOLO", cmd: "codex --dangerously-bypass-approvals-and-sandbox" },
        { label: "OpenCode", cmd: "opencode" },
        { label: "Pi Coding", cmd: "pi" },
        { label: "OpenClaude", cmd: "openclaude" },
        { label: "OpenClaude — YOLO", cmd: "openclaude --dangerously-skip-permissions" },
        { label: "KiloCode", cmd: "kilo" },
        { label: "CommandCode", cmd: "npx command-code" },
        { label: "CommandCode — YOLO", cmd: "npx command-code --yolo" },
      ];
      const customs = getCustomCLIs().flatMap((cli) => {
        const items: { label: string; cmd: string }[] = [
          { label: cli.name, cmd: cli.command },
        ];
        if (cli.yoloCommand) {
          items.push({ label: `${cli.name} — YOLO`, cmd: cli.yoloCommand });
        }
        return items;
      });
      const picked = await vscode.window.showQuickPick(
        [...builtins, ...customs],
        { placeHolder: "Select a session type" }
      );
      if (picked) {
        provider.launch(picked.cmd, picked.label);
      }
    }),
    vscode.commands.registerCommand("pivotcli.openGemini", () => {
      provider.launch("gemini");
    }),
    vscode.commands.registerCommand("pivotcli.openGeminiYolo", () => {
      provider.launch("gemini -y");
    }),
    vscode.commands.registerCommand("pivotcli.openClaude", () => {
      provider.launch("claude");
    }),
    vscode.commands.registerCommand("pivotcli.openClaudeYolo", () => {
      provider.launch("claude --dangerously-skip-permissions");
    }),
    vscode.commands.registerCommand("pivotcli.openCodex", () => {
      provider.launch("codex");
    }),
    vscode.commands.registerCommand("pivotcli.openCodexYolo", () => {
      provider.launch("codex --dangerously-bypass-approvals-and-sandbox");
    }),
    vscode.commands.registerCommand("pivotcli.openOpencode", () => {
      provider.launch("opencode");
    }),
    vscode.commands.registerCommand("pivotcli.openPi", () => {
      provider.launch("pi");
    }),
    vscode.commands.registerCommand("pivotcli.openKilo", () => {
      provider.launch("kilo");
    }),
    vscode.commands.registerCommand("pivotcli.openCommandCode", () => {
      provider.launch("npx command-code");
    }),
    vscode.commands.registerCommand("pivotcli.openCommandCodeYolo", () => {
      provider.launch("npx command-code --yolo");
    }),
    vscode.commands.registerCommand("pivotcli.showSessions", async () => {
      const sessions: Session[] = context.globalState.get("pivotcli.sessions", []);
      if (sessions.length === 0) {
        vscode.window.showInformationMessage("No session history yet.");
        return;
      }
      const items = sessions.map((s) => {
        const date = new Date(s.timestamp);
        const timeStr = date.toLocaleString();
        return { label: s.label, description: timeStr, cmd: s.cmd };
      });
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: "Select a session to relaunch",
      });
      if (picked) {
        provider.launch(picked.cmd);
      }
    })
  );
}

export function deactivate() {}

class PivotCLIProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private tabs: Map<number, Tab> = new Map();
  private activeTabId: number = -1;
  private nextTabId: number = 1;
  private isRestoring: boolean = false;

  constructor(private readonly ctx: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView) {
    this.view = webviewView;

    const localRes = (...segs: string[]) =>
      webviewView.webview.asWebviewUri(
        vscode.Uri.file(path.join(this.ctx.extensionPath, ...segs))
      );

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.ctx.extensionPath, "node_modules")),
      ],
    };

    const xtermCss = localRes("node_modules", "@xterm", "xterm", "css", "xterm.css");
    const xtermJs = localRes("node_modules", "@xterm", "xterm", "lib", "xterm.js");
    const fitJs = localRes("node_modules", "@xterm", "addon-fit", "lib", "addon-fit.js");

    webviewView.webview.html = getHtml(xtermCss, xtermJs, fitJs, getCustomCLIs());

    this.ctx.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("pivotcli.customCLIList")) {
          this.view?.webview.postMessage({
            command: "update-custom-clis",
            customCLIs: getCustomCLIs(),
          });
        }
      })
    );

    webviewView.webview.onDidReceiveMessage((msg: any) => {
      switch (msg.command) {
        case "open-gemini":
          this.launch("gemini");
          break;
        case "open-gemini-yolo":
          this.launch("gemini -y");
          break;
        case "open-claude":
          this.launch("claude");
          break;
        case "open-claude-yolo":
          this.launch("claude --dangerously-skip-permissions");
          break;
        case "open-codex":
          this.launch("codex");
          break;
        case "open-codex-yolo":
          this.launch("codex --dangerously-bypass-approvals-and-sandbox");
          break;
        case "open-opencode":
          this.launch("opencode");
          break;
        case "open-pi":
          this.launch("pi");
          break;
        case "open-openclaude":
          this.launch("openclaude");
          break;
        case "open-openclaude-yolo":
          this.launch("openclaude --dangerously-skip-permissions");
          break;
        case "open-kilo":
          this.launch("kilo");
          break;
        case "open-command-code":
          this.launch("npx command-code");
          break;
        case "open-command-code-yolo":
          this.launch("npx command-code --yolo");
          break;
        case "input":
          if (msg.tabId !== undefined) {
            this.tabs.get(msg.tabId)?.pty?.write(msg.data);
          }
          break;
        case "resize":
          if (msg.tabId !== undefined && msg.cols > 0 && msg.rows > 0) {
            try { this.tabs.get(msg.tabId)?.pty?.resize(msg.cols, msg.rows); } catch {}
          }
          break;
        case "switch-tab":
          this.activeTabId = msg.tabId;
          break;
        case "close-tab":
          this.closeTab(msg.tabId);
          break;
        case "open-custom":
          if (typeof msg.cmd === "string" && msg.cmd.length > 0) {
            this.launch(msg.cmd, typeof msg.label === "string" ? msg.label : undefined);
          }
          break;
        case "open-custom-settings":
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "@ext:KamrulHasan.pivotcli customCLIList"
          );
          break;
      }
    });

    webviewView.onDidDispose(() => this.killAllPty());

    setTimeout(() => this.restoreTabs(), 300);
  }

  public launch(cmd: string, labelOverride?: string) {
    const labels: Record<string, string> = {
      "gemini": "Gemini",
      "gemini -y": "Gemini YOLO",
      "claude": "Claude",
      "claude --dangerously-skip-permissions": "Claude YOLO",
      "codex": "Codex",
      "codex --dangerously-bypass-approvals-and-sandbox": "Codex YOLO",
      "opencode": "OpenCode",
      "pi": "Pi Coding",
      "openclaude": "OpenClaude",
      "openclaude --dangerously-skip-permissions": "OpenClaude YOLO",
      "kilo": "KiloCode",
      "npx command-code": "CommandCode",
      "npx command-code --yolo": "CommandCode YOLO",
    };
    const label = labelOverride ?? labels[cmd] ?? cmd;

    const tabId = this.nextTabId++;
    const tab: Tab = { id: tabId, label, cmd, pty: null };
    this.tabs.set(tabId, tab);
    this.activeTabId = tabId;

    this.saveSession(cmd, label);
    this.persistTabs();
    this.post({ command: "new-tab", tabId, label });
    this.spawnPty(tab);
  }

  private closeTab(tabId: number) {
    const tab = this.tabs.get(tabId);
    if (tab?.pty) {
      try { tab.pty.kill(); } catch {}
    }
    this.tabs.delete(tabId);
    this.persistTabs();

    if (this.activeTabId === tabId) {
      const remaining = Array.from(this.tabs.keys());
      this.activeTabId = remaining.length > 0 ? remaining[remaining.length - 1] : -1;
    }

    this.post({ command: "tab-closed", tabId, switchTo: this.activeTabId });
  }

  private persistTabs() {
    if (this.isRestoring) { return; }
    const data = Array.from(this.tabs.values()).map(t => ({ cmd: t.cmd, label: t.label }));
    this.ctx.workspaceState.update("pivotcli.openTabs", data);
  }

  private restoreTabs() {
    const saved: { cmd: string; label: string }[] =
      this.ctx.workspaceState.get("pivotcli.openTabs", []);
    if (saved.length === 0) { return; }
    this.isRestoring = true;
    for (const { cmd, label } of saved) {
      this.launch(cmd, label);
    }
    this.isRestoring = false;
    this.persistTabs();
  }

  private saveSession(cmd: string, label: string) {
    const sessions: Session[] = this.ctx.globalState.get("pivotcli.sessions", []);
    sessions.unshift({ cmd, label, timestamp: Date.now() });
    if (sessions.length > 10) { sessions.length = 10; }
    this.ctx.globalState.update("pivotcli.sessions", sessions);
  }

  private spawnPty(tab: Tab) {
    const isWin = os.platform() === "win32";
    const shell = isWin ? "powershell.exe" : "/bin/bash";
    const shellArgs = isWin ? ["-NoProfile", "-NoExit", "-Command", tab.cmd] : ["-c", tab.cmd];
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();

    try {
      tab.pty = ptyModule.spawn(shell, shellArgs, {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd,
        env: { ...process.env } as Record<string, string>,
      });

      tab.pty.onData((data: string) => {
        this.post({ command: "output", tabId: tab.id, data });
      });

      tab.pty.onExit(() => {
        this.post({ command: "exit", tabId: tab.id });
      });
    } catch (err: any) {
      this.post({
        command: "output",
        tabId: tab.id,
        data: `\r\nError spawning process: ${err.message}\r\n`,
      });
    }
  }

  private killAllPty() {
    for (const tab of this.tabs.values()) {
      if (tab.pty) {
        try { tab.pty.kill(); } catch {}
      }
    }
    this.tabs.clear();
  }

  private post(msg: unknown) {
    this.view?.webview.postMessage(msg);
  }
}
