#!/usr/bin/env python3
"""Build and deploy VeriPanel frontend with API proxy on the production server."""

import os
import subprocess
import sys
import time
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/var/www/veripanel"
API_PORT = 8080

ROOT = Path(__file__).resolve().parent
DIST = ROOT / "dist"

NGINX_SITE = f"""server {{
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root {REMOTE_DIR};
    index index.html;

    location /phone-api/ {{
        proxy_pass http://127.0.0.1:{API_PORT}/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_connect_timeout 30s;
        proxy_read_timeout 60s;
    }}

    location / {{
        try_files $uri $uri/ /index.html;
    }}
}}
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
        sftp.put(str(local_path), remote_path)


def main() -> int:
    print("Building frontend...")
    subprocess.run(["npm", "run", "build"], cwd=ROOT, check=True)

    if not DIST.exists():
        print("Build failed: dist/ not found", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, "apt-get update && apt-get install -y nginx", timeout=600)
    run(client, f"mkdir -p {REMOTE_DIR}")
    run(client, f"rm -rf {REMOTE_DIR}/*")

    sftp = client.open_sftp()
    for child in DIST.iterdir():
        upload_tree(sftp, child, f"{REMOTE_DIR}/{child.name}")
    sftp.close()

    run(client, f"cat > /etc/nginx/sites-available/veripanel << 'EOF'\n{NGINX_SITE}EOF")
    run(client, "ln -sf /etc/nginx/sites-available/veripanel /etc/nginx/sites-enabled/veripanel")
    run(client, "rm -f /etc/nginx/sites-enabled/default")
    run(client, "nginx -t")
    run(client, "systemctl enable nginx")
    run(client, "systemctl restart nginx")
    time.sleep(1)

    run(client, 'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1/')
    run(client, 'curl -s "http://127.0.0.1/phone-api/api/health"')

    client.close()
    print(f"\nDone. Site: http://{SERVER}/")
    print(f"API proxy: http://{SERVER}/phone-api/api/search?q=QUERY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
