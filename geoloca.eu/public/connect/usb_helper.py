#!/usr/bin/env python3
"""GeoLoca Link — runs on YOUR computer while using the dashboard."""

from __future__ import annotations

import json
import platform
import re
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = 7429
VERSION = 3
_SCAN_CACHE: tuple[float, dict] | None = None
_SCAN_CACHE_TTL = 1.5


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
    label = name.strip() or "iPhone"
    return {"name": label, "model": model or label, "connection": "usb"}


def detect_via_idevice() -> dict | None:
    udid = run(["idevice_id", "-l"], timeout=8)
    if not udid:
        return None
    udid_line = udid.splitlines()[0].strip()
    name = run(["ideviceinfo", "-u", udid_line, "-k", "DeviceName"], timeout=8) or "iPhone"
    model = run(["ideviceinfo", "-u", udid_line, "-k", "ProductType"], timeout=8) or name
    return device(name, model)


def walk_profiler(node) -> dict | None:
    if isinstance(node, list):
        for item in node:
            found = walk_profiler(item)
            if found:
                return found
        return None
    if not isinstance(node, dict):
        return None

    name = str(node.get("_name") or node.get("name") or "")
    vendor = str(node.get("vendor_id") or node.get("usb_vendor_id") or node.get("manufacturer") or "")
    serial = str(node.get("serial_num") or node.get("serial_number") or "")

    if re.search(r"iPhone|iPad|Apple Mobile Device", name, re.I):
        return device(name, node.get("model") or name)
    if vendor.lower() in ("0x05ac", "apple", "1452") and re.search(r"mobile|iphone|ipad", name, re.I):
        return device(name or "iPhone", node.get("model") or name)
    if serial and re.search(r"iPhone|iPad", name, re.I):
        return device(name, node.get("model") or name)

    for key in ("_items", "items", "_children", "children"):
        found = walk_profiler(node.get(key))
        if found:
            return found
    return None


def detect_via_system_profiler() -> dict | None:
    for datatype in ("SPUSBDataType", "SPThunderboltDataType"):
        raw = run(["system_profiler", datatype, "-json"], timeout=35)
        if raw:
            try:
                payload = json.loads(raw)
            except json.JSONDecodeError:
                payload = None
            if payload is not None:
                root = payload.get(datatype) if isinstance(payload, dict) else payload
                found = walk_profiler(root)
                if found:
                    return found

        text = run(["system_profiler", datatype], timeout=35)
        if text and re.search(r"iPhone|Apple Mobile Device", text, re.I):
            match = re.search(r"(iPhone[^\n:]*)", text, re.I)
            label = match.group(1).strip() if match else "iPhone"
            return device(label, "iPhone")
    return None


def detect_via_ioreg() -> dict | None:
    commands = (
        ["ioreg", "-p", "IOUSB", "-l", "-w", "0"],
        ["ioreg", "-r", "-c", "AppleUSBHostDevice", "-l", "-w", "0"],
        ["ioreg", "-r", "-c", "IOUSBHostDevice", "-l", "-w", "0"],
    )
    for cmd in commands:
        out = run(cmd, timeout=20)
        if not out:
            continue

        if re.search(r"iPhone|Apple Mobile Device|iPad", out, re.I):
            names = re.findall(r'"USB Product Name"\s*=\s*"([^"]+)"', out)
            for name in reversed(names):
                if re.search(r"iPhone|iPad|Apple Mobile", name, re.I):
                    return device(name)
            return device("iPhone")

        blocks = re.split(r"\+\-o ", out)
        for block in blocks:
            if not re.search(r'idVendor"\s*=\s*(1452|0x05ac)|idVendor" = 1452', block, re.I):
                continue
            if re.search(r"hub|keyboard|trackpad|mouse|receiver|audio|camera|bluetooth", block, re.I):
                continue
            match = re.search(r'"USB Product Name"\s*=\s*"([^"]+)"', block)
            if match:
                return device(match.group(1))
    return None


def detect_via_xcode_tools() -> dict | None:
    for cmd in (
        ["xcrun", "xctrace", "list", "devices"],
        ["xcrun", "simctl", "list", "devices", "available"],
        ["instruments", "-s", "devices"],
    ):
        out = run(cmd, timeout=15)
        if not out:
            continue
        for line in out.splitlines():
            if re.search(r"Simulator|\(null\)", line, re.I):
                continue
            if re.search(r"iPhone|iPad", line, re.I):
                name = line.split("(")[0].strip(" *") or "iPhone"
                if re.search(r"iPhone|iPad", name, re.I):
                    return device(name)
    return None


def mac_hints() -> list[str]:
    hints = [
        "Unlock iPhone and tap Trust This Computer when prompted",
        "Use a USB data cable (charge-only cables won't work)",
        "Unplug and replug the cable after tapping Trust",
    ]
    if not run(["which", "idevice_id"], timeout=3):
        hints.append("Install iPhone tools: brew install libimobiledevice")
    return hints


def detect_iphone_usb() -> dict:
    global _SCAN_CACHE
    now = time.time()
    if _SCAN_CACHE and now - _SCAN_CACHE[0] < _SCAN_CACHE_TTL:
        return _SCAN_CACHE[1]

    checks: list[tuple[str, dict | None]] = []

    idevice = detect_via_idevice()
    checks.append(("idevice", idevice))
    if idevice:
        result = {"connected": True, "device": idevice, "method": "idevice"}
        _SCAN_CACHE = (now, result)
        return result

    if platform.system() == "Darwin":
        for name, fn in (
            ("ioreg", detect_via_ioreg),
            ("xcode", detect_via_xcode_tools),
            ("system_profiler", detect_via_system_profiler),
        ):
            found = fn()
            checks.append((name, found))
            if found:
                result = {"connected": True, "device": found, "method": name}
                _SCAN_CACHE = (now, result)
                return result

    if platform.system() == "Linux":
        lsusb = run(["lsusb"], timeout=8)
        if lsusb and ("Apple" in lsusb or "05ac:" in lsusb.lower()):
            name = "iPhone"
            for line in lsusb.splitlines():
                if "Apple" in line or "05ac:" in line.lower():
                    name = line.split(":", 2)[-1].strip() or "iPhone"
                    break
            result = {"connected": True, "device": device(name), "method": "lsusb"}
            _SCAN_CACHE = (now, result)
            return result

    if platform.system() == "Windows":
        ps = run(
            [
                "powershell",
                "-NoProfile",
                "-Command",
                "Get-PnpDevice -PresentOnly | Where-Object { $_.FriendlyName -match 'iPhone|Apple Mobile Device' } | Select-Object -First 1 -ExpandProperty FriendlyName",
            ],
            timeout=15,
        )
        if ps:
            result = {"connected": True, "device": device(ps), "method": "pnp"}
            _SCAN_CACHE = (now, result)
            return result

    payload = {"connected": False, "hints": mac_hints() if platform.system() == "Darwin" else []}
    _SCAN_CACHE = (now, payload)
    return payload


def set_location(lat: float, lng: float) -> dict:
    lat_s = f"{lat:.6f}"
    lng_s = f"{lng:.6f}"

    if run(["which", "idevicesetlocation"], timeout=3):
        out = run(["idevicesetlocation", lat_s, lng_s], timeout=20)
        if out.lower().find("error") == -1:
            return {"ok": True, "method": "idevicesetlocation"}

    if run(["which", "pymobiledevice3"], timeout=3):
        out = run(["pymobiledevice3", "developer", "simulate-location", "set", "--", lat_s, lng_s], timeout=25)
        if "error" not in out.lower():
            return {"ok": True, "method": "pymobiledevice3"}

    if not detect_iphone_usb().get("connected"):
        return {"ok": False, "error": "iphone_not_connected", "hints": mac_hints()}

    return {
        "ok": False,
        "error": "tools_missing",
        "message": "iPhone detected — run: brew install libimobiledevice",
        "hints": mac_hints(),
    }


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
    print(f"GeoLoca Link v{VERSION} running on http://127.0.0.1:{PORT}")
    print("Plug in iPhone via USB, unlock it, tap Trust, then click Connect iPhone in the dashboard.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    main()
