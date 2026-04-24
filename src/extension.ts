import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import { getHtml } from "./html";

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
      const picked = await vscode.window.showQuickPick(
        [
          { label: "GEMINI CLI", cmd: "gemini" },
          { label: "GEMINI CLI - YOLO", cmd: "gemini -y" },
          { label: "OPENCODE", cmd: "opencode" },
          { label: "KILO CODE CLI", cmd: "kilo" },
        ],
        { placeHolder: "Select a session type" }
      );
      if (picked) {
        provider.launch(picked.cmd);
      }
    }),
    vscode.commands.registerCommand("pivotcli.openGemini", () => {
      provider.launch("gemini");
    }),
    vscode.commands.registerCommand("pivotcli.openGeminiYolo", () => {
      provider.launch("gemini -y");
    }),
    vscode.commands.registerCommand("pivotcli.openOpencode", () => {
      provider.launch("opencode");
    }),
    vscode.commands.registerCommand("pivotcli.openKilo", () => {
      provider.launch("kilo");
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
  private ptyProcess?: any;

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

    webviewView.webview.html = getHtml(xtermCss, xtermJs, fitJs);

    webviewView.webview.onDidReceiveMessage((msg: any) => {
      switch (msg.command) {
        case "open-gemini":
          this.launch("gemini");
          break;
        case "open-gemini-yolo":
          this.launch("gemini -y");
          break;
        case "open-opencode":
          this.launch("opencode");
          break;
        case "open-kilo":
          this.launch("kilo");
          break;
        case "input":
          this.ptyProcess?.write(msg.data);
          break;
        case "resize":
          if (msg.cols > 0 && msg.rows > 0) {
            try { this.ptyProcess?.resize(msg.cols, msg.rows); } catch {}
          }
          break;
      }
    });

    webviewView.onDidDispose(() => this.killPty());
  }

  public launch(cmd: string) {
    this.post({ command: "reset" });
    const label = cmd === "gemini" ? "GEMINI CLI"
      : cmd === "gemini -y" ? "GEMINI CLI (YOLO)"
      : cmd === "opencode" ? "OPENCODE"
      : "KILO CODE CLI";
    this.post({ command: "loading", label });
    this.saveSession(cmd, label);
    this.spawnPty(cmd);
  }

  private saveSession(cmd: string, label: string) {
    const sessions: Session[] = this.ctx.globalState.get("pivotcli.sessions", []);
    sessions.unshift({ cmd, label, timestamp: Date.now() });
    if (sessions.length > 10) { sessions.length = 10; }
    this.ctx.globalState.update("pivotcli.sessions", sessions);
  }

  private spawnPty(cmd: string) {
    this.killPty();
    this.post({ command: "show-terminal" });

    const isWin = os.platform() === "win32";
    const shell = isWin ? "powershell.exe" : "/bin/bash";
    const shellArgs = isWin ? ["-NoProfile", "-NoExit", "-Command", cmd] : ["-c", cmd];
    const cwd =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();

    try {
      this.ptyProcess = ptyModule.spawn(shell, shellArgs, {
        name: "xterm-256color",
        cols: 80,
        rows: 24,
        cwd,
        env: { ...process.env } as Record<string, string>,
      });

      this.ptyProcess.onData((data: string) => {
        this.post({ command: "output", data });
      });

      this.ptyProcess.onExit(() => {
        this.post({ command: "exit" });
        this.ptyProcess = undefined;
      });
    } catch (err: any) {
      this.post({
        command: "output",
        data: `\r\nError spawning process: ${err.message}\r\n`,
      });
    }
  }

  private killPty() {
    if (this.ptyProcess) {
      try { this.ptyProcess.kill(); } catch {}
      this.ptyProcess = undefined;
    }
  }

  private post(msg: unknown) {
    this.view?.webview.postMessage(msg);
  }
}
