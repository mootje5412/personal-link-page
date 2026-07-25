#!/usr/bin/env python3
"""Run the HexTLO Telegram bot."""

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def main() -> None:
    subprocess.run([sys.executable, str(ROOT / "main.py")], check=True)


if __name__ == "__main__":
    main()
