import * as vscode from "vscode";
import * as os from "os";
import * as path from "path";
import * as fs from "fs";
import { getHtml, CustomCLI } from "./html";

const CUSTOM_CLI_STORAGE_KEY = "pivotcli.customCLIList.storage";

function getConfiguredCustomCLIs(): CustomCLI[] {
  return vscode.workspace
    .getConfiguration("pivotcli")
    .get<CustomCLI[]>("customCLIList", []);
}

function getCustomCLIStore(context: vscode.ExtensionContext): vscode.Memento {
  return vscode.workspace.workspaceFolders?.length ? context.workspaceState : context.globalState;
}

function getCustomCLIs(context: vscode.ExtensionContext): CustomCLI[] {
  const stored = getCustomCLIStore(context).get<CustomCLI[] | undefined>(CUSTOM_CLI_STORAGE_KEY);
  if (stored !== undefined) {
    return stored;
  }
  return getConfiguredCustomCLIs();
}

async function setCustomCLIs(context: vscode.ExtensionContext, customCLIs: CustomCLI[]) {
  await getCustomCLIStore(context).update(CUSTOM_CLI_STORAGE_KEY, customCLIs);
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

interface BuiltinCLI { label: string; cmd: string; msgCmd: string; }
const BUILTIN_CLIS: BuiltinCLI[] = [
  { label: "Gemini",             cmd: "gemini",                                           msgCmd: "open-gemini" },
  { label: "Gemini \u2014 YOLO", cmd: "gemini -y",                                        msgCmd: "open-gemini-yolo" },
  { label: "Antigravity",        cmd: "agy",                                              msgCmd: "open-antigravity" },
  { label: "Antigravity \u2014 YOLO", cmd: "agy --dangerously-skip-permissions",         msgCmd: "open-antigravity-yolo" },
  { label: "Claude",             cmd: "claude",                                            msgCmd: "open-claude" },
  { label: "Claude \u2014 YOLO", cmd: "claude --dangerously-skip-permissions",             msgCmd: "open-claude-yolo" },
  { label: "Codex",              cmd: "codex",                                             msgCmd: "open-codex" },
  { label: "Codex \u2014 YOLO",  cmd: "codex --dangerously-bypass-approvals-and-sandbox",  msgCmd: "open-codex-yolo" },
  { label: "OpenCode",           cmd: "opencode",                                          msgCmd: "open-opencode" },
  { label: "Pi Coding",          cmd: "pi",                                                msgCmd: "open-pi" },
  { label: "OpenClaude",         cmd: "openclaude",                                        msgCmd: "open-openclaude" },
  { label: "OpenClaude \u2014 YOLO", cmd: "openclaude --dangerously-skip-permissions",    msgCmd: "open-openclaude-yolo" },
  { label: "KiloCode",           cmd: "kilo",                                              msgCmd: "open-kilo" },
  { label: "CommandCode",        cmd: "npx command-code",                                  msgCmd: "open-command-code" },
  { label: "CommandCode \u2014 YOLO", cmd: "npx command-code --yolo",                    msgCmd: "open-command-code-yolo" },
];

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
      const builtins = BUILTIN_CLIS.map(c => ({ label: c.label, cmd: c.cmd }));
      const customs = getCustomCLIs(context).flatMap((cli) => {
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
    vscode.commands.registerCommand("pivotcli.openAntigravity", () => {
      provider.launch("agy");
    }),
    vscode.commands.registerCommand("pivotcli.openAntigravityYolo", () => {
      provider.launch("agy --dangerously-skip-permissions");
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
  private imageCounters = new Map<number, number>();
  private pendingImages = new Map<number, { filePath: string; counter: number }[]>();

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

    webviewView.webview.html = getHtml(xtermCss, xtermJs, fitJs, getCustomCLIs(this.ctx));

    this.ctx.subscriptions.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration("pivotcli.customCLIList")) {
          this.view?.webview.postMessage({
            command: "update-custom-clis",
            customCLIs: getCustomCLIs(this.ctx),
          });
        }
      })
    );

    webviewView.webview.onDidReceiveMessage(async (msg: any) => {
      const builtin = BUILTIN_CLIS.find(c => c.msgCmd === msg.command);
      if (builtin) { this.launch(builtin.cmd, builtin.label); return; }
      switch (msg.command) {
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
        case "add-custom-cli":
          await this.addCustomCLI(msg);
          break;
        case "edit-custom-cli":
          if (typeof msg.index === "number") {
            await this.editCustomCLI(msg);
          }
          break;
        case "delete-custom-cli":
          if (typeof msg.index === "number") {
            await this.deleteCustomCLI(msg.index);
          }
          break;
        case "open-custom-settings":
          vscode.commands.executeCommand(
            "workbench.action.openSettings",
            "@ext:KamrulHasan.pivotcli customCLIList"
          );
          break;
        case "paste-image": {
          const tabId: number = msg.tabId;
          const b64: string = msg.data;
          const mimeType: string = typeof msg.mimeType === "string" ? msg.mimeType : "image/png";
          const ext = (mimeType.split("/")[1] || "png").replace(/[^a-z0-9]/g, "");
          const imgCount = (this.imageCounters.get(tabId) ?? 0) + 1;
          const tmpDir = process.platform === 'win32' ? os.tmpdir() : '/tmp';
          const tmpFile = path.join(tmpDir, `img${tabId}-${imgCount}.${ext}`);
          fs.writeFileSync(tmpFile, Buffer.from(b64, "base64"));
          this.imageCounters.set(tabId, imgCount);
          const pending = this.pendingImages.get(tabId) ?? [];
          pending.push({ filePath: tmpFile, counter: imgCount });
          this.pendingImages.set(tabId, pending);
          this.tabs.get(tabId)?.pty?.write(tmpFile);
          setTimeout(() => { try { fs.unlinkSync(tmpFile); } catch {} }, 30_000);
          break;
        }
      }
    });

    webviewView.onDidDispose(() => this.killAllPty());

    setTimeout(() => this.restoreTabs(), 300);
  }

  public launch(cmd: string, labelOverride?: string) {
    const label = labelOverride ?? BUILTIN_CLIS.find(c => c.cmd === cmd)?.label ?? cmd;

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
    this.imageCounters.delete(tabId);
    this.pendingImages.delete(tabId);
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

  private async updateCustomCLIs(customCLIs: CustomCLI[]) {
    await setCustomCLIs(this.ctx, customCLIs);
    this.post({ command: "update-custom-clis", customCLIs });
  }

  private async addCustomCLI(msg: any) {
    const name = typeof msg.name === "string" ? msg.name.trim() : "";
    const command = typeof msg.cliCommand === "string" ? msg.cliCommand.trim() : "";
    const yoloCommand = typeof msg.yoloCommand === "string" ? msg.yoloCommand.trim() : "";

    if (!name || !command) {
      this.post({ command: "custom-cli-error", message: "Custom CLI name and command are required." });
      vscode.window.showErrorMessage("Custom CLI name and command are required.");
      return;
    }

    const customCLIs = getCustomCLIs(this.ctx);
    const exists = customCLIs.some((cli) => cli.name.toLowerCase() === name.toLowerCase());
    if (exists) {
      this.post({ command: "custom-cli-error", message: `A custom CLI named \"${name}\" already exists.` });
      vscode.window.showErrorMessage(`A custom CLI named \"${name}\" already exists.`);
      return;
    }

    const rawColor = typeof msg.color === "string" ? msg.color.trim() : "";
    const color = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : undefined;
    const newCLI: CustomCLI = { name, command };
    if (yoloCommand) { newCLI.yoloCommand = yoloCommand; }
    if (color) { newCLI.color = color; }

    await this.updateCustomCLIs([...customCLIs, newCLI]);
    this.post({ command: "custom-cli-saved" });
  }

  private async deleteCustomCLI(index: number) {
    const customCLIs = getCustomCLIs(this.ctx);
    if (index < 0 || index >= customCLIs.length) {
      return;
    }

    customCLIs.splice(index, 1);
    await this.updateCustomCLIs(customCLIs);
    this.post({ command: "custom-cli-deleted" });
  }

  private async editCustomCLI(msg: any) {
    const index = msg.index as number;
    const name = typeof msg.name === "string" ? msg.name.trim() : "";
    const command = typeof msg.cliCommand === "string" ? msg.cliCommand.trim() : "";
    const yoloCommand = typeof msg.yoloCommand === "string" ? msg.yoloCommand.trim() : "";
    const rawColor = typeof msg.color === "string" ? msg.color.trim() : "";
    const color = /^#[0-9a-fA-F]{6}$/.test(rawColor) ? rawColor : undefined;

    if (!name || !command) {
      this.post({ command: "custom-cli-error", message: "Custom CLI name and command are required." });
      return;
    }

    const customCLIs = getCustomCLIs(this.ctx);
    if (index < 0 || index >= customCLIs.length) {
      this.post({ command: "custom-cli-error", message: "Invalid CLI index." });
      return;
    }

    // Allow same name if it belongs to the item being edited
    const duplicate = customCLIs.some((cli, i) => i !== index && cli.name.toLowerCase() === name.toLowerCase());
    if (duplicate) {
      this.post({ command: "custom-cli-error", message: `A custom CLI named "${name}" already exists.` });
      return;
    }

    const updated: CustomCLI = { name, command };
    if (yoloCommand) { updated.yoloCommand = yoloCommand; }
    if (color) { updated.color = color; }
    customCLIs[index] = updated;
    await this.updateCustomCLIs(customCLIs);
    this.post({ command: "custom-cli-saved" });
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
        let out = data;
        const pending = this.pendingImages.get(tab.id);
        if (pending && pending.length > 0) {
          for (let i = pending.length - 1; i >= 0; i--) {
            const { filePath: imgPath, counter } = pending[i];
            if (out.includes(imgPath)) {
              out = out.split(imgPath).join(`image ${counter}`);
              pending.splice(i, 1);
            }
          }
        }
        this.post({ command: "output", tabId: tab.id, data: out });
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
