# People Search API — Server Commands

## Install (Termius / phone — copy all lines)

```bash
rm -rf /tmp/personal-link-page
mkdir -p ~/search-api
cd /tmp
git clone https://github.com/mootje5412/personal-link-page.git
cp -r personal-link-page/search-api/* ~/search-api/
cd ~/search-api
sed -i 's/\r$//' deploy.sh install.sh remove-old-bot.sh 2>/dev/null || true
chmod +x deploy.sh install.sh remove-old-bot.sh
bash install.sh
```

If `./deploy.sh` says "required file not found", run:

```bash
sed -i 's/\r$//' ~/search-api/*.sh
bash ~/search-api/install.sh
```

## Import your XLSX or CSV

Your file columns are supported automatically:

`Name`, `Surname`, `Phone Number`, `E-Mail Contact`

Upload your file to the server, then run:

```bash
cd ~/search-api
./venv/bin/pip install -r requirements.txt
./venv/bin/python import_data.py /root/your-file.xlsx --replace
systemctl restart search-api
```

Or CSV/TSV:

```bash
./venv/bin/python import_data.py /root/your-file.csv --replace
```

Check record count:

```bash
curl http://127.0.0.1:8080/api/health
```

## Search links (no API key)

By email:

```
http://YOUR_SERVER_IP:8080/api/search?email=alemm_07@hotmail.com
```

By phone:

```
http://YOUR_SERVER_IP:8080/api/search?phone=905331657436
```

By first + last name:

```
http://YOUR_SERVER_IP:8080/api/search?first_name=Gokhan&last_name=al
```

Combined:

```
http://YOUR_SERVER_IP:8080/api/search?first_name=Gokhan&last_name=al&email=alemm_07@hotmail.com
```

## Restart / logs

```bash
systemctl restart search-api
journalctl -u search-api -f
```

## Remove old Telegram bot

```bash
pkill -9 -f "node index.js"
rm -rf ~/findnow-bot
```
