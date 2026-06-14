#!/bin/sh
# Build the Potemkin Pipeline macOS screensaver (.saver bundle).
#
#   ./build-saver.sh            build "Potemkin Pipeline.saver" in the repo root
#   ./build-saver.sh --install  also copy it to ~/Library/Screen Savers/ and open it
#
# The .saver is a loadable Cocoa bundle: a ScreenSaverView subclass (screensaver/
# PotemkinSaver.swift) that hosts a WKWebView rendering the inlined single-file app.
# index.html is bundled verbatim as a resource, so re-running ./build.sh then this
# script ships the latest app without touching the Swift.
set -e
cd "$(dirname "$0")"

NAME="Potemkin Pipeline"
EXEC="PotemkinPipeline"           # must match CFBundleExecutable in screensaver/Info.plist
SAVER="$NAME.saver"
SRC="screensaver/PotemkinSaver.swift"
PLIST="screensaver/Info.plist"

[ -f index.html ] || { echo "index.html missing — run ./build.sh first" >&2; exit 1; }
command -v swiftc >/dev/null 2>&1 || { echo "swiftc not found — install Xcode Command Line Tools (xcode-select --install)" >&2; exit 1; }

echo "building $SAVER…"
rm -rf "$SAVER"
mkdir -p "$SAVER/Contents/MacOS" "$SAVER/Contents/Resources"

cp "$PLIST" "$SAVER/Contents/Info.plist"
cp index.html "$SAVER/Contents/Resources/index.html"
printf 'BNDL????' > "$SAVER/Contents/PkgInfo"

# Compile a universal loadable bundle so it runs on Apple Silicon and Intel.
DEPLOY=11.0
build_arch() {
  swiftc -O -emit-library -module-name "$EXEC" \
    -target "$1-apple-macos$DEPLOY" \
    -framework ScreenSaver -framework WebKit -framework AppKit \
    -o "$2" "$SRC"
}

if build_arch arm64 "$SAVER/Contents/MacOS/$EXEC.arm64" 2>/dev/null \
   && build_arch x86_64 "$SAVER/Contents/MacOS/$EXEC.x86_64" 2>/dev/null; then
  lipo -create "$SAVER/Contents/MacOS/$EXEC.arm64" "$SAVER/Contents/MacOS/$EXEC.x86_64" \
    -output "$SAVER/Contents/MacOS/$EXEC"
  rm -f "$SAVER/Contents/MacOS/$EXEC.arm64" "$SAVER/Contents/MacOS/$EXEC.x86_64"
  echo "  universal binary (arm64 + x86_64)"
else
  # Fall back to host architecture only.
  rm -f "$SAVER/Contents/MacOS/$EXEC.arm64" "$SAVER/Contents/MacOS/$EXEC.x86_64"
  HOST="$(uname -m)"
  build_arch "$HOST" "$SAVER/Contents/MacOS/$EXEC"
  echo "  $HOST binary (cross-compile unavailable)"
fi

# Ad-hoc sign so recent macOS will load the bundle.
codesign --force --deep --sign - "$SAVER" >/dev/null 2>&1 \
  && echo "  ad-hoc signed" || echo "  WARNING: codesign failed — bundle may be blocked"

echo "built $SAVER"

if [ "$1" = "--install" ]; then
  DEST="$HOME/Library/Screen Savers"
  mkdir -p "$DEST"
  rm -rf "$DEST/$SAVER"
  cp -R "$SAVER" "$DEST/$SAVER"
  echo "installed to $DEST/$SAVER"
  open "$DEST/$SAVER"   # opens System Settings → Screen Saver to select it
fi
