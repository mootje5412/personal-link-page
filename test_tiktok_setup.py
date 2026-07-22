#!/usr/bin/env python3
# coding:utf-8
"""
Quick test script to verify TikTok username changer dependencies and basic functionality
"""

import sys

def test_imports():
    """Test if all required modules can be imported"""
    print("Testing imports...")
    
    missing = []
    
    try:
        import requests
        print("✓ requests module found")
    except ImportError:
        print("✗ requests module missing")
        missing.append("requests")
    
    try:
        import termcolor
        print("✓ termcolor module found")
    except ImportError:
        print("✗ termcolor module missing")
        missing.append("termcolor")
    
    try:
        import hashlib
        print("✓ hashlib module found (built-in)")
    except ImportError:
        print("✗ hashlib module missing")
        missing.append("hashlib")
    
    if missing:
        print(f"\n⚠ Missing modules: {', '.join(missing)}")
        print("Install with: pip install " + " ".join(missing))
        return False
    
    print("\n✓ All required modules available\n")
    return True


def test_xg_algorithm():
    """Test the X-Gorgon algorithm basics"""
    print("Testing X-Gorgon algorithm...")
    
    try:
        from tiktok_username_changer import XG, getxg
        
        # Test basic XG generation
        test_data = [0x05, 0x00, 0x50, 0x47, 0x47, 0x1E, 0x00, 0x08, 
                     0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
                     0x00, 0x08, 0x10, 0x09]
        
        xg = XG(test_data)
        result = xg.main()
        
        if result and result.startswith("8402"):
            print(f"✓ X-Gorgon generation working")
            print(f"  Sample output: {result[:20]}...")
        else:
            print("✗ X-Gorgon generation failed")
            return False
        
        # Test getxg function
        headers = getxg("test_param=123", None, None)
        if "X-Gorgon" in headers and "X-Khronos" in headers:
            print(f"✓ getxg() function working")
            print(f"  X-Khronos: {headers['X-Khronos']}")
        else:
            print("✗ getxg() function failed")
            return False
        
        print("\n✓ X-Gorgon algorithm functional\n")
        return True
        
    except Exception as e:
        print(f"✗ Error testing X-Gorgon: {e}")
        return False


def test_network():
    """Test basic network connectivity"""
    print("Testing network connectivity...")
    
    try:
        import requests
        
        # Test basic HTTPS
        response = requests.get("https://www.google.com", timeout=5)
        if response.status_code == 200:
            print("✓ HTTPS connectivity working")
        else:
            print(f"⚠ Unexpected status code: {response.status_code}")
        
        # Try to reach TikTok (will likely fail but tests DNS/routing)
        try:
            response = requests.get("https://api16.tiktokv.com", timeout=5)
            print(f"✓ Can reach TikTok API domain (status: {response.status_code})")
        except requests.exceptions.RequestException as e:
            print(f"⚠ Cannot reach TikTok API: {type(e).__name__}")
            print("  (This is expected if testing from certain IPs/regions)")
        
        print("\n✓ Basic network functional\n")
        return True
        
    except Exception as e:
        print(f"✗ Network test error: {e}")
        return False


def display_usage_reminder():
    """Display usage instructions"""
    print("="*60)
    print("USAGE INSTRUCTIONS")
    print("="*60)
    print("\nTo use the TikTok username changer:")
    print("\n1. Get your session ID from TikTok:")
    print("   - Open tiktok.com in your browser")
    print("   - Press F12 → Application → Cookies → tiktok.com")
    print("   - Copy the 'sessionid' value")
    print("\n2. Run the main script:")
    print("   python tiktok_username_changer.py")
    print("\n3. Paste your session ID when prompted")
    print("\n⚠ WARNING: Use a test account, NOT your main account!")
    print("=" * 60)


def main():
    print("\n" + "="*60)
    print("TikTok Username Changer - Setup Test")
    print("="*60 + "\n")
    
    all_passed = True
    
    # Run tests
    if not test_imports():
        all_passed = False
        print("\n⚠ Install missing dependencies first:")
        print("   pip install -r requirements.txt\n")
        sys.exit(1)
    
    if not test_xg_algorithm():
        all_passed = False
    
    if not test_network():
        all_passed = False
    
    # Summary
    if all_passed:
        print("\n" + "="*60)
        print("✓ ALL TESTS PASSED - System is ready")
        print("="*60 + "\n")
        display_usage_reminder()
        sys.exit(0)
    else:
        print("\n" + "="*60)
        print("⚠ SOME TESTS FAILED - Check errors above")
        print("="*60 + "\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
