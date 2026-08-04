#!/usr/bin/env python3
"""Deploy GeoLoca.eu frontend + secure API to 109.71.252.128"""

import os
import secrets
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_WEB = "/var/www/geoloca"
REMOTE_API = "/opt/geoloca-api"
REMOTE_DATA = "/var/lib/geoloca"

ROOT = Path(__file__).resolve().parent
LOCAL_DIST = ROOT / "dist"
LOCAL_SERVER = ROOT / "server"

NGINX_SITE = f"""server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}}

server {{
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate /etc/ssl/certs/geoloca.crt;
    ssl_certificate_key /etc/ssl/private/geoloca.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root {REMOTE_WEB};
    index index.html;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;

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

    location ~* \\.(js|css|png|ico|svg|woff2)$ {{
        expires 7d;
        add_header Cache-Control "public";
    }}
}}
"""

SYSTEMD_UNIT = f"""[Unit]
Description=GeoLoca API
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory={REMOTE_API}
EnvironmentFile={REMOTE_API}/.env
ExecStart=/usr/bin/node src/index.js
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths={REMOTE_DATA}
PrivateTmp=true

[Install]
WantedBy=multi-user.target
"""

SSL_SETUP = """
mkdir -p /etc/ssl/private /etc/ssl/certs
if [ ! -f /etc/ssl/certs/geoloca.crt ]; then
  openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/ssl/private/geoloca.key \
    -out /etc/ssl/certs/geoloca.crt \
    -subj "/CN=109.71.252.128/O=GeoLoca" \
    -addext "subjectAltName=IP:109.71.252.128"
  chmod 600 /etc/ssl/private/geoloca.key
fi
"""

NODE_SETUP = """
if ! command -v node >/dev/null 2>&1; then
  apt-get update -qq && apt-get install -y -qq nodejs npm
fi
node --version
"""


def run(client, cmd, timeout=300):
    print(f"$ {cmd[:140]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:3000])
    if err.strip() and code != 0:
        print(err.strip()[:1200], file=sys.stderr)
    return code


def upload_dir(sftp, local: Path, remote: str, skip=None):
    skip = skip or set()
    for item in sorted(local.rglob("*")):
        rel = item.relative_to(local)
        if any(part in skip for part in rel.parts):
            continue
        if rel.name in skip:
            continue
        remote_path = f"{remote}/{rel.as_posix()}"
        if item.is_dir():
            try:
                sftp.mkdir(remote_path)
            except OSError:
                pass
        else:
            print(f"  {rel}")
            sftp.put(str(item), remote_path)


def main():
    if not LOCAL_DIST.is_dir():
        print("Run: npm run build", file=sys.stderr)
        return 1
    if not LOCAL_SERVER.is_dir():
        print("Missing server/", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, NODE_SETUP.strip())

    # Frontend
    run(client, f"mkdir -p {REMOTE_WEB} && rm -rf {REMOTE_WEB}/*")
    sftp = client.open_sftp()
    upload_dir(sftp, LOCAL_DIST, REMOTE_WEB)

    # API
    run(client, f"mkdir -p {REMOTE_API} {REMOTE_DATA} /opt/geoloca-bridge")
    upload_dir(sftp, LOCAL_SERVER, REMOTE_API, skip={"node_modules", "data", ".env"})
    bridge_local = ROOT / "bridge" / "usb_helper.py"
    if bridge_local.is_file():
        print("  bridge/usb_helper.py")
        sftp.put(str(bridge_local), "/opt/geoloca-bridge/usb_helper.py")
    sftp.close()

    session_secret = secrets.token_hex(32)
    env_content = f"""NODE_ENV=production
PORT=3001
TRUST_PROXY=1
SESSION_SECRET={session_secret}
GEOLOCA_DATA_DIR={REMOTE_DATA}
ALLOWED_ORIGINS=https://{SERVER},http://{SERVER}
"""

    run(
        client,
        f"""if [ ! -f {REMOTE_API}/.env ]; then
  cat > {REMOTE_API}/.env << 'ENVEOF'
{env_content}ENVEOF
else
  grep -q '^GEOLOCA_DATA_DIR=' {REMOTE_API}/.env || echo 'GEOLOCA_DATA_DIR={REMOTE_DATA}' >> {REMOTE_API}/.env
  grep -q '^NODE_ENV=' {REMOTE_API}/.env || echo 'NODE_ENV=production' >> {REMOTE_API}/.env
  grep -q '^TRUST_PROXY=' {REMOTE_API}/.env || echo 'TRUST_PROXY=1' >> {REMOTE_API}/.env
fi""",
    )

    run(client, f"cd {REMOTE_API} && npm install --omit=dev")
    run(client, f"chown -R www-data:www-data {REMOTE_API} {REMOTE_DATA}")
    run(client, f"chmod 700 {REMOTE_DATA}")

    run(client, f"cat > /etc/systemd/system/geoloca-api.service << 'EOF'\n{SYSTEMD_UNIT}EOF")
    run(client, "systemctl daemon-reload && systemctl enable geoloca-api && systemctl restart geoloca-api")

    USB_HELPER_UNIT = """[Unit]
Description=GeoLoca USB Helper
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/geoloca-bridge/usb_helper.py
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
"""
    run(client, f"cat > /etc/systemd/system/geoloca-usb-helper.service << 'EOF'\n{USB_HELPER_UNIT}EOF")
    run(client, "systemctl daemon-reload && systemctl enable geoloca-usb-helper && systemctl restart geoloca-usb-helper")

    run(client, SSL_SETUP.strip())
    run(client, f"cat > /etc/nginx/sites-available/geoloca << 'EOF'\n{NGINX_SITE}EOF")
    run(client, "ln -sf /etc/nginx/sites-available/geoloca /etc/nginx/sites-enabled/geoloca")
    run(client, "nginx -t && systemctl restart nginx")

    time.sleep(2)
    run(client, "systemctl is-active geoloca-api")
    run(client, "systemctl is-active geoloca-usb-helper || true")
    run(client, "curl -sk https://127.0.0.1/api/health")
    run(client, "curl -sk https://127.0.0.1/api/usb/scan")
    run(client, "curl -skI https://127.0.0.1/ | head -6")
    client.close()
    print(f"\nLive at https://{SERVER}/")
    print(f"API at https://{SERVER}/api/health")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
