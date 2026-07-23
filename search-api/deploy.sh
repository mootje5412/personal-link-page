#!/bin/bash
set -euo pipefail

APP_DIR="/root/search-api"
SERVICE_NAME="search-api"

echo "Deploying People Search API"
echo "==========================="

if [ ! -f ".env" ]; then
  cp .env.example .env
  SECRET=$(python3 - <<'PY'
import secrets
print(secrets.token_urlsafe(32))
PY
)
  sed -i "s|change-this-to-a-long-random-secret|${SECRET}|" .env
  echo "Created .env with a new API key."
fi

python3 -m venv venv 2>/dev/null || {
  apt-get update -qq && apt-get install -y -qq python3-venv python3-pip
  python3 -m venv venv
}
./venv/bin/pip install -r requirements.txt

mkdir -p data

cat > /etc/systemd/system/${SERVICE_NAME}.service <<EOF
[Unit]
Description=People Search API
After=network.target

[Service]
Type=simple
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=${APP_DIR}/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8080
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable ${SERVICE_NAME}
systemctl restart ${SERVICE_NAME}

sleep 2

if systemctl is-active --quiet ${SERVICE_NAME}; then
  API_KEY=$(grep '^API_KEY=' .env | cut -d= -f2-)
  echo ""
  echo "API is running."
  echo ""
  echo "Health:"
  echo "  curl http://127.0.0.1:8080/api/health"
  echo ""
  echo "Search link example:"
  echo "  curl \"http://YOUR_SERVER_IP:8080/api/search?first_name=Ege&last_name=Tevkir\" \\"
  echo "    -H \"X-API-Key: ${API_KEY}\""
  echo ""
  echo "Your API key (keep private):"
  echo "  ${API_KEY}"
else
  echo "Service failed to start. Check logs:"
  echo "  journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
  exit 1
fi
