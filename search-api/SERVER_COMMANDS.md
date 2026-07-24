# People Search API — Server Commands

## Install (clone the correct branch)

```bash
rm -rf ~/search-api /tmp/personal-link-page
mkdir -p ~/search-api
cd /tmp
git clone -b cursor/people-search-api-649a https://github.com/mootje5412/personal-link-page.git
cp -r personal-link-page/search-api/* ~/search-api/
cd ~/search-api
chmod +x deploy.sh remove-old-bot.sh
./deploy.sh
```

## Remove old Telegram bot

```bash
cd ~/search-api
./remove-old-bot.sh
rm -rf ~/findnow-bot
```

## API links (no API key needed)

Health:

```bash
curl http://YOUR_SERVER_IP:8080/api/health
```

Search by phone:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?phone=0612345678"
```

Search by first + last name:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?first_name=Ege&last_name=Tevkir"
```

Search by identity number:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?identity_number=AB123456"
```

Combined:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?phone=0612345678&first_name=John&last_name=Doe&identity_number=XY987654"
```

## Import your database

CSV columns:
`first_name,last_name,phone,identity_number,email,city,country,source,notes`

```bash
cd ~/search-api
./venv/bin/python import_csv.py your-data.csv
```

## Restart / logs

```bash
systemctl restart search-api
journalctl -u search-api -f
```
