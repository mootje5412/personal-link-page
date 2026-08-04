#!/usr/bin/env python3
"""Deploy Nexus OSINT static PWA to server."""

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
WEB_ROOT = "/var/www/nexus-osint"

LOCAL_DIR = Path(__file__).resolve().parent
DIST = LOCAL_DIR / "dist"

NGINX_CONFIG = """server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl default_server;
    listen [::]:443 ssl default_server;
    server_name _;

    ssl_certificate /etc/ssl/certs/phantom.crt;
    ssl_certificate_key /etc/ssl/private/phantom.key;
    ssl_protocols TLSv1.2 TLSv1.3;

    root /var/www/nexus-osint;
    index index.html;

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml image/svg+xml;

    add_header Cache-Control "no-store, no-cache, must-revalidate" always;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location = /sw.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }

    location = /manifest.json {
        add_header Cache-Control "no-store, no-cache, must-revalidate" always;
    }

    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
    }
}
"""


def run(client, cmd, timeout=120):
    print(f"$ {cmd[:120]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[-3000:])
    if err.strip() and code != 0:
        print(err.strip()[-1000:], file=sys.stderr)
    return code


def main():
    if not DIST.exists():
        print("Run npm run build first", file=sys.stderr)
        return 1

    tmp = tempfile.NamedTemporaryFile(suffix=".tar.gz", delete=False)
    tmp.close()
    archive = Path(tmp.name)
    with tarfile.open(archive, "w:gz") as tar:
        tar.add(DIST, arcname="dist")

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    # Stop and remove old apps
    print("\n=== Removing old applications ===")
    run(client, "systemctl stop viralai geoloca-api geoloca-usb-helper search-api 2>/dev/null || true")
    run(client, "systemctl disable viralai geoloca-api geoloca-usb-helper search-api 2>/dev/null || true")
    run(client, "pkill -9 -f 'next-server' 2>/dev/null || true")
    run(client, "pkill -9 -f geoloca 2>/dev/null || true")
    run(client, "rm -rf /root/viralai /opt/geoloca-api /opt/geoloca-bridge /var/www/phantom /var/www/html")
    run(client, "rm -f /etc/systemd/system/viralai.service /etc/systemd/system/geoloca-api.service /etc/systemd/system/geoloca-usb-helper.service /etc/systemd/system/search-api.service")
    run(client, "systemctl daemon-reload")

    # Deploy Nexus OSINT
    print("\n=== Deploying Nexus OSINT ===")
    sftp = client.open_sftp()
    remote_archive = "/tmp/nexus-deploy.tar.gz"
    sftp.put(str(archive), remote_archive)
    sftp.close()
    archive.unlink()

    run(client, f"mkdir -p {WEB_ROOT}")
    run(client, f"rm -rf {WEB_ROOT}/*")
    run(client, f"tar -xzf {remote_archive} -C /tmp && cp -r /tmp/dist/* {WEB_ROOT}/ && rm -rf /tmp/dist {remote_archive}")

    # Nginx
    run(client, f"cat > /etc/nginx/sites-available/nexus-osint << 'EOF'\n{NGINX_CONFIG}EOF")
    run(client, "rm -f /etc/nginx/sites-enabled/* /etc/nginx/sites-available/phantom /etc/nginx/sites-available/viralai /etc/nginx/sites-available/geoloca /etc/nginx/sites-available/default")
    run(client, "ln -sf /etc/nginx/sites-available/nexus-osint /etc/nginx/sites-enabled/nexus-osint")
    run(client, "nginx -t && systemctl reload nginx")

    time.sleep(1)
    run(client, "curl -skI https://127.0.0.1/ | head -10")
    run(client, "curl -sk https://127.0.0.1/ | grep -o '<title>[^<]*</title>'")
    run(client, f"ls -la {WEB_ROOT} | head -10")

    client.close()
    print(f"\n✓ Nexus OSINT live at https://{SERVER}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
