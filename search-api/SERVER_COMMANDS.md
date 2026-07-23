# People Search API — Server Commands

Only the API URL is shared with users. Source code stays on your server.

## 1. Remove old Telegram bot

```bash
cd ~/search-api
chmod +x remove-old-bot.sh
./remove-old-bot.sh
rm -rf ~/findnow-bot
```

## 2. Upload and install API

```bash
mkdir -p ~/search-api
cd ~/search-api
git clone https://github.com/mootje5412/personal-link-page.git /tmp/repo
cp -r /tmp/repo/search-api/* ~/search-api/
chmod +x deploy.sh remove-old-bot.sh
./deploy.sh
```

Or if already cloned:

```bash
cd ~/personal-link-page
git pull
cp -r search-api/* ~/search-api/
cd ~/search-api
./deploy.sh
```

## 3. API links (replace YOUR_SERVER_IP and YOUR_API_KEY)

Health:

```bash
curl http://YOUR_SERVER_IP:8080/api/health
```

Search by phone:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?phone=0612345678" \
  -H "X-API-Key: YOUR_API_KEY"
```

Search by first + last name:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?first_name=Ege&last_name=Tevkir" \
  -H "X-API-Key: YOUR_API_KEY"
```

Search by identity number:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?identity_number=AB123456" \
  -H "X-API-Key: YOUR_API_KEY"
```

Combined search:

```bash
curl "http://YOUR_SERVER_IP:8080/api/search?phone=0612345678&first_name=John&last_name=Doe&identity_number=XY987654" \
  -H "X-API-Key: YOUR_API_KEY"
```

POST JSON:

```bash
curl -X POST "http://YOUR_SERVER_IP:8080/api/search" \
  -H "X-API-Key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"phone":"0612345678","first_name":"John","last_name":"Doe","identity_number":"XY987654"}'
```

## 4. Add your own database records

Edit `sample-import.csv` or create your CSV with columns:

`first_name,last_name,phone,identity_number,email,city,country,source,notes`

Import:

```bash
cd ~/search-api
./venv/bin/python import_csv.py your-data.csv
```

## 5. Restart / logs

```bash
systemctl restart search-api
journalctl -u search-api -f
```

Get your API key:

```bash
grep '^API_KEY=' ~/search-api/.env
```

## Response example

```json
{
  "success": true,
  "query": {
    "phone": null,
    "first_name": "Ege",
    "last_name": "Tevkir",
    "identity_number": null
  },
  "total": 1,
  "results": [
    {
      "id": 1,
      "first_name": "Ege",
      "last_name": "Tevkir",
      "full_name": "Ege Tevkir",
      "phone": "+31612345678",
      "identity_number": "AB123456",
      "email": "ege.tevkir@example.com",
      "city": "Amsterdam",
      "country": "NL",
      "source": "sample",
      "notes": "Demo record only"
    }
  ],
  "elapsed_ms": 1.24
}
```
