# TikTok Username Changer - Usage Guide

## ⚠️ Important Warnings

1. **Terms of Service**: This tool violates TikTok's Terms of Service
2. **Account Risk**: Using this may result in account suspension or ban
3. **Legal Risk**: Reverse engineering APIs may have legal implications in your jurisdiction
4. **No Warranty**: This tool is provided as-is for educational purposes only

## What Was Fixed

### 1. **Updated API Versions**
- Changed from old version `34.0.0` to multiple recent versions (`29.1.3`, `28.2.4`)
- Added `manifest_version_code` parameter (required by newer TikTok APIs)
- Updated build numbers to match version codes

### 2. **Multiple API Domains**
- Now tries multiple TikTok API domains:
  - `api16-normal-c-useast1a.tiktokv.com` (regional endpoint)
  - `api19-normal-c-useast1a.tiktokv.com`
  - `api22-normal-c-useast1a.tiktokv.com`
  - `api16.tiktokv.com` (fallback)

### 3. **Enhanced Headers**
- Added `X-SS-REQ-TICKET` (timestamp in milliseconds)
- Added `X-SS-DP` (device platform identifier)
- Added `X-TT-TOKEN` header
- Updated User-Agent format to modern iOS style

### 4. **Better Device Fingerprinting**
- More realistic device IDs (19-digit numbers instead of 9-12 digits)
- Updated device type to `iPhone15,2` (iPhone 14 Pro)
- Updated iOS version to `17.4.1`
- Changed region from Saudi Arabia to United States

### 5. **Debug Output**
- Added verbose logging to see exactly what's failing
- Shows API domain, version, status code, and response
- Better error messages with actionable information

### 6. **Retry Logic**
- Tries multiple version/domain combinations
- Continues trying if one fails
- Reports which combination (if any) worked

## Installation

```bash
pip install -r requirements.txt
```

## Getting Your Session ID

### Method 1: Browser DevTools (Chrome/Firefox)

1. Go to [tiktok.com](https://www.tiktok.com) and log in
2. Press `F12` to open Developer Tools
3. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
4. Click **Cookies** → `https://www.tiktok.com`
5. Find the cookie named `sessionid`
6. Copy its **Value** (long string of characters)

### Method 2: Browser Extension

1. Install "EditThisCookie" or similar cookie viewer
2. Visit TikTok while logged in
3. Click the extension icon
4. Find and copy the `sessionid` value

## Usage

```bash
python tiktok_username_changer.py
```

Follow the prompts:
1. Enter your `sessionid`
2. Script will fetch and display your current username
3. Enter the new username you want
4. Wait for the result

## Expected Output

### Success:
```
[INFO] Generated Device ID: 7123456789012345678
[INFO] Generated Installation ID: 7987654321098765432

Enter your TikTok sessionid: [your session id here]

[INFO] Fetching your current username...

[DEBUG] Domain: api16-normal-c-useast1a.tiktokv.com, Version: 29.1.3
[DEBUG] Status Code: 200
[DEBUG] Response: {"user":{"unique_id":"old_username"...

✓ Your current TikTok username is: old_username

Enter the new username you wish to set: new_username

[INFO] Attempting to change username...
✓ Username change successful!
```

### Failure Examples:

**Expired Session:**
```
[DEBUG] Status Code: 401
[DEBUG] Response: {"message":"Unauthorized"}
```

**Rate Limited:**
```
[DEBUG] Status Code: 429
[DEBUG] Response: {"message":"Rate limit exceeded"}
```

**Invalid Signature (X-Gorgon outdated):**
```
[DEBUG] Status Code: 400
[DEBUG] Response: {"message":"Invalid signature"}
```

## Troubleshooting

### "Failed to fetch profile"

**Possible causes:**
1. **Expired session_id**: Get a fresh one from your browser
2. **Wrong session_id**: Make sure you copied the entire value
3. **IP blocked**: TikTok may have rate-limited your IP address
4. **API changed**: The X-Gorgon algorithm may need updating

### "API responded OK but username didn't change"

**Possible causes:**
1. Username is already taken
2. Username violates TikTok's naming rules
3. You recently changed your username (TikTok has cooldown periods)
4. Account requires additional verification

### "Invalid signature" errors

The X-Gorgon algorithm is outdated. This is the most likely failure mode as TikTok regularly updates their security measures.

## Why This Might Still Not Work

Even with these fixes, the tool may fail because:

1. **X-Gorgon Algorithm**: The core signature generation might be outdated
2. **Device Attestation**: Modern TikTok may require cryptographic device certificates
3. **Biometric Checks**: Some actions might require app-level biometric verification
4. **Server-Side Changes**: TikTok may have changed endpoints or parameters entirely
5. **Behavioral Analysis**: TikTok may detect automated access patterns

## Testing Advice

When you test:
1. Use a **test account**, not your main account
2. Watch the debug output carefully
3. Note the specific error messages
4. If you get "invalid signature" errors, the X-Gorgon algorithm needs updating (requires reverse engineering the latest TikTok app)

## Next Steps If It Fails

If you see consistent "invalid signature" or "bad request" errors, you would need to:

1. Download the latest TikTok APK/IPA
2. Reverse engineer the native libraries to find the updated X-Gorgon algorithm
3. Update the `XG` class accordingly

This requires advanced skills in:
- ARM assembly
- Mobile app reverse engineering (IDA Pro, Ghidra, Frida)
- Cryptographic algorithm analysis

## Legal Disclaimer

This tool is provided for **educational and research purposes only**. The authors do not condone:
- Violating TikTok's Terms of Service
- Unauthorized access to computer systems
- Any illegal activity

Use at your own risk. You are responsible for any consequences.
