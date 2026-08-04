#!/usr/bin/env python3
"""GeoLoca Link — finds iPhone on USB using built-in Mac services only."""

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
VERSION = 9
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
    last_out = ""
    for args in (
        [sys.executable, "-m", "pip", "install", "--user", "--upgrade", "pymobiledevice3"],
        [sys.executable, "-m", "pip", "install", "--user", "--upgrade", "--break-system-packages", "pymobiledevice3"],
    ):
        code, out = run_cmd(args, timeout=300)
        last_out = out
        if code == 0 and run_cmd(pmd3_cmd("--help"), timeout=20)[0] == 0:
            _TOOLS_READY = True
            sys.stderr.write("[GeoLoca Link] Location tools ready\n")
            return True, ""

    return False, last_out or "Could not install location tools"


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


def pmd3_ready() -> bool:
    return run_cmd(pmd3_cmd("--help"), timeout=15)[0] == 0


def get_ios_version() -> tuple[int, int] | None:
    code, out = run_cmd(pmd3_cmd("lockdown", "info"), timeout=25)
    if code != 0:
        out = run(["ideviceinfo", "-k", "ProductVersion"], timeout=8)
    if not out:
        return None
    match = re.search(r"(\d+)\.(\d+)", out)
    if not match:
        return None
    return int(match.group(1)), int(match.group(2))


def mount_developer_image() -> tuple[bool, str]:
    if not pmd3_ready():
        return False, "Location tools not installed"

    for cmd in (pmd3_cmd("mounter", "auto-mount"), pmd3_cmd("mounter", "auto")):
        code, out = run_cmd(cmd, timeout=120)
        lower = out.lower()
        if code == 0 or "already mounted" in lower:
            return True, out

    return False, out


def read_simulated_coords(ios_major: int | None) -> tuple[float, float] | None:
    if ios_major is not None and ios_major >= 17:
        return None
    code, out = run_cmd(pmd3_cmd("developer", "simulate-location", "get"), timeout=20)
    if code != 0 or not out:
        return None
    nums = re.findall(r"-?\d+\.\d+", out)
    if len(nums) >= 2:
        lat, lng = float(nums[0]), float(nums[1])
        if abs(lat) <= 90 and abs(lng) <= 180:
            return lat, lng
    return None


def coords_match(want_lat: float, want_lng: float, got_lat: float, got_lng: float) -> bool:
    return abs(want_lat - got_lat) < 0.02 and abs(want_lng - got_lng) < 0.02


def developer_mode_hint(text: str) -> bool:
    lower = text.lower()
    return any(
        k in lower
        for k in (
            "developer mode",
            "developer disk",
            "development",
            "pairing dialog",
            "invalid lockdown service",
            "cryptex",
            "developerdiskimage",
        )
    )


def developer_mode_status() -> dict:
    ios = get_ios_version()
    if ios and ios[0] < 16:
        return {"required": False, "enabled": True, "ios": f"{ios[0]}.{ios[1]}", "message": "Developer Mode not needed on your iOS version"}

    if not pmd3_ready():
        return {"required": True, "enabled": None, "message": "Connect GeoLoca Link first"}

    code, out = run_cmd(pmd3_cmd("mounter", "query-developer-mode-status"), timeout=25)
    enabled = code == 0 and "enabled" in out.lower() and "disabled" not in out.lower()
    if code == 0 and "disabled" in out.lower():
        enabled = False

    ios_label = f"{ios[0]}.{ios[1]}" if ios else "unknown"
    if enabled:
        return {"required": True, "enabled": True, "ios": ios_label, "message": "Developer Mode is ON — ready to change GPS"}

    if ios and ios[0] >= 17:
        msg = (
            "Developer Mode is hidden until you open Xcode once (free from App Store), "
            "plug in your iPhone, and accept the prompt. Then it appears under "
            "Settings → Privacy & Security → Developer Mode."
        )
    else:
        msg = "Developer Mode is OFF — tap Enable via USB below (iPhone will restart)"

    return {"required": True, "enabled": False, "ios": ios_label, "message": msg, "raw": out}


def enable_developer_mode() -> dict:
    ios = get_ios_version()
    if ios and ios[0] < 16:
        return {"ok": True, "message": "Your iPhone does not need Developer Mode"}

    if not pmd3_ready():
        return {"ok": False, "message": "Start GeoLoca Link in Terminal first"}

    status = developer_mode_status()
    if status.get("enabled"):
        return {"ok": True, "message": "Developer Mode is already on"}

    if ios and ios[0] >= 17:
        return {
            "ok": False,
            "needs_xcode": True,
            "message": (
                "On iOS 17+, Apple requires Xcode once: install Xcode from App Store (free), "
                "open it, plug in iPhone via USB — Xcode will ask to enable Developer Mode. "
                "After that it shows in Settings → Privacy & Security."
            ),
        }

    code, out = run_cmd(pmd3_cmd("amfi", "enable-developer-mode"), timeout=90)
    if code == 0:
        return {
            "ok": True,
            "message": "iPhone is restarting. After reboot: Settings → Privacy & Security → Developer Mode → ON",
        }

    lower = out.lower()
    if "passcode" in lower:
        return {
            "ok": False,
            "message": "Remove iPhone passcode temporarily, try again, then turn passcode back on after Developer Mode is enabled",
        }

    return {"ok": False, "message": out or "Could not enable — open Xcode on your Mac and plug in iPhone once"}


def set_via_pymobiledevice3(lat: float, lng: float, lat_s: str, lng_s: str) -> tuple[bool, str]:
    if not pmd3_ready():
        return False, "Location tools missing"

    code, list_out = run_cmd(pmd3_cmd("usbmux", "list"), timeout=20)
    if code != 0 or not list_out.strip():
        return False, "iPhone not paired — unlock, tap Trust, replug USB"

    ios = get_ios_version()
    ios_major = ios[0] if ios else 17
    use_dvt = ios_major >= 17

    if ios_major >= 16:
        dm = developer_mode_status()
        if dm.get("required") and dm.get("enabled") is False:
            return False, dm.get("message") or "Developer Mode must be ON to change iPhone GPS"

    ok, mount_out = mount_developer_image()
    if not ok:
        if developer_mode_hint(mount_out):
            return False, mount_out
        sys.stderr.write(f"[GeoLoca Link] Mount note: {mount_out}\n")

    if use_dvt:
        attempts = (
            pmd3_cmd("developer", "dvt", "simulate-location", "set", "--", lat_s, lng_s),
            pmd3_cmd("developer", "dvt", "simulate-location", "set", "--", lat_s, lng_s, "--userspace"),
        )
    else:
        attempts = (
            pmd3_cmd("developer", "simulate-location", "set", "--", lat_s, lng_s),
            pmd3_cmd("developer", "simulate-location", "set", lat_s, lng_s),
        )

    last = mount_out
    for cmd in attempts:
        code, out = run_cmd(cmd, timeout=90)
        last = out or last
        if code != 0:
            continue

        got = read_simulated_coords(ios_major)
        if got and coords_match(lat, lng, got[0], got[1]):
            return True, f"GPS set to {got[0]:.4f}, {got[1]:.4f}"

        return True, "iPhone GPS updated — open Apple Maps to confirm"

    return False, last or "Could not override iPhone GPS"


def prepare_location() -> dict:
    ready, msg = ensure_location_tools()
    if not ready:
        return {"ok": False, "message": msg}
    if not detect_iphone_usb().get("connected"):
        return {"ok": True, "message": "Tools ready — plug in iPhone"}

    ios = get_ios_version()
    ok, mount_msg = mount_developer_image()
    if not ok and developer_mode_hint(mount_msg):
        return {
            "ok": False,
            "error": "developer_mode",
            "message": "Turn on Developer Mode: iPhone Settings → Privacy & Security → Developer Mode → ON, restart iPhone",
        }

    ios_label = f"iOS {ios[0]}.{ios[1]}" if ios else "iOS"
    return {"ok": True, "message": f"Ready ({ios_label}) — Developer Mode must be ON"}


def set_location(lat: float, lng: float) -> dict:
    if not detect_iphone_usb().get("connected"):
        return {"ok": False, "error": "iphone_not_connected", "message": "iPhone not found on USB"}

    ready, tool_err = ensure_location_tools()
    if not ready:
        return {"ok": False, "error": "tools_failed", "message": tool_err}

    lat_s = f"{lat:.6f}"
    lng_s = f"{lng:.6f}"
    ios = get_ios_version()
    ios_major = ios[0] if ios else 17

    if ios_major < 17:
        idevice = which("idevicesetlocation")
        if idevice:
            code, out = run_cmd([idevice, lat_s, lng_s], timeout=35)
            if code == 0:
                got = read_simulated_coords(ios_major)
                if got and coords_match(lat, lng, got[0], got[1]):
                    return {"ok": True, "method": "idevicesetlocation", "message": "iPhone GPS updated"}

    success, detail = set_via_pymobiledevice3(lat, lng, lat_s, lng_s)
    if success:
        return {
            "ok": True,
            "method": "pymobiledevice3-dvt" if ios_major >= 17 else "pymobiledevice3",
            "message": detail,
        }

    if developer_mode_hint(detail):
        return {
            "ok": False,
            "error": "developer_mode",
            "message": "On iPhone: Settings → Privacy & Security → Developer Mode → ON, restart iPhone, replug USB",
        }

    return {"ok": False, "error": "location_failed", "message": detail or "Could not change iPhone GPS"}


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
            return self._json(200, prepare_location())
        if path in ("/developer/status", "/api/developer/status"):
            return self._json(200, developer_mode_status())
        return self._json(404, {"error": "not_found"})

    def do_POST(self):
        path = urlparse(self.path).path
        if path in ("/developer/enable", "/api/developer/enable"):
            return self._json(200, enable_developer_mode())
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
