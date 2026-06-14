# Re-inline hyperion.css + hyperion.js into a standalone single-file build.
# Output: index.html (no external requests, drop-in deployable / GitHub Pages root).

$ErrorActionPreference = "Stop"

$root = $PSScriptRoot
if (-not $root) {
  $root = (Get-Location).Path
}

$htmlPath = Join-Path $root "hyperion.html"
$cssPath  = Join-Path $root "hyperion.css"
$jsPath   = Join-Path $root "hyperion.js"
$outPath  = Join-Path $root "index.html"

$html = [System.IO.File]::ReadAllText($htmlPath)
$css  = [System.IO.File]::ReadAllText($cssPath)
$js   = [System.IO.File]::ReadAllText($jsPath)

$html = $html.Replace(
  '<link rel="stylesheet" href="hyperion.css">',
  "<style>`n$css`n</style>"
)

$html = $html.Replace(
  '<script src="hyperion.js"></script>',
  "<script>`n$js`n</script>"
)

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, $html, $utf8NoBom)

$bytes = (Get-Item $outPath).Length
Write-Host "built index.html ($bytes bytes)"