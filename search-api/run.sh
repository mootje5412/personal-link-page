#!/bin/sh
set -eu

cd "$(dirname "$0")"

export DEBIAN_FRONTEND=noninteractive

if ! python3 -c "import venv" 2>/dev/null; then
  apt-get -qq update
  apt-get -qq -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold install python3-venv python3-full
fi

if ! command -v 7z >/dev/null 2>&1 && ! command -v 7za >/dev/null 2>&1; then
  apt-get -qq update
  apt-get -qq -y -o Dpkg::Options::=--force-confdef -o Dpkg::Options::=--force-confold install p7zip-full
fi

if [ ! -d venv ]; then
  python3 -m venv venv
fi

if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -f telegram.env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./telegram.env
  set +a
fi

./venv/bin/pip install -q -r requirements.txt
exec ./venv/bin/python main.py
