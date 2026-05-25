from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import subprocess
import shlex
import json
import os
import shutil

app = FastAPI(title="HexBlade API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TOOL_CONFIGS = {
    "nmap": {
        "binary": "nmap",
        "base_args": [],
        "input_placeholder": "target IP or domain",
    },
    "gobuster": {
        "binary": "gobuster",
        "base_args": [],
        "input_placeholder": "target URL",
    },
    "ffuf": {
        "binary": "ffuf",
        "base_args": [],
        "input_placeholder": "target URL (use FUZZ keyword)",
    },
    "sqlmap": {
        "binary": "sqlmap",
        "base_args": ["--batch"],
        "input_placeholder": "target URL",
    },
    "subfinder": {
        "binary": "subfinder",
        "base_args": [],
        "input_placeholder": "target domain",
    },
    "httpx": {
        "binary": "httpx",
        "base_args": [],
        "input_placeholder": "target domain or URL",
    },
    "amass": {
        "binary": "amass",
        "base_args": [],
        "input_placeholder": "target domain",
    },
    "feroxbuster": {
        "binary": "feroxbuster",
        "base_args": [],
        "input_placeholder": "target URL",
    },
    "dirsearch": {
        "binary": "dirsearch",
        "base_args": [],
        "input_placeholder": "target URL",
    },
    "wpscan": {
        "binary": "wpscan",
        "base_args": [],
        "input_placeholder": "target WordPress URL",
    },
    "nikto": {
        "binary": "nikto",
        "base_args": [],
        "input_placeholder": "target URL or IP",
    },
    "hydra": {
        "binary": "hydra",
        "base_args": [],
        "input_placeholder": "target IP/domain",
    },
    "hashcat": {
        "binary": "hashcat",
        "base_args": [],
        "input_placeholder": "hash value",
    },
    "john": {
        "binary": "john",
        "base_args": [],
        "input_placeholder": "hash file path",
    },
    "curl": {
        "binary": "curl",
        "base_args": ["-v"],
        "input_placeholder": "target URL",
    },
    "dig": {
        "binary": "dig",
        "base_args": [],
        "input_placeholder": "domain name",
    },
    "whois": {
        "binary": "whois",
        "base_args": [],
        "input_placeholder": "domain or IP",
    },
    "nc": {
        "binary": "nc",
        "base_args": [],
        "input_placeholder": "host port (e.g. example.com 80)",
    },
    "whatweb": {
        "binary": "whatweb",
        "base_args": [],
        "input_placeholder": "target URL",
    },
    "xsstrike": {
        "binary": "python3",
        "base_args": ["/opt/XSStrike/xsstrike.py"],
        "input_placeholder": "target URL",
    },
    "commix": {
        "binary": "commix",
        "base_args": ["--batch"],
        "input_placeholder": "target URL",
    },
}

MOCK_SIMULATED_REPORTS = {
    "nmap": [
        "Starting Nmap 7.94 ( https://nmap.org ) at 2026-05-25 22:45",
        "Initiating Ping Scan at 22:45",
        "Scanning target_host (142.250.190.46) [1 port]",
        "Completed Ping Scan at 22:45, 0.04s elapsed",
        "Initiating Parallel DNS resolution of 1 IP address at 22:45",
        "Completed Parallel DNS resolution at 22:45, 0.08s elapsed",
        "Initiating SYN Stealth Scan at 22:45",
        "Scanning target_host (142.250.190.46) [1000 ports]",
        "Discovered open port 80/tcp on 142.250.190.46",
        "Discovered open port 443/tcp on 142.250.190.46",
        "Completed SYN Stealth Scan at 22:45, 1.42s elapsed (1000 total ports)",
        "Initiating Service scan at 22:45",
        "Scanning 2 services on target_host (142.250.190.46)",
        "Completed Service scan at 22:45, 2.10s elapsed",
        "Nmap scan report for target_host (142.250.190.46)",
        "Host is up (0.015s latency).",
        "rDNS record for 142.250.190.46: lga34s36-in-f14.1e100.net",
        "Not shown: 998 filtered tcp ports (no-response)",
        "PORT    STATE SERVICE  VERSION",
        "80/tcp  open  http     gws",
        "443/tcp open  ssl/http gws",
        "|_http-title: Exploit Target Sandbox Home",
        "| ssl-cert: Subject: commonName=*.google.com",
        "Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel",
        "",
        "Nmap done: 1 IP address (1 host up) scanned in 4.12 seconds"
    ],
    "gobuster": [
        "===============================================================",
        "Gobuster v3.6",
        "by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)",
        "===============================================================",
        "[+] Url:                     https://target_url",
        "[+] Method:                  GET",
        "[+] Threads:                 10",
        "[+] Wordlist:                /usr/share/wordlists/dirb/common.txt",
        "[+] Negative Status codes:   404",
        "[+] User Agent:              gobuster/3.6",
        "===============================================================",
        "Starting gobuster in directory busting mode",
        "===============================================================",
        "/index.html           (Status: 200) [Size: 12432]",
        "/images               (Status: 301) [Size: 310] [--> https://target_url/images/]",
        "/search               (Status: 200) [Size: 45012]",
        "/login                (Status: 200) [Size: 3102]",
        "/admin                (Status: 401) [Size: 220] (Requires Basic Auth)",
        "/robots.txt           (Status: 200) [Size: 180]",
        "/dashboard            (Status: 302) [Size: 0] [--> https://target_url/login]",
        "/assets               (Status: 301) [Size: 312] [--> https://target_url/assets/]",
        "/api                  (Status: 200) [Size: 1543]",
        "===============================================================",
        "Finished",
        "==============================================================="
    ],
    "sqlmap": [
        "        ___",
        "       __H__",
        " ___ ___[.]_____ ___ ___  {1.8.2#stable}",
        "|_ -| . [']     | .'| . |",
        "|___|_  [.]_|_|_|__,|  _|",
        "      |_| think      |_|   https://sqlmap.org",
        "",
        "[*] starting @ 22:45:12 /2026-05-25/",
        "",
        "[INFO] testing connection to the target URL",
        "[INFO] checking if the target is protected by some WAF/IPS",
        "[INFO] testing if the target URL is stable",
        "[INFO] testing if HTTP parameter 'id' is dynamic",
        "[WARNING] heuristic (basic) test shows that GET parameter 'id' might not be injectable",
        "[INFO] testing for SQL injection on GET parameter 'id'",
        "[INFO] testing 'AND boolean-based blind - WHERE or HAVING clause'",
        "[INFO] GET parameter 'id' appears to be 'AND boolean-based blind - WHERE or HAVING clause' injectable",
        "[INFO] testing 'Generic UNION query [1 to 20 columns]'",
        "[INFO] target DBMS is MySQL",
        "GET parameter 'id' is vulnerable. Do you want to keep testing the others? [y/N] N",
        "sqlmap identified the following injection point(s) with a total of 42 HTTP requests:",
        "---",
        "Parameter: id (GET)",
        "    Type: boolean-based blind",
        "    Title: AND boolean-based blind - WHERE or HAVING clause",
        "    Payload: id=1 AND 2931=2931",
        "---",
        "[INFO] fetched DBMS: MySQL >= 5.6",
        "[INFO] active database: 'hexblade_db'",
        "[INFO] current user: 'db_admin@localhost'",
        "[INFO] testing completed successfully"
    ],
    "ffuf": [
        "",
        r"        /'___\  /'___\           ",
        r"       /\ \__/ /\ \__/  __  __   ",
        r"       \ \ ,__\\ \ ,__\/\ \/\ \  ",
        r"        \ \ \_/ \ \ \_/\ \ \_\ \ ",
        r"         \ \_\   \ \_\  \ \____/ ",
        r"          \/_/    \/_/   \/___/  ",
        "",
        "       v2.1.0-dev",
        "________________________________________________",
        "",
        " :: Method           : GET",
        " :: URL              : https://target_url/FUZZ",
        " :: Wordlist         : /usr/share/wordlists/dirb/common.txt",
        " :: Follow Redirects : false",
        " :: Calibration      : false",
        " :: Timeout          : 10",
        " :: Threads          : 40",
        "________________________________________________",
        "",
        ".htaccess               [Status: 403, Size: 277, Words: 20, Lines: 10, Duration: 35ms]",
        "admin                   [Status: 301, Size: 312, Words: 20, Lines: 10, Duration: 38ms]",
        "config.php              [Status: 200, Size: 0, Words: 1, Lines: 1, Duration: 40ms]",
        "index.php               [Status: 200, Size: 1242, Words: 285, Lines: 42, Duration: 32ms]",
        "robots.txt              [Status: 200, Size: 154, Words: 12, Lines: 8, Duration: 30ms]",
        ":: Progress: [4612/4612] :: Job [1/1] :: 120 req/sec :: Duration: [00:00:38] :: Errors: 0 ::"
    ]
}

DEFAULT_MOCK_REPORT = [
    "[INFO] Executing simulated cyber analysis stream...",
    "[INFO] Initializing connection to target endpoint...",
    "[INFO] Performing quick diagnostic probe...",
    "PORT      STATE    SERVICE",
    "22/tcp    open     ssh",
    "80/tcp    open     http",
    "443/tcp   open     https",
    "8080/tcp  closed   http-proxy",
    "[INFO] Security check completed.",
    "STATUS: DONE"
]

def build_command(tool: str, target: str, flags: str) -> list:
    config = TOOL_CONFIGS.get(tool)
    if not config:
        return None

    binary = config["binary"]
    base = config["base_args"][:]

    extra_flags = shlex.split(flags) if flags.strip() else []

    if tool == "nmap":
        cmd = [binary] + extra_flags + base + [target]
    elif tool == "gobuster":
        wordlist = "/usr/share/wordlists/dirb/common.txt"
        cmd = [binary, "dir", "-u", target, "-w", wordlist] + extra_flags
    elif tool == "ffuf":
        wordlist = "/usr/share/wordlists/dirb/common.txt"
        cmd = [binary, "-u", target, "-w", wordlist] + extra_flags
    elif tool == "sqlmap":
        cmd = [binary, "-u", target] + base + extra_flags
    elif tool == "subfinder":
        cmd = [binary, "-d", target] + extra_flags
    elif tool == "httpx":
        cmd = [binary, "-u", target] + extra_flags
    elif tool == "amass":
        cmd = [binary, "enum", "-d", target] + extra_flags
    elif tool == "feroxbuster":
        cmd = [binary, "-u", target] + extra_flags
    elif tool == "dirsearch":
        cmd = [binary, "-u", target] + extra_flags
    elif tool == "wpscan":
        cmd = [binary, "--url", target] + extra_flags
    elif tool == "nikto":
        cmd = [binary, "-h", target] + extra_flags
    elif tool == "hydra":
        cmd = [binary] + extra_flags + [target]
    elif tool == "hashcat":
        cmd = [binary] + extra_flags + [target]
    elif tool == "john":
        cmd = [binary, target] + extra_flags
    elif tool == "curl":
        cmd = [binary] + base + extra_flags + [target]
    elif tool == "dig":
        cmd = [binary, target] + extra_flags
    elif tool == "whois":
        cmd = [binary, target] + extra_flags
    elif tool == "nc":
        parts = target.split()
        cmd = [binary, "-zv"] + parts + extra_flags
    elif tool == "whatweb":
        cmd = [binary, target] + extra_flags
    elif tool == "xsstrike":
        cmd = config["base_args"][:] + ["-u", target] + extra_flags
        cmd = ["python3"] + cmd
    elif tool == "commix":
        cmd = [binary, "--url", target] + base + extra_flags
    else:
        cmd = [binary] + base + extra_flags + [target]

    return cmd


@app.websocket("/ws/run")
async def run_tool(websocket: WebSocket):
    await websocket.accept()
    try:
        data = await websocket.receive_text()
        payload = json.loads(data)
        tool = payload.get("tool")
        target = payload.get("target", "").strip()
        flags = payload.get("flags", "")

        if not tool or not target:
            await websocket.send_text(json.dumps({"type": "error", "data": "Tool and target are required."}))
            await websocket.close()
            return

        cmd = build_command(tool, target, flags)
        if not cmd:
            await websocket.send_text(json.dumps({"type": "error", "data": f"Unknown tool: {tool}"}))
            await websocket.close()
            return

        await websocket.send_text(json.dumps({"type": "info", "data": f"$ {' '.join(cmd)}"}))

        binary_name = cmd[0]
        binary_path = shutil.which(binary_name)

        # High-Fidelity Simulation Fallback when binary is missing (common on Windows hosts)
        if not binary_path:
            await websocket.send_text(json.dumps({
                "type": "error",
                "data": f"⚠️ TARGET MODULE '{binary_name.upper()}' NOT DETECTED ON WINDOWS PATH."
            }))
            await websocket.send_text(json.dumps({
                "type": "info",
                "data": f"✨ LAUNCHING DECK SIMULATOR FOR MODULE: {tool.upper()} against: {target}..."
            }))
            
            # Stream mock output realistic logs with small natural delay
            mock_lines = MOCK_SIMULATED_REPORTS.get(tool, DEFAULT_MOCK_REPORT)
            for line in mock_lines:
                await asyncio.sleep(0.3)
                await websocket.send_text(json.dumps({"type": "output", "data": line}))
                
            await asyncio.sleep(0.5)
            await websocket.send_text(json.dumps({"type": "done", "data": "Simulation scan completed successfully. [Demo Mode]"}))
            await websocket.close()
            return

        # Binary is installed - execute real process!
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
            limit=1024 * 1024
        )

        async def read_stream():
            while True:
                line = await process.stdout.readline()
                if not line:
                    break
                decoded = line.decode("utf-8", errors="replace").rstrip()
                await websocket.send_text(json.dumps({"type": "output", "data": decoded}))

        try:
            await asyncio.wait_for(read_stream(), timeout=300)
        except asyncio.TimeoutError:
            process.kill()
            await websocket.send_text(json.dumps({"type": "error", "data": "Process timed out after 5 minutes."}))

        await process.wait()
        await websocket.send_text(json.dumps({"type": "done", "data": f"Exit code: {process.returncode}"}))

    except WebSocketDisconnect:
        pass
    except Exception as e:
        try:
            await websocket.send_text(json.dumps({"type": "error", "data": str(e)}))
        except:
            pass


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/tools")
def list_tools():
    result = {}
    for name, cfg in TOOL_CONFIGS.items():
        result[name] = {
            "placeholder": cfg["input_placeholder"],
        }
    return result
