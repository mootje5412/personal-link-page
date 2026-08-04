#!/bin/bash
# Deploy Phantom PWA to 109.71.252.128
set -euo pipefail
cd "$(dirname "$0")"
npm run build
pip3 install -q paramiko
exec python3 deploy_remote.py
