import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// Color maps matching category vibes
const TOOLS = {
  "Recon & Enum": {
    icon: "◈",
    color: "#00ff9d",
    glow: "rgba(0, 255, 157, 0.4)",
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
    glow: "rgba(255, 107, 53, 0.4)",
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
    glow: "rgba(255, 56, 96, 0.4)",
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
    glow: "rgba(189, 147, 249, 0.4)",
    tools: [
      { id: "hashcat", name: "Hashcat", desc: "GPU hash cracker", placeholder: "5f4dcc3b5aa765d61d8327deb882cf99" },
      { id: "john", name: "John the Ripper", desc: "Password cracker", placeholder: "/path/to/hashfile" },
      { id: "hydra", name: "Hydra", desc: "Network login brute force", placeholder: "192.168.1.1" },
    ],
  },
  "Network": {
    icon: "◉",
    color: "#50fa7b",
    glow: "rgba(80, 250, 123, 0.4)",
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
    { label: "Stealth Scan", flags: "-sS -T2" },
    { label: "OS Detect", flags: "-O -T4" },
  ],
  gobuster: [
    { label: "Dir Mode", flags: "" },
    { label: "DNS Mode", flags: "dns" },
    { label: "Extensions", flags: "-x php,html,txt" },
    { label: "Status 200", flags: "-s 200" },
  ],
  sqlmap: [
    { label: "Basic Scan", flags: "" },
    { label: "Level 5 & Risk 3", flags: "--level=5 --risk=3" },
    { label: "Dump Databases", flags: "--dbs" },
    { label: "Bypass WAF", flags: "--tamper=space2comment" },
  ],
  ffuf: [
    { label: "Dir Fuzzing", flags: "" },
    { label: "Subdomain Fuzz", flags: "-H 'Host: FUZZ.target.com'" },
    { label: "Filter 404", flags: "-fc 404" },
    { label: "Recursion Fuzz", flags: "-recursion" },
  ],
};

const MOCK_MESSAGES = [
  "INJECTING CORE DECK MODULES...",
  "ESTABLISHING PROXY CHAINS...",
  "UPDATING HEXBLADE SUBPROCESSES...",
  "RESOLVING LOCAL HOPS...",
  "BYPASSING WAF TELEMETRY...",
  "WARPING INTERFACES...",
  "LOADING SHELLCODE DECRYPTORS...",
  "SYNCING DECK CONTROLS...",
  "CLEARING ENCRYPTED TEMP FILES...",
];

// Synth Sound Player
const playSynthSound = (type, isMuted) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (type === "hover") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      gain.gain.setValueAtTime(0.012, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.03);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } else if (type === "run") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(90, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(950, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "success") {
      const playChime = (freq, delay, dur) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
        gain.gain.setValueAtTime(0.04, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + dur);
      };
      playChime(660, 0, 0.12);
      playChime(880, 0.08, 0.22);
    } else if (type === "error") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(80, ctx.currentTime + 0.35);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (e) {
    // Audio Context is blocked or unsupported
  }
};

// Matrix Rain Backdrop Component
function MatrixRain({ active }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const matrixChars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ☠☣☢◈⬡⬢⚡".split("");
    const fontSize = 13;
    const columns = Math.ceil(canvas.width / fontSize);
    const rainDrops = Array(columns).fill(0).map(() => Math.random() * -800);

    const draw = () => {
      ctx.fillStyle = "rgba(5, 5, 8, 0.08)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < rainDrops.length; i++) {
        const text = matrixChars[Math.floor(Math.random() * matrixChars.length)];
        const x = i * fontSize;
        const y = rainDrops[i];

        if (Math.random() > 0.985) {
          ctx.fillStyle = "#ffffff"; // White flash character
        } else {
          ctx.fillStyle = "rgba(0, 255, 157, 0.18)"; // Matrix light green with faint background alpha
        }

        ctx.fillText(text, x, y);

        if (y > canvas.height && Math.random() > 0.975) {
          rainDrops[i] = 0;
        }
        rainDrops[i] += fontSize * 0.75;
      }
      animationFrameId = requestAnimationFrame(draw);
    };

    animationFrameId = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, [active]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}

// Telemetry and System Monitor Widgets
function InteractiveTelemetry({ running, activeColor }) {
  const canvasRef = useRef(null);
  const [cpu, setCpu] = useState(12);
  const [ram, setRam] = useState(41);
  const [activeLog, setActiveLog] = useState("");

  // Simulated metrics flux
  useEffect(() => {
    const timer = setInterval(() => {
      setCpu((prev) => {
        const base = running ? 68 : 12;
        const fluctuation = Math.floor(Math.random() * 12) - 6;
        return Math.max(2, Math.min(99, base + fluctuation));
      });
      setRam((prev) => {
        const base = running ? 74 : 41;
        const fluctuation = Math.floor(Math.random() * 4) - 2;
        return Math.max(30, Math.min(95, base + fluctuation));
      });

      // Random system lines
      if (running) {
        if (Math.random() > 0.4) {
          setActiveLog(MOCK_MESSAGES[Math.floor(Math.random() * MOCK_MESSAGES.length)]);
        }
      } else {
        if (Math.random() > 0.9) {
          setActiveLog("SYSTEM STANDBY — LISTENING ON ADAPTERS");
        }
      }
    }, 1500);

    return () => clearInterval(timer);
  }, [running]);

  // Live Canvas Wave Chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationId;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = activeColor || "#00ff9d";
      ctx.lineWidth = 1.5;

      ctx.beginPath();
      for (let x = 0; x < canvas.width; x++) {
        const frequency = running ? 0.05 : 0.02;
        const amplitude = running ? 15 : 6;
        const speed = running ? 0.15 : 0.04;
        const y = canvas.height / 2 + Math.sin(x * frequency + offset) * amplitude;
        if (x === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      offset += running ? 0.12 : 0.03;
      animationId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationId);
  }, [running, activeColor]);

  return (
    <div className="telemetry-box panel-glass">
      <div className="telemetry-header">
        <span className="telemetry-title">⚡ SYS_METRICS HUD</span>
        <span className="telemetry-badge blink-cursor">LIVE</span>
      </div>

      <div className="gauges-grid">
        <div className="gauge-card">
          <div className="gauge-label">CPU CORE LOAD</div>
          <div className="gauge-val" style={{ color: running ? "#ff3860" : activeColor }}>
            {cpu}%
          </div>
          <div className="gauge-progress-bar">
            <div
              className="gauge-progress-fill"
              style={{
                width: `${cpu}%`,
                background: running ? "linear-gradient(90deg, #ff3860, #ff6b35)" : `linear-gradient(90deg, ${activeColor}, #00e5ff)`,
              }}
            />
          </div>
        </div>

        <div className="gauge-card">
          <div className="gauge-label">RAM STACK UTIL</div>
          <div className="gauge-val" style={{ color: running ? "#bd93f9" : activeColor }}>
            {ram}%
          </div>
          <div className="gauge-progress-bar">
            <div
              className="gauge-progress-fill"
              style={{
                width: `${ram}%`,
                background: running ? "linear-gradient(90deg, #bd93f9, #ff3860)" : `linear-gradient(90deg, ${activeColor}, #bd93f9)`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="telemetry-wave-container">
        <div className="wave-overlay-title">WAVE_SPECTRUM_PROBE</div>
        <canvas ref={canvasRef} width="180" height="50" className="telemetry-canvas" />
      </div>

      {activeLog && (
        <div className="live-ticker-box">
          <span className="ticker-label">HUD_ALERTS:</span>
          <span className="ticker-text">{activeLog}</span>
        </div>
      )}
    </div>
  );
}

// Interactive Nmap/Tools Flags Helper Builder
function ToolOptionsHelper({ selectedTool, flags, setFlags, activeColor }) {
  const [stealth, setStealth] = useState(false);
  const [fast, setFast] = useState(false);
  const [verbose, setVerbose] = useState(false);

  // Sync checkboxes to flag input for Nmap
  useEffect(() => {
    if (selectedTool !== "nmap") return;
    let parts = [];
    if (stealth) parts.push("-sS");
    if (fast) parts.push("-F");
    if (verbose) parts.push("-v");
    setFlags(parts.join(" "));
  }, [stealth, fast, verbose, selectedTool]);

  if (selectedTool !== "nmap") return null;

  return (
    <div className="flags-helper panel-glass">
      <div className="helper-title" style={{ color: activeColor }}>
        🎯 QUICK FLAG MATRIX
      </div>
      <div className="helper-checkboxes">
        <label className={`custom-checkbox-container ${stealth ? "checked" : ""}`} style={{ "--active-color": activeColor }}>
          <input type="checkbox" checked={stealth} onChange={(e) => setStealth(e.target.checked)} />
          <span className="checkbox-indicator"></span>
          <span className="checkbox-label">STEALTH SCAN (-sS)</span>
        </label>
        <label className={`custom-checkbox-container ${fast ? "checked" : ""}`} style={{ "--active-color": activeColor }}>
          <input type="checkbox" checked={fast} onChange={(e) => setFast(e.target.checked)} />
          <span className="checkbox-indicator"></span>
          <span className="checkbox-label">QUICK PORTS (-F)</span>
        </label>
        <label className={`custom-checkbox-container ${verbose ? "checked" : ""}`} style={{ "--active-color": activeColor }}>
          <input type="checkbox" checked={verbose} onChange={(e) => setVerbose(e.target.checked)} />
          <span className="checkbox-indicator"></span>
          <span className="checkbox-label">VERBOSE MODE (-v)</span>
        </label>
      </div>
    </div>
  );
}

// Terminal Screen component
function TerminalOutput({ lines, running, activeColor, onClear, isMuted }) {
  const bottomRef = useRef(null);
  const [search, setSearch] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto Scroll logic
  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines, autoScroll]);

  // Filtered terminal outputs
  const filteredLines = useMemo(() => {
    if (!search.trim()) return lines;
    const query = search.toLowerCase();
    return lines.filter((l) => l.data.toLowerCase().includes(query));
  }, [lines, search]);

  // Copy logs to clipboard
  const handleCopyLogs = () => {
    playSynthSound("click", isMuted);
    const text = lines.map((l) => `${l.type === "info" ? "> " : ""}${l.data}`).join("\n");
    navigator.clipboard.writeText(text);
  };

  // Download logs to TXT
  const handleDownloadLogs = () => {
    playSynthSound("click", isMuted);
    const text = lines.map((l) => `${l.type === "info" ? "> " : ""}${l.data}`).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hexblade_audit_report_${Date.now()}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="terminal-output panel-glass">
      <div className="terminal-header">
        <div className="header-indicators">
          <span className="dot red" />
          <span className="dot yellow" />
          <span className="dot green" />
        </div>
        <span className="terminal-title">⚔️ CONSOLE_AUDITOR://output</span>

        {/* Dynamic Scan status text */}
        {running && <span className="running-alert blink-cursor">PROBING ENCRYPTED PORTS...</span>}

        <div className="terminal-actions">
          {/* Output Search bar */}
          <input
            className="terminal-search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 filter lines..."
          />

          <button className="terminal-action-btn" onClick={handleCopyLogs} title="Copy log results">
            📋 COPY
          </button>
          <button className="terminal-action-btn" onClick={handleDownloadLogs} title="Download logs report">
            📥 EXPORT
          </button>
          <button className="terminal-action-btn scroll-lock-btn" onClick={() => setAutoScroll(!autoScroll)}>
            {autoScroll ? "🔒 AUTO_SCROLL ON" : "🔓 AUTO_SCROLL OFF"}
          </button>
          <button className="terminal-action-btn clear-btn" onClick={onClear}>
            🧹 CLEAR
          </button>
        </div>
      </div>

      <div className="terminal-body scrollable-custom">
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
            <p className="hint-text">CHOOSE TACTICAL EXPLOIT MODULE → ENTER TARGET ENDPOINT → FIRE ATTACK 🔥</p>
          </div>
        )}

        {filteredLines.map((line, i) => (
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

      {/* Mini status bar count */}
      <div className="terminal-footer-metrics">
        <span>Lines: {lines.length}</span>
        {search && <span className="search-match-count">Matched: {filteredLines.length}</span>}
        <span>Z-INDEX ENCRYPTION // AES-256</span>
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
  const [matrixActive, setMatrixActive] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [crtActive, setCrtActive] = useState(true);
  const wsRef = useRef(null);

  // Sound triggers on tool category or tool clicks
  const handleToolSelect = (cat, tool) => {
    playSynthSound("click", isMuted);
    setSelectedCategory(cat);
    setSelectedTool(tool);
    setFlags("");
  };

  const handleRun = useCallback(() => {
    if (!target.trim() || running) return;

    playSynthSound("run", isMuted);
    setOutput([]);
    setRunning(true);

    const wsUrl = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1" 
      ? "ws://localhost:8000/ws/run" 
      : `wss://${window.location.hostname}/ws/run`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(JSON.stringify({ tool: selectedTool.id, target: target.trim(), flags }));
    };

    ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      setOutput((prev) => [...prev, msg]);
      if (msg.type === "done") {
        playSynthSound("success", isMuted);
        setRunning(false);
        ws.close();
      } else if (msg.type === "error") {
        playSynthSound("error", isMuted);
        setRunning(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      playSynthSound("error", isMuted);
      setOutput((prev) => [
        ...prev,
        { type: "error", data: "⚠️ DISPATCH FAILED — BACKEND UNREACHABLE. IS DOCKER-COMPOSE RUNNING?" },
      ]);
      setRunning(false);
    };

    ws.onclose = () => setRunning(false);
  }, [target, flags, selectedTool, running, isMuted]);

  const handleStop = () => {
    playSynthSound("error", isMuted);
    wsRef.current?.close();
    setOutput((prev) => [...prev, { type: "error", data: "🛑 INTERCEPT COMPLETED — SESSION ABORTED BY SYSTEM CONTROLLER." }]);
    setRunning(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) handleRun();
  };

  const presets = QUICK_PRESETS[selectedTool?.id] || [];
  const activeColor = TOOLS[selectedCategory]?.color || "#00ff9d";
  const activeGlow = TOOLS[selectedCategory]?.glow || "rgba(0, 255, 157, 0.4)";

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;700;900&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #050508;
          color: #c8d3e0;
          font-family: 'Rajdhani', sans-serif;
          min-height: 100vh;
          overflow-x: hidden;
        }

        .app-root {
          position: relative;
          display: grid;
          grid-template-rows: 58px 1fr;
          grid-template-columns: 240px 1fr;
          height: 100vh;
          overflow: hidden;
          background: radial-gradient(circle at 50% 50%, #0c0d16 0%, #050508 100%);
        }

        /* Glitch CRT Overlay Filter */
        .crt-scanlines {
          position: absolute;
          top: 0; left: 0; right: 0; bottom: 0;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.04), rgba(0, 255, 0, 0.01), rgba(0, 255, 0, 0.04));
          background-size: 100% 4px, 6px 100%;
          z-index: 9999;
          pointer-events: none;
        }

        /* High-tech Panel Containers */
        .panel-glass {
          background: rgba(13, 14, 25, 0.75);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.05);
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
          border-radius: 4px;
          transition: all 0.25s ease;
        }

        /* HEADER */
        .header {
          grid-column: 1 / -1;
          background: #090a12;
          border-bottom: 2px solid #14172a;
          display: flex;
          align-items: center;
          padding: 0 24px;
          gap: 16px;
          z-index: 10;
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.8);
        }

        .logo-glitch {
          font-family: 'Orbitron', sans-serif;
          font-weight: 900;
          font-size: 22px;
          color: #00ff9d;
          letter-spacing: 3px;
          text-transform: uppercase;
          position: relative;
          text-shadow: 0 0 10px rgba(0, 255, 157, 0.6);
        }
        .logo-glitch span { color: #ff3860; text-shadow: 0 0 10px rgba(255, 56, 96, 0.6); }

        .tagline {
          font-size: 11px;
          color: #4f5b8c;
          letter-spacing: 3px;
          text-transform: uppercase;
          font-family: 'Share Tech Mono', monospace;
          margin-top: 3px;
        }

        /* Tactical HUD Controls inside Header */
        .hud-controllers {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .hud-btn {
          background: rgba(20, 23, 42, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          padding: 4px 10px;
          color: #8c9dc4;
          font-size: 10px;
          font-family: 'Share Tech Mono', monospace;
          cursor: pointer;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .hud-btn:hover {
          color: #00ff9d;
          border-color: #00ff9d;
          box-shadow: 0 0 10px rgba(0, 255, 157, 0.3);
        }
        .hud-btn.active {
          color: #00ff9d;
          background: rgba(0, 255, 157, 0.08);
          border-color: #00ff9d;
          box-shadow: 0 0 10px rgba(0, 255, 157, 0.2);
        }

        .system-status-indicator {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 11px;
          color: #8c9dc4;
          font-family: 'Share Tech Mono', monospace;
          border-left: 1px solid #14172a;
          padding-left: 16px;
        }

        .status-pulse-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: #00ff9d;
          box-shadow: 0 0 10px #00ff9d;
          animation: pulse-hud 1.8s infinite;
        }
        @keyframes pulse-hud {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.4; }
        }

        /* SIDEBAR / ADAPTERS PANEL */
        .sidebar {
          background: rgba(9, 10, 18, 0.85);
          border-right: 2px solid #14172a;
          overflow-y: auto;
          scrollbar-width: thin;
          z-index: 2;
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 12px;
        }
        .sidebar::-webkit-scrollbar { width: 4px; }
        .sidebar::-webkit-scrollbar-thumb { background: #14172a; border-radius: 2px; }

        .cat-group {
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 4px;
          background: rgba(15, 16, 30, 0.4);
          overflow: hidden;
          margin-bottom: 8px;
        }

        .cat-header {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 14px;
          font-size: 11px;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #8c9dc4;
          cursor: pointer;
          font-family: 'Orbitron', sans-serif;
          border-bottom: 1px solid rgba(255, 255, 255, 0.03);
          transition: all 0.25s ease;
        }
        .cat-header.active {
          color: var(--cat-color);
          background: rgba(255, 255, 255, 0.02);
          text-shadow: 0 0 8px var(--cat-glow);
        }
        .cat-icon { font-size: 14px; }

        .tool-btn {
          display: flex;
          flex-direction: column;
          width: 100%;
          padding: 10px 14px 10px 24px;
          background: transparent;
          border: none;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s;
          border-left: 3px solid transparent;
        }
        .tool-btn:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .tool-btn.active {
          background: rgba(255, 255, 255, 0.03);
          border-left-color: var(--cat-color);
        }
        .tool-name {
          font-size: 13px;
          font-weight: 700;
          color: #c8d3e0;
          letter-spacing: 1px;
          font-family: 'Orbitron', sans-serif;
        }
        .tool-btn.active .tool-name {
          color: var(--cat-color);
          text-shadow: 0 0 6px var(--cat-glow);
        }
        .tool-desc {
          font-size: 10px;
          color: #5d6b8c;
          margin-top: 3px;
          font-family: 'Share Tech Mono', monospace;
        }

        /* MAIN DASHBOARD HUD */
        .main-hud {
          display: grid;
          grid-template-rows: auto 1fr;
          overflow: hidden;
          background: transparent;
          z-index: 1;
          padding: 16px;
          gap: 16px;
        }

        .control-room-panel {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
        }

        .control-panel {
          padding: 20px;
          position: relative;
        }

        .tool-identity {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 18px;
        }
        .tool-badge {
          font-family: 'Orbitron', sans-serif;
          font-size: 22px;
          font-weight: 900;
          color: var(--active-color);
          text-shadow: 0 0 15px var(--active-color);
          letter-spacing: 3px;
        }
        .tool-full-desc {
          font-size: 12px;
          color: #8c9dc4;
          font-family: 'Share Tech Mono', monospace;
          letter-spacing: 1px;
          margin-left: 6px;
        }

        .input-strike-row {
          display: flex;
          gap: 12px;
          align-items: center;
          flex-wrap: wrap;
        }

        .input-target {
          flex: 1;
          min-width: 220px;
          background: #090a12;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 12px 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
          color: #00ff9d;
          outline: none;
          transition: all 0.25s;
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
        }
        .input-target:focus {
          border-color: var(--active-color);
          box-shadow: 0 0 10px var(--active-color), inset 0 0 8px rgba(0, 0, 0, 0.6);
        }
        .input-target::placeholder { color: rgba(255, 255, 255, 0.15); }

        .input-flags {
          width: 220px;
          background: #090a12;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 4px;
          padding: 12px 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 14px;
          color: #c8d3e0;
          outline: none;
          transition: all 0.25s;
          box-shadow: inset 0 0 8px rgba(0, 0, 0, 0.6);
        }
        .input-flags:focus {
          border-color: #8c9dc4;
          box-shadow: 0 0 8px rgba(140, 157, 196, 0.3), inset 0 0 8px rgba(0, 0, 0, 0.6);
        }
        .input-flags::placeholder { color: rgba(255, 255, 255, 0.15); }

        .btn-strike {
          padding: 12px 28px;
          background: var(--active-color);
          color: #050508;
          border: none;
          border-radius: 4px;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 0 20px var(--active-color);
        }
        .btn-strike:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 35px var(--active-color);
          opacity: 0.95;
        }
        .btn-strike:disabled {
          opacity: 0.2;
          cursor: not-allowed;
          box-shadow: none;
        }

        .btn-abort {
          padding: 12px 24px;
          background: rgba(255, 56, 96, 0.1);
          color: #ff3860;
          border: 1px solid #ff3860;
          border-radius: 4px;
          font-family: 'Orbitron', sans-serif;
          font-size: 14px;
          font-weight: 900;
          letter-spacing: 2px;
          text-transform: uppercase;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 0 10px rgba(255, 56, 96, 0.2);
        }
        .btn-abort:hover {
          background: #ff3860;
          color: #050508;
          box-shadow: 0 0 25px #ff3860;
        }

        /* Preset Badges */
        .preset-vault {
          display: flex;
          gap: 8px;
          margin-top: 14px;
          flex-wrap: wrap;
          align-items: center;
        }
        .preset-title {
          font-size: 11px;
          color: #5d6b8c;
          letter-spacing: 1px;
          text-transform: uppercase;
          font-family: 'Share Tech Mono', monospace;
        }
        .preset-badge {
          padding: 4px 12px;
          background: rgba(20, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 3px;
          font-size: 11px;
          font-family: 'Share Tech Mono', monospace;
          color: #8c9dc4;
          cursor: pointer;
          transition: all 0.2s;
        }
        .preset-badge:hover {
          border-color: var(--active-color);
          color: var(--active-color);
          background: rgba(255, 255, 255, 0.02);
          box-shadow: 0 0 10px var(--active-color);
        }

        /* TELEMETRY SYS HUD BOX */
        .telemetry-box {
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .telemetry-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid #14172a;
          padding-bottom: 8px;
        }
        .telemetry-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 11px;
          color: #8c9dc4;
          letter-spacing: 2px;
        }
        .telemetry-badge {
          color: #ff3860;
          font-size: 10px;
          font-family: 'Share Tech Mono', monospace;
          background: rgba(255, 56, 96, 0.1);
          padding: 1px 6px;
          border-radius: 2px;
        }

        .gauges-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .gauge-card {
          background: rgba(9, 10, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 3px;
          padding: 8px;
        }
        .gauge-label {
          font-size: 9px;
          color: #5d6b8c;
          font-family: 'Share Tech Mono', monospace;
        }
        .gauge-val {
          font-size: 18px;
          font-weight: 700;
          font-family: 'Orbitron', sans-serif;
          margin: 2px 0;
        }
        .gauge-progress-bar {
          height: 3px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .gauge-progress-fill {
          height: 100%;
          border-radius: 2px;
          transition: width 0.5s ease;
        }

        .telemetry-wave-container {
          background: rgba(9, 10, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 3px;
          padding: 8px;
          position: relative;
        }
        .wave-overlay-title {
          position: absolute;
          top: 4px; left: 6px;
          font-size: 8px;
          font-family: 'Share Tech Mono', monospace;
          color: #5d6b8c;
          letter-spacing: 1px;
        }
        .telemetry-canvas {
          display: block;
          width: 100%;
          height: 40px;
          margin-top: 10px;
        }

        .live-ticker-box {
          font-family: 'Share Tech Mono', monospace;
          font-size: 10px;
          padding: 6px 10px;
          border-left: 2px solid #ff3860;
          background: rgba(255, 56, 96, 0.03);
          color: #ff3860;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ticker-label {
          margin-right: 6px;
          font-weight: 700;
        }

        /* FLAGS MATRIX HELPER BOX */
        .flags-helper {
          padding: 10px 14px;
          background: rgba(9, 10, 18, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.03);
          margin-top: 12px;
        }
        .helper-title {
          font-family: 'Orbitron', sans-serif;
          font-size: 10px;
          letter-spacing: 1.5px;
          margin-bottom: 8px;
        }
        .helper-checkboxes {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .custom-checkbox-container {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }
        .custom-checkbox-container input { display: none; }
        .checkbox-indicator {
          width: 12px; height: 12px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: #090a12;
          position: relative;
          transition: all 0.2s;
        }
        .custom-checkbox-container:hover .checkbox-indicator {
          border-color: var(--active-color);
        }
        .custom-checkbox-container.checked .checkbox-indicator {
          background: var(--active-color);
          border-color: var(--active-color);
          box-shadow: 0 0 8px var(--active-color);
        }
        .checkbox-label {
          font-size: 10px;
          font-family: 'Share Tech Mono', monospace;
          color: #8c9dc4;
        }
        .custom-checkbox-container.checked .checkbox-label {
          color: #c8d3e0;
        }

        /* TERMINAL PANEL */
        .terminal-output {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow: hidden;
          background: rgba(5, 5, 8, 0.85);
          position: relative;
        }

        .terminal-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          background: #090a12;
          border-bottom: 1px solid #14172a;
          flex-wrap: wrap;
        }
        .header-indicators { display: flex; gap: 6px; }
        .dot { width: 10px; height: 10px; border-radius: 50%; }
        .dot.red { background: #ff5f57; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #28ca41; }

        .terminal-title {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #5d6b8c;
          letter-spacing: 1px;
        }

        .running-alert {
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #ff3860;
          margin-left: 12px;
          letter-spacing: 1px;
          animation: blink 1.2s step-end infinite;
        }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

        .terminal-actions {
          margin-left: auto;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .terminal-search-input {
          background: #050508;
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 3px;
          padding: 3px 8px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 11px;
          color: #00ff9d;
          outline: none;
          width: 130px;
          transition: width 0.25s, border-color 0.25s;
        }
        .terminal-search-input:focus {
          width: 200px;
          border-color: #00ff9d;
        }

        .terminal-action-btn {
          background: rgba(20, 23, 42, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.05);
          color: #8c9dc4;
          font-size: 10px;
          padding: 3px 8px;
          cursor: pointer;
          font-family: 'Share Tech Mono', monospace;
          border-radius: 2px;
          transition: all 0.15s;
        }
        .terminal-action-btn:hover {
          color: #00ff9d;
          border-color: #00ff9d;
          background: rgba(255, 255, 255, 0.02);
        }
        .terminal-action-btn.clear-btn:hover {
          color: #ff3860;
          border-color: #ff3860;
        }

        .terminal-body {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          font-family: 'Share Tech Mono', monospace;
          font-size: 12.5px;
          line-height: 1.8;
          background: rgba(3, 3, 5, 0.2);
        }
        .scrollable-custom::-webkit-scrollbar { width: 5px; }
        .scrollable-custom::-webkit-scrollbar-thumb { background: #14172a; border-radius: 2px; }

        .terminal-line { word-break: break-all; margin-bottom: 2px; }
        .line-output { color: #b4c2d9; }
        .line-info { color: #00ff9d; text-shadow: 0 0 6px rgba(0, 255, 157, 0.25); }
        .line-error { color: #ff3860; text-shadow: 0 0 6px rgba(255, 56, 96, 0.25); }
        .line-done {
          color: #bd93f9;
          border-top: 1px dashed rgba(189, 147, 249, 0.2);
          margin-top: 8px;
          padding-top: 8px;
          font-weight: 700;
          text-shadow: 0 0 6px rgba(189, 147, 249, 0.25);
        }
        .prompt { color: #00ff9d; font-weight: 700; }

        .empty-terminal {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          gap: 16px;
          opacity: 0.25;
        }
        .ascii-art {
          color: #00ff9d;
          font-size: 8px;
          line-height: 1.35;
          text-align: center;
          white-space: pre;
        }
        .hint-text {
          color: #8c9dc4;
          font-size: 11px;
          letter-spacing: 2px;
          font-family: 'Share Tech Mono', monospace;
        }

        .terminal-footer-metrics {
          background: #090a12;
          border-top: 1px solid #14172a;
          padding: 4px 16px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #4f5b8c;
          font-family: 'Share Tech Mono', monospace;
        }
        .search-match-count {
          color: #ffb86c;
        }

        /* Disclaimer footer banner */
        .disclaimer-banner {
          grid-column: 1 / -1;
          background: #14050a;
          border-top: 1.5px solid #2e0915;
          padding: 6px 20px;
          font-size: 10px;
          color: #9c3f58;
          text-align: center;
          letter-spacing: 2.5px;
          font-family: 'Share Tech Mono', monospace;
          z-index: 10;
          font-weight: 700;
          text-shadow: 0 0 6px rgba(156, 63, 88, 0.35);
        }

        @media (max-width: 900px) {
          .app-root { grid-template-columns: 1fr; grid-template-rows: 58px auto 1fr auto; overflow-y: auto; height: auto; }
          .sidebar { border-right: none; border-bottom: 2px solid #14172a; flex-direction: row; flex-wrap: wrap; }
          .cat-group { width: 100%; }
          .control-room-panel { grid-template-columns: 1fr; }
          .ascii-art { display: none; }
        }
      `}</style>

      {/* Retro CRT Scanlines dynamic overlay */}
      {crtActive && <div className="crt-scanlines" />}

      <div
        className="app-root"
        style={{
          "--active-color": activeColor,
          "--active-glow": activeGlow,
        }}
      >
        {/* Full-width dynamic canvas rain backdrop */}
        <MatrixRain active={matrixActive} />

        {/* HEADER CONTROLS */}
        <header className="header">
          <div className="logo-glitch">
            Hex<span>Blade</span>
          </div>
          <div className="tagline">Exploit_Auditor.exe</div>

          <div className="hud-controllers">
            {/* Audio Toggle */}
            <button className={`hud-btn ${!isMuted ? "active" : ""}`} onClick={() => setIsMuted(!isMuted)}>
              <span>🔊</span> {isMuted ? "SOUND OFF" : "SOUND ON"}
            </button>

            {/* Matrix rain toggle */}
            <button className={`hud-btn ${matrixActive ? "active" : ""}`} onClick={() => setMatrixActive(!matrixActive)}>
              <span>🌐</span> {matrixActive ? "MATRIX ON" : "MATRIX OFF"}
            </button>

            {/* Retro CRT scanlines toggle */}
            <button className={`hud-btn ${crtActive ? "active" : ""}`} onClick={() => setCrtActive(!crtActive)}>
              <span>📺</span> {crtActive ? "CRT SHIELD ON" : "CRT SHIELD OFF"}
            </button>
          </div>

          <div className="system-status-indicator">
            <span className="status-pulse-dot" />
            <span>ADAPTER STATUS: ONLINE</span>
            <span style={{ color: "#14172a" }}>|</span>
            <span>RESTRICTED ACCESS</span>
          </div>
        </header>

        {/* LEFT TOOL ADAPTER SIDEBAR */}
        <nav className="sidebar">
          {Object.entries(TOOLS).map(([cat, { icon, color, glow, tools }]) => (
            <div className="cat-group" key={cat} style={{ "--cat-color": color, "--cat-glow": glow }}>
              <div
                className={`cat-header ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => {
                  playSynthSound("click", isMuted);
                  setSelectedCategory(cat);
                }}
              >
                <span className="cat-icon">{icon}</span>
                {cat}
              </div>
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  className={`tool-btn ${selectedTool?.id === tool.id ? "active" : ""}`}
                  onClick={() => handleToolSelect(cat, tool)}
                  style={{ "--cat-color": color, "--cat-glow": glow }}
                >
                  <span className="tool-name">{tool.name}</span>
                  <span className="tool-desc">{tool.desc}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>

        {/* MAIN HUD COMMAND CENTER */}
        <main className="main-hud">
          <div className="control-room-panel">
            {/* Target and Flags panel */}
            <div className="control-panel panel-glass" style={{ "--active-color": activeColor }}>
              <div className="tool-identity">
                <div className="tool-badge">{selectedTool?.name}</div>
                <div className="tool-full-desc">// {selectedTool?.desc}</div>
              </div>

              <div className="input-strike-row">
                <input
                  className="input-target"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={selectedTool?.placeholder || "Specify target (e.g. 192.168.1.1)..."}
                  disabled={running}
                />
                <input
                  className="input-flags"
                  value={flags}
                  onChange={(e) => setFlags(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Insert options/flags manually..."
                  disabled={running}
                />
                {!running ? (
                  <button
                    className="btn-strike"
                    onClick={handleRun}
                    disabled={!target.trim() || running}
                  >
                    🚀 FIRE STRIKE
                  </button>
                ) : (
                  <button className="btn-abort" onClick={handleStop}>
                    💥 ABORT
                  </button>
                )}
              </div>

              {/* Dynamic Option Box Helper for Nmap */}
              <ToolOptionsHelper
                selectedTool={selectedTool?.id}
                flags={flags}
                setFlags={setFlags}
                activeColor={activeColor}
              />

              {presets.length > 0 && (
                <div className="preset-vault">
                  <span className="preset-title">Presets:</span>
                  {presets.map((p) => (
                    <button
                      key={p.label}
                      className="preset-badge"
                      onClick={() => {
                        playSynthSound("click", isMuted);
                        setFlags(p.flags);
                      }}
                      style={{ "--active-color": activeColor }}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Diagnostic system gauge widgets */}
            <InteractiveTelemetry running={running} activeColor={activeColor} />
          </div>

          {/* Console logger panel */}
          <TerminalOutput
            lines={output}
            running={running}
            activeColor={activeColor}
            onClear={() => {
              playSynthSound("click", isMuted);
              setOutput([]);
            }}
            isMuted={isMuted}
          />
        </main>

        <div className="disclaimer-banner">
          ⚠️ AUTHORIZED PENETRATION AUDITING INTERFACE ONLY. ALL RETRIEVED PACKETS ARE LOGGED BY ADAPTER SYSTEM.
        </div>
      </div>
    </>
  );
}
