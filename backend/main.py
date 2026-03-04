from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import asyncio
import subprocess
import shlex
import json
import os

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

        binary_path = cmd[0]
        if not os.path.exists(binary_path) and not any(
            os.path.exists(os.path.join(p, binary_path))
            for p in os.environ.get("PATH", "").split(":")
        ):
            pass

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
