#!/usr/bin/env sh
set -eu

cd /root/search-api

apt-get update -qq
apt-get install -y -qq python3-venv python3-pip

python3 -m venv venv
./venv/bin/pip install -r requirements.txt
mkdir -p databases data

cat > /etc/systemd/system/search-api.service <<'EOF'
[Unit]
Description=Search API
After=network.target

[Service]
WorkingDirectory=/root/search-api
ExecStart=/root/search-api/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable search-api
systemctl restart search-api

echo "Done. Put CSV/XLSX files in /root/search-api/databases/"
echo "Then run: cd /root/search-api && ./venv/bin/python import_data.py --replace"
echo "Test: curl http://127.0.0.1:8080/api/health"
