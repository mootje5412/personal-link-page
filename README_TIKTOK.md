# TikTok Username Changer - Quick Reference

> ⚠️ **Warning:** Use at your own risk. Violates TikTok TOS. Test accounts only.

## 🚀 Quick Start (3 Steps)

### 1. Install
```bash
pip install -r requirements.txt
```

### 2. Test Setup
```bash
python test_tiktok_setup.py
```

### 3. Run
```bash
python tiktok_username_changer.py
```

---

## 📋 Getting Your Session ID

### Chrome/Firefox:
1. Go to [tiktok.com](https://www.tiktok.com) (logged in)
2. Press `F12`
3. **Application** → **Cookies** → `tiktok.com`
4. Copy `sessionid` value

---

## 📊 Expected Results

| Output | Meaning |
|--------|---------|
| `✓ Username change successful!` | **It worked!** 🎉 |
| `Invalid signature` | X-Gorgon algorithm outdated |
| `Unauthorized` | Session ID expired/invalid |
| `Rate limit exceeded` | TikTok blocked your IP |

---

## 📖 Full Documentation

- **`CHANGES_SUMMARY.md`** - What was fixed and why
- **`TESTING_GUIDE.md`** - Detailed testing instructions
- **`TIKTOK_USAGE.md`** - Technical documentation

---

## 🔧 What Was Fixed

✅ Updated API versions (34.0.0 → 29.1.3, 28.2.4)  
✅ Multiple API domains (5 endpoints)  
✅ Enhanced headers (X-SS-REQ-TICKET, X-SS-DP, X-TT-TOKEN)  
✅ Realistic device IDs (19 digits)  
✅ Modern device type (iPhone 15)  
✅ Debug output for troubleshooting  
✅ Retry logic  

---

## ⚠️ Most Likely Result

**"Invalid signature" errors** → The X-Gorgon algorithm is outdated and needs reverse engineering from the latest TikTok app.

---

## 💡 What to Report

After testing, tell me:
1. Status code (200, 400, 401, 429)
2. Error message
3. Whether username actually changed

This helps determine the next fix!

---

## 📝 Files in This Update

```
tiktok_username_changer.py - Main script
test_tiktok_setup.py       - Setup validator
requirements.txt           - Dependencies
TESTING_GUIDE.md          - Step-by-step guide
TIKTOK_USAGE.md           - Technical docs
CHANGES_SUMMARY.md        - What changed
README_TIKTOK.md          - This file
```

---

## ⚖️ Legal

For educational purposes only. May result in account ban. You've been warned.
