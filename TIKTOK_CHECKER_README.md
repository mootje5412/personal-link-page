# TikTok Username Checker (Accurate)

This checker uses TikTok's **real signup validation API**, not profile-page guessing.

## Why the old results were wrong

The previous version treated "no profile found" as available. That is incorrect.

Names like `@boost`, `@wordy`, and `@unity` can be:
- reserved by TikTok
- banned from reuse
- blocked as common words

Those are **not registerable**, even if no public profile exists.

## What this checker uses

```text
GET https://www.tiktok.com/api/uniqueid/check/?aid=1233&unique_id=USERNAME
Cookie: sessionid=YOUR_SESSION
```

TikTok status codes:
- `0` = username is available
- `3249` = taken or not available
- `3250` / `3252` / `3254` = invalid username format

This requires a logged-in TikTok `sessionid` cookie.

## Setup

```bash
pip install -r requirements.txt
cp config.example.json config.json
```

Then edit `config.json`:

```json
{
  "sessionid": "paste_your_sessionid_here"
}
```

Or set an environment variable:

```bash
export TIKTOK_SESSIONID='your_sessionid_here'
```

### Get your sessionid

1. Log in at https://www.tiktok.com
2. Open DevTools
3. Application -> Cookies -> `https://www.tiktok.com`
4. Copy the value of `sessionid`

## Run

### Check one username

```bash
python tiktok_checker.py
```

Choose option 4.

### Fast 5-letter meaningful word scan

```bash
python tiktok_5letter_fast.py 15
```

This scans meaningful 5-letter words like `scope`, `minor`, `orbit`, `vault`, etc.

### Other modes

```bash
python tiktok_checker.py
```

Options:
1. 3-letter usernames
2. 4-letter usernames
3. 5-letter meaningful words
4. Single username
5. Custom list file

## Output

Only usernames with API status code `0` are saved as available.

Results are written to:
- `available_5letter_meaningful.txt`
- `available_4letter.txt`
- `available_3letter.txt`

## Notes

- Without a valid `sessionid`, TikTok returns empty responses and checks fail safely instead of giving fake available names.
- Short/common words are usually taken or blocked.
- Random/longer names have better success rates.
- Use 10-15 workers for speed.

## Files

- `tiktok_checker_core.py` - accurate API checker
- `tiktok_checker.py` - interactive CLI
- `tiktok_5letter_fast.py` - fast meaningful 5-letter scanner
- `tiktok_5letter_words.py` - word list
- `config.example.json` - session config template
