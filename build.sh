#!/bin/sh
# Build script:
# 1. Concatenate src/*.js files (in order) → wrap in IIFE → write hyperion.js
# 2. Inline hyperion.css + hyperion.js into hyperion.html → write index.html
# Output: index.html (no external requests, drop-in deployable / GitHub Pages root).
set -e
cd "$(dirname "$0")"

# ---- Step 1: concatenate src/ files into hyperion.js ----
{
  printf '"use strict";\n(function(){\n'
  cat \
    src/config.js \
    src/rng.js \
    "src/content-banks/banks.js" \
    "src/content-banks/snippets.js" \
    src/event-dsl.js \
    src/state.js \
    src/render/dom.js \
    src/render/file-tree.js \
    src/render/renderer.js \
    src/render/overlay.js \
    src/overlays/index.js \
    src/missions/index.js \
    src/dramas/simple.js \
    src/dramas/boss.js \
    src/dramas/git.js \
    src/dramas/deep-work.js \
    src/dramas/registry.js \
    src/scheduler.js \
    src/render/header.js \
    src/ui/hotkeys.js \
    src/ui/idle.js \
    src/ui/scene-picker.js \
    src/ui/config-dialog.js \
    src/audio.js \
    src/render/visibility.js \
    src/main.js \
    src/debug.js
  printf '\n})();\n'
} > hyperion.js

echo "built hyperion.js ($(wc -c < hyperion.js) bytes)"

# ---- Step 2: inline css + js into hyperion.html → index.html ----
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
