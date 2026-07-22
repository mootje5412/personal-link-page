# TikTok Username Checker

A powerful Python tool to check the availability of TikTok usernames. Supports checking 3-letter and 4-letter username combinations with rotating user agents for reliability.

## Features

- ✅ Check 3-letter username availability (26³ = 17,576 combinations)
- ✅ Check 4-letter username availability (26⁴ = 456,976 combinations)
- ✅ Check custom username lists
- ✅ Check single usernames
- ✅ Rotating user agents (100+ different user agents)
- ✅ Parallel processing for faster checking
- ✅ Results saved to JSON files
- ✅ Real-time status updates

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Setup

1. Clone or download this repository

2. Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the script:

```bash
python tiktok_checker.py
```

### Options

When you run the script, you'll be presented with 4 options:

#### Option 1: Check 3-letter usernames

Checks all possible 3-letter combinations (aaa to zzz).

- Total usernames: 17,576
- Recommended workers: 3-5
- Estimated time: ~2-3 hours (depending on network speed)

```
Select option: 1
```

#### Option 2: Check 4-letter usernames

Checks all possible 4-letter combinations (aaaa to zzzz).

- Total usernames: 456,976
- Recommended workers: 3-5
- Estimated time: ~50+ hours (depending on network speed)

```
Select option: 2
```

#### Option 3: Check custom username list

Check usernames from a text file (one username per line).

```
Select option: 3
Enter filename: usernames.txt
```

Example `usernames.txt`:
```
abc
xyz
test
cool
epic
```

#### Option 4: Check single username

Check availability of a single username.

```
Select option: 4
Enter username: coolname
```

## Configuration

### Adjust Delay Between Requests

Open `tiktok_checker.py` and modify the delay parameter:

```python
checker = TikTokChecker(delay=0.5)  # 0.5 seconds between requests
```

### Adjust Parallel Workers

When prompted, enter the number of parallel workers:
- Recommended: 3-5 workers
- Higher values = faster but may trigger rate limits
- Lower values = slower but more reliable

## Output

### Console Output

The script displays real-time status updates:

```
✓ AVAILABLE: @abc (Status: 404)
✗ Taken: @xyz (Status: 200)
✓ AVAILABLE: @qwe (Status: 404)
```

### JSON Results

Results are automatically saved to JSON files:

- `tiktok_3letter_results.json` - For 3-letter checks
- `tiktok_4letter_results.json` - For 4-letter checks
- `tiktok_custom_results.json` - For custom list checks

Example output:

```json
{
  "total_checked": 100,
  "available_count": 15,
  "taken_count": 85,
  "available_usernames": [
    "abc",
    "def",
    "ghi"
  ],
  "timestamp": "2026-07-22T01:18:00.123456"
}
```

## User Agents

The script rotates through 100 different user agents to avoid detection:

- Windows Chrome/Edge
- macOS Safari/Chrome
- iOS Safari
- Android Chrome
- Linux Chrome/Firefox
- And many more...

## How It Works

1. **Username Generation**: Generates all possible combinations for the selected length
2. **HTTP Request**: Makes a request to `https://www.tiktok.com/@username`
3. **Status Check**: Determines availability based on:
   - HTTP 404 = Available
   - HTTP 200 with "couldn't find this account" = Available
   - HTTP 200 with valid profile = Taken
4. **User Agent Rotation**: Each request uses a random user agent
5. **Parallel Processing**: Multiple usernames checked simultaneously
6. **Results Export**: All findings saved to JSON

## Rate Limiting

TikTok may implement rate limiting. If you experience issues:

1. Reduce the number of parallel workers (try 2-3)
2. Increase the delay between requests (try 1.0-2.0 seconds)
3. Take breaks between large batches
4. Use a VPN if your IP gets temporarily blocked

## Best Practices

- Start with a small test run before checking all combinations
- Use option 4 to test single usernames first
- Monitor the output for errors or rate limiting
- Keep the number of parallel workers reasonable (3-5)
- Be patient with large batches (4-letter usernames take a long time)

## Troubleshooting

### "Connection timeout" errors

- Reduce the number of parallel workers
- Increase the delay between requests
- Check your internet connection

### "Too many requests" or rate limiting

- Significantly reduce parallel workers (1-2)
- Increase delay to 2+ seconds
- Wait 30-60 minutes before resuming

### No available usernames found

- Most 3-letter and 4-letter usernames are likely taken
- Consider checking longer usernames or specific patterns
- Try custom lists with creative combinations

## Disclaimer

This tool is for educational and research purposes only. Please:

- Respect TikTok's Terms of Service
- Use responsibly and ethically
- Don't abuse rate limits
- Don't use for spam or malicious purposes

## License

This project is provided as-is for educational purposes.

## Support

For issues or questions, please check the code comments or modify the script according to your needs.

---

**Created:** 2026-07-22  
**Version:** 1.0
