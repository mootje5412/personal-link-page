#!/usr/bin/env python3
"""Deploy VeriPanel search API updates to the server."""

import os
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/root/api"
LOCAL_DIR = Path(__file__).resolve().parent

UPLOAD_FILES = [
    "lib/sqlParser.js",
    "lib/parsers.js",
    "lib/searchEngine.js",
    "test/sqlParser.test.js",
]

SYSTEMD_UNIT = """[Unit]
Description=VeriPanel Telegram Search Bot
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/root/api
Environment=NODE_ENV=production
Environment=NODE_OPTIONS=--max-old-space-size=1536
EnvironmentFile=-/root/api/telegram.env
ExecStart=/usr/bin/node /root/api/bot.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""


def run(client, cmd, timeout=120):
    print(f"$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    text = (out + err).strip()
    if text:
        print(text[:3000])
    return code, text


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, "test -f /swapfile || (fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile && grep -q '/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >> /etc/fstab)")
    run(client, "free -h")

    sftp = client.open_sftp()
    run(client, "mkdir -p /root/api/test")
    for rel in UPLOAD_FILES:
        local = LOCAL_DIR / rel
        remote = f"{REMOTE_DIR}/{rel}"
        print(f"Uploading {rel}...")
        sftp.put(str(local), remote)
    sftp.close()

    run(client, f"cat > /etc/systemd/system/search-api.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
    run(client, "systemctl daemon-reload")
    run(client, "cd /root/api && node test/sqlParser.test.js")
    run(client, "systemctl restart search-api")

    print("Waiting for index rebuild...")
    for _ in range(36):
        time.sleep(5)
        code, text = run(client, "journalctl -u search-api -n 8 --no-pager | tail -8")
        if "Telegram bot is running" in text and "Index ready" in text:
            break
        if "oom-kill" in text.lower() or "status=9/KILL" in text:
            print("Still rebuilding after memory pressure...")

    verify = r"""import { searchDatabases, getLineStats } from './lib/searchEngine.js';
const root = '/root/api';
const stats = getLineStats(root).stats;
const tc = searchDatabases('23480340824', { rootDir: root, type: 'tc', limit: 3 });
const ad = searchDatabases('NESLIHAN', { rootDir: root, type: 'ad', limit: 3 });
console.log(JSON.stringify({
  indexed_records: stats.indexed_records,
  status: stats.status,
  tc_found: tc.found,
  tc_name: tc.results[0]?.isim || tc.results[0]?.ad || null,
  ad_found: ad.found,
  ad_name: ad.results[0]?.isim || null,
}, null, 2));"""
    run(client, f"cd /root/api && node --input-type=module -e {verify!r}")

    client.close()
    print("\nDeploy complete.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
