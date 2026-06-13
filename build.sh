#!/bin/sh
# Re-inline hyperion.css + hyperion.js into a standalone single-file build.
# Output: index.html (no external requests, drop-in deployable / GitHub Pages root).
set -e
cd "$(dirname "$0")"

awk '
  /<link rel="stylesheet" href="hyperion.css">/ {
    print "<style>"
    while ((getline line < "hyperion.css") > 0) print line
    close("hyperion.css")
    print "</style>"
    next
  }
  /<script src="hyperion.js"><\/script>/ {
    print "<script>"
    while ((getline line < "hyperion.js") > 0) print line
    close("hyperion.js")
    print "</script>"
    next
  }
  { print }
' hyperion.html > index.html

echo "built index.html ($(wc -c < index.html) bytes)"
