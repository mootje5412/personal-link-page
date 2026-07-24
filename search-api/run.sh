#!/bin/sh
set -eu

cd "$(dirname "$0")"

if ! python3 -c "import venv" 2>/dev/null; then
  apt-get update
  apt-get install -y python3-venv python3-full
fi

if [ ! -d venv ]; then
  python3 -m venv venv
fi

./venv/bin/pip install -q -r requirements.txt
exec ./venv/bin/python main.py
