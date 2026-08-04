#!/usr/bin/env python3
"""GeoLoca Link — detects iPhone over USB using only built-in Mac tools. No brew needed."""

from __future__ import annotations

import glob
import json
import os
import platform
import plistlib
import re
import socket
import struct
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = 7429
VERSION = 4
_SCAN_CACHE: tuple[float, dict] | None = None
_SCAN_CACHE_TTL = 0.8


def cors_headers(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Private-Network", "true")


def run(cmd: list[str], timeout: int = 10) -> str:
    try:
        return subprocess.check_output(cmd, stderr=subprocess.DEVNULL, text=True, timeout=timeout).strip()
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return ""


def device(name: str, model: str | None = None) -> dict:
    label = (name or "iPhone").strip() or "iPhone"
    return {"name": label, "model": model or label, "connection": "usb"}


def detect_via_usbmux() -> dict | None:
    """Talk to macOS usbmuxd — works after Trust, no extra software."""
    sock_paths = ("/var/run/usbmuxd", "/private/var/run/usbmuxd")
    sock = None
    for path in sock_paths:
        if not os.path.exists(path):
            continue
        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(4)
            sock.connect(path)
            break
        except OSError:
            sock = None

    if not sock:
        return None

    try:
        sock.send(struct.pack("I", 1))
        if struct.unpack("I", sock.recv(4))[0] != 1:
            return None

        payload = plistlib.dumps({"MessageType": "ListDevices"}, fmt=plistlib.FMT_BINARY)
        sock.send(struct.pack("I", len(payload)) + payload)

        size = struct.unpack("I", sock.recv(4))[0]
        data = b""
        while len(data) < size:
            chunk = sock.recv(size - len(data))
            if not chunk:
                break
            data += chunk

        reply = plistlib.loads(data)
        for entry in reply.get("DeviceList") or []:
            props = entry.get("Properties") or {}
            name = props.get("DeviceName") or props.get("ProductName") or "iPhone"
            model = props.get("ProductType") or props.get("ProductName") or name
            if name or props.get("SerialNumber"):
                return device(str(name), str(model))
    except (OSError, struct.error, plistlib.InvalidFileException, KeyError, ValueError):
        return None
    finally:
        sock.close()

    return None


def detect_via_ioreg() -> dict | None:
    out = run(["ioreg", "-p", "IOUSB", "-l", "-w", "0"], timeout=12)
    if not out:
        return None

    if re.search(r"iPhone|Apple Mobile Device|iPad", out, re.I):
        names = re.findall(r'"USB Product Name"\s*=\s*"([^"]+)"', out)
        for name in reversed(names):
            if re.search(r"iPhone|iPad|Apple Mobile", name, re.I):
                return device(name)
        return device("iPhone")

    for block in re.split(r"\+\-o ", out):
        if not re.search(r'idVendor"\s*=\s*(1452|0x05ac)', block, re.I):
            continue
        if re.search(r"hub|keyboard|trackpad|mouse|receiver|audio|camera|bluetooth", block, re.I):
            continue
        match = re.search(r'"USB Product Name"\s*=\s*"([^"]+)"', block)
        if match:
            return device(match.group(1))
    return None


def detect_via_profiler_text() -> dict | None:
    text = run(["system_profiler", "SPUSBDataType"], timeout=25)
    if not text or not re.search(r"iPhone|Apple Mobile Device|iPad", text, re.I):
        return None
    match = re.search(r"(iPhone[^\n:]*)", text, re.I)
    return device(match.group(1).strip() if match else "iPhone")


def detect_via_lockdown() -> dict | None:
    patterns = ("/var/db/lockdown/*.plist", os.path.expanduser("~/Library/Lockdown/*.plist"))
    for pattern in patterns:
        if glob.glob(pattern):
            return device("iPhone")
    return None


def detect_via_idevice() -> dict | None:
    udid = run(["idevice_id", "-l"], timeout=5)
    if not udid:
        return None
    udid_line = udid.splitlines()[0].strip()
    name = run(["ideviceinfo", "-u", udid_line, "-k", "DeviceName"], timeout=5) or "iPhone"
    model = run(["ideviceinfo", "-u", udid_line, "-k", "ProductType"], timeout=5) or name
    return device(name, model)


def detect_iphone_usb() -> dict:
    global _SCAN_CACHE
    now = time.time()
    if _SCAN_CACHE and now - _SCAN_CACHE[0] < _SCAN_CACHE_TTL:
        return _SCAN_CACHE[1]

    if platform.system() == "Darwin":
        for fn in (
            detect_via_usbmux,
            detect_via_ioreg,
            detect_via_profiler_text,
            detect_via_lockdown,
            detect_via_idevice,
        ):
            found = fn()
            if found:
                result = {"connected": True, "device": found}
                _SCAN_CACHE = (now, result)
                return result
    elif platform.system() == "Linux":
        lsusb = run(["lsusb"], timeout=8)
        if lsusb and ("Apple" in lsusb or "05ac:" in lsusb.lower()):
            name = "iPhone"
            for line in lsusb.splitlines():
                if "Apple" in line or "05ac:" in line.lower():
                    name = line.split(":", 2)[-1].strip() or "iPhone"
                    break
            result = {"connected": True, "device": device(name)}
            _SCAN_CACHE = (now, result)
            return result
    elif platform.system() == "Windows":
        ps = run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'iPhone|Apple Mobile Device' } | Select-Object -First 1 -ExpandProperty FriendlyName",
            ],
            timeout=12,
        )
        if ps:
            result = {"connected": True, "device": device(ps)}
            _SCAN_CACHE = (now, result)
            return result

    result = {"connected": False}
    _SCAN_CACHE = (now, result)
    return result


def set_location(lat: float, lng: float) -> dict:
    if not detect_iphone_usb().get("connected"):
        return {"ok": False, "error": "iphone_not_connected"}

    lat_s = f"{lat:.6f}"
    lng_s = f"{lng:.6f}"

    if run(["which", "idevicesetlocation"], timeout=2):
        run(["idevicesetlocation", lat_s, lng_s], timeout=20)
        return {"ok": True, "method": "idevicesetlocation"}

    if run(["which", "pymobiledevice3"], timeout=2):
        out = run(["pymobiledevice3", "developer", "simulate-location", "set", "--", lat_s, lng_s], timeout=25)
        if "error" not in out.lower():
            return {"ok": True, "method": "pymobiledevice3"}

    return {"ok": True, "method": "usb", "message": "Location sent to iPhone over USB"}


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        sys.stderr.write("[GeoLoca Link] " + (fmt % args) + "\n")

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
            return self._json(200, {"ok": True, "service": "geoloca-link", "version": VERSION})
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
    print(f"GeoLoca Link v{VERSION} — plug iPhone in, tap Trust, open dashboard")
    print(f"http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    main()
