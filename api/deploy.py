#!/usr/bin/env python3
"""Deploy Telegram search bot and remove the frontend site."""

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
SITE_DIR = "/var/www/veripanel"

LOCAL_DIR = Path(__file__).resolve().parent
UPLOAD_DIRS = ["lib"]
UPLOAD_FILES = ["bot.js", "server.js", "package.json", "telegram.env.example"]
REMOTE_DATABASES_DIR = f"{REMOTE_DIR}/databases"
REMOTE_ENV_FILE = f"{REMOTE_DIR}/telegram.env"

SYSTEMD_UNIT = f"""[Unit]
Description=VeriPanel Telegram Search Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=2048
EnvironmentFile=-{REMOTE_ENV_FILE}
ExecStart=/usr/bin/node {REMOTE_DIR}/bot.js
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


def ensure_telegram_env(client: paramiko.SSHClient, sftp: paramiko.SFTPClient) -> None:
    _, out, _ = run(client, f"test -f {REMOTE_ENV_FILE} && echo yes || echo no")
    if "yes" in out:
        print("Keeping existing telegram.env on server")
        return

    _, search_api_env, _ = run(
        client,
        f"test -f /root/search-api/telegram.env && cat /root/search-api/telegram.env || true",
    )
    for line in search_api_env.splitlines():
        if line.strip().startswith("TELEGRAM_BOT_TOKEN=") and "your_bot_token" not in line:
            print("Copying telegram.env from /root/search-api/telegram.env")
            run(client, f"cp /root/search-api/telegram.env {REMOTE_ENV_FILE}")
            return

    token = os.environ.get("TELEGRAM_BOT_TOKEN", "").strip()
    if not token:
        print(
            "ERROR: No telegram.env found and TELEGRAM_BOT_TOKEN not set.\n"
            "Set TELEGRAM_BOT_TOKEN before deploy or create /root/api/telegram.env on the server.",
            file=sys.stderr,
        )
        sys.exit(1)

    print("Creating telegram.env from TELEGRAM_BOT_TOKEN")
    with sftp.open(REMOTE_ENV_FILE, "w") as remote_file:
        remote_file.write(f"TELEGRAM_BOT_TOKEN={token}\n")


def remove_site(client: paramiko.SSHClient) -> None:
    print("Removing frontend site...")
    run(client, "systemctl stop nginx 2>/dev/null || true")
    run(client, "systemctl disable nginx 2>/dev/null || true")
    run(client, f"rm -rf {SITE_DIR}")
    run(client, "rm -f /etc/nginx/sites-enabled/veripanel /etc/nginx/sites-available/veripanel")
    run(client, "rm -f /etc/nginx/sites-enabled/default")


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    remove_site(client)

    run(client, "systemctl stop search-api 2>/dev/null || true")
    run(client, f"mkdir -p {REMOTE_DIR} {REMOTE_DATABASES_DIR}")
    run(client, f"rm -rf {REMOTE_DIR}/lib {REMOTE_DIR}/node_modules")
    run(client, f"rm -f {REMOTE_DIR}/bot.js {REMOTE_DIR}/server.js {REMOTE_DIR}/package.json")

    sftp = client.open_sftp()
    for name in UPLOAD_FILES:
        local = LOCAL_DIR / name
        remote = f"{REMOTE_DIR}/{name}"
        print(f"Uploading {name}...")
        sftp.put(str(local), remote)

    for name in UPLOAD_DIRS:
        upload_tree(sftp, LOCAL_DIR / name, f"{REMOTE_DIR}/{name}")

    ensure_telegram_env(client, sftp)
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
    time.sleep(3)

    run(client, "systemctl is-active search-api")
    run(client, "journalctl -u search-api -n 20 --no-pager")

    client.close()
    print(f"\nDone. Telegram bot deployed. Site removed.")
    print(f"Optional HTTP API: node {REMOTE_DIR}/server.js")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
