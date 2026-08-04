#!/bin/bash
set -euo pipefail
cd "$(dirname "$0")"
npm run build
exec python3 deploy_remote.py
