#!/bin/sh
set -eu

APP_DIR="/root/search-api"
SERVICE_NAME="search-api"

cd "$APP_DIR"

echo "Deploying People Search API..."

if [ ! -f ".env" ]; then
  cp .env.example .env
fi

if ! python3 -m venv venv 2>/dev/null; then
  apt-get update -qq
  apt-get install -y -qq python3-venv python3-pip
  python3 -m venv venv
fi

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
  echo "OK - API running on port 8080"
  echo "Test: curl http://127.0.0.1:8080/api/health"
else
  echo "FAILED - check: journalctl -u ${SERVICE_NAME} -n 50 --no-pager"
  exit 1
fi
