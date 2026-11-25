#!/usr/bin/env sh
# Render statik sayti build paytida API manzilini config.js ga yozadi.
# KONS_API_HOST — backend servisining domeni (render.yaml da avtomatik beriladi).
set -e
cd "$(dirname "$0")/.."
if [ -n "$KONS_API_HOST" ]; then
  printf "window.KONS_API = 'https://%s';\n" "$KONS_API_HOST" > config.js
else
  printf "window.KONS_API = '';\n" > config.js
fi
echo "config.js:"; cat config.js
