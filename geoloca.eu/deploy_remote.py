#!/usr/bin/env python3
"""Deploy GeoLoca.eu landing page to 109.71.252.128"""

import os
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/var/www/geoloca"

LOCAL_DIST = Path(__file__).resolve().parent / "dist"

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

    root {REMOTE_DIR};
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml image/svg+xml;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location ~* \\.(js|css|png|ico|svg|woff2)$ {{
        expires 7d;
        add_header Cache-Control "public";
    }}
}}
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


def run(client, cmd, timeout=120):
    print(f"$ {cmd[:120]}...")
    stdin, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:2000])
    if err.strip() and code != 0:
        print(err.strip()[:800], file=sys.stderr)
    return code


def upload_dir(sftp, local: Path, remote: str):
    for item in sorted(local.rglob("*")):
        rel = item.relative_to(local)
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

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, f"mkdir -p {REMOTE_DIR} && rm -rf {REMOTE_DIR}/*")
    sftp = client.open_sftp()
    upload_dir(sftp, LOCAL_DIST, REMOTE_DIR)
    sftp.close()

    run(client, SSL_SETUP.strip())
    run(client, f"cat > /etc/nginx/sites-available/geoloca << 'EOF'\n{NGINX_SITE}EOF")
    run(client, "ln -sf /etc/nginx/sites-available/geoloca /etc/nginx/sites-enabled/geoloca")
    run(client, "nginx -t && systemctl restart nginx")

    time.sleep(1)
    run(client, "curl -skI https://127.0.0.1/ | head -6")
    client.close()
    print(f"\nLive at https://{SERVER}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
