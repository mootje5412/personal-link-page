#!/usr/bin/env python3
"""
Accurate TikTok username checker.

Uses TikTok's signup validation API:
  GET https://www.tiktok.com/api/uniqueid/check/?aid=1233&unique_id=USERNAME

Requires a logged-in TikTok session cookie (sessionid).
Without it, TikTok returns empty responses and checks are unreliable.
"""

from __future__ import annotations

import json
import os
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from enum import Enum
from pathlib import Path
from typing import Iterable, List, Optional

import requests

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
]

CHECK_URL = "https://www.tiktok.com/api/uniqueid/check/"
PROFILE_URL = "https://www.tiktok.com/@{username}"

# TikTok signup validation status codes
STATUS_AVAILABLE = 0
STATUS_TAKEN = 3249
STATUS_INVALID_CHARS = 3250
STATUS_TOO_LONG = 3252
STATUS_NUMBERS_ONLY = 3254


class UsernameStatus(str, Enum):
    AVAILABLE = "available"
    TAKEN = "taken"
    UNAVAILABLE = "unavailable"  # reserved, banned, or blocked by TikTok
    INVALID = "invalid"
    ERROR = "error"


@dataclass
class CheckResult:
    username: str
    status: UsernameStatus
    status_code: Optional[int] = None
    message: str = ""


def load_session_id(config_path: str = "config.json") -> Optional[str]:
    env_value = os.environ.get("TIKTOK_SESSIONID", "").strip()
    if env_value:
        return env_value

    path = Path(config_path)
    if path.exists():
        data = json.loads(path.read_text(encoding="utf-8"))
        value = str(data.get("sessionid", "")).strip()
        if value:
            return value

    return None


def random_user_agent() -> str:
    return random.choice(USER_AGENTS)


def profile_is_taken(username: str, session: requests.Session) -> bool:
    response = session.get(
        PROFILE_URL.format(username=username),
        headers={"User-Agent": random_user_agent()},
        timeout=12,
    )
    match = re.search(
        r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">(.+?)</script>',
        response.text,
    )
    if not match:
        return False

    data = json.loads(match.group(1))
    detail = data.get("__DEFAULT_SCOPE__", {}).get("webapp.user-detail", {})
    user = (detail.get("userInfo") or {}).get("user") or {}
    unique_id = str(user.get("uniqueId", "")).lower()
    return bool(user.get("id")) and unique_id == username.lower()


def map_status_code(status_code: int) -> UsernameStatus:
    if status_code == STATUS_AVAILABLE:
        return UsernameStatus.AVAILABLE
    if status_code == STATUS_TAKEN:
        return UsernameStatus.TAKEN
    if status_code in (STATUS_INVALID_CHARS, STATUS_TOO_LONG, STATUS_NUMBERS_ONLY):
        return UsernameStatus.INVALID
    return UsernameStatus.UNAVAILABLE


class TikTokUsernameChecker:
    def __init__(self, sessionid: str, delay: float = 0.05):
        if not sessionid.strip():
            raise ValueError("TikTok sessionid is required for accurate checks.")

        self.delay = delay
        self.session = requests.Session()
        self.session.cookies.set("sessionid", sessionid.strip(), domain=".tiktok.com")
        self.session.headers.update(
            {
                "User-Agent": random_user_agent(),
                "Referer": "https://www.tiktok.com/signup",
                "Accept": "application/json, text/plain, */*",
            }
        )

    def check(self, username: str, retries: int = 3) -> CheckResult:
        username = username.strip().lstrip("@").lower()
        if not username:
            return CheckResult(username, UsernameStatus.INVALID, message="Empty username")

        params = {"aid": "1233", "unique_id": username}

        for attempt in range(retries):
            try:
                response = self.session.get(CHECK_URL, params=params, timeout=12)
                body = response.text.strip()

                if not body:
                    if attempt + 1 < retries:
                        time.sleep(0.4 * (attempt + 1))
                        continue
                    return CheckResult(
                        username,
                        UsernameStatus.ERROR,
                        message="Empty API response. Session may be expired.",
                    )

                payload = response.json()
                status_code = payload.get("status_code")
                if status_code is None:
                    return CheckResult(
                        username,
                        UsernameStatus.ERROR,
                        message=f"Unexpected API payload: {payload}",
                    )

                mapped = map_status_code(int(status_code))

                if mapped == UsernameStatus.AVAILABLE and profile_is_taken(username, self.session):
                    mapped = UsernameStatus.TAKEN

                time.sleep(self.delay)
                return CheckResult(
                    username=username,
                    status=mapped,
                    status_code=int(status_code),
                    message=payload.get("status_msg") or mapped.value,
                )
            except requests.RequestException as exc:
                if attempt + 1 < retries:
                    time.sleep(0.4 * (attempt + 1))
                    continue
                return CheckResult(username, UsernameStatus.ERROR, message=str(exc))

        return CheckResult(username, UsernameStatus.ERROR, message="Retries exhausted")

    def check_many(
        self,
        usernames: Iterable[str],
        workers: int = 10,
        on_result=None,
    ) -> List[CheckResult]:
        names = list(usernames)
        results: List[CheckResult] = []

        with ThreadPoolExecutor(max_workers=workers) as pool:
            futures = {pool.submit(self.check, name): name for name in names}
            for future in as_completed(futures):
                result = future.result()
                results.append(result)
                if on_result:
                    on_result(result)

        return results


def print_setup_help() -> None:
    print(
        """
TikTok session cookie required.

1. Log in to https://www.tiktok.com in your browser
2. Open DevTools -> Application/Storage -> Cookies -> tiktok.com
3. Copy the value of `sessionid`
4. Save it one of these ways:
   - export TIKTOK_SESSIONID='your_session_id'
   - create config.json: {"sessionid": "your_session_id"}

Then run:
  python tiktok_checker.py
  python tiktok_5letter_words.py 15
"""
    )


def main() -> None:
    sessionid = load_session_id()
    if not sessionid:
        print("Missing TikTok sessionid.")
        print_setup_help()
        sys.exit(1)

    username = input("Username to check: ").strip().lstrip("@")
    checker = TikTokUsernameChecker(sessionid)
    result = checker.check(username)
    print(json.dumps(result.__dict__, default=lambda x: x.value, indent=2))


if __name__ == "__main__":
    main()
