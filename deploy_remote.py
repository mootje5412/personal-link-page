#!/usr/bin/env python3
import io
import os
import sys
import tarfile
import time

import paramiko

SERVER = os.environ.get("DEPLOY_SERVER", "109.71.252.128")
USER = os.environ.get("DEPLOY_USER", "root")
PASSWORD = os.environ.get("DEPLOY_PASSWORD", "")
REMOTE_DIR = "/root/odido-zoeker"
WORKSPACE = "/workspace"

FILES = [
    "config/config.js",
    "src/bot.js",
    "src/handlers/commandHandler.js",
    "src/handlers/messageHandler.js",
    "src/handlers/paginationHandler.js",
    "src/services/odidoService.js",
    "src/utils/formatResults.js",
    "index.js",
    "bot-package.json",
    "restart.sh",
]


def run(client, command):
    print(f"$ {command}")
    stdin, stdout, stderr = client.exec_command(command)
    out = stdout.read().decode()
    err = stderr.read().decode()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out.rstrip())
    if err:
        print(err.rstrip(), file=sys.stderr)
    return code, out, err


def main():
    if not PASSWORD:
        print("Stel DEPLOY_PASSWORD in voor SSH-toegang.", file=sys.stderr)
        sys.exit(1)

    archive = io.BytesIO()
    with tarfile.open(fileobj=archive, mode="w:gz") as tar:
        for rel_path in FILES:
            full_path = os.path.join(WORKSPACE, rel_path)
            tar.add(full_path, arcname=rel_path)
    archive.seek(0)

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f"Verbinden met {SERVER}...")
    client.connect(SERVER, username=USER, password=PASSWORD, timeout=30)

    sftp = client.open_sftp()
    run(client, f"mkdir -p {REMOTE_DIR}")
    remote_tar = f"{REMOTE_DIR}/bot-deploy.tar.gz"
    print("Bestanden uploaden...")
    with sftp.file(remote_tar, "wb") as remote_file:
        remote_file.write(archive.read())
    sftp.close()

    commands = f"""
set -e
cd {REMOTE_DIR}
tar -xzf bot-deploy.tar.gz
rm -f bot-deploy.tar.gz
mv -f bot-package.json package.json
chmod +x restart.sh

if ! command -v node >/dev/null 2>&1; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

npm install
pkill -9 -f "/root/odido-zoeker" 2>/dev/null || true
pkill -9 -f "node /root/findnow-bot/index.js" 2>/dev/null || true
sleep 1
pm2 delete odido-zoeker 2>/dev/null || true
pm2 start index.js --name odido-zoeker
pm2 save
sleep 3
pm2 logs odido-zoeker --lines 20 --nostream
"""
    code, out, err = run(client, commands)
    client.close()

    if code != 0:
        print(f"Deployment mislukt (exit {code})", file=sys.stderr)
        sys.exit(code)

    print("Deployment voltooid!")


if __name__ == "__main__":
    main()
