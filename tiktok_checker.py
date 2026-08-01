#!/usr/bin/env python3
"""TikTok username checker CLI (user agents only)."""

import itertools
import json
import string
import sys

from tiktok_checker_core import TikTokUsernameChecker, UsernameStatus


def generate_letter_combos(length: int):
    chars = string.ascii_lowercase
    return (''.join(combo) for combo in itertools.product(chars, repeat=length))


def save_results(filename: str, usernames):
    with open(filename, 'w', encoding='utf-8') as handle:
        for name in sorted(usernames):
            handle.write(f"@{name}\n")


def scan_list(checker: TikTokUsernameChecker, usernames, workers: int, output_file: str):
    available = []

    def on_result(result):
        if result.status == UsernameStatus.AVAILABLE:
            available.append(result.username)
            print(f"AVAILABLE @{result.username}")
        elif result.status == UsernameStatus.TAKEN:
            pass
        elif result.status == UsernameStatus.ERROR:
            print(f"error @{result.username}: {result.message}")

    checker.check_many(usernames, workers=workers, on_result=on_result)
    save_results(output_file, available)
    print(f"\nSaved {len(available)} available usernames to {output_file}")


def main():
    print("TikTok Username Checker")
    print("1. Check 3-letter usernames")
    print("2. Check 4-letter usernames")
    print("3. Check 5-letter meaningful words")
    print("4. Check one username")
    print("5. Check custom list file")

    choice = input("Select option (1-5): ").strip()
    workers = int(input("Workers (recommended 10-15): ").strip() or "12")
    checker = TikTokUsernameChecker()

    if choice == "1":
        scan_list(checker, list(generate_letter_combos(3)), workers, "available_3letter.txt")
    elif choice == "2":
        scan_list(checker, list(generate_letter_combos(4)), workers, "available_4letter.txt")
    elif choice == "3":
        from tiktok_5letter_words import MEANINGFUL_5_LETTER_WORDS

        words = sorted({w.lower() for w in MEANINGFUL_5_LETTER_WORDS if len(w) == 5 and w.isalpha()})
        scan_list(checker, words, workers, "available_5letter_meaningful.txt")
    elif choice == "4":
        username = input("Username: ").strip().lstrip("@")
        result = checker.check(username)
        print(json.dumps(result.__dict__, default=lambda x: x.value, indent=2))
    elif choice == "5":
        filename = input("File path: ").strip()
        with open(filename, "r", encoding="utf-8") as handle:
            names = [line.strip().lstrip("@") for line in handle if line.strip()]
        scan_list(checker, names, workers, "available_custom.txt")
    else:
        print("Invalid option")
        sys.exit(1)


if __name__ == "__main__":
    main()
