# coding:utf-8
import hashlib
import json
from time import time
from hashlib import md5
from copy import deepcopy
from random import choice, randint
from termcolor import colored
import requests


secure_tools = """\
                                                                                              
  ____  ____ ____    ____  _                 
 |  _ \/ ___/ ___|  / ___|| |_ ___  _ __ ___ 
 | |_) \___ \___ \  \___ \| __/ _ \| '__/ _ \
 |  _ < ___) |__) |  ___) | || (_) | | |  __/
 |_| \_\____/____/  |____/ \__\___/|_|  \___|

"""


made_by_rss = "Edit by RSS Store - Updated Version"

Tik_tok = "TikTok UserName Changer "

print(colored(secure_tools, "cyan"))
print(colored(Tik_tok, "green"))
print(colored(made_by_rss, "yellow"))


def hex_string(num):
    tmp_string = hex(num)[2:]
    if len(tmp_string) < 2:
        tmp_string = "0" + tmp_string
    return tmp_string


def reverse(num):
    tmp_string = hex(num)[2:]
    if len(tmp_string) < 2:
        tmp_string = "0" + tmp_string
    return int(tmp_string[1:] + tmp_string[:1], 16)


def RBIT(num):
    result = ""
    tmp_string = bin(num)[2:]
    while len(tmp_string) < 8:
        tmp_string = "0" + tmp_string
    for i in range(0, 8):
        result = result + tmp_string[7 - i]
    return int(result, 2)


class XG:
    def __init__(self, debug):
        self.length = 0x14
        self.debug = debug
        self.hex_CE0 = [
            0x05,
            0x00,
            0x50,
            choice(range(0, 0xFF)),
            0x47,
            0x1E,
            0x00,
            8 * choice(range(0, 0x1F)),
        ]

    def addr_BA8(self):
        tmp = ""
        hex_BA8 = []
        for i in range(0x0, 0x100):
            hex_BA8.append(i)
        for i in range(0, 0x100):
            if i == 0:
                A = 0
            elif tmp:
                A = tmp
            else:
                A = hex_BA8[i - 1]
            B = self.hex_CE0[i % 0x8]
            if A == 0x05:
                if i != 1:
                    if tmp != 0x05:
                        A = 0
            C = A + i + B
            while C >= 0x100:
                C = C - 0x100
            if C < i:
                tmp = C
            else:
                tmp = ""
            D = hex_BA8[C]
            hex_BA8[i] = D
        return hex_BA8

    def initial(self, debug, hex_BA8):
        tmp_add = []
        tmp_hex = deepcopy(hex_BA8)
        for i in range(self.length):
            A = debug[i]
            if not tmp_add:
                B = 0
            else:
                B = tmp_add[-1]
            C = hex_BA8[i + 1] + B
            while C >= 0x100:
                C = C - 0x100
            tmp_add.append(C)
            D = tmp_hex[C]
            tmp_hex[i + 1] = D
            E = D + D
            while E >= 0x100:
                E = E - 0x100
            F = tmp_hex[E]
            G = A ^ F
            debug[i] = G
        return debug

    def calculate(self, debug):
        for i in range(self.length):
            A = debug[i]
            B = reverse(A)
            C = debug[(i + 1) % self.length]
            D = B ^ C
            E = RBIT(D)
            F = E ^ self.length
            G = ~F
            while G < 0:
                G += 0x100000000
            H = int(hex(G)[-2:], 16)
            debug[i] = H
        return debug

    def main(self):
        result = ""
        for item in self.calculate(self.initial(self.debug, self.addr_BA8())):
            result = result + hex_string(item)

        return "8402{}{}{}{}{}".format(
            hex_string(self.hex_CE0[7]),
            hex_string(self.hex_CE0[3]),
            hex_string(self.hex_CE0[1]),
            hex_string(self.hex_CE0[6]),
            result,
        )


def getxg(param="", stub="", cookie=""):
    gorgon = []
    ttime = time()

    url_md5 = md5(bytearray(param, "utf-8")).hexdigest()
    for i in range(0, 4):
        gorgon.append(int(url_md5[2 * i : 2 * i + 2], 16))

    if stub:
        for i in range(0, 4):
            gorgon.append(int(stub[2 * i : 2 * i + 2], 16))
    else:
        for i in range(0, 4):
            gorgon.append(0x0)

    if cookie:
        cookie_md5 = md5(bytearray(cookie, "utf-8")).hexdigest()
        for i in range(0, 4):
            gorgon.append(int(cookie_md5[2 * i : 2 * i + 2], 16))
    else:
        for i in range(0, 4):
            gorgon.append(0x0)

    gorgon = gorgon + [0x0, 0x8, 0x10, 0x9]

    Khronos = hex(int(ttime))[2:]
    for i in range(0, 4):
        gorgon.append(int(Khronos[2 * i : 2 * i + 2], 16))

    return {"X-Gorgon": XG(gorgon).main(), "X-Khronos": str(int(ttime))}


def get_stub(data):
    if isinstance(data, dict):
        data = json.dumps(data)

    if isinstance(data, str):
        data = data.encode(encoding="utf-8")
    if data == None or data == "" or len(data) == 0:
        return "00000000000000000000000000000000"

    m = hashlib.md5()
    m.update(data)
    res = m.hexdigest()
    res = res.upper()
    return res


def getxg_m(param, data):
    """Generate X-Gorgon and X-Khronos headers based on parameters."""
    return getxg(param, hashlib.md5(data.encode()).hexdigest() if data else None, None)


def get_profile(session_id, device_id, iid):
    """Fetch TikTok profile with multiple API version attempts."""
    
    # Updated version numbers to more recent values
    version_configs = [
        {
            "version_code": "290103",
            "version_name": "29.1.3",
            "manifest_version_code": "2023901030",
            "build_number": "291030",
        },
        {
            "version_code": "280204",
            "version_name": "28.2.4",
            "manifest_version_code": "2023802040",
            "build_number": "282040",
        },
        {
            "version_code": "340002",
            "version_name": "34.0.0",
            "manifest_version_code": "2023400020",
            "build_number": "340002",
        },
    ]
    
    # Try multiple API domains
    api_domains = [
        "api16-normal-c-useast1a.tiktokv.com",
        "api19-normal-c-useast1a.tiktokv.com",
        "api22-normal-c-useast1a.tiktokv.com",
        "api16.tiktokv.com",
        "api19.tiktokv.com",
    ]
    
    for domain in api_domains:
        for config in version_configs:
            try:
                data = None
                
                # Updated parameters with more recent values
                parm = (
                    f"device_id={device_id}&iid={iid}&id=kaa"
                    f"&version_code={config['version_code']}"
                    f"&language=en&app_name=musical_ly&app_version={config['version_name']}"
                    f"&carrier_region=US&tz_offset=-14400&mcc_mnc=310260"
                    f"&locale=en&sys_region=US&aid=1233"
                    f"&screen_width=1284&os_api=18&ac=WIFI&os_version=17.4.1"
                    f"&app_language=en&tz_name=America/New_York"
                    f"&carrier_region1=US&build_number={config['build_number']}"
                    f"&device_platform=iphone&device_type=iPhone15,2"
                    f"&manifest_version_code={config['manifest_version_code']}"
                )
                
                sig = getxg_m(parm, data)
                url = f"https://{domain}/aweme/v1/user/profile/self/?{parm}"
                
                headers = {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Cookie": f"sessionid={session_id}",
                    "sdk-version": "2",
                    "user-agent": f"com.zhiliaoapp.musically/{config['version_code']} (iPhone; iOS 17.4.1; Scale/3.00)",
                    "X-Gorgon": sig["X-Gorgon"],
                    "X-Khronos": sig["X-Khronos"],
                    "X-SS-REQ-TICKET": str(int(time() * 1000)),
                    "X-SS-DP": "1233",
                    "X-TT-TOKEN": "00",
                }
                
                response = requests.get(
                    url,
                    headers=headers,
                    cookies={"sessionid": session_id},
                    timeout=10
                )
                
                print(f"\n[DEBUG] Domain: {domain}, Version: {config['version_name']}")
                print(f"[DEBUG] Status Code: {response.status_code}")
                print(f"[DEBUG] Response: {response.text[:500]}")
                
                if response.status_code == 200 and "user" in response.json():
                    return response.json()["user"]["unique_id"]
                    
            except Exception as e:
                print(f"[ERROR] {domain} with version {config.get('version_name')}: {str(e)}")
                continue
    
    return "None"


def check_is_changed(last_username, session_id, device_id, iid):
    """Check if the username has been changed in the TikTok profile."""
    current_username = get_profile(session_id, device_id, iid)
    if current_username != "None" and current_username != last_username:
        return True
    return False


def change_username(session_id, device_id, iid, last_username, new_username):
    """Attempt to change a TikTok username with multiple API attempts."""
    from urllib.parse import quote
    
    version_configs = [
        {
            "version_code": "290103",
            "version_name": "29.1.3",
            "manifest_version_code": "2023901030",
            "build_number": "291030",
        },
        {
            "version_code": "280204",
            "version_name": "28.2.4",
            "manifest_version_code": "2023802040",
            "build_number": "282040",
        },
    ]
    
    api_domains = [
        "api16-normal-c-useast1a.tiktokv.com",
        "api19-normal-c-useast1a.tiktokv.com",
        "api22-normal-c-useast1a.tiktokv.com",
        "api16.tiktokv.com",
    ]
    
    for domain in api_domains:
        for config in version_configs:
            try:
                data = f"unique_id={quote(new_username)}"
                
                parm = (
                    f"device_id={device_id}&iid={iid}&residence=US"
                    f"&version_name={config['version_name']}"
                    f"&os_version=17.4.1&app_name=musical_ly&locale=en&ac=WIFI"
                    f"&sys_region=US&version_code={config['version_code']}"
                    f"&channel=App%20Store&op_region=US&os_api=18"
                    f"&device_brand=iphone&idfv={iid}-1ED5-4350-9318-77A1469C0B89"
                    f"&device_platform=iphone&device_type=iPhone15,2"
                    f"&carrier_region1=US&tz_name=America/New_York"
                    f"&account_region=us&build_number={config['build_number']}"
                    f"&tz_offset=-14400&app_language=en&carrier_region=US"
                    f"&current_region=US&aid=1233&mcc_mnc=310260"
                    f"&screen_width=1284&uoo=1&content_language=en"
                    f"&language=en&cdid={iid}&openudid={iid}"
                    f"&app_version={config['version_name']}"
                    f"&manifest_version_code={config['manifest_version_code']}"
                )
                
                sig = getxg_m(parm, data)
                
                url = f"https://{domain}/aweme/v1/commit/user/?{parm}"
                
                headers = {
                    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "Cookie": f"sessionid={session_id}",
                    "sdk-version": "2",
                    "user-agent": f"com.zhiliaoapp.musically/{config['version_code']} (iPhone; iOS 17.4.1; Scale/3.00)",
                    "X-Gorgon": sig["X-Gorgon"],
                    "X-Khronos": sig["X-Khronos"],
                    "X-SS-REQ-TICKET": str(int(time() * 1000)),
                    "X-SS-DP": "1233",
                    "X-TT-TOKEN": "00",
                }
                
                response = requests.post(url, data=data, headers=headers, timeout=10)
                result = response.text
                
                print(f"\n[DEBUG] Domain: {domain}, Version: {config['version_name']}")
                print(f"[DEBUG] Status Code: {response.status_code}")
                print(f"[DEBUG] Response: {result[:500]}")
                
                if "unique_id" in result:
                    print("[INFO] Checking if username actually changed...")
                    if check_is_changed(last_username, session_id, device_id, iid):
                        return "✓ Username change successful!"
                    else:
                        return "⚠ API responded OK but username didn't change. Response: " + result[:200]
                        
            except Exception as e:
                print(f"[ERROR] {domain} with version {config.get('version_name')}: {str(e)}")
                continue
    
    return "✗ Failed to change username on all attempted API versions/domains."


def main():
    print("\n" + "="*60)
    print("TikTok Username Changer - Updated Version")
    print("="*60 + "\n")
    
    # Generate more realistic device IDs
    device_id = str(randint(7000000000000000000, 7999999999999999999))
    iid = str(randint(7000000000000000000, 7999999999999999999))
    
    print(f"[INFO] Generated Device ID: {device_id}")
    print(f"[INFO] Generated Installation ID: {iid}\n")
    
    session_id = input(colored("Enter your TikTok sessionid: ", "red"))
    
    if not session_id or len(session_id) < 20:
        print(colored("✗ Invalid session ID. It should be a long string from your TikTok cookies.", "red"))
        return
    
    print(colored("\n[INFO] Fetching your current username...", "yellow"))
    user = get_profile(session_id, device_id, iid)
    
    if user != "None":
        print(colored(f"\n✓ Your current TikTok username is: {user}", "green"))
        new_username = input(colored("\nEnter the new username you wish to set: ", "cyan"))
        
        if not new_username or len(new_username) < 2:
            print(colored("✗ Invalid username.", "red"))
            return
            
        print(colored("\n[INFO] Attempting to change username...", "yellow"))
        result = change_username(session_id, device_id, iid, user, new_username)
        print("\n" + colored(result, "green" if "successful" in result else "red"))
    else:
        print(colored("\n✗ Failed to fetch profile. Possible reasons:", "red"))
        print("  1. Invalid or expired session_id")
        print("  2. TikTok API has changed significantly")
        print("  3. Your IP is rate-limited/blocked")
        print("  4. Account requires additional verification")


if __name__ == "__main__":
    main()
