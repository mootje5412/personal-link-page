#!/usr/bin/env python3
"""Deploy ViralAI Next.js PWA to the remote server."""

import os
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

SERVER = os.environ.get("SERVER_HOST", "109.71.252.128")
USER = os.environ.get("SERVER_USER", "root")
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/root/viralai"
PORT = 3000

LOCAL_DIR = Path(__file__).resolve().parent
EXCLUDE = {
    "node_modules",
    ".next",
    ".git",
    ".env.local",
}

SYSTEMD_UNIT = f"""[Unit]
Description=ViralAI Next.js PWA
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}
Environment=NODE_ENV=production
Environment=PORT={PORT}
ExecStart={REMOTE_DIR}/node_modules/.bin/next start -p {PORT}
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
"""

NGINX_CONFIG = f"""server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate /etc/ssl/certs/phantom.crt;
    ssl_certificate_key /etc/ssl/private/phantom.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Prevent browsers and old PWAs from serving stale cached pages
    add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    add_header Pragma "no-cache" always;

    location / {{
        proxy_pass http://127.0.0.1:{PORT};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }}

    location = /sw.js {{
        proxy_pass http://127.0.0.1:{PORT};
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }}

    location = /manifest.json {{
        proxy_pass http://127.0.0.1:{PORT};
        proxy_hide_header Cache-Control;
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }}

    location /_next/static/ {{
        proxy_pass http://127.0.0.1:{PORT};
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }}
}}
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 600) -> tuple[int, str, str]:
    print(f"$ {cmd[:140]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[-4000:])
    if err.strip() and code != 0:
        print(err.strip()[-2000:], file=sys.stderr)
    return code, out, err


def create_archive() -> Path:
    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp.close()
    archive_path = Path(tmp.name)

    def filter_tar(tarinfo: tarfile.TarInfo) -> tarfile.TarInfo | None:
        parts = Path(tarinfo.name).parts
        if any(part in EXCLUDE for part in parts):
            return None
        return tarinfo

    with tarfile.open(archive_path, "w:gz") as tar:
        tar.add(LOCAL_DIR, arcname="viralai", filter=filter_tar)

    print(f"Created archive: {archive_path} ({archive_path.stat().st_size // 1024} KB)")
    return archive_path


def main() -> int:
    archive = create_archive()

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    sftp = client.open_sftp()
    remote_archive = "/tmp/viralai-deploy.tar.gz"
    print("Uploading archive...")
    sftp.put(str(archive), remote_archive)
    sftp.close()
    archive.unlink()

    run(client, "systemctl stop viralai 2>/dev/null || true")
    run(client, "systemctl stop geoloca-api geoloca-usb-helper search-api 2>/dev/null || true")
    run(client, "systemctl disable geoloca-api geoloca-usb-helper search-api 2>/dev/null || true")
    run(client, "pkill -9 -f geoloca 2>/dev/null || true; pkill -9 -f usb_helper.py 2>/dev/null || true")
    run(client, "rm -rf /opt/geoloca-api /opt/geoloca-bridge /var/www/phantom /var/lib/geoloca")
    run(client, "rm -f /etc/systemd/system/geoloca-api.service /etc/systemd/system/geoloca-usb-helper.service /etc/systemd/system/search-api.service")
    run(client, "systemctl daemon-reload")
    run(client, f"rm -rf {REMOTE_DIR} && mkdir -p {REMOTE_DIR}")
    run(client, f"tar -xzf {remote_archive} -C /root")
    run(client, f"test -d /root/viralai && test -f /root/viralai/package.json")
    run(client, f"rm -f {remote_archive}")

    print("Installing dependencies (this may take a few minutes)...")
    code, _, _ = run(client, f"cd {REMOTE_DIR} && npm install 2>&1", timeout=600)
    if code != 0:
        print("npm install failed", file=sys.stderr)
        return 1

    print("Building production app...")
    code, _, _ = run(client, f"cd {REMOTE_DIR} && npm run build 2>&1", timeout=600)
    if code != 0:
        print("Build failed", file=sys.stderr)
        return 1

    run(client, f"cat > /etc/systemd/system/viralai.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
    run(client, "systemctl daemon-reload")
    run(client, "systemctl enable viralai")
    run(client, "systemctl restart viralai")

    time.sleep(5)
    run(client, f"curl -sI http://127.0.0.1:{PORT} | head -8")

    run(client, f"cat > /etc/nginx/sites-available/viralai << 'EOF'\n{NGINX_CONFIG}EOF")
    run(client, "rm -f /etc/nginx/sites-enabled/phantom /etc/nginx/sites-enabled/default")
    run(client, "ln -sf /etc/nginx/sites-available/viralai /etc/nginx/sites-enabled/viralai")
    run(client, "nginx -t && systemctl reload nginx")

    time.sleep(2)
    run(client, f"curl -skI https://127.0.0.1/ | head -8")
    run(client, "systemctl is-active viralai")

    client.close()
    print(f"\nDone. ViralAI live at https://{SERVER}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
