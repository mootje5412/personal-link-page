#!/bin/bash
# Deploy ViralAI PWA to 109.71.252.128
set -euo pipefail
cd "$(dirname "$0")"
export SERVER_HOST="${SERVER_HOST:-109.71.252.128}"
export SERVER_PASS="${SERVER_PASS:-z2GFltjwp4rgccrOJdtc}"
exec python3 deploy_remote.py
