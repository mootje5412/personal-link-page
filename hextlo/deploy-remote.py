#!/usr/bin/env python3
"""Deploy HexTLO bot to remote server via paramiko."""

import io
import os
import tarfile
from pathlib import Path

import paramiko

SERVER = "109.71.252.128"
USER = "root"
PASSWORD = "z2GFltjwp4rgccrOJdtc"
REMOTE_DIR = "/root/hextlo"
API_KEY = "d1880ff59709750dfa2bd520d3db929f8fb8da724bed1e6200e23f420d6bd207"
BOT_TOKEN = os.environ.get("HEXTLO_BOT_TOKEN", "")

LOCAL_DIR = Path(__file__).resolve().parent
EXCLUDES = {".venv", "__pycache__", ".env", "deploy-remote.py"}


def build_tarball() -> bytes:
    buffer = io.BytesIO()
    with tarfile.open(fileobj=buffer, mode="w:gz") as tar:
        for path in LOCAL_DIR.rglob("*"):
            rel = path.relative_to(LOCAL_DIR)
            if any(part in EXCLUDES for part in rel.parts):
                continue
            tar.add(path, arcname=str(rel))
    buffer.seek(0)
    return buffer.read()


def run(client: paramiko.SSHClient, command: str) -> tuple[str, str, int]:
    stdin, stdout, stderr = client.exec_command(command)
    exit_code = stdout.channel.recv_exit_status()
    return stdout.read().decode(), stderr.read().decode(), exit_code


def main() -> None:
    tarball = build_tarball()
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=20)

    sftp = client.open_sftp()
    run(client, f"mkdir -p {REMOTE_DIR}")
    with sftp.file(f"{REMOTE_DIR}/hextlo-bot.tar.gz", "wb") as remote_file:
        remote_file.write(tarball)
    sftp.close()

    env_block = f"""HEXTLO_BOT_TOKEN={BOT_TOKEN}
HEXTLO_API_KEY={API_KEY}
HEXTLO_API_BASE_URL=https://zopztlo.zopzstress.st/api/v1
"""

    remote_script = f"""
set -e
cd {REMOTE_DIR}
tar -xzf hextlo-bot.tar.gz
rm -f hextlo-bot.tar.gz
cat > .env << 'EOF'
{env_block}EOF

export DEBIAN_FRONTEND=noninteractive
apt-get update -qq >/dev/null 2>&1 || true
apt-get install -y -qq python3 python3-venv python3-pip >/dev/null 2>&1 || true

if [ ! -d venv ]; then python3 -m venv venv; fi
venv/bin/pip install -q --upgrade pip
venv/bin/pip install -q -r requirements.txt

if ! command -v pm2 >/dev/null 2>&1; then npm install -g pm2; fi

pm2 delete hextlo 2>/dev/null || true
"""
    if BOT_TOKEN:
        remote_script += f"""
pm2 start venv/bin/python --name hextlo --cwd {REMOTE_DIR} -- main.py
pm2 save
sleep 2
pm2 status hextlo
pm2 logs hextlo --lines 10 --nostream
"""
    else:
        remote_script += """
echo "HEXTLO_BOT_TOKEN not set — files deployed, add token to .env then run:"
echo "  pm2 start venv/bin/python --name hextlo --cwd /root/hextlo -- main.py"
"""

    out, err, code = run(client, remote_script)
    print(out)
    if err:
        print(err)
    if code != 0:
        raise SystemExit(code)

    test_out, _, _ = run(
        client,
        f'cd {REMOTE_DIR} && venv/bin/python -c "from utils.detector import detect_search; print(detect_search(\'John Smith\').search_type.value)"',
    )
    print("Detector test:", test_out.strip())

    api_test, _, _ = run(
        client,
        f'curl -4 -sS --max-time 15 "https://zopztlo.zopzstress.st/api/v1/ssnsearch?q=example,example&key={API_KEY}"',
    )
    print("API test:", api_test[:200])

    client.close()
    print("Deploy complete.")


if __name__ == "__main__":
    main()
