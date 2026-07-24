#!/bin/sh
set -eu

cd /tmp
rm -rf personal-link-page
git clone https://github.com/mootje5412/personal-link-page.git
cp personal-link-page/search-api/main.py personal-link-page/search-api/requirements.txt personal-link-page/search-api/run.sh personal-link-page/search-api/restart.sh /root/search-api/

cd /root/search-api
bash restart.sh
