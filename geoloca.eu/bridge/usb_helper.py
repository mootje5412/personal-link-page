#!/usr/bin/env python3
"""GeoLoca Link — finds iPhone on USB using built-in Mac services only."""

from __future__ import annotations

import glob
import json
import os
import platform
import plistlib
import re
import shutil
import socket
import struct
import subprocess
import sys
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse

PORT = 7429
VERSION = 6
_SCAN_CACHE: tuple[float, dict] | None = None
_SCAN_CACHE_TTL = 0.5
_TOOLS_READY = False


def run(cmd: list[str], timeout: int = 10) -> str:
    code, out = run_cmd(cmd, timeout=timeout)
    return out if code == 0 else ""


def run_cmd(cmd: list[str], timeout: int = 30) -> tuple[int, str]:
    try:
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env={**os.environ, "PATH": _extended_path()},
        )
        out = (proc.stdout or "") + (proc.stderr or "")
        return proc.returncode, out.strip()
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError) as exc:
        return 1, str(exc)


def _extended_path() -> str:
    extra = [
        os.path.expanduser("~/.local/bin"),
        "/opt/homebrew/bin",
        "/usr/local/bin",
    ]
    current = os.environ.get("PATH", "")
    return os.pathsep.join(extra + [current])


def pmd3_cmd(*args: str) -> list[str]:
    return [sys.executable, "-m", "pymobiledevice3", *args]


def which(cmd: str) -> str | None:
    for folder in _extended_path().split(os.pathsep):
        path = os.path.join(folder, cmd)
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return None


def ensure_location_tools() -> tuple[bool, str]:
    global _TOOLS_READY
    if _TOOLS_READY:
        return True, ""

    if which("idevicesetlocation"):
        _TOOLS_READY = True
        return True, ""

    code, _ = run_cmd(pmd3_cmd("--help"), timeout=15)
    if code == 0:
        _TOOLS_READY = True
        return True, ""

    sys.stderr.write("[GeoLoca Link] Installing location tools (one time)…\n")
    code, out = run_cmd(
        [sys.executable, "-m", "pip", "install", "--user", "pymobiledevice3"],
        timeout=240,
    )
    if code != 0:
        return False, out or "Could not install location tools"

    code, _ = run_cmd(pmd3_cmd("--help"), timeout=20)
    if code != 0:
        return False, "Location tools installed but not working — restart GeoLoca Link"

    _TOOLS_READY = True
    sys.stderr.write("[GeoLoca Link] Location tools ready\n")
    return True, ""


def cors_headers(handler: BaseHTTPRequestHandler) -> None:
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    handler.send_header("Access-Control-Allow-Headers", "Content-Type")
    handler.send_header("Access-Control-Allow-Private-Network", "true")


def device(name: str, model: str | None = None) -> dict:
    label = (name or "iPhone").strip() or "iPhone"
    return {"name": label, "model": model or label, "connection": "usb"}


def _usbmux_exchange(message: dict) -> dict | None:
    for path in ("/var/run/usbmuxd", "/private/var/run/usbmuxd"):
        if not os.path.exists(path):
            continue
        sock = None
        try:
            sock = socket.socket(socket.AF_UNIX, socket.SOCK_STREAM)
            sock.settimeout(5)
            sock.connect(path)
            sock.send(struct.pack("I", 1))
            if struct.unpack("I", sock.recv(4))[0] != 1:
                continue

            for fmt in (plistlib.FMT_BINARY, plistlib.FMT_XML):
                payload = plistlib.dumps(message, fmt=fmt)
                sock.send(struct.pack("I", len(payload)) + payload)
                size_data = sock.recv(4)
                if len(size_data) < 4:
                    continue
                size = struct.unpack("I", size_data)[0]
                data = b""
                while len(data) < size:
                    chunk = sock.recv(size - len(data))
                    if not chunk:
                        break
                    data += chunk
                if not data:
                    continue
                try:
                    return plistlib.loads(data)
                except plistlib.InvalidFileException:
                    continue
        except OSError:
            pass
        finally:
            if sock:
                sock.close()
    return None


def detect_via_usbmux() -> dict | None:
    reply = _usbmux_exchange({"MessageType": "ListDevices"})
    if not reply:
        return None

    for entry in reply.get("DeviceList") or []:
        props = entry.get("Properties") or {}
        conn_type = str(props.get("ConnectionType") or "USB").upper()
        if conn_type not in ("USB", "WIRED", ""):
            continue

        name = props.get("DeviceName") or props.get("ProductName")
        model = props.get("ProductType") or props.get("ProductName") or name
        serial = props.get("SerialNumber") or props.get("UniqueDeviceID")

        if name:
            return device(str(name), str(model or name))
        if serial and str(serial).startswith("0000"):
            return device("iPhone", "iPhone")

    return None


def detect_via_ioreg() -> dict | None:
    commands = (
        ["ioreg", "-p", "IOUSB", "-l", "-w", "0"],
        ["ioreg", "-r", "-c", "IOUSBHostDevice", "-l", "-w", "0"],
        ["ioreg", "-r", "-c", "AppleUSBHostDevice", "-l", "-w", "0"],
    )
    patterns = (
        r"iPhone",
        r"Apple Mobile Device",
        r"iPad",
        r"Apple.?Phone",
    )

    for cmd in commands:
        out = run(cmd, timeout=15)
        if not out:
            continue

        if any(re.search(p, out, re.I) for p in patterns):
            names = re.findall(r'"(?:USB Product Name|kUSBProductString)"\s*=\s*"([^"]+)"', out)
            for name in reversed(names):
                if re.search(r"iPhone|iPad|Apple Mobile|Phone", name, re.I):
                    return device(name)
            return device("iPhone")

        for block in re.split(r"\+\-o ", out):
            if not re.search(r'idVendor"\s*=\s*(1452|0x05ac)|"idVendor"\s*=\s*1452', block, re.I):
                continue
            if re.search(r"hub|keyboard|trackpad|mouse|receiver|audio|camera|bluetooth|ethernet", block, re.I):
                continue
            match = re.search(r'"(?:USB Product Name|kUSBProductString)"\s*=\s*"([^"]+)"', block)
            if match and not re.search(r"hub|bridge", match.group(1), re.I):
                return device(match.group(1))

    return None


def detect_via_profiler_text() -> dict | None:
    for datatype in ("SPUSBDataType", "SPThunderboltDataType"):
        text = run(["system_profiler", datatype], timeout=30)
        if not text:
            continue
        if re.search(r"iPhone|Apple Mobile Device|iPad", text, re.I):
            match = re.search(r"((?:iPhone|iPad)[^\n:]*)", text, re.I)
            label = match.group(1).strip() if match else "iPhone"
            return device(label, "iPhone")
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
        for fn in (detect_via_ioreg, detect_via_usbmux, detect_via_profiler_text, detect_via_idevice):
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

    ready, tool_err = ensure_location_tools()
    if not ready:
        return {"ok": False, "error": "tools_failed", "message": tool_err}

    lat_s = f"{lat:.6f}"
    lng_s = f"{lng:.6f}"

    if which("idevicesetlocation"):
        code, out = run_cmd(["idevicesetlocation", lat_s, lng_s], timeout=25)
        if code == 0:
            return {"ok": True, "method": "idevicesetlocation"}

    run_cmd(pmd3_cmd("mounter", "auto"), timeout=90)

    code, out = run_cmd(pmd3_cmd("developer", "simulate-location", "set", "--", lat_s, lng_s), timeout=40)
    if code == 0:
        return {"ok": True, "method": "pymobiledevice3"}

    detail = out.strip() or "Could not change iPhone GPS"
    lower = detail.lower()
    if "developer mode" in lower or "developer disk" in lower or "development" in lower:
        return {
            "ok": False,
            "error": "developer_mode",
            "message": "On iPhone: Settings → Privacy & Security → Developer Mode → ON, then restart iPhone",
        }

    return {"ok": False, "error": "location_failed", "message": detail}


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
        if path in ("/tools/prepare", "/api/tools/prepare"):
            ready, msg = ensure_location_tools()
            return self._json(200, {"ok": ready, "message": msg})
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
    print(f"GeoLoca Link v{VERSION} running — keep this open, plug iPhone in, tap Trust")
    print(f"http://127.0.0.1:{PORT}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("Stopped.")


if __name__ == "__main__":
    main()
