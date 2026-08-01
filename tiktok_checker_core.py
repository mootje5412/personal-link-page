#!/usr/bin/env python3
"""TikTok username checker using rotating user agents (no login required)."""

from __future__ import annotations

import json
import random
import re
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from enum import Enum
from typing import Iterable, List, Optional

import requests

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36 Edg/149.0.0.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:152.0) Gecko/20100101 Firefox/152.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.5 Safari/605.1.15",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Safari/537.36 OPR/131.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/30.0 Chrome/143.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Mobile Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:152.0) Gecko/20100101 Firefox/152.0",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 26_5_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/149.0.7827.137 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36 Edg/150.0.0.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36 OPR/132.0.0.0",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/148.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
    "TikTok 17.4.0 rv:174014 (iPhone; iOS 13.6.1; sv_SE) Cronet",
]

PROFILE_URL = "https://www.tiktok.com/@{username}"
OEMBED_URL = "https://www.tiktok.com/oembed"


class UsernameStatus(str, Enum):
    AVAILABLE = "available"
    TAKEN = "taken"
    ERROR = "error"


@dataclass
class CheckResult:
    username: str
    status: UsernameStatus
    message: str = ""


def random_user_agent() -> str:
    return random.choice(USER_AGENTS)


def profile_has_account(username: str, user_agent: str) -> bool:
    response = requests.get(
        PROFILE_URL.format(username=username),
        headers={
            "User-Agent": user_agent,
            "Accept-Language": "en-US,en;q=0.9",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
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


def oembed_has_account(username: str, user_agent: str) -> bool:
    response = requests.get(
        OEMBED_URL,
        params={"url": f"https://www.tiktok.com/@{username}"},
        headers={"User-Agent": user_agent},
        timeout=12,
    )
    return response.status_code == 200 and "author_name" in response.text


class TikTokUsernameChecker:
    """Checks usernames by rotating user agents against TikTok public endpoints."""

    def __init__(self, delay: float = 0.05):
        self.delay = delay

    def check(self, username: str, retries: int = 2) -> CheckResult:
        username = username.strip().lstrip("@").lower()
        if not username:
            return CheckResult(username, UsernameStatus.ERROR, "Empty username")

        for attempt in range(retries):
            user_agent = random_user_agent()
            try:
                if profile_has_account(username, user_agent):
                    time.sleep(self.delay)
                    return CheckResult(username, UsernameStatus.TAKEN, "Profile exists")

                # Second pass with a different user agent for oEmbed confirmation.
                user_agent = random_user_agent()
                if oembed_has_account(username, user_agent):
                    time.sleep(self.delay)
                    return CheckResult(username, UsernameStatus.TAKEN, "oEmbed profile exists")

                time.sleep(self.delay)
                return CheckResult(username, UsernameStatus.AVAILABLE, "No account found")
            except requests.RequestException as exc:
                if attempt + 1 < retries:
                    time.sleep(0.3)
                    continue
                return CheckResult(username, UsernameStatus.ERROR, str(exc))

        return CheckResult(username, UsernameStatus.ERROR, "Retries exhausted")

    def check_many(
        self,
        usernames: Iterable[str],
        workers: int = 12,
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
