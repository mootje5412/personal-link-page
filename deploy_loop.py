#!/usr/bin/env python3
"""Deploy Loop PWA + API to 109.71.252.128"""

import os
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/root/loop-app"
WEB_ROOT = "/var/www/loop"
JWT_SECRET = os.environ.get("JWT_SECRET", "loop-prod-jwt-z2GFltjwp4rgccrOJdtc")

ROOT = Path(__file__).resolve().parent

NGINX_CONF = f"""server {{
    listen 80;
    listen [::]:80;
    server_name {SERVER};
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name {SERVER};

    ssl_certificate /etc/ssl/certs/phantom.crt;
    ssl_certificate_key /etc/ssl/private/phantom.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root {WEB_ROOT};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    location /uploads/ {{
        proxy_pass http://127.0.0.1:3001/uploads/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }}

    client_max_body_size 85M;

    location /api/ {{
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
"""

SYSTEMD_UNIT = f"""[Unit]
Description=Loop API Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory={REMOTE_DIR}/server
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=JWT_SECRET={JWT_SECRET}
Environment=CLIENT_ORIGIN=https://{SERVER},http://{SERVER}
ExecStart=/usr/bin/node loop-server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
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
        print(err.strip()[:800], file=sys.stderr)
    return code, out, err


def build_frontend() -> None:
    print("Building frontend...")
    subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True)


def create_tarball(tar_path: Path) -> None:
    dist = ROOT / "dist"
    server = ROOT / "server"
    files = [
        ("dist", dist),
    ]
    server_files = [
        "loop-server.js",
        "loop-db.js",
        "loop-schema.sql",
        "package.json",
        "package-lock.json",
    ]
    with tarfile.open(tar_path, "w:gz") as tar:
        for name, path in files:
            tar.add(path, arcname=name)
        for name in server_files:
            tar.add(server / name, arcname=f"server/{name}")


def main() -> int:
    build_frontend()

    with tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False) as tmp:
        tar_path = Path(tmp.name)

    try:
        create_tarball(tar_path)
        print(f"Created deploy bundle ({tar_path.stat().st_size // 1024} KB)")

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        print(f"Connecting to {SERVER}...")
        client.connect(SERVER, username=USER, password=PASSWORD, timeout=30, banner_timeout=30)

        run(client, f"mkdir -p {REMOTE_DIR} {WEB_ROOT}")
        sftp = client.open_sftp()
        remote_tar = f"{REMOTE_DIR}/deploy.tar.gz"
        print("Uploading bundle...")
        sftp.put(str(tar_path), remote_tar)
        sftp.close()

        run(client, f"cd {REMOTE_DIR} && tar -xzf deploy.tar.gz && rm deploy.tar.gz")
        run(client, f"rsync -a --delete {REMOTE_DIR}/dist/ {WEB_ROOT}/")
        run(client, f"chown -R www-data:www-data {WEB_ROOT}")
        run(client, f"cd {REMOTE_DIR}/server && npm install --omit=dev")
        run(client, f"mkdir -p {REMOTE_DIR}/server/data {REMOTE_DIR}/server/uploads")

        run(client, f"cat > /etc/systemd/system/loop-api.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
        run(client, "systemctl daemon-reload")
        run(client, "systemctl enable loop-api")
        run(client, "systemctl restart loop-api")

        run(client, f"cat > /etc/nginx/sites-available/loop << 'EOF'\n{NGINX_CONF}EOF")
        run(client, "rm -f /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/loop")
        run(client, "ln -sf /etc/nginx/sites-available/loop /etc/nginx/sites-enabled/loop")
        run(client, "nginx -t")
        run(client, "systemctl reload nginx")

        time.sleep(2)
        run(client, "systemctl is-active loop-api")
        run(client, "curl -sk https://127.0.0.1/api/health")
        run(client, f"curl -sk https://127.0.0.1/ | head -c 200")

        client.close()
        print(f"\n✓ Loop deployed: https://{SERVER}/")
        return 0
    finally:
        tar_path.unlink(missing_ok=True)


if __name__ == "__main__":
    raise SystemExit(main())
