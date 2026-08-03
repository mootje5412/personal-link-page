#!/usr/bin/env python3
"""Deploy Geoloca PWA to 109.71.252.128 — replaces existing server files."""

import os
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/var/www/geoloca"

REMOVE_PATHS = [
    "/root/api",
    "/root/search-api",
    "/root/apexsearch-bot",
    "/root/hextlo",
    "/root/odido-zoeker",
    "/root/panelisearch",
    "/root/findnow-bot",
    "/root/findnow-osint-bot",
    "/root/findnow-osint",
    "/root/geoloca",
]

LOCAL_DIST = Path(__file__).resolve().parent / "dist"

NGINX_SITE = f"""server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root {REMOTE_DIR};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \\.(js|css|png|ico|svg|woff2|webmanifest)$ {{
        expires 7d;
        add_header Cache-Control "public";
    }}

    location = /sw.js {{
        add_header Cache-Control "no-cache";
    }}
}}
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 180) -> tuple[int, str, str]:
    print(f"$ {cmd[:140]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:2500])
    if err.strip() and code != 0:
        print(err.strip()[:1000], file=sys.stderr)
    return code, out, err


def upload_dir(sftp: paramiko.SFTPClient, local: Path, remote: str) -> None:
    for item in sorted(local.rglob("*")):
        rel = item.relative_to(local)
        remote_path = f"{remote}/{rel.as_posix()}"
        if item.is_dir():
            try:
                sftp.mkdir(remote_path)
            except OSError:
                pass
        else:
            print(f"  upload {rel}")
            sftp.put(str(item), remote_path)


def main() -> int:
    if not LOCAL_DIST.is_dir():
        print(f"Missing build output: {LOCAL_DIST}", file=sys.stderr)
        print("Run: cd geoloca && npm install && npm run build", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    print("\n--- Stopping old services ---")
    run(client, "systemctl stop search-api 2>/dev/null || true")
    run(client, "systemctl disable search-api 2>/dev/null || true")
    run(client, "rm -f /etc/systemd/system/search-api.service")
    run(client, "systemctl daemon-reload")
    run(client, "pm2 kill 2>/dev/null || true")
    run(client, "pkill -9 -f 'node /root/api' 2>/dev/null || true")
    run(client, "pkill -9 -f 'node index.js' 2>/dev/null || true")
    run(client, "pkill -9 -f uvicorn 2>/dev/null || true")
    run(client, "pkill -9 -f main.py 2>/dev/null || true")

    print("\n--- Removing old files ---")
    for path in REMOVE_PATHS:
        run(client, f"rm -rf {path}")

    print("\n--- Uploading Geoloca ---")
    run(client, f"mkdir -p {REMOTE_DIR}")
    run(client, f"rm -rf {REMOTE_DIR}/*")
    sftp = client.open_sftp()
    upload_dir(sftp, LOCAL_DIST, REMOTE_DIR)
    sftp.close()

    print("\n--- Configuring nginx ---")
    run(client, f"cat > /etc/nginx/sites-available/geoloca << 'EOF'\n{NGINX_SITE}EOF")
    run(client, "rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/*")
    run(client, "ln -sf /etc/nginx/sites-available/geoloca /etc/nginx/sites-enabled/geoloca")
    run(client, "nginx -t")
    run(client, "systemctl enable nginx")
    run(client, "systemctl restart nginx")

    time.sleep(2)
    print("\n--- Verifying ---")
    run(client, "systemctl is-active nginx")
    run(client, "curl -sI http://127.0.0.1/ | head -10")
    run(client, f"ls -la {REMOTE_DIR}")
    run(client, "ls -la /root")

    client.close()
    print(f"\nDone. Geoloca is live at http://{SERVER}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
