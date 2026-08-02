#!/usr/bin/env python3
"""Deploy JavaScript search API to the production server."""

import os
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/root/api"
PORT = 8080

LOCAL_DIR = Path(__file__).resolve().parent
UPLOAD_DIRS = ["databases", "lib"]
UPLOAD_FILES = ["server.js", "package.json"]

SYSTEMD_UNIT = f"""[Unit]
Description=VeriPanel JavaScript Search API
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}
Environment=PORT={PORT}
Environment=NODE_ENV=production
ExecStart=/usr/bin/node {REMOTE_DIR}/server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 300) -> tuple[int, str, str]:
    print(f"$ {cmd[:140]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:2500])
    if err.strip() and code != 0:
        print(err.strip()[:1200], file=sys.stderr)
    return code, out, err


def upload_tree(sftp: paramiko.SFTPClient, local_path: Path, remote_path: str) -> None:
    if local_path.is_dir():
        try:
            sftp.mkdir(remote_path)
        except OSError:
            pass
        for child in local_path.iterdir():
            upload_tree(sftp, child, f"{remote_path}/{child.name}")
    else:
        print(f"Uploading {local_path.relative_to(LOCAL_DIR)}")
        sftp.put(str(local_path), remote_path)


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, "systemctl stop search-api 2>/dev/null || true")
    run(client, f"mkdir -p {REMOTE_DIR}")
    run(client, f"rm -rf {REMOTE_DIR}/lib {REMOTE_DIR}/databases {REMOTE_DIR}/node_modules")
    run(client, f"rm -f {REMOTE_DIR}/server.js {REMOTE_DIR}/package.json")

    sftp = client.open_sftp()
    for name in UPLOAD_FILES:
        local = LOCAL_DIR / name
        remote = f"{REMOTE_DIR}/{name}"
        print(f"Uploading {name}...")
        sftp.put(str(local), remote)

    for name in UPLOAD_DIRS:
        upload_tree(sftp, LOCAL_DIR / name, f"{REMOTE_DIR}/{name}")
    sftp.close()

    print("Installing Node.js and dependencies...")
    run(
        client,
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs",
        timeout=600,
    )
    run(client, f"cd {REMOTE_DIR} && npm install --omit=dev", timeout=300)

    run(client, f"cat > /etc/systemd/system/search-api.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
    run(client, "systemctl daemon-reload")
    run(client, "systemctl enable search-api")
    run(client, "systemctl restart search-api")
    time.sleep(2)

    run(client, f'curl -s "http://127.0.0.1:{PORT}/api/health"')
    run(client, f'curl -s "http://127.0.0.1:{PORT}/api/search?q=05551234567" | head -c 500')
    run(client, "systemctl is-active search-api")

    client.close()
    print(f"\nDone. API: http://{SERVER}:{PORT}/api/search?q=QUERY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
