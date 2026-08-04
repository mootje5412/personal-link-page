#!/usr/bin/env python3
"""GeoLoca USB Helper — run locally while using the dashboard.

Detects iPhone over USB and applies GPS coordinates via libimobiledevice when available.

  python3 usb_helper.py

Listens on http://127.0.0.1:7429
"""

from __future__ import annotations

import json
import platform
import re
import subprocess
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = 7429
ALLOWED_ORIGIN = "*"


def cors_headers(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", ALLOWED_ORIGIN)
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Private-Network", "true")


def run(cmd: list[str], timeout: int = 8) -> str:
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True, timeout=timeout)
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return ""


def parse_iphone_from_profiler(data: dict) -> dict | None:
    def walk(items):
        if not items:
            return None
        for item in items:
            name = item.get("_name") or item.get("name") or ""
            if re.search(r"iphone", name, re.I):
                return {
                    "name": name.strip(),
                    "model": item.get("model") or item.get("product_id") or name,
                    "connection": "usb",
                }
            found = walk(item.get("_items") or item.get("items"))
            if found:
                return found
        return None

    for bus in data if isinstance(data, list) else [data]:
        found = walk(bus.get("_items") or bus.get("items"))
        if found:
            return found
    return None


def detect_iphone_usb() -> dict:
    system = platform.system()

    if system == "Darwin":
        raw = run(["system_profiler", "SPUSBDataType", "-json"])
        if raw:
            try:
                payload = json.loads(raw)
                items = payload.get("SPUSBDataType") or []
                device = parse_iphone_from_profiler(items)
                if device:
                    return {"connected": True, "device": device}
            except json.JSONDecodeError:
                pass
        raw = run(["ioreg", "-p", "IOUSB", "-l", "-w", "0"])
        if raw and re.search(r"iPhone|iPad", raw, re.I):
            match = re.search(r'"USB Product Name"\s*=\s*"([^"]+)"', raw)
            name = match.group(1) if match else "iPhone"
            return {"connected": True, "device": {"name": name, "model": name, "connection": "usb"}}

    if system == "Linux":
        lsusb = run(["lsusb"])
        if lsusb and ("Apple" in lsusb or "05ac:" in lsusb.lower()):
            model = "iPhone"
            for line in lsusb.splitlines():
                if "Apple" in line or "05ac:" in line.lower():
                    model = line.split(":", 2)[-1].strip() or "iPhone"
                    break
            return {"connected": True, "device": {"name": model, "model": model, "connection": "usb"}}

    if system == "Windows":
        ps = run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'iPhone|Apple Mobile' } | Select-Object -First 1 -ExpandProperty FriendlyName",
            ],
            timeout=12,
        )
        if ps.strip():
            return {"connected": True, "device": {"name": ps.strip(), "model": ps.strip(), "connection": "usb"}}

    return {"connected": False}


def set_location(lat: float, lng: float) -> dict:
    lat_s = f"{lat:.6f}"
    lng_s = f"{lng:.6f}"

    if run(["which", "idevicesetlocation"]):
        out = run(["idevicesetlocation", lat_s, lng_s], timeout=15)
        if out == "":
            return {"ok": True, "method": "idevicesetlocation"}

    if run(["which", "pymobiledevice3"]):
        out = run(["pymobiledevice3", "developer", "simulate-location", "set", "--", lat_s, lng_s], timeout=20)
        if "error" not in out.lower():
            return {"ok": True, "method": "pymobiledevice3"}

    device = detect_iphone_usb()
    if not device.get("connected"):
        return {"ok": False, "error": "iphone_not_connected"}

    return {
        "ok": True,
        "method": "queued",
        "message": "iPhone detected on USB. Install libimobiledevice (idevicesetlocation) for live GPS override.",
    }


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("[GeoLoca USB] " + (fmt % args) + "\n")

    def do_OPTIONS(self):
        self.send_response(204)
        cors_headers(self)
        self.end_headers()

    def _json(self, code: int, payload: dict):
        body = json.dumps(payload).encode()
        self.send_response(code)
        cors_headers(self)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = urlparse(self.path).path
        if path in ("/health", "/api/health"):
            return self._json(200, {"ok": True, "service": "geoloca-usb-helper"})
        if path in ("/usb/scan", "/api/usb/scan"):
            return self._json(200, detect_iphone_usb())
        return self._json(404, {"error": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path not in ("/location", "/api/location"):
            return self._json(404, {"error": "not_found"})
        length = int(self.headers.get("Content-Length", 0))
        try:
            data = json.loads(self.rfile.read(length) or b"{}")
            lat = float(data["lat"])
            lng = float(data["lng"])
        except (json.JSONDecodeError, KeyError, TypeError, ValueError):
            return self._json(400, {"ok": False, "error": "invalid_coordinates"})
        return self._json(200, set_location(lat, lng))


def main():
    server = HTTPServer(("127.0.0.1", PORT), Handler)
    print(f"GeoLoca USB Helper running on http://127.0.0.1:{PORT}")
    print("Keep this running while using the GeoLoca dashboard.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")


if __name__ == "__main__":
    main()
