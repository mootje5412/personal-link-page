#!/usr/bin/env python3
"""Remove the VeriPanel frontend site from the production server."""

import os
import sys

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = os.environ.get("SERVER_PASS", "z2GFltjwp4rgccrOJdtc")
SITE_DIR = "/var/www/veripanel"


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 120) -> tuple[int, str, str]:
    print(f"$ {cmd}")
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out.strip():
        print(out.strip())
    if err.strip() and code != 0:
        print(err.strip(), file=sys.stderr)
    return code, out, err


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Connecting to {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    run(client, "systemctl stop nginx 2>/dev/null || true")
    run(client, "systemctl disable nginx 2>/dev/null || true")
    run(client, f"rm -rf {SITE_DIR}")
    run(client, "rm -f /etc/nginx/sites-enabled/veripanel /etc/nginx/sites-available/veripanel")
    run(client, "rm -f /etc/nginx/sites-enabled/default")
    run(client, "systemctl is-active nginx || true")
    run(client, 'curl -s "http://127.0.0.1:8080/api/health"')

    client.close()
    print(f"\nSite removed. API only: http://{SERVER}:8080/api/search?q=QUERY")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
