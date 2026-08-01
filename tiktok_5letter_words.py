#!/usr/bin/env python3
"""Fast TikTok 5-letter meaningful username checker."""

import json
import random
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from typing import List, Optional

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

MEANINGFUL_5_LETTER_WORDS = sorted(set([
    "scope", "minor", "major", "flame", "blaze", "storm", "pixel", "forge", "vault", "prism",
    "orbit", "quest", "rogue", "synth", "cyber", "ghost", "noble", "crisp", "drift", "pulse",
    "spark", "alpha", "omega", "delta", "sigma", "prime", "logic", "focus", "trust", "grace",
    "honor", "valor", "merit", "vigor", "vital", "urban", "rural", "ocean", "river", "coral",
    "pearl", "amber", "ivory", "olive", "cedar", "maple", "birch", "flora", "fauna", "terra",
    "lunar", "solar", "comet", "nova", "nebula", "astro", "cosmo", "hyper", "ultra", "macro",
    "micro", "nano", "quant", "vector", "matrix", "cipher", "token", "proxy", "cache", "stack",
    "queue", "patch", "debug", "parse", "query", "index", "input", "output", "frame", "layer",
    "model", "agent", "asset", "brand", "craft", "drive", "elite", "epoch", "event", "field",
    "force", "front", "globe", "guard", "heart", "ideal", "image", "inner", "intel", "joint",
    "karma", "label", "light", "limit", "local", "magic", "match", "media", "metal", "mind",
    "moral", "music", "nerve", "night", "north", "novel", "offer", "order", "panel", "party",
    "phase", "place", "plane", "plant", "point", "power", "press", "price", "pride", "proof",
    "queen", "quick", "quiet", "quote", "radio", "range", "ratio", "reach", "realm", "rebel",
    "reply", "right", "rival", "robot", "route", "scale", "scene", "sense", "serve", "shade",
    "shape", "share", "sharp", "shift", "shine", "skill", "smart", "smoke", "solid", "sound",
    "space", "speed", "spice", "spine", "split", "sport", "stage", "stand", "start", "state",
    "steel", "stone", "store", "story", "style", "super", "surge", "swift", "table", "taste",
    "teach", "theme", "think", "tiger", "title", "today", "total", "touch", "tower", "trace",
    "track", "trade", "train", "trend", "trial", "tribe", "trick", "trust", "truth", "twist",
    "union", "unity", "value", "video", "vista", "voice", "watch", "water", "wheel", "world",
    "worth", "write", "youth", "zebra", "angel", "arena", "atlas", "badge", "beach", "beast",
    "bench", "birth", "black", "blade", "blank", "blast", "bless", "block", "blood", "board",
    "boost", "brain", "bread", "break", "breed", "brick", "brief", "bring", "broad", "brook",
    "build", "burst", "cabin", "camel", "carry", "catch", "cause", "chain", "chair", "charm",
    "chart", "chase", "chess", "chief", "child", "chill", "choir", "claim", "class", "clean",
    "clear", "clerk", "cliff", "climb", "clock", "close", "cloud", "coach", "coast", "color",
    "couch", "count", "court", "cover", "crack", "crazy", "cream", "cross", "crowd", "crown",
    "curve", "cycle", "daily", "dance", "death", "depth", "devil", "diary", "digit", "dirty",
    "doubt", "draft", "drama", "dream", "dress", "drink", "eagle", "early", "earth", "eight",
    "empty", "enemy", "enjoy", "enter", "entry", "equal", "error", "essay", "extra", "faith",
    "fancy", "fault", "feast", "fence", "fiber", "fight", "final", "first", "fixed", "flash",
    "fleet", "floor", "fluid", "focal", "folks", "force", "found", "fresh", "front", "fruit",
    "funds", "funny", "giant", "given", "glass", "glory", "grace", "grade", "grain", "grand",
    "grant", "grape", "graph", "grass", "grave", "great", "green", "greet", "group", "grove",
    "guard", "guess", "guest", "guide", "guild", "habit", "happy", "harsh", "haven", "heart",
    "heavy", "hello", "hobby", "horse", "hotel", "house", "human", "humor", "ideal", "image",
    "index", "inner", "input", "issue", "ivory", "jewel", "joint", "judge", "juice", "knife",
    "knock", "known", "label", "large", "laser", "later", "laugh", "layer", "learn", "lease",
    "leave", "legal", "lemon", "level", "light", "limit", "linen", "liver", "local", "logic",
    "loose", "lover", "lower", "loyal", "lucky", "lunch", "magic", "major", "maker", "maple",
    "march", "match", "maybe", "mayor", "medal", "media", "mercy", "merge", "merit", "metal",
    "meter", "might", "minor", "mixed", "model", "money", "month", "moral", "motor", "mount",
    "mouse", "mouth", "movie", "music", "naked", "nerve", "never", "night", "noble", "noise",
    "north", "noted", "novel", "nurse", "occur", "ocean", "offer", "often", "olive", "onion",
    "opera", "order", "organ", "other", "outer", "owner", "paint", "panel", "panic", "paper",
    "party", "patch", "pause", "peace", "pearl", "penny", "phase", "phone", "photo", "piano",
    "piece", "pilot", "pitch", "place", "plain", "plane", "plant", "plate", "point", "poker",
    "polar", "power", "press", "price", "pride", "prime", "print", "prior", "prize", "proof",
    "proud", "prove", "proxy", "pulse", "punch", "pupil", "queen", "quest", "quick", "quiet",
    "quite", "quote", "radar", "radio", "raise", "rally", "ranch", "range", "rapid", "ratio",
    "reach", "react", "ready", "realm", "rebel", "refer", "relax", "reply", "right", "rigid",
    "rival", "river", "robin", "robot", "rocky", "roman", "rough", "round", "route", "royal",
    "rugby", "rural", "saint", "salad", "scale", "scene", "scope", "score", "sense", "serve",
    "seven", "shade", "shake", "shall", "shame", "shape", "share", "sharp", "sheep", "sheet",
    "shelf", "shell", "shift", "shine", "shirt", "shock", "shoot", "shore", "short", "shout",
    "sight", "sigma", "skill", "skull", "sleep", "slide", "small", "smart", "smile", "smoke",
    "snake", "snowy", "solid", "solve", "sorry", "sound", "south", "space", "spare", "speak",
    "speed", "spend", "spice", "spine", "split", "spoke", "sport", "spray", "squad", "stack",
    "staff", "stage", "stake", "stand", "stark", "start", "state", "steal", "steam", "steel",
    "stick", "still", "stock", "stone", "store", "storm", "story", "strip", "study", "stuff",
    "style", "sugar", "suite", "sunny", "super", "surge", "sweet", "swift", "sword", "table",
    "taste", "teach", "teeth", "tempo", "terms", "theme", "thick", "thing", "think", "third",
    "those", "three", "throw", "tiger", "tight", "timer", "title", "toast", "today", "token",
    "total", "touch", "tough", "tower", "toxic", "trace", "track", "trade", "trail", "train",
    "trait", "treat", "trend", "trial", "tribe", "trick", "troop", "truck", "truly", "trust",
    "truth", "tumor", "twist", "ultra", "uncle", "under", "union", "unity", "until", "upper",
    "upset", "urban", "usage", "usual", "valid", "value", "vault", "vegan", "venue", "verse",
    "video", "vigor", "villa", "vinyl", "viral", "virus", "visit", "vista", "vital", "vivid",
    "vocal", "voice", "voter", "wagon", "waste", "watch", "water", "weary", "weave", "wheat",
    "wheel", "where", "while", "white", "whole", "whose", "width", "woman", "world", "worry",
    "worth", "would", "write", "wrong", "yield", "young", "youth", "zebra", "zones",
    # extra meaningful / brandable picks
    "arbor", "axiom", "basin", "beacon", "bloom", "brave", "breeze", "candy", "canon", "cargo",
    "chalk", "chord", "clash", "clerk", "clove", "cocoa", "comet", "coral", "couch", "crest",
    "cubic", "curio", "daisy", "decay", "decoy", "denim", "disco", "dodge", "dough", "dwarf",
    "ember", "enact", "envoy", "ethic", "evoke", "fable", "fairy", "fancy", "favor", "ferry",
    "fever", "fiber", "fiery", "flair", "flint", "flora", "folio", "fract", "frost", "funky",
    "fuzzy", "gamer", "gazer", "genie", "gloss", "gloom", "glyph", "golem", "grasp", "gravy",
    "graze", "grill", "grind", "groom", "grove", "growl", "guava", "haste", "hatch", "haunt",
    "hazel", "hedge", "helix", "herbs", "hiker", "hinge", "honey", "hound", "hover", "hybrid",
    "icily", "icing", "inbox", "inlet", "ionic", "irony", "ivory", "jazzy", "jelly", "joker",
    "jolly", "joust", "kayak", "kiosk", "kitty", "knack", "kneel", "knelt", "knoll", "koala",
    "lance", "latch", "latte", "leafy", "leash", "ledge", "leech", "lemon", "level", "libra",
    "lilac", "lithe", "llama", "lobby", "locus", "lotus", "lumen", "lunar", "lunge", "lyric",
    "macro", "magma", "mango", "manor", "maple", "marsh", "medal", "melon", "merry", "metro",
    "micro", "mimic", "mirth", "misty", "mixer", "modal", "moist", "molar", "moody", "morph",
    "mossy", "motif", "motto", "mural", "myths", "nadir", "nanny", "nexus", "ninja", "ninth",
    "nitro", "nomad", "nooks", "notch", "nudge", "nymph", "oasis", "octet", "odder", "odium",
    "olive", "ombre", "onset", "optic", "orbit", "otter", "ounce", "outdo", "ovary", "oxide",
    "ozone", "paddy", "pagan", "panda", "panel", "pasta", "patch", "patty", "pause", "peach",
    "pecan", "penne", "petal", "petty", "piano", "pilot", "pinch", "pivot", "plaid", "plank",
    "plaza", "plead", "plume", "plush", "poach", "polar", "polka", "poppy", "porch", "posse",
    "prawn", "preys", "primo", "privy", "probe", "promo", "props", "prose", "psalm", "puffy",
    "pylon", "quack", "quart", "quasi", "quell", "quilt", "quirk", "quota", "rabbi", "racer",
    "radii", "rainy", "raven", "rayon", "razor", "recon", "reeds", "reign", "relic", "remix",
    "repel", "resin", "retro", "rhino", "rhyme", "ridge", "rifle", "rigor", "rinse", "risen",
    "risky", "ritzy", "roast", "robin", "rocky", "rodeo", "rogue", "roomy", "roost", "rotor",
    "rouge", "round", "rowdy", "royal", "ruddy", "rumor", "rusty", "saber", "sadly", "saggy",
    "salon", "salsa", "salty", "sandy", "sassy", "satin", "sauce", "sauna", "savvy", "scald",
    "scarf", "scary", "scion", "scoop", "scorn", "scout", "scuba", "seedy", "seize", "serum",
    "setup", "sever", "shady", "shaky", "shawl", "sheen", "sheer", "shied", "shiny", "shire",
    "shoal", "shone", "shook", "shorn", "showy", "shrug", "shunt", "siege", "silly", "sinew",
    "siren", "sixth", "sixty", "skate", "skier", "skiff", "skimp", "skirt", "skulk", "skunk",
    "slang", "slant", "slash", "slate", "sleek", "sleet", "slice", "slick", "slime", "sling",
    "slink", "slope", "sloth", "slump", "slung", "slurp", "smack", "smear", "smelt", "smirk",
    "smite", "smoky", "snack", "snare", "snarl", "sneak", "snide", "sniff", "snipe", "snoop",
    "snore", "snort", "snout", "snowy", "snuff", "soapy", "sober", "soggy", "solar", "solid",
    "sonar", "sonic", "sooth", "soppy", "soupy", "sower", "spank", "spawn", "spear", "speck",
    "spicy", "spied", "spiky", "spill", "spiny", "spire", "spite", "splat", "splay", "spoil",
    "spool", "spoon", "spore", "sport", "sprig", "spunk", "spurn", "spurt", "squat", "squid",
    "stabs", "staid", "stale", "stank", "stare", "stark", "stash", "stays", "stead", "steep",
    "stern", "stews", "stiff", "stile", "sting", "stink", "stint", "stoic", "stoke", "stomp",
    "stony", "stood", "stool", "stoop", "store", "stork", "stout", "stove", "strap", "straw",
    "stray", "strep", "strew", "strip", "strut", "stubs", "stuck", "studs", "stung", "stunk",
    "stunt", "suave", "suede", "sugar", "suing", "suite", "sulky", "sunny", "super", "surer",
    "surge", "surly", "sushi", "swamp", "swarm", "swath", "swear", "sweat", "sweep", "sweet",
    "swell", "swept", "swift", "swill", "swine", "swing", "swipe", "swirl", "swish", "swoon",
    "swoop", "sword", "swore", "sworn", "swung", "synod", "syrup", "tabby", "taboo", "tacit",
    "tacky", "taffy", "taint", "taken", "tamer", "tango", "tangy", "taper", "tapir", "tardy",
    "tarot", "tarry", "taste", "tasty", "tatty", "taunt", "tawny", "teach", "teary", "tease",
    "teddy", "teems", "teeth", "tempo", "tenet", "tenor", "tense", "tenth", "tepee", "tepid",
    "terra", "terse", "tests", "texas", "thank", "theft", "their", "theme", "there", "these",
    "thick", "thief", "thigh", "thing", "think", "third", "thong", "thorn", "those", "three",
    "threw", "throb", "throw", "thrum", "thumb", "thump", "thyme", "tiara", "tibia", "tidal",
    "tiger", "tight", "tilde", "timer", "timid", "tipsy", "titan", "tithe", "title", "toast",
    "today", "toddy", "token", "tonal", "toned", "tonic", "tooth", "topaz", "topic", "torch",
    "torso", "torus", "total", "totem", "touch", "tough", "towel", "tower", "toxic", "trace",
    "track", "tract", "trade", "trail", "train", "trait", "tramp", "trash", "trawl", "tread",
    "treat", "trend", "triad", "trial", "tribe", "trice", "trick", "tried", "trier", "trike",
    "trill", "tripe", "trite", "troll", "troop", "trope", "trout", "trove", "truce", "truck",
    "truer", "truly", "trump", "trunk", "truss", "trust", "truth", "tryst", "tubal", "tubby",
    "tuber", "tulip", "tulle", "tumor", "tunic", "turbo", "tutor", "twang", "tweak", "tweed",
    "tweet", "twice", "twine", "twirl", "twist", "twixt", "tying", "udder", "ulcer", "ultra",
    "umbra", "uncle", "uncut", "under", "undid", "undue", "unfed", "unfit", "unify", "union",
    "unite", "unity", "unlit", "unmet", "unset", "untie", "until", "unwed", "unzip", "upper",
    "upset", "urban", "urged", "usage", "usher", "using", "usual", "usurp", "utile", "utter",
    "vague", "valet", "valid", "valor", "value", "valve", "vapid", "vapor", "vault", "vaunt",
    "vegan", "venom", "venue", "verge", "verse", "verso", "verve", "vicar", "video", "vigil",
    "vigor", "villa", "vinyl", "viola", "viper", "viral", "virus", "visit", "visor", "vista",
    "vital", "vivid", "vixen", "vocal", "vodka", "vogue", "voice", "voila", "vomit", "voter",
    "vouch", "vowel", "vying", "wacky", "wafer", "wager", "wagon", "waist", "waive", "waltz",
    "warty", "waste", "watch", "water", "waver", "waxen", "weary", "weave", "wedge", "weedy",
    "weigh", "weird", "welch", "welsh", "whack", "whale", "wharf", "wheat", "wheel", "whelp",
    "where", "which", "whiff", "while", "whine", "whiny", "whirl", "whisk", "white", "whole",
    "whoop", "whore", "whose", "widen", "wider", "widow", "width", "wield", "wight", "willy",
    "wimpy", "wince", "winch", "windy", "wiser", "wispy", "witch", "witty", "woken", "woman",
    "women", "woody", "wooer", "wooly", "woozy", "wordy", "world", "worry", "worse", "worst",
    "worth", "would", "wound", "woven", "wrack", "wrath", "wreak", "wreck", "wrest", "wring",
    "wrist", "write", "wrong", "wrote", "wrung", "wryly", "yacht", "yahoo", "yearn", "yeast",
    "yield", "young", "yours", "youth", "yummy", "zebra", "zesty", "zonal", "zones", "zooms",
]))


@dataclass
class CheckResult:
    username: str
    available: Optional[bool]
    status_code: Optional[int] = None
    error: Optional[str] = None


def random_user_agent() -> str:
    return random.choice(USER_AGENTS)


def is_username_available(username: str, html: str) -> tuple[bool, Optional[int]]:
    match = re.search(
        r'<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application/json">(.+?)</script>',
        html,
    )
    if not match:
        return False, None

    data = json.loads(match.group(1))
    detail = data.get("__DEFAULT_SCOPE__", {}).get("webapp.user-detail", {})
    user_info = detail.get("userInfo", {})
    user = user_info.get("user", {}) if isinstance(user_info, dict) else {}
    status_code = detail.get("statusCode")

    if user.get("uniqueId") and user.get("id"):
        return False, status_code

    if status_code in (10221, 10202, 10201):
        return True, status_code

    if not user_info and status_code is not None:
        return True, status_code

    return False, status_code


def check_username(username: str, session: Optional[requests.Session] = None) -> CheckResult:
    url = f"https://www.tiktok.com/@{username}"
    headers = {
        "User-Agent": random_user_agent(),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Connection": "keep-alive",
    }

    client = session or requests
    try:
        response = client.get(url, headers=headers, timeout=12, allow_redirects=True)
        available, status_code = is_username_available(username, response.text)
        return CheckResult(username=username, available=available, status_code=status_code)
    except requests.RequestException as exc:
        return CheckResult(username=username, available=None, error=str(exc))


def check_many(usernames: List[str], workers: int = 12) -> List[CheckResult]:
    results: List[CheckResult] = []
    checked = 0
    total = len(usernames)

    with ThreadPoolExecutor(max_workers=workers) as pool:
        futures = {pool.submit(check_username, name): name for name in usernames}
        for future in as_completed(futures):
            result = future.result()
            results.append(result)
            checked += 1

            if result.available:
                print(f"AVAILABLE @{result.username}")
            elif checked % 25 == 0:
                found = sum(1 for r in results if r.available)
                print(f"[{checked}/{total}] found {found} available so far")

    return results


def main() -> None:
    workers = 12
    if len(sys.argv) > 1:
        try:
            workers = int(sys.argv[1])
        except ValueError:
            pass

    words = [w for w in MEANINGFUL_5_LETTER_WORDS if len(w) == 5 and w.isalpha()]
    print(f"Checking {len(words)} meaningful 5-letter usernames with {workers} workers...\n")

    start = time.time()
    results = check_many(words, workers=workers)
    elapsed = time.time() - start

    available = sorted({r.username for r in results if r.available})
    taken = sorted({r.username for r in results if r.available is False})
    errors = [r for r in results if r.available is None]

    print("\n" + "=" * 60)
    print(f"Checked: {len(results)} | Available: {len(available)} | Taken: {len(taken)} | Errors: {len(errors)}")
    print(f"Time: {elapsed:.1f}s")
    print("=" * 60)

    if available:
        print("\nAVAILABLE USERNAMES:")
        for name in available:
            print(f"@{name}")

        with open("available_5letter_meaningful.txt", "w", encoding="utf-8") as handle:
            for name in available:
                handle.write(f"@{name}\n")
        print("\nSaved to available_5letter_meaningful.txt")
    else:
        print("\nNo available meaningful 5-letter usernames found in this list.")


if __name__ == "__main__":
    main()
