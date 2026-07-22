# TikTok Username Changer - Testing Guide

## ⚠️ CRITICAL WARNINGS

1. **DO NOT use your main TikTok account** - Create or use a test account
2. **Account may get banned** - This violates TikTok's Terms of Service
3. **For educational purposes only** - Understand the risks before proceeding

---

## Quick Test Setup (5 minutes)

### Step 1: Install Dependencies

```bash
pip install -r requirements.txt
```

### Step 2: Verify Setup

```bash
python test_tiktok_setup.py
```

Expected output:
```
Testing imports...
✓ requests module found
✓ termcolor module found
✓ hashlib module found (built-in)

✓ All required modules available

Testing X-Gorgon algorithm...
✓ X-Gorgon generation working
✓ getxg() function working

✓ X-Gorgon algorithm functional

✓ ALL TESTS PASSED - System is ready
```

### Step 3: Get Your Session ID

**Option A: Chrome**
1. Open [tiktok.com](https://www.tiktok.com) and log in
2. Press `F12` to open DevTools
3. Click **Application** tab (top bar)
4. Expand **Cookies** in left sidebar
5. Click `https://www.tiktok.com`
6. Find row with Name = `sessionid`
7. Copy the entire **Value** (long string like `a1b2c3d4e5f6...`)

**Option B: Firefox**
1. Open [tiktok.com](https://www.tiktok.com) and log in
2. Press `F12` to open DevTools
3. Click **Storage** tab
4. Expand **Cookies** → `https://www.tiktok.com`
5. Find `sessionid` and copy its Value

**Option C: Browser Extension**
1. Install "EditThisCookie" (Chrome) or "Cookie-Editor" (Firefox)
2. Visit TikTok while logged in
3. Click extension icon
4. Find and export `sessionid` value

### Step 4: Run the Tool

```bash
python tiktok_username_changer.py
```

You'll see:
```
Enter your TikTok sessionid: [paste here]
```

Paste your session ID (it won't show on screen - that's normal for security).

---

## What to Expect

### ✅ Best Case - It Works

```
[INFO] Generated Device ID: 7123456789012345678
[INFO] Generated Installation ID: 7987654321098765432

[INFO] Fetching your current username...

[DEBUG] Domain: api16-normal-c-useast1a.tiktokv.com, Version: 29.1.3
[DEBUG] Status Code: 200
[DEBUG] Response: {"user":{"unique_id":"old_username"...

✓ Your current TikTok username is: old_username

Enter the new username you wish to set: new_cool_username

[INFO] Attempting to change username...
[DEBUG] Domain: api16-normal-c-useast1a.tiktokv.com, Version: 29.1.3
[DEBUG] Status Code: 200

✓ Username change successful!
```

**What to report:** "It worked! Changed from X to Y using domain Z"

---

### ⚠️ Likely Case - Signature Rejected

```
[DEBUG] Domain: api16-normal-c-useast1a.tiktokv.com, Version: 29.1.3
[DEBUG] Status Code: 400
[DEBUG] Response: {"message":"Invalid signature"...

[DEBUG] Domain: api19-normal-c-useast1a.tiktokv.com, Version: 28.2.4
[DEBUG] Status Code: 400
[DEBUG] Response: {"message":"Invalid signature"...

✗ Failed to change username on all attempted API versions/domains.
```

**What this means:** The X-Gorgon signature algorithm is outdated. TikTok has updated their security.

**What to report:** 
- "Got 'Invalid signature' errors on all domains"
- Copy/paste a few lines of the [DEBUG] output

---

### 🔒 Another Common Issue - Expired Session

```
[DEBUG] Status Code: 401
[DEBUG] Response: {"message":"Unauthorized"...

✗ Failed to fetch profile. Possible reasons:
  1. Invalid or expired session_id
```

**What to do:**
1. Get a fresh session ID from your browser
2. Make sure you copied the entire value (no spaces/newlines)
3. Make sure you're logged into TikTok in that browser

---

### 🚫 Rate Limiting

```
[DEBUG] Status Code: 429
[DEBUG] Response: {"message":"Rate limit exceeded"...
```

**What this means:** TikTok is rate-limiting your IP or account.

**What to do:**
- Wait 10-15 minutes before trying again
- Consider using a VPN (but may still fail)

---

### 🤔 Partial Success

```
[DEBUG] Status Code: 200
[DEBUG] Response: {"user":{"unique_id":"new_username"...

[INFO] Checking if username actually changed...

⚠ API responded OK but username didn't change.
```

**What this means:** 
- Username is already taken
- Account has a username change cooldown (TikTok limits changes to once per 7-30 days)
- Username violates TikTok's rules (profanity, impersonation, etc.)

---

## What I Need From Your Test

Please report back with:

### 1. Status Codes You Received
Example: "Got 400 on all attempts" or "Got 200 but username didn't change"

### 2. Error Messages
Copy the `[DEBUG] Response:` lines, especially the first few

### 3. Which Domains Were Tried
Note which `api16`, `api19`, or `api22` domains showed up

### 4. Session ID Status
- Is it fresh (just copied)?
- Can you still access TikTok with that session?

### 5. Final Result
- ✅ Username changed successfully
- ❌ Failed with error X
- ⚠️ Partial success (API said OK but username didn't change)

---

## Understanding the Results

### If You Get Status 400 "Invalid Signature"

The **X-Gorgon algorithm is outdated**. This is the most likely failure mode.

**Why:** TikTok regularly updates their signature algorithm to block reverse-engineered tools.

**Fix Required:** Reverse engineer the latest TikTok mobile app to extract the new algorithm. This requires:
- Tools: IDA Pro, Ghidra, or Frida
- Skills: ARM assembly, Android/iOS reversing, cryptography
- Time: Several hours to days

### If You Get Status 200 with Success Message

**The tool works!** But this is unlikely given TikTok's aggressive security updates.

### If You Get Status 401 "Unauthorized"

Your session ID is invalid/expired. Get a fresh one.

### If You Get Status 429

You're rate limited. Wait and try from a different IP.

---

## Troubleshooting

### "requests module not found"
```bash
pip install requests termcolor
```

### "termcolor module not found"
```bash
pip install termcolor
```

### "Cannot import XG"
Make sure you're in the same directory as `tiktok_username_changer.py`

### Script exits immediately
Your session ID might be empty. Make sure you actually pasted it (it won't show on screen).

### "Connection timeout"
- Check your internet connection
- TikTok may be blocking your IP
- Try from a different network/VPN

---

## Security Notes

### What Gets Sent to TikTok

1. **Session ID** - Your authentication cookie
2. **Device ID** - Randomly generated (not your real device)
3. **Installation ID** - Randomly generated
4. **API Parameters** - Device info (iOS version, iPhone model, etc.)
5. **X-Gorgon Signature** - Cryptographic signature of the above

### What TikTok Sees

- API requests from "iPhone 14 Pro with iOS 17.4.1"
- Your session ID (links to your account)
- Your IP address
- Timestamp of requests

### Risk Assessment

**Low Risk:**
- Testing once or twice with a fresh test account

**Medium Risk:**
- Multiple attempts in short time
- Using with an existing account

**High Risk:**
- Using with your main account
- Repeated testing over days
- Automated usage

**Recommendation:** Create a throwaway account specifically for testing. Use a VPN if possible.

---

## Expected Outcome

**Most Likely Result:** The tool will fail with "Invalid signature" errors because the X-Gorgon algorithm needs updating.

**What This Tells Us:** Whether the signature algorithm is the only issue, or if there are other API changes too.

**Best Case Scenario:** It works, and we know the fix was successful!

**Worst Case:** Even with valid signatures, TikTok has added additional security layers (device attestation, CAPTCHA, etc.).

---

## After Testing

Please share your results (screenshots of the debug output are helpful) so I can:
1. Determine if the X-Gorgon algorithm is the main blocker
2. Identify any other API changes needed
3. Update the tool further if possible

Remember: This is reverse engineering for educational purposes. The goal is to understand TikTok's API security, not to abuse their platform.

---

## Legal Reminder

⚠️ By using this tool, you acknowledge:
- This violates TikTok's Terms of Service
- Your account may be suspended or banned
- You use this at your own risk
- This is for educational/research purposes only
- You will not use this for malicious purposes

**I am not responsible for any consequences of using this tool.**
