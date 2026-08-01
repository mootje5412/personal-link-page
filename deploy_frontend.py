#!/usr/bin/env python3
"""Deploy VeriPanel frontend to the production server."""

import os
import sys
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
REMOTE_DIR = "/var/www/veripanel"
LOCAL_DIST = Path(__file__).resolve().parent / "dist"

NGINX_SITE = """server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/veripanel;
    index index.html;

    location /phone-api/ {
        proxy_pass http://127.0.0.1:8080/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
"""


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 120) -> tuple[int, str, str]:
    print(f"$ {cmd[:120]}...")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip()[:2000])
    if err.strip() and code != 0:
        print(err.strip()[:1000], file=sys.stderr)
    return code, out, err


def upload_dist(sftp: paramiko.SFTPClient, local_dir: Path, remote_dir: str) -> None:
    for path in local_dir.rglob("*"):
        rel = path.relative_to(local_dir).as_posix()
        remote_path = f"{remote_dir}/{rel}" if rel != "." else remote_dir
        if path.is_dir():
            try:
                sftp.mkdir(remote_path)
            except OSError:
                pass
        else:
            sftp.put(str(path), remote_path)


def main() -> int:
    if not LOCAL_DIST.exists():
        print("Run npm run build first.", file=sys.stderr)
        return 1

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, f"mkdir -p {REMOTE_DIR}")
    run(client, f"rm -rf {REMOTE_DIR}/*")

    print("Uploading dist/...")
    sftp = client.open_sftp()
    upload_dist(sftp, LOCAL_DIST, REMOTE_DIR)
    sftp.close()

    run(client, "apt-get update -qq && apt-get install -y -qq nginx", timeout=300)
    run(
        client,
        f"cat > /etc/nginx/sites-available/veripanel << 'EOF'\n{NGINX_SITE}EOF",
    )
    run(client, "ln -sf /etc/nginx/sites-available/veripanel /etc/nginx/sites-enabled/veripanel")
    run(client, "rm -f /etc/nginx/sites-enabled/default")
    run(client, "nginx -t")
    run(client, "systemctl enable nginx")
    run(client, "systemctl restart nginx")
    run(client, "curl -sI http://127.0.0.1/ | head -5")

    client.close()
    print(f"\nDone. Frontend: http://{SERVER}/")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
