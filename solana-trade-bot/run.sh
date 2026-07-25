#!/bin/bash
set -e
cd "$(dirname "$0")"
pip install -r requirements.txt -q
python bot.py
