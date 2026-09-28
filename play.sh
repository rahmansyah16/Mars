#!/bin/sh
# Naruto: Seventh Dawn launcher for macOS / Linux.
# Lists your art files for the game, then opens it in your browser.
cd "$(dirname "$0")" || exit 1
echo "NARUTO: SEVENTH DAWN (unofficial fan game, 18+)"
sh tools/scan-assets.sh
if command -v xdg-open >/dev/null 2>&1; then
  xdg-open index.html >/dev/null 2>&1 &
elif command -v open >/dev/null 2>&1; then
  open index.html
else
  echo "Open index.html in your web browser."
fi
