import { useState, useRef, useEffect, useCallback } from "react";

const TOOLS = {
  "Recon & Enum": {
    icon: "◈",
    color: "#00ff9d",
    tools: [
      { id: "nmap", name: "Nmap", desc: "Port & service scanner", placeholder: "192.168.1.1 or domain.com" },
      { id: "subfinder", name: "Subfinder", desc: "Subdomain discovery", placeholder: "target.com" },
      { id: "amass", name: "Amass", desc: "Attack surface mapping", placeholder: "target.com" },
      { id: "httpx", name: "httpx", desc: "HTTP probing toolkit", placeholder: "target.com" },
      { id: "whatweb", name: "WhatWeb", desc: "Web tech fingerprinting", placeholder: "https://target.com" },
      { id: "dig", name: "Dig", desc: "DNS lookup tool", placeholder: "target.com" },
      { id: "whois", name: "Whois", desc: "Domain/IP info", placeholder: "target.com" },
    ],
  },
  "Dir Busting": {
    icon: "⬡",
    color: "#ff6b35",
    tools: [
      { id: "gobuster", name: "Gobuster", desc: "Dir/subdomain brute force", placeholder: "https://target.com" },
      { id: "ffuf", name: "ffuf", desc: "Fast web fuzzer", placeholder: "https://target.com/FUZZ" },
      { id: "feroxbuster", name: "Feroxbuster", desc: "Recursive content discovery", placeholder: "https://target.com" },
      { id: "dirsearch", name: "Dirsearch", desc: "Web path scanner", placeholder: "https://target.com" },
    ],
  },
  "Exploitation": {
    icon: "⚡",
    color: "#ff3860",
    tools: [
      { id: "sqlmap", name: "SQLmap", desc: "SQL injection automation", placeholder: "https://target.com/page?id=1" },
      { id: "xsstrike", name: "XSStrike", desc: "XSS detection suite", placeholder: "https://target.com/search?q=test" },
      { id: "commix", name: "Commix", desc: "Command injection tester", placeholder: "https://target.com/page?cmd=test" },
      { id: "wpscan", name: "WPScan", desc: "WordPress vulnerability scanner", placeholder: "https://target.com" },
      { id: "nikto", name: "Nikto", desc: "Web server scanner", placeholder: "https://target.com" },
    ],
  },
  "Cracking": {
    icon: "⬢",
    color: "#bd93f9",
    tools: [
      { id: "hashcat", name: "Hashcat", desc: "GPU hash cracker", placeholder: "5f4dcc3b5aa765d61d8327deb882cf99" },
      { id: "john", name: "John the Ripper", desc: "Password cracker", placeholder: "/path/to/hashfile" },
      { id: "hydra", name: "Hydra", desc: "Network login brute force", placeholder: "192.168.1.1" },
    ],
  },
  "Network": {
    icon: "◉",
    color: "#50fa7b",
    tools: [
      { id: "curl", name: "cURL", desc: "HTTP request tool", placeholder: "https://target.com" },
      { id: "nc", name: "Netcat", desc: "TCP/UDP swiss knife", placeholder: "target.com 80" },
    ],
  },
};

const QUICK_PRESETS = {
  nmap: [
    { label: "Quick Scan", flags: "-T4 -F" },
    { label: "Full Port", flags: "-p- -T4" },
    { label: "Service Detect", flags: "-sV -sC" },
    { label: "Stealth", flags: "-sS -T2" },
    { label: "OS Detect", flags: "-O -T4" },
  ],
  gobuster: [
    { label: "Dir Mode", flags: "" },
    { label: "DNS Mode", flags: "dns" },
    { label: "Extensions", flags: "-x php,html,txt" },
    { label: "Status 200", flags: "-s 200" },
  ],
  sqlmap: [
    { label: "Basic", flags: "" },
    { label: "Level 5", flags: "--level=5 --risk=3" },
    { label: "Dump DB", flags: "--dbs" },
    { label: "Bypass WAF", flags: "--tamper=space2comment" },
  ],
  ffuf: [
    { label: "Dir Fuzz", flags: "" },
    { label: "Subdomain", flags: "-H 'Host: FUZZ.target.com'" },
    { label: "Filter 404", flags: "-fc 404" },
    { label: "Recursion", flags: "-recursion" },
  ],
};

function TerminalOutput({ lines, running }) {
  const bottomRef = useRef(null);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div className="terminal-output">
      <div className="terminal-header">
        <span className="dot red" />
        <span className="dot yellow" />
        <span className="dot green" />
        <span className="terminal-title">hexblade — output</span>
        {running && <span className="blink-cursor">█</span>}
      </div>
      <div className="terminal-body">
        {lines.length === 0 && (
          <div className="empty-terminal">
            <pre className="ascii-art">{`
  ██╗  ██╗███████╗██╗  ██╗██████╗ ██╗      █████╗ ██████╗ ███████╗
  ██║  ██║██╔════╝╚██╗██╔╝██╔══██╗██║     ██╔══██╗██╔══██╗██╔════╝
  ███████║█████╗   ╚███╔╝ ██████╔╝██║     ███████║██║  ██║█████╗  
  ██╔══██║██╔══╝   ██╔██╗ ██╔══██╗██║     ██╔══██║██║  ██║██╔══╝  
  ██║  ██║███████╗██╔╝ ██╗██████╔╝███████╗██║  ██║██████╔╝███████╗
  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚══════╝
            `}</pre>
            <p className="hint-text">Select a tool → enter target → fire 🔥</p>
          </div>
        )}
        {lines.map((line, i) => (
          <div
            key={i}
            className={`terminal-line ${line.type === "error" ? "line-error" : line.type === "info" ? "line-info" : line.type === "done" ? "line-done" : "line-output"}`}
          >
            {line.type === "info" && <span className="prompt">❯ </span>}
            {line.data}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

export default function HexBlade() {
  const [selectedCategory, setSelectedCategory] = useState("Recon & Enum");
  const [selectedTool, setSelectedTool] = useState(TOOLS["Recon & Enum"].tools[0]);
  const [target, setTarget] = useState("");
  const [flags, setFlags] = useState("");
  const [output, setOutput] = useState([]);
  const [running, setRunning] = useState(false);
  const wsRef = useRef(null);

  const handleToolSelect = (cat, tool) => {
    setSelectedCategory(cat);
    setSelectedTool(tool);
    setFlags("");
    setOutput([]);
  };

  const handleRun = useCallback(() => {
    if (!target.trim() || running) return;

    setOutput([]);
    setRunning(true);

    const ws = new WebSocket("ws://localhost:8000/ws/run");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ tool: selectedTool.id, target: target.trim(), flags }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setOutput((prev) => [...prev, msg]);
      if (msg.type === "done" || msg.type === "error") {
        setRunning(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      setOutput((prev) => [...prev, { type: "error", data: "WebSocket error — is the backend running? (docker-compose up)" }]);
      setRunning(false);
    };

    ws.onclose = () => setRunning(false);
  }, [target, flags, selectedTool, running]);

  const handleStop = () => {
    wsRef.current?.close();
    setOutput((prev) => [...prev, { type: "error", data: "⛔ Process killed by user." }]);
    setRunning(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) handleRun();
  };

  const presets = QUICK_PRESETS[selectedTool?.id] || [];
  const catColor = TOOLS[selectedCategory]?.color || "#00ff9d";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@400;500;600;700&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0a0a0f;
          color: #c8d3e0;
          font-family: 'Rajdhani', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .app {
          display: grid;
          grid-template-rows: 56px 1fr;
          grid-template-columns: 220px 1fr;
          height: 100vh;
          gap: 0;
        }

        /* HEADER */
        .header {
          grid-column: 1 / -1;
          background: #0d0d14;
          border-bottom: 1px solid #1a1a2e;
          display: flex;
          align-items: center;
          padding: 0 20px;
          gap: 16px;
        }
        .logo {
          font-family: 'Share Tech Mono', monospace;
          font-size: 20px;
          color: #00ff9d;
          letter-spacing: 4px;
          text-transform: uppercase;
        }
        .logo span { color: #ff3860; }
        .tagline {
          font-size: 11px;
          color: #444;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-left: 8px;
        }
        .status-bar {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 16px;
          font-size: 11px;
          color: #444;
          font-family: 'Share Tech Mono', monospace;
        }
        .status-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #00ff9d;
          box-shadow: 0 0 8px #00ff9d;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }

        /* SIDEBAR */
        .sidebar {
          background: #0d0d14;
          border-right: 1px solid #1a1a2e;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #1a1a2e transparent;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-track { background: transparent; }
        .sidebar::-webkit-scrollbar-thumb { background: #1a1a2e; border-radius: 2px; }

        .cat-group { border-bottom: 1px solid #111827; }

        .cat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 14px;
          font-size: 10px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #555;
          cursor: pointer;
          user-select: none;
          transition: color 0.2s;
        }
        .cat-header:hover { color: #888; }
        .cat-header.active { color: var(--cat-color); }
        .cat-icon { font-size: 14px; }

        .tool-btn {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 8px 14px 8px 30px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: background 0.15s;
          border-left: 2px solid transparent;
        }
        .tool-btn:hover { background: #111827; }
        .tool-btn.active {
          background: #111827;
          border-left-color: var(--cat-color);
        }
        .tool-name {
          font-size: 13px;
          font-weight: 600;
          color: #c8d3e0;
          letter-spacing: 0.5px;
        }
        .tool-btn.active .tool-name { color: var(--cat-color); }
        .tool-desc {
          font-size: 10px;
          color: #444;
          margin-top: 1px;
          font-family: 'Share Tech Mono', monospace;
        }

        /* MAIN */
        .main {
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          background: #0a0a0f;
        }

        .control-panel {
          padding: 16px 20px;
          border-bottom: 1px solid #1a1a2e;
          background: #0d0d14;
        }

        .tool-title-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 14px;
        }
        .tool-badge {
          font-family: 'Share Tech Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          color: var(--active-color);
          text-shadow: 0 0 16px var(--active-color);
          letter-spacing: 2px;
        }
        .tool-full-desc {
          font-size: 12px;
          color: #555;
          letter-spacing: 1px;
        }

        .input-row {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .input-target {
          flex: 1;
          min-width: 200px;
          background: #0a0a0f;
          border: 1px solid #1a1a2e;
          border-radius: 4px;
          padding: 10px 14px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: #c8d3e0;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-target:focus {
          border-color: var(--active-color);
          box-shadow: 0 0 0 1px var(--active-color)22;
        }
        .input-target::placeholder { color: #2a2a3e; }

        .input-flags {
          width: 200px;
          background: #0a0a0f;
          border: 1px solid #1a1a2e;
          border-radius: 4px;
          padding: 10px 14px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 13px;
          color: #c8d3e0;
          outline: none;
          transition: border-color 0.2s;
        }
        .input-flags:focus { border-color: #555; }
        .input-flags::placeholder { color: #2a2a3e; }

        .btn-run {
          padding: 10px 24px;
          background: var(--active-color);
          color: #000;
          border: none;
          border-radius: 4px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: opacity 0.2s, box-shadow 0.2s;
          box-shadow: 0 0 20px var(--active-color)44;
        }
        .btn-run:hover { opacity: 0.85; box-shadow: 0 0 30px var(--active-color)66; }
        .btn-run:disabled { opacity: 0.3; cursor: not-allowed; }

        .btn-stop {
          padding: 10px 20px;
          background: transparent;
          color: #ff3860;
          border: 1px solid #ff3860;
          border-radius: 4px;
          font-family: 'Rajdhani', sans-serif;
          font-size: 14px;
          font-weight: 700;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s;
        }
        .btn-stop:hover { background: #ff386011; }

        .presets-row {
          display: flex;
          gap: 6px;
          margin-top: 10px;
          flex-wrap: wrap;
          align-items: center;
        }
        .presets-label {
          font-size: 10px;
          color: #333;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: 'Share Tech Mono', monospace;
        }
        .preset-chip {
          padding: 3px 10px;
          background: #111827;
          border: 1px solid #1a1a2e;
          border-radius: 2px;
          font-size: 11px;
          font-family: 'Share Tech Mono', monospace;
          color: #666;
          cursor: pointer;
          transition: all 0.15s;
          letter-spacing: 0.5px;
        }
        .preset-chip:hover {
          border-color: var(--active-color);
          color: var(--active-color);
          background: #0a0a0f;
        }

        /* TERMINAL */
        .terminal-output {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: #050508;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          background: #0d0d14;
          border-bottom: 1px solid #1a1a2e;
        }
        .dot {
          width: 10px; height: 10px;
          border-radius: 50%;
        }
        .dot.red { background: #ff5f57; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #28ca41; }
        .terminal-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #444;
          margin-left: 8px;
          letter-spacing: 1px;
        }
        .blink-cursor {
          font-family: 'Share Tech Mono', monospace;
          color: #00ff9d;
          margin-left: auto;
          animation: blink 1s step-end infinite;
          font-size: 12px;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .terminal-body {
          flex: 1;
          overflow-y: auto;
          padding: 14px 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12px;
          line-height: 1.7;
          scrollbar-width: thin;
          scrollbar-color: #1a1a2e transparent;
        }
        .terminal-body::-webkit-scrollbar { width: 4px; }
        .terminal-body::-webkit-scrollbar-thumb { background: #1a1a2e; }

        .terminal-line { word-break: break-all; }
        .line-output { color: #8899aa; }
        .line-info { color: #00ff9d; }
        .line-error { color: #ff3860; }
        .line-done { color: #bd93f9; border-top: 1px solid #1a1a2e; margin-top: 8px; padding-top: 8px; }
        .prompt { color: #00ff9d; }

        .empty-terminal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
        }
        .ascii-art {
          color: #1a2a1a;
          font-size: 9px;
          line-height: 1.3;
          text-align: center;
          white-space: pre;
        }
        .hint-text {
          color: #2a3a2a;
          font-size: 12px;
          letter-spacing: 2px;
        }

        /* Disclaimer banner */
        .disclaimer {
          grid-column: 1 / -1;
          background: #1a0a0a;
          border-top: 1px solid #3a1a1a;
          padding: 4px 20px;
          font-size: 10px;
          color: #6a3a3a;
          text-align: center;
          letter-spacing: 1px;
          font-family: 'Share Tech Mono', monospace;
        }

        @media (max-width: 700px) {
          .app { grid-template-columns: 1fr; grid-template-rows: 56px auto 1fr auto; }
          .sidebar { display: flex; flex-wrap: wrap; overflow-x: auto; border-right: none; border-bottom: 1px solid #1a1a2e; }
          .cat-group { border-bottom: none; }
          .ascii-art { display: none; }
        }
      `}</style>

      <div
        className="app"
        style={{
          "--active-color": catColor,
          "--cat-color": catColor,
        }}
      >
        {/* HEADER */}
        <header className="header">
          <div className="logo">Hex<span>Blade</span></div>
          <div className="tagline">Web Exploitation Toolkit</div>
          <div className="status-bar">
            <span className="status-dot" />
            <span>SYSTEM READY</span>
            <span style={{ color: "#222" }}>|</span>
            <span>FOR AUTHORIZED TESTING ONLY</span>
          </div>
        </header>

        {/* SIDEBAR */}
        <nav className="sidebar">
          {Object.entries(TOOLS).map(([cat, { icon, color, tools }]) => (
            <div className="cat-group" key={cat} style={{ "--cat-color": color }}>
              <div
                className={`cat-header ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
              >
                <span className="cat-icon">{icon}</span>
                {cat}
              </div>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-btn ${selectedTool?.id === tool.id ? "active" : ""}`}
                  onClick={() => handleToolSelect(cat, tool)}
                  style={{ "--cat-color": color }}
                >
                  <span className="tool-name">{tool.name}</span>
                  <span className="tool-desc">{tool.desc}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* MAIN CONTENT */}
        <main className="main" style={{ "--active-color": catColor }}>
          <div className="control-panel">
            <div className="tool-title-row">
              <div className="tool-badge">{selectedTool?.name}</div>
              <div className="tool-full-desc">{selectedTool?.desc}</div>
            </div>

            <div className="input-row">
              <input
                className="input-target"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedTool?.placeholder || "Enter target..."}
                disabled={running}
              />
              <input
                className="input-flags"
                value={flags}
                onChange={(e) => setFlags(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="--flags (optional)"
                disabled={running}
              />
              {!running ? (
                <button
                  className="btn-run"
                  onClick={handleRun}
                  disabled={!target.trim() || running}
                >
                  ▶ RUN
                </button>
              ) : (
                <button className="btn-stop" onClick={handleStop}>
                  ■ STOP
                </button>
              )}
            </div>

            {presets.length > 0 && (
              <div className="presets-row">
                <span className="presets-label">Presets:</span>
                {presets.map((p) => (
                  <button
                    key={p.label}
                    className="preset-chip"
                    onClick={() => setFlags(p.flags)}
                    style={{ "--active-color": catColor }}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <TerminalOutput lines={output} running={running} />
        </main>

        <div className="disclaimer">
          ⚠ FOR AUTHORIZED PENETRATION TESTING AND CTF CHALLENGES ONLY — UNAUTHORIZED USE IS ILLEGAL
        </div>
      </div>
    </>
  );
}
