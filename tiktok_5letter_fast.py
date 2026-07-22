#!/usr/bin/env python3
"""Fast meaningful 5-letter TikTok username scanner."""

import sys
import time
from pathlib import Path

from tiktok_checker_core import (
    TikTokUsernameChecker,
    UsernameStatus,
    load_session_id,
    print_setup_help,
)
from tiktok_5letter_words import MEANINGFUL_5_LETTER_WORDS


def main() -> None:
    sessionid = load_session_id()
    if not sessionid:
        print("Missing TikTok sessionid.")
        print_setup_help()
        sys.exit(1)

    workers = 12
    if len(sys.argv) > 1:
        try:
            workers = max(1, int(sys.argv[1]))
        except ValueError:
            pass

    words = sorted({w.lower() for w in MEANINGFUL_5_LETTER_WORDS if len(w) == 5 and w.isalpha()})
    checker = TikTokUsernameChecker(sessionid, delay=0.03)

    available = []
    taken = []
    unavailable = []
    errors = []
    checked = 0
    total = len(words)

    print(f"Checking {total} meaningful 5-letter usernames with {workers} workers...\n")

    def handle(result):
        nonlocal checked
        checked += 1
        if result.status == UsernameStatus.AVAILABLE:
            available.append(result.username)
            print(f"AVAILABLE @{result.username}")
        elif checked % 50 == 0:
            print(f"[{checked}/{total}] available={len(available)} taken={len(taken)}")

    start = time.time()
    results = checker.check_many(words, workers=workers, on_result=handle)
    elapsed = time.time() - start

    for result in results:
        if result.status == UsernameStatus.TAKEN:
            taken.append(result.username)
        elif result.status == UsernameStatus.UNAVAILABLE:
            unavailable.append(result.username)
        elif result.status == UsernameStatus.ERROR:
            errors.append(result)

    print("\n" + "=" * 60)
    print(f"Done in {elapsed:.1f}s")
    print(f"Available: {len(available)}")
    print(f"Taken: {len(taken)}")
    print(f"Unavailable/reserved: {len(unavailable)}")
    print(f"Errors: {len(errors)}")
    print("=" * 60)

    if available:
        print("\nREGISTERABLE USERNAMES:")
        for name in sorted(available):
            print(f"@{name}")

        Path("available_5letter_meaningful.txt").write_text(
            "\n".join(f"@{name}" for name in sorted(available)) + "\n",
            encoding="utf-8",
        )
        print("\nSaved to available_5letter_meaningful.txt")
    else:
        print("\nNo registerable usernames found.")

    if errors:
        print("\nSome checks failed. If many errors appear, refresh your sessionid.")


if __name__ == "__main__":
    main()
