# 🗡️ HexBlade — Web Exploitation Toolkit

Browser-based swiss army knife for web pentesting. 20+ tools in one stunning hacker HUD. Pick a tool, paste a target, fire.

## Features

- **Cyberpunk HUD Interface** — Matrix rain, CRT scanlines, synth sound effects
- **20+ Security Tools** — Nmap, Gobuster, ffuf, SQLmap, XSStrike, Hydra, and more
- **Real-time Terminal** — Live WebSocket output with search, copy, and export
- **Client-Side Demo** — Works standalone without backend for showcasing
- **System Telemetry** — Animated CPU/RAM gauges and wave spectrum

## Architecture

| Component | Repo | Host |
|-----------|------|------|
| Frontend (React + Vite) | [hexblade](https://github.com/GokulNathReddy/hexblade) | Vercel |
| Backend (FastAPI + WebSocket) | [hexblade-backend](https://github.com/GokulNathReddy/hexblade-backend) | Render |

## Quick Start (Local)

```bash
# Frontend
cd frontend
npm install
npm run dev
```

## Connect to Backend

Set this environment variable in Vercel to connect to your deployed backend:

```
VITE_BACKEND_WS=wss://your-render-url.onrender.com/ws/run
```

Without this variable, the frontend runs in **Demo Mode** with simulated scan output.

## Tools

Nmap, Gobuster, ffuf, Feroxbuster, Dirsearch, Subfinder, httpx, WhatWeb, SQLmap, XSStrike, Commix, WPScan, Nikto, Hashcat, John, Hydra, cURL, Netcat, Dig, Whois

## ⚠️ For authorized penetration testing and CTF challenges only.
