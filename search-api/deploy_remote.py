#!/usr/bin/env python3
"""Deploy VeriPanel Python search API to the server."""

import os
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/root/search-api"
API_KEY = "z2GFltjwp4rgccrOJdtc"

REMOVE_DIRS = [
    "/root/apexsearch-bot",
    "/root/hextlo",
    "/root/odido-zoeker",
    "/root/panelisearch",
    "/root/findnow-bot",
    "/root/findnow-osint-bot",
    "/root/findnow-osint",
]

LOCAL_DIR = Path(__file__).resolve().parent
UPLOAD_FILES = ["main.py", "requirements.txt", "run.sh", "restart.sh", "cleanup.sh"]

SYSTEMD_UNIT = f"""[Unit]
Description=VeriPanel Search API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}
Environment=API_KEY={API_KEY}
Environment=PORT=8080
Environment=AUTO_REBUILD=0
ExecStart={REMOTE_DIR}/venv/bin/python {REMOTE_DIR}/main.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 120) -> tuple[int, str, str]:
    print(f"$ {cmd[:120]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:2000])
    if err.strip() and code != 0:
        print(err.strip()[:1000], file=sys.stderr)
    return code, out, err


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, "pm2 kill 2>/dev/null || true; pm2 unstartup 2>/dev/null || true")
    run(client, "pkill -9 -f 'node index.js' 2>/dev/null || true")
    run(client, "pkill -9 -f 'main.py' 2>/dev/null || true")
    run(client, "pkill -9 -f uvicorn 2>/dev/null || true")

    for path in REMOVE_DIRS:
        run(client, f"rm -rf {path}")

    run(client, f"mkdir -p {REMOTE_DIR}/databases")

    sftp = client.open_sftp()
    for name in UPLOAD_FILES:
        local = LOCAL_DIR / name
        remote = f"{REMOTE_DIR}/{name}"
        print(f"Uploading {name}...")
        sftp.put(str(local), remote)
    sftp.close()

    run(client, f"chmod +x {REMOTE_DIR}/run.sh {REMOTE_DIR}/restart.sh {REMOTE_DIR}/cleanup.sh")

    run(client, f"cat > /etc/systemd/system/search-api.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
    run(client, "systemctl daemon-reload")

    print("Installing Python dependencies and starting API (may take a few minutes)...")
    code, _, _ = run(
        client,
        f"cd {REMOTE_DIR} && bash run.sh > /tmp/api-setup.log 2>&1 &",
        timeout=30,
    )

    time.sleep(8)

    run(client, "systemctl enable search-api")
    run(client, "systemctl restart search-api || true")

    time.sleep(4)
    run(client, f'curl -s "http://127.0.0.1:8080/api/phone?key={API_KEY}" | head -c 400')
    run(client, "systemctl is-active search-api || true")
    run(client, f"ls -la {REMOTE_DIR} && ls -la /root")

    client.close()
    print(f"\nDone. API: http://{SERVER}:8080/api/phone?key={API_KEY}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
