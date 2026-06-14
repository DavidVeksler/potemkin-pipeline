# Build script:
# 1. Concatenate src/*.js files (in order) → wrap in IIFE → write hyperion.js
# 2. Inline hyperion.css + hyperion.js into hyperion.html → write index.html
# Output: index.html (no external requests, drop-in deployable / GitHub Pages root).

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
if (-not $root) {
  $root = (Get-Location).Path
}

# ---- Step 1: concatenate src/ files into hyperion.js ----

$srcFiles = @(
  "src\config.js",
  "src\rng.js",
  "src\content-banks\banks.js",
  "src\content-banks\snippets.js",
  "src\event-dsl.js",
  "src\state.js",
  "src\render\dom.js",
  "src\render\file-tree.js",
  "src\render\renderer.js",
  "src\render\overlay.js",
  "src\overlays\index.js",
  "src\missions\index.js",
  "src\dramas\simple.js",
  "src\dramas\boss.js",
  "src\dramas\git.js",
  "src\dramas\deep-work.js",
  "src\dramas\registry.js",
  "src\scheduler.js",
  "src\render\header.js",
  "src\ui\hotkeys.js",
  "src\ui\idle.js",
  "src\ui\scene-picker.js",
  "src\ui\config-dialog.js",
  "src\audio.js",
  "src\render\visibility.js",
  "src\main.js",
  "src\debug.js"
)

$parts = @('"use strict";', '(function(){')

foreach ($rel in $srcFiles) {
  $path = Join-Path $root $rel
  $parts += [System.IO.File]::ReadAllText($path)
}

$parts += '})();'

$js = $parts -join "`n"

$jsPath = Join-Path $root "hyperion.js"
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($jsPath, $js, $utf8NoBom)

Write-Host "built hyperion.js ($((Get-Item $jsPath).Length) bytes)"

# ---- Step 2: inline css + js into hyperion.html → index.html ----

$htmlPath = Join-Path $root "hyperion.html"
$cssPath  = Join-Path $root "hyperion.css"
$outPath  = Join-Path $root "index.html"

$html = [System.IO.File]::ReadAllText($htmlPath)
$css  = [System.IO.File]::ReadAllText($cssPath)

$html = $html.Replace(
  '<link rel="stylesheet" href="hyperion.css">',
  "<style>`n$css`n</style>"
)

$html = $html.Replace(
  '<script src="hyperion.js"></script>',
  "<script>`n$js`n</script>"
)

[System.IO.File]::WriteAllText($outPath, $html, $utf8NoBom)

$bytes = (Get-Item $outPath).Length
Write-Host "built index.html ($bytes bytes)"
