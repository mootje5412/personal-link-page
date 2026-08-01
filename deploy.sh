#!/bin/bash
# Deploy VeriPanel Python search API to 109.71.252.128
set -euo pipefail
cd "$(dirname "$0")"
exec python3 deploy_remote.py
