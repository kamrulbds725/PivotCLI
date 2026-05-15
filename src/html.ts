import * as vscode from "vscode";

export interface CustomCLI {
  name: string;
  command: string;
  yoloCommand?: string;
  color?: string;
}

export function getHtml(
  css: vscode.Uri,
  js: vscode.Uri,
  fit: vscode.Uri,
  customCLIs: CustomCLI[] = []
): string {
  // Encode as base64 so any characters in names/commands can't break the JS template
  const customCLIsB64 = Buffer.from(JSON.stringify(customCLIs)).toString("base64");
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
      align-items: center; justify-content: center; gap: 6px;
      padding: 24px 16px;
    }
    .btn-group {
      width: 100%; max-width: 260px;
      display: flex; flex-direction: column; gap: 0;
    }
    .home-title {
      font-size: 11px; font-weight: 600; text-transform: uppercase;
      letter-spacing: 1px; color: rgba(255,255,255,0.65);
      margin-bottom: 8px;
    }
    .launch-btn {
      width: 100%; max-width: 260px; padding: 10px 16px;
      border: none; border-radius: 6px;
      cursor: pointer; font-size: 12px; font-weight: 500;
      color: rgba(255,255,255,0.8);
      background: rgba(255,255,255,0.05);
      display: flex; align-items: center; gap: 10px;
      transition: background 0.15s, color 0.15s;
      text-align: left; position: relative;
    }
    .launch-btn:hover { background: rgba(255,255,255,0.1); color: var(--vscode-foreground); }
    .launch-btn:active { background: rgba(255,255,255,0.14); }
    .launch-btn .btn-icon {
      width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0;
    }
    .launch-btn .btn-arrow {
      margin-left: auto; font-size: 10px;
      transition: opacity 0.15s, transform 0.2s;
      color: rgba(255,255,255,0.3); opacity: 1;
    }
    .launch-btn:hover .btn-arrow { opacity: 1; color: rgba(255,255,255,0.5); }
    .launch-btn.expanded .btn-arrow { transform: rotate(90deg); }

    .sub-items {
      width: 100%; max-width: 260px;
      overflow: hidden; max-height: 0;
      transition: max-height 0.25s ease;
      margin: 0; padding: 0; line-height: 0;
    }
    .sub-items.open { max-height: 120px; line-height: normal; }
    .sub-item {
      width: 100%; padding: 8px 16px 8px 32px;
      border: none; border-radius: 4px;
      cursor: pointer; font-size: 11.5px; font-weight: 400;
      color: rgba(255,255,255,0.6);
      background: transparent;
      display: flex; align-items: center; gap: 8px;
      transition: background 0.12s, color 0.12s;
      text-align: left;
    }
    .sub-item:hover { background: rgba(255,255,255,0.08); color: var(--vscode-foreground); }
    .sub-item:active { background: rgba(255,255,255,0.12); }
    .sub-item .sub-dot {
      width: 4px; height: 4px; border-radius: 50%;
      background: rgba(255,255,255,0.25); flex-shrink: 0;
    }
    .custom-sep {
      width: 100%; max-width: 260px;
      height: 1px; background: rgba(255,255,255,0.08);
      margin: 6px 0;
    }
    .add-custom-btn {
      width: 100%; max-width: 260px; padding: 9px 16px;
      border: 1px dashed rgba(255,255,255,0.13); border-radius: 6px;
      cursor: pointer; font-size: 11.5px; font-weight: 500;
      color: rgba(255,255,255,0.3); background: transparent;
      display: flex; align-items: center; justify-content: center; gap: 7px;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
      margin-top: 8px;
    }
    .add-custom-btn:hover {
      border-color: rgba(255,255,255,0.3);
      color: rgba(255,255,255,0.65);
      background: rgba(255,255,255,0.04);
    }
    .add-custom-btn:active { background: rgba(255,255,255,0.07); }
    .add-custom-btn .add-icon {
      font-size: 16px; line-height: 1; opacity: 0.7; font-weight: 300;
    }
    .add-custom-hint {
      font-size: 10px; color: rgba(255,255,255,0.45);
      max-width: 260px; text-align: center; margin-top: 5px;
      line-height: 1.4;
    }

    #tab-bar {
      display: none; flex-direction: row; align-items: stretch;
      padding: 0; gap: 0;
      background: rgba(0,0,0,0.15);
      overflow-x: auto; flex-shrink: 0;
      scrollbar-width: none;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    #tab-bar::-webkit-scrollbar { display: none; }
    #tab-list {
      display: flex; flex-direction: row; align-items: stretch;
      gap: 0; min-width: 0; overflow-x: auto; flex: 1;
      scrollbar-width: none;
    }
    #tab-list::-webkit-scrollbar { display: none; }
    .tab {
      display: flex; align-items: center; gap: 7px;
      padding: 0 12px; height: 31px; cursor: pointer;
      font-size: 11px; font-weight: 400;
      color: rgba(255,255,255,0.4);
      background: transparent;
      border-radius: 0;
      border-right: 1px solid rgba(255,255,255,0.06);
      white-space: nowrap; flex-shrink: 0;
      min-width: 80px; max-width: 180px;
      position: relative;
      transition: color 0.12s, background 0.12s;
    }
    .tab:hover {
      color: rgba(255,255,255,0.75);
      background: rgba(255,255,255,0.05);
    }
    .tab.active {
      color: rgba(255,255,255,0.92);
      background: rgba(255,255,255,0.08);
      font-weight: 500;
    }
    .tab .tab-label {
      overflow: hidden; text-overflow: ellipsis; flex: 1;
    }
    .tab .close-btn {
      display: inline-flex; align-items: center; justify-content: center;
      width: 18px; height: 18px; border-radius: 50%;
      border: none; background: transparent; color: rgba(255,255,255,0.4);
      cursor: pointer; font-size: 14px; line-height: 1;
      opacity: 0; transition: opacity 0.12s, background 0.12s, color 0.12s;
      flex-shrink: 0;
    }
    .tab:hover .close-btn { opacity: 1; }
    .tab .close-btn:hover { background: rgba(255,255,255,0.1); color: var(--vscode-foreground); }
    .tab.active .close-btn { opacity: 0.6; }
    .tab.active .close-btn:hover { opacity: 1; background: rgba(255,255,255,0.1); }

    .tab-spinner {
      width: 10px; height: 10px;
      border: 1.5px solid rgba(255,255,255,0.15);
      border-top-color: var(--vscode-foreground);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      flex-shrink: 0;
      display: none;
    }
    .tab.busy .tab-spinner { display: block; }
    .tab.busy .close-btn { display: none; }

    #add-tab-btn {
      display: flex; align-items: center; justify-content: center;
      width: 32px; height: 31px; border-radius: 0;
      border: none; background: transparent;
      color: rgba(255,255,255,0.35); cursor: pointer;
      font-size: 16px; line-height: 1;
      flex-shrink: 0;
      transition: background 0.12s, color 0.12s;
    }
    #add-tab-btn:hover { background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.8); }

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
    .loading-text { font-size: 13px; opacity: 0.7; }

    #terminals { display: none; width: 100%; flex: 1; position: relative; overflow: hidden; }
    .term-panel {
      display: none; width: 100%; height: 100%; padding: 8px 10px; overflow: hidden;
      position: absolute; top: 0; left: 0;
    }
    .term-panel.active { display: block; }
    .term-panel .xterm { width: 100% !important; }
    .term-panel .xterm-cursor-bar { animation: cursor-blink 1s step-end infinite; }
    @keyframes cursor-blink { 50% { opacity: 0; } }
    .term-panel .xterm-viewport { width: 100% !important; overflow-y: hidden !important; }
    .term-panel .xterm-viewport::-webkit-scrollbar { display: none; }
  </style>
</head>
<body>
  <div id="tab-bar"><div id="tab-list"></div><button id="add-tab-btn">+</button></div>
  <div id="buttons">
    <div class="home-title">Launch a CLI</div>
    <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:-4px;margin-bottom:10px;">CLIs must be installed on your system before use</div>

    <div class="btn-group">
      <button class="launch-btn expandable" data-group="claude">
        <span class="btn-icon" style="background:#d97757"></span>Claude<span class="btn-arrow">&#9656;</span>
      </button>
      <div class="sub-items" data-for="claude">
        <button class="sub-item" data-cmd="open-claude"><span class="sub-dot"></span>Normal</button>
        <button class="sub-item" data-cmd="open-claude-yolo"><span class="sub-dot"></span>YOLO Mode</button>
      </div>
    </div>

    <div class="btn-group">
      <button class="launch-btn expandable" data-group="codex">
        <span class="btn-icon" style="background:#10a37f"></span>Codex<span class="btn-arrow">&#9656;</span>
      </button>
      <div class="sub-items" data-for="codex">
        <button class="sub-item" data-cmd="open-codex"><span class="sub-dot"></span>Normal</button>
        <button class="sub-item" data-cmd="open-codex-yolo"><span class="sub-dot"></span>YOLO Mode</button>
      </div>
    </div>

    <div class="btn-group">
      <button class="launch-btn expandable" data-group="gemini">
        <span class="btn-icon" style="background:#4285f4"></span>Gemini<span class="btn-arrow">&#9656;</span>
      </button>
      <div class="sub-items" data-for="gemini">
        <button class="sub-item" data-cmd="open-gemini"><span class="sub-dot"></span>Normal</button>
        <button class="sub-item" data-cmd="open-gemini-yolo"><span class="sub-dot"></span>YOLO Mode</button>
      </div>
    </div>

    <button class="launch-btn" id="btn-opencode">
      <span class="btn-icon" style="background:#34a853"></span>OpenCode<span class="btn-arrow">&#9656;</span>
    </button>
    <button class="launch-btn" id="btn-pi">
      <span class="btn-icon" style="background:#6366f1"></span>Pi Coding<span class="btn-arrow">&#9656;</span>
    </button>
    <div class="btn-group">
      <button class="launch-btn expandable" data-group="openclaude">
        <span class="btn-icon" style="background:#c084fc"></span>OpenClaude<span class="btn-arrow">&#9656;</span>
      </button>
      <div class="sub-items" data-for="openclaude">
        <button class="sub-item" data-cmd="open-openclaude"><span class="sub-dot"></span>Normal</button>
        <button class="sub-item" data-cmd="open-openclaude-yolo"><span class="sub-dot"></span>YOLO Mode</button>
      </div>
    </div>
    <button class="launch-btn" id="btn-kilo">
      <span class="btn-icon" style="background:#ea4335"></span>KiloCode<span class="btn-arrow">&#9656;</span>
    </button>
    <div class="btn-group">
      <button class="launch-btn expandable" data-group="command-code">
        <span class="btn-icon" style="background:#7c3aed"></span>CommandCode<span class="btn-arrow">&#9656;</span>
      </button>
      <div class="sub-items" data-for="command-code">
        <button class="sub-item" data-cmd="open-command-code"><span class="sub-dot"></span>Normal</button>
        <button class="sub-item" data-cmd="open-command-code-yolo"><span class="sub-dot"></span>YOLO Mode</button>
      </div>
    </div>

    <div id="custom-clis"></div>
    <button id="add-custom-cli-btn" class="add-custom-btn" title="Opens pivotcli.customCLIList in VS Code Settings">
      <span class="add-icon">+</span> Add Custom CLI
    </button>
  </div>
  <div id="loading">
    <div class="spinner"></div>
    <div class="loading-text">Loading...</div>
  </div>
  <div id="terminals"></div>

  <script src="${js}"></script>
  <script src="${fit}"></script>
  <script>const _customCLIs = JSON.parse(atob("${customCLIsB64}"));</script>
  <script>
    const vscode = acquireVsCodeApi();
    const buttonsDiv = document.getElementById("buttons");
    const tabBar = document.getElementById("tab-bar");
    const tabList = document.getElementById("tab-list");
    const loadingDiv = document.getElementById("loading");
    const loadingText = loadingDiv.querySelector(".loading-text");
    const terminalsDiv = document.getElementById("terminals");

    // Track all tabs: { id, label, term, fitAddon, el, tabEl, gotFirstOutput, idleTimer, isNewTab }
    const tabs = new Map();
    let activeTabId = -1;
    let newTabId = -1; // tracks the "New Tab" waiting for CLI selection
    const IDLE_DELAY = 800;
    const BUSY_THRESHOLD = 200;

    function isEscapeOnly(data) {
      var esc = String.fromCharCode(27);
      var stripped = data;
      while (stripped.indexOf(esc) !== -1) {
        var i = stripped.indexOf(esc);
        var end = i + 1;
        if (end < stripped.length && (stripped[end] === "[" || stripped[end] === "]")) {
          end++;
          while (end < stripped.length && stripped.charCodeAt(end) >= 0x20 && stripped.charCodeAt(end) <= 0x3F) end++;
          if (end < stripped.length) end++;
        }
        if (end === i + 1) end++; // always advance past ESC to prevent infinite loop
        stripped = stripped.substring(0, i) + stripped.substring(end);
      }
      return stripped.replace(/[\\r\\n\\t]/g, "").trim().length < 5;
    }

    function markBusy(tabId, data) {
      const t = tabs.get(tabId);
      if (!t) return;
      // Ignore cursor movements and tiny escape sequences
      if (isEscapeOnly(data)) {
        return;
      }
      t.outputAccum = (t.outputAccum || 0) + data.length;
      clearTimeout(t.idleTimer);
      if (t.outputAccum >= BUSY_THRESHOLD) {
        t.tabEl.classList.add("busy");
      }
      t.idleTimer = setTimeout(() => {
        t.tabEl.classList.remove("busy");
        t.outputAccum = 0;
      }, IDLE_DELAY);
    }

    function switchTab(tabId) {
      activeTabId = tabId;
      vscode.postMessage({ command: "switch-tab", tabId });

      const t = tabs.get(tabId);

      // If switching to a real tab (not the new tab), close picker
      if (t && !t.isNewTab) {
        buttonsDiv.style.display = "none";
        terminalsDiv.style.display = "block";
        addBtn.style.transform = "";
        // Collapse sub-items
        document.querySelectorAll(".sub-items.open").forEach(s => s.classList.remove("open"));
        document.querySelectorAll(".launch-btn.expanded").forEach(b => b.classList.remove("expanded"));
      }

      for (const [id, tab] of tabs) {
        if (tab.el) tab.el.classList.toggle("active", id === tabId);
        tab.tabEl.classList.toggle("active", id === tabId);
      }

      if (t && t.isNewTab) {
        // Show homepage for new tab
        terminalsDiv.style.display = "none";
        loadingDiv.style.display = "none";
        buttonsDiv.style.display = "flex";
        addBtn.style.transform = "";
      } else if (t && t.gotFirstOutput) {
        loadingDiv.style.display = "none";
      } else if (t) {
        loadingText.textContent = "Loading " + t.label + "...";
        loadingDiv.style.display = "flex";
      }

      if (t && t.fitAddon) {
        setTimeout(() => {
          t.fitAddon.fit();
          vscode.postMessage({ command: "resize", tabId, cols: t.term.cols, rows: t.term.rows });
        }, 50);
      }
    }

    function createTab(tabId, label) {
      // If there's a "New Tab" waiting, remove it first
      if (newTabId >= 0) {
        const nt = tabs.get(newTabId);
        if (nt) {
          nt.tabEl.remove();
          tabs.delete(newTabId);
        }
        newTabId = -1;
      }

      // Hide buttons, show tab bar and terminals area
      buttonsDiv.style.display = "none";
      addBtn.style.transform = "";
      tabBar.style.display = "flex";
      terminalsDiv.style.display = "block";

      // Create tab button
      const tabEl = document.createElement("div");
      tabEl.className = "tab";
      tabEl.innerHTML = '<div class="tab-spinner"></div><span class="tab-label"></span><button class="close-btn">&times;</button>';
      tabEl.querySelector(".tab-label").textContent = label;
      const closeBtn = tabEl.querySelector(".close-btn");
      tabEl.addEventListener("click", (e) => {
        if (e.target === closeBtn || closeBtn.contains(e.target)) {
          e.stopPropagation();
          vscode.postMessage({ command: "close-tab", tabId });
        } else {
          switchTab(tabId);
        }
      });
      tabList.appendChild(tabEl);

      // Create terminal panel
      const el = document.createElement("div");
      el.className = "term-panel";
      terminalsDiv.appendChild(el);

      tabs.set(tabId, { id: tabId, label, term: null, fitAddon: null, el, tabEl, gotFirstOutput: false, idleTimer: null, outputAccum: 0, isNewTab: false });

      // Mark as busy (loading)
      tabEl.classList.add("busy");

      // Show loading for this tab
      loadingText.textContent = "Loading " + label + "...";
      loadingDiv.style.display = "flex";

      switchTab(tabId);
    }

    function initTermForTab(tabId) {
      const t = tabs.get(tabId);
      if (!t || t.term) return;

      loadingDiv.style.display = "none";

      const term = new Terminal({
        cursorBlink: false,
        cursorStyle: "bar",
        cursorInactiveStyle: "none",
        fontSize: 14.2,
        fontWeight: "normal",
        fontWeightBold: "bold",
        letterSpacing: 0,
        lineHeight: 1.0,
        convertEol: false,
        fontFamily: "'Cascadia Code', 'Fira Code', Consolas, 'Courier New', monospace",
        theme: { background: "#1a1b1e", cursor: "rgba(255,255,255,0.6)", cursorAccent: "transparent" }
      });
      const fitAddon = new FitAddon.FitAddon();
      term.loadAddon(fitAddon);
      term.open(t.el);

      t.term = term;
      t.fitAddon = fitAddon;

      setTimeout(() => {
        fitAddon.fit();
        vscode.postMessage({ command: "resize", tabId, cols: term.cols, rows: term.rows });
        setTimeout(() => {
          fitAddon.fit();
          vscode.postMessage({ command: "resize", tabId, cols: term.cols, rows: term.rows });
        }, 200);
      }, 100);

      term.onData(data => vscode.postMessage({ command: "input", tabId, data }));

      term.attachCustomKeyEventHandler(function(event) {
        if (event.type !== 'keydown') return true;

        // Shift+Enter: insert a soft newline.
        // Pi uses Kitty keyboard protocol (ESC[13;2u); other CLIs use Alt+Enter (ESC CR).
        if ((event.key === 'Enter' || event.code === 'Enter') && event.shiftKey) {
          event.preventDefault();
          var tab = tabs.get(tabId);
          var isPi = tab && tab.label && tab.label.toLowerCase().indexOf('pi') === 0;
          var seq = isPi ? "\\x1b[13;2u" : "\\x1b\\r";
          vscode.postMessage({ command: "input", tabId: tabId, data: seq });
          return false;
        }

        // Ctrl+V: paste text or image from clipboard
        if (event.key === 'v' && event.ctrlKey && !event.altKey) {
          var p = (typeof navigator.clipboard.read === 'function')
            ? navigator.clipboard.read()
            : Promise.reject(new Error('no clipboard.read'));
          p.then(function(items) {
            for (var i = 0; i < items.length; i++) {
              var item = items[i];
              var imgType = null;
              for (var j = 0; j < item.types.length; j++) {
                if (item.types[j].indexOf('image/') === 0) { imgType = item.types[j]; break; }
              }
              if (imgType) {
                (function(it, mt) {
                  it.getType(mt).then(function(blob) {
                    var reader = new FileReader();
                    reader.onload = function() {
                      var b64 = reader.result.split(',')[1];
                      vscode.postMessage({ command: "paste-image", tabId: tabId, data: b64, mimeType: mt });
                    };
                    reader.readAsDataURL(blob);
                  });
                })(item, imgType);
                return;
              }
              if (item.types.indexOf('text/plain') >= 0) {
                (function(it) {
                  it.getType('text/plain').then(function(b) { return b.text(); }).then(function(text) {
                    vscode.postMessage({ command: "input", tabId: tabId, data: text });
                  });
                })(item);
                return;
              }
            }
          }).catch(function() {
            navigator.clipboard.readText().then(function(text) {
              if (text) vscode.postMessage({ command: "input", tabId: tabId, data: text });
            }).catch(function() {});
          });
          return false;
        }

        return true;
      });

      new ResizeObserver(() => {
        if (t.fitAddon && t.el.classList.contains("active")) {
          t.fitAddon.fit();
          vscode.postMessage({ command: "resize", tabId, cols: t.term.cols, rows: t.term.rows });
        }
      }).observe(t.el);
    }

    function removeTab(tabId, switchTo) {
      const t = tabs.get(tabId);
      if (t) {
        clearTimeout(t.idleTimer);
        if (t.term) t.term.dispose();
        if (t.el) t.el.remove();
        t.tabEl.remove();
        tabs.delete(tabId);
        if (newTabId === tabId) newTabId = -1;
      }
      if (tabs.size === 0) {
        tabBar.style.display = "none";
        terminalsDiv.style.display = "none";
        loadingDiv.style.display = "none";
        buttonsDiv.style.display = "flex";
        activeTabId = -1;
      } else if (switchTo >= 0) {
        switchTab(switchTo);
      }
    }

    // Expandable button handlers
    document.querySelectorAll(".launch-btn.expandable").forEach(btn => {
      btn.addEventListener("click", () => {
        const group = btn.dataset.group;
        const sub = document.querySelector('.sub-items[data-for="' + group + '"]');
        const isOpen = sub.classList.contains("open");
        // Close all
        document.querySelectorAll(".sub-items.open").forEach(s => s.classList.remove("open"));
        document.querySelectorAll(".launch-btn.expanded").forEach(b => b.classList.remove("expanded"));
        // Toggle this one
        if (!isOpen) {
          sub.classList.add("open");
          btn.classList.add("expanded");
        }
      });
    });
    document.querySelectorAll(".sub-item").forEach(item => {
      item.addEventListener("click", () => {
        vscode.postMessage({ command: item.dataset.cmd });
      });
    });
    // Direct launch buttons
    document.getElementById("btn-opencode").onclick = () =>
      vscode.postMessage({ command: "open-opencode" });
    document.getElementById("btn-pi").onclick = () =>
      vscode.postMessage({ command: "open-pi" });
    document.getElementById("btn-kilo").onclick = () =>
      vscode.postMessage({ command: "open-kilo" });
    document.getElementById("add-custom-cli-btn").onclick = () =>
      vscode.postMessage({ command: "open-custom-settings" });

    // Custom CLIs (from pivotcli.customCLIs setting)
    function renderCustomCLIs(customs) {
      const container = document.getElementById("custom-clis");
      container.innerHTML = "";
      if (!customs || !customs.length) { return; }

      const sep = document.createElement("div");
      sep.className = "custom-sep";
      container.appendChild(sep);

      customs.forEach(function(cli) {
        // Validate color to prevent CSS injection
        const color = /^[a-zA-Z0-9#(),. %]+$/.test(cli.color || "") ? cli.color : "#888888";

        function makeBtn(label, withArrow) {
          const btn = document.createElement("button");
          btn.className = "launch-btn";
          const icon = document.createElement("span");
          icon.className = "btn-icon";
          icon.style.background = color;
          btn.appendChild(icon);
          btn.appendChild(document.createTextNode(label));
          if (withArrow) {
            const arrow = document.createElement("span");
            arrow.className = "btn-arrow";
            arrow.innerHTML = "&#9656;";
            btn.appendChild(arrow);
          }
          return btn;
        }

        function makeSubItem(displayText, cmd, label) {
          const item = document.createElement("button");
          item.className = "sub-item";
          const dot = document.createElement("span");
          dot.className = "sub-dot";
          item.appendChild(dot);
          item.appendChild(document.createTextNode(displayText));
          item.addEventListener("click", function() {
            vscode.postMessage({ command: "open-custom", cmd: cmd, label: label });
          });
          return item;
        }

        if (cli.yoloCommand) {
          const group = document.createElement("div");
          group.className = "btn-group";

          const mainBtn = makeBtn(cli.name, true);
          mainBtn.classList.add("expandable");

          const subItems = document.createElement("div");
          subItems.className = "sub-items";
          subItems.appendChild(makeSubItem("Normal", cli.command, cli.name));
          subItems.appendChild(makeSubItem("YOLO Mode", cli.yoloCommand, cli.name + " YOLO"));

          mainBtn.addEventListener("click", function() {
            const isOpen = subItems.classList.contains("open");
            document.querySelectorAll(".sub-items.open").forEach(function(s) { s.classList.remove("open"); });
            document.querySelectorAll(".launch-btn.expanded").forEach(function(b) { b.classList.remove("expanded"); });
            if (!isOpen) { subItems.classList.add("open"); mainBtn.classList.add("expanded"); }
          });

          group.appendChild(mainBtn);
          group.appendChild(subItems);
          container.appendChild(group);
        } else {
          const btn = makeBtn(cli.name, true);
          btn.addEventListener("click", function() {
            vscode.postMessage({ command: "open-custom", cmd: cli.command, label: cli.name });
          });
          container.appendChild(btn);
        }
      });
    }

    renderCustomCLIs(_customCLIs);

    // Plus button creates a "New Tab" showing homepage
    const addBtn = document.getElementById("add-tab-btn");
    let nextLocalId = 90000; // local IDs for new tabs (won't conflict with backend IDs)

    addBtn.onclick = () => {
      // If already on a new tab, do nothing
      if (newTabId >= 0 && activeTabId === newTabId) return;

      // Create a "New Tab" entry in the tab bar
      const localId = nextLocalId++;
      newTabId = localId;

      tabBar.style.display = "flex";

      const tabEl = document.createElement("div");
      tabEl.className = "tab";
      tabEl.innerHTML = '<span class="tab-label">New Tab</span><button class="close-btn">&times;</button>';
      const closeBtn = tabEl.querySelector(".close-btn");
      tabEl.addEventListener("click", (e) => {
        if (e.target === closeBtn || closeBtn.contains(e.target)) {
          e.stopPropagation();
          // Remove the new tab
          tabEl.remove();
          tabs.delete(localId);
          if (newTabId === localId) newTabId = -1;
          // Switch to last real tab or show homepage
          const remaining = Array.from(tabs.keys());
          if (remaining.length > 0) {
            switchTab(remaining[remaining.length - 1]);
          } else {
            tabBar.style.display = "none";
            terminalsDiv.style.display = "none";
            loadingDiv.style.display = "none";
            buttonsDiv.style.display = "flex";
            activeTabId = -1;
          }
        } else {
          switchTab(localId);
        }
      });
      tabList.appendChild(tabEl);

      tabs.set(localId, { id: localId, label: "New Tab", term: null, fitAddon: null, el: null, tabEl, gotFirstOutput: false, idleTimer: null, outputAccum: 0, isNewTab: true });

      switchTab(localId);
    };

    // Handle right-click → Paste for images (Ctrl+V is handled per-terminal in attachCustomKeyEventHandler)
    document.addEventListener('paste', function(event) {
      if (activeTabId < 0) return;
      var t = tabs.get(activeTabId);
      if (!t || t.isNewTab) return;
      var items = event.clipboardData && event.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image/') === 0) {
          event.preventDefault();
          (function(item, mt) {
            var blob = item.getAsFile();
            if (!blob) return;
            var reader = new FileReader();
            reader.onload = function() {
              var b64 = reader.result.split(',')[1];
              vscode.postMessage({ command: "paste-image", tabId: activeTabId, data: b64, mimeType: mt });
            };
            reader.readAsDataURL(blob);
          })(items[i], items[i].type);
          return;
        }
      }
      // No image — let xterm handle text paste naturally
    }, true);

    window.addEventListener("message", e => {
      const msg = e.data;

      if (msg.command === "update-custom-clis") {
        renderCustomCLIs(msg.customCLIs || []);
      } else if (msg.command === "new-tab") {
        createTab(msg.tabId, msg.label);
      } else if (msg.command === "output") {
        const t = tabs.get(msg.tabId);
        if (t) {
          if (!t.gotFirstOutput) {
            t.gotFirstOutput = true;
            initTermForTab(msg.tabId);
          }
          markBusy(msg.tabId, msg.data);
          t.term?.write(msg.data);
        }
      } else if (msg.command === "exit") {
        const t = tabs.get(msg.tabId);
        if (t) {
          if (!t.gotFirstOutput) {
            t.gotFirstOutput = true;
            initTermForTab(msg.tabId);
          }
          clearTimeout(t.idleTimer);
          t.tabEl.classList.remove("busy");
          t.term?.writeln("\\r\\n[Process exited]");
        }
      } else if (msg.command === "tab-closed") {
        removeTab(msg.tabId, msg.switchTo);
      }
    });
  </script>
</body>
</html>`;
}
