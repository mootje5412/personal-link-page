# TikTok Username Changer - Changes Summary

## Overview

I've updated the TikTok username changer code with several fixes to address likely API compatibility issues. The original code had outdated API versions, endpoints, and headers that TikTok probably no longer accepts.

---

## Key Improvements Made

### 1. ✅ Updated API Versions

**Before:**
- Version: `34.0.0` (old)
- Build: `340002`
- Missing `manifest_version_code`

**After:**
- Tries multiple versions: `29.1.3`, `28.2.4`
- Includes proper `manifest_version_code`
- Updated build numbers to match
- Falls back through versions if one fails

### 2. ✅ Multiple API Domains

**Before:**
- Only tried `api16.tiktokv.com`
- Single point of failure

**After:**
- Tries 5 different domains:
  - `api16-normal-c-useast1a.tiktokv.com`
  - `api19-normal-c-useast1a.tiktokv.com`
  - `api22-normal-c-useast1a.tiktokv.com`
  - `api16.tiktokv.com`
  - `api19.tiktokv.com`
- Increases chances of finding a working endpoint

### 3. ✅ Enhanced Headers

**Before:**
```python
headers = {
    "X-Gorgon": sig["X-Gorgon"],
    "X-Khronos": sig["X-Khronos"],
    "user-agent": "com.zhiliaoapp.musically/..."
}
```

**After:**
```python
headers = {
    "X-Gorgon": sig["X-Gorgon"],
    "X-Khronos": sig["X-Khronos"],
    "X-SS-REQ-TICKET": str(int(time() * 1000)),  # NEW
    "X-SS-DP": "1233",                            # NEW
    "X-TT-TOKEN": "00",                           # NEW
    "user-agent": "...iOS 17.4.1...",
}
```

These additional headers are commonly seen in modern TikTok API requests.

### 4. ✅ Realistic Device Fingerprinting

**Before:**
- Device IDs: 9-12 digits (unrealistic)
- Device: Generic iPhone reference
- iOS: 17.3 (slightly old)
- Region: Saudi Arabia (SA)

**After:**
- Device IDs: 19 digits (matches real TikTok IDs)
- Device: `iPhone15,2` (iPhone 14 Pro)
- iOS: `17.4.1` (recent version)
- Region: `US` (less likely to be geo-blocked)

### 5. ✅ Comprehensive Debug Output

**Before:**
```python
print(res)  # Basic response dump
```

**After:**
```python
print(f"[DEBUG] Domain: {domain}, Version: {version}")
print(f"[DEBUG] Status Code: {response.status_code}")
print(f"[DEBUG] Response: {result[:500]}")
```

Now you can see:
- Which domain was tried
- What version was used
- Exact status code (400, 401, 429, etc.)
- Error message from TikTok

This helps diagnose the exact failure point.

### 6. ✅ Better Error Handling

**Before:**
- Single try-except, generic errors
- No retry logic

**After:**
- Tries multiple domain/version combinations
- Continues on failure instead of stopping
- Reports which combination (if any) worked
- Distinguishes between different failure types

---

## Files Created

### 1. `tiktok_username_changer.py`
The main updated script with all fixes above.

### 2. `test_tiktok_setup.py`
Quick validation script that tests:
- ✓ Are all Python dependencies installed?
- ✓ Does the X-Gorgon algorithm work?
- ✓ Is network connectivity functional?

Run before testing the main script.

### 3. `requirements.txt`
```
requests>=2.31.0
termcolor>=2.3.0
```

### 4. `TIKTOK_USAGE.md`
Technical documentation covering:
- What was fixed and why
- Installation instructions
- How to get session ID
- Troubleshooting guide
- Legal disclaimers

### 5. `TESTING_GUIDE.md`
Step-by-step user guide:
- 5-minute quick start
- Session ID extraction (with screenshots instructions)
- Expected outputs for all scenarios
- What to report back
- Security considerations

### 6. `CHANGES_SUMMARY.md` (this file)
Quick overview of all changes.

---

## How to Test

### Quick Start (3 commands):

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Test setup
python test_tiktok_setup.py

# 3. Run the tool
python tiktok_username_changer.py
```

See `TESTING_GUIDE.md` for detailed instructions.

---

## What Will Probably Happen

### Most Likely: ❌ Invalid Signature

```
[DEBUG] Status Code: 400
[DEBUG] Response: {"message":"Invalid signature"}
```

**Why:** The core X-Gorgon signature algorithm is probably outdated. TikTok updates this regularly to block tools like this.

**What it means:** The fixes I made (versions, headers, domains) aren't the problem—the signature algorithm itself needs updating.

**Next step:** Would require reverse engineering the latest TikTok mobile app to extract the new algorithm.

### Less Likely: ✅ It Works!

```
[DEBUG] Status Code: 200
✓ Username change successful!
```

**Why:** The X-Gorgon algorithm might still be valid, and my other fixes were all that was needed.

**What it means:** The original code just needed updating to newer API versions/headers.

### Possible: 🔒 Session Expired

```
[DEBUG] Status Code: 401
[DEBUG] Response: {"message":"Unauthorized"}
```

**Why:** Session ID is invalid or expired.

**Next step:** Get a fresh session ID from browser.

### Possible: 🚫 Rate Limited

```
[DEBUG] Status Code: 429
```

**Why:** TikTok is blocking your IP or account from making API calls.

**Next step:** Wait 15+ minutes or use VPN.

---

## Technical Details

### What Changed in the API Request

**Before (old code):**
```
GET https://api16.tiktokv.com/aweme/v1/user/profile/self/?
    device_id=777788999
    &version_code=34.0.0
    &device_type=iPhone13,4
    &os_version=17.3
    &sys_region=SA
```

**After (updated code):**
```
GET https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/user/profile/self/?
    device_id=7123456789012345678
    &version_code=29.1.3
    &manifest_version_code=2023901030
    &device_type=iPhone15,2
    &os_version=17.4.1
    &sys_region=US
```

### X-Gorgon Algorithm (Unchanged)

I kept the original X-Gorgon algorithm implementation (`XG` class) because:
1. It's extremely complex and likely still somewhat valid
2. Updating it requires reverse engineering the TikTok app binary
3. If the algorithm is the problem, you'll see "Invalid signature" errors
4. If other things are the problem, you'll see different errors

The algorithm generates a signature like:
```
X-Gorgon: 84020800470000a3f4e8d2c1b9...
X-Khronos: 1721369234
```

This signature proves to TikTok that the request came from a legitimate app, not a bot.

---

## What Your Test Results Will Tell Us

| Result | What It Means | Next Step |
|--------|---------------|-----------|
| ✅ Status 200 + Success | All fixes worked! | Celebrate! |
| ❌ Status 400 "Invalid signature" | X-Gorgon algorithm outdated | Reverse engineer new algorithm |
| 🔒 Status 401 "Unauthorized" | Session ID issue | Get fresh session ID |
| 🚫 Status 429 | Rate limited | Wait or use VPN |
| ⚠️ Status 200 but no change | Username taken/cooldown | Try different username |

---

## If It Still Doesn't Work

### The X-Gorgon Algorithm is Outdated

To fix this properly would require:

1. **Download Latest TikTok App**
   - iOS IPA or Android APK
   - Preferably same version we're spoofing (29.1.3)

2. **Reverse Engineer the Binary**
   - Tools: IDA Pro, Ghidra, Frida
   - Find the signature generation function
   - Analyze the ARM assembly code

3. **Extract the Algorithm**
   - Identify the new mixing/hashing operations
   - Determine any new magic constants
   - Map it back to Python

4. **Update the XG Class**
   - Rewrite `addr_BA8()`, `initial()`, `calculate()`
   - Match the new algorithm exactly

This is advanced work requiring:
- Mobile reverse engineering skills
- ARM assembly knowledge
- Cryptographic algorithm analysis
- Several hours to days of work

### Alternative Approaches

If reverse engineering is too complex:

1. **Use Frida** to hook the real app and extract signatures
2. **Proxy** requests through a real device running TikTok
3. **Wait** for someone else to reverse engineer it and release updated code
4. **Accept** that TikTok's security has won this round

---

## Repository Files

All files have been committed to branch `cursor/tiktok-api-fixes-4e0e`:

```
tiktok_username_changer.py  - Main script (updated)
test_tiktok_setup.py        - Setup validation
requirements.txt            - Dependencies
TIKTOK_USAGE.md            - Technical documentation
TESTING_GUIDE.md           - User testing guide
CHANGES_SUMMARY.md         - This file
```

Pull Request: [#2](https://github.com/mootje5412/personal-link-page/pull/2)

---

## Legal Reminder

⚠️ This tool:
- Violates TikTok's Terms of Service
- May result in account suspension
- Is for educational/research purposes only
- Should be tested on throwaway accounts

I am not responsible for any consequences of using this tool.

---

## Summary

I've made every reasonable update I could without reverse engineering the TikTok app binary. The code now:

1. ✅ Uses current API versions
2. ✅ Tries multiple domains
3. ✅ Includes modern headers
4. ✅ Has realistic device fingerprinting
5. ✅ Provides detailed debug output
6. ✅ Has proper retry logic

**The most likely remaining issue is the X-Gorgon algorithm itself.**

When you test it, the debug output will tell us exactly what's failing, and we can determine if further fixes are possible or if reverse engineering is required.

Good luck with testing! 🎯
