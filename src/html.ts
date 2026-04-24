import * as vscode from "vscode";

export function getHtml(
  css: vscode.Uri,
  js: vscode.Uri,
  fit: vscode.Uri
): string {
  return /*html*/ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="stylesheet" href="${css}" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { height: 100%; overflow: hidden; }
    body {
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      display: flex; flex-direction: column;
    }
    #buttons {
      flex: 1; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 12px;
    }
    .launch-btn {
      width: 180px; padding: 11px 0;
      border: 1px solid rgba(255,255,255,0.08); border-radius: 8px;
      cursor: pointer; font-size: 13px; font-weight: 500;
      letter-spacing: 0.3px; color: var(--vscode-foreground);
      background: rgba(255,255,255,0.04);
      transition: background 0.15s, border-color 0.15s;
    }
    .launch-btn:hover { background: rgba(255,255,255,0.09); border-color: rgba(255,255,255,0.18); }
    .launch-btn:active { background: rgba(255,255,255,0.13); }

    #loading {
      display: none; flex: 1;
      flex-direction: column; align-items: center; justify-content: center; gap: 14px;
    }
    .spinner {
      width: 28px; height: 28px;
      border: 3px solid rgba(255,255,255,0.1);
      border-top-color: var(--vscode-foreground);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .loading-text {
      font-size: 13px; opacity: 0.7;
    }

    #terminal-container { display: none; width: 100%; height: 100%; padding: 8px 10px; overflow: hidden; }
    #terminal-container .xterm { width: 100% !important; }
    #terminal-container .xterm-cursor-bar { animation: cursor-blink 1s step-end infinite; }
    @keyframes cursor-blink { 50% { opacity: 0; } }
    #terminal-container .xterm-viewport { width: 100% !important; overflow-y: hidden !important; }
    #terminal-container .xterm-viewport::-webkit-scrollbar { display: none; }
  </style>
</head>
<body>
  <div id="buttons">
    <button class="launch-btn" id="btn-gemini">GEMINI CLI</button>
    <button class="launch-btn" id="btn-yolo">GEMINI CLI — YOLO</button>
    <button class="launch-btn" id="btn-opencode">OPENCODE</button>
    <button class="launch-btn" id="btn-kilo">KILO CODE CLI</button>
  </div>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Loading Gemini CLI...</div>
  </div>
  <div id="terminal-container"></div>

  <script src="${js}"></script>
  <script src="${fit}"></script>
  <script>
    const vscode = acquireVsCodeApi();
    const buttonsDiv = document.getElementById("buttons");
    const loadingDiv = document.getElementById("loading");
    const loadingText = loadingDiv.querySelector(".loading-text");
    const termDiv = document.getElementById("terminal-container");
    let term, fitAddon, gotFirstOutput = false;

    function showLoading(label) {
      gotFirstOutput = false;
      buttonsDiv.style.display = "none";
      loadingText.textContent = "Loading " + label + "...";
      loadingDiv.style.display = "flex";
      termDiv.style.display = "none";
    }

    function showTerminal() {
      loadingDiv.style.display = "none";
      termDiv.style.display = "block";
      initTerm();
    }

    function initTerm() {
      if (term) term.dispose();
      term = new Terminal({
        cursorBlink: false,
        cursorStyle: "bar",
        cursorInactiveStyle: "none",
        fontSize: 13,
        fontWeight: "normal",
        fontWeightBold: "bold",
        letterSpacing: 0,
        lineHeight: 1.0,
        convertEol: false,
        fontFamily: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
        theme: { background: "#1a1b1e", cursor: "rgba(255,255,255,0.6)", cursorAccent: "transparent" }
      });
      fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      term.open(termDiv);
      setTimeout(() => {
        fitAddon.fit();
        vscode.postMessage({ command: "resize", cols: term.cols, rows: term.rows });
        // re-fit after layout settles
        setTimeout(() => {
          fitAddon.fit();
          vscode.postMessage({ command: "resize", cols: term.cols, rows: term.rows });
        }, 200);
      }, 100);
      term.onData(data => vscode.postMessage({ command: "input", data }));
      new ResizeObserver(() => {
        if (fitAddon) {
          fitAddon.fit();
          vscode.postMessage({ command: "resize", cols: term.cols, rows: term.rows });
        }
      }).observe(termDiv);
    }

    document.getElementById("btn-gemini").onclick = () => {
      showLoading("GEMINI CLI");
      vscode.postMessage({ command: "open-gemini" });
    };
    document.getElementById("btn-yolo").onclick = () => {
      showLoading("GEMINI CLI (YOLO)");
      vscode.postMessage({ command: "open-gemini-yolo" });
    };
    document.getElementById("btn-opencode").onclick = () => {
      showLoading("OPENCODE");
      vscode.postMessage({ command: "open-opencode" });
    };
    document.getElementById("btn-kilo").onclick = () => {
      showLoading("KILO CODE CLI");
      vscode.postMessage({ command: "open-kilo" });
    };

    window.addEventListener("message", e => {
      const msg = e.data;
      if (msg.command === "reset") {
        if (term) { term.dispose(); term = null; fitAddon = null; }
        gotFirstOutput = false;
        buttonsDiv.style.display = "none";
        loadingDiv.style.display = "none";
        termDiv.style.display = "none";
      } else if (msg.command === "loading") {
        gotFirstOutput = false;
        if (term) { term.dispose(); term = null; fitAddon = null; }
        buttonsDiv.style.display = "none";
        termDiv.style.display = "none";
        loadingText.textContent = "Loading " + msg.label + "...";
        loadingDiv.style.display = "flex";
      } else if (msg.command === "show-terminal") {
        // terminal ready on backend, but wait for first output
      } else if (msg.command === "output") {
        if (!gotFirstOutput) {
          gotFirstOutput = true;
          showTerminal();
        }
        term?.write(msg.data);
      } else if (msg.command === "exit") {
        if (!gotFirstOutput) {
          gotFirstOutput = true;
          showTerminal();
        }
        term?.writeln("\\r\\n[Process exited]");
      }
    });
  </script>
</body>
</html>`;
}
