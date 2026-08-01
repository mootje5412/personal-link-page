#!/bin/bash

echo "Gezochte Mensen Odido Zoeker - Herstart"
echo "========================================"
echo ""

echo "Bot herstarten via pm2..."
pm2 restart odido-zoeker || pm2 start /root/odido-zoeker/index.js --name odido-zoeker
pm2 save

sleep 2
pm2 status odido-zoeker
pm2 logs odido-zoeker --lines 15 --nostream
