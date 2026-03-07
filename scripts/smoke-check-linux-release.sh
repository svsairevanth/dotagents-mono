#!/usr/bin/env bash
set -euo pipefail

ARCH=""
DIST_DIR="apps/desktop/dist"

usage() {
  cat <<'EOF'
Usage: scripts/smoke-check-linux-release.sh --arch <x64|arm64> [--dist-dir <path>]

Checks:
  - SHA256SUMS verification
  - artifact presence and type
  - .deb metadata and extracted binary architecture
  - AppImage extraction and extracted binary architecture
EOF
}

normalize_arch() {
  case "$1" in
    x64|amd64|x86_64) echo "x64" ;;
    arm64|aarch64) echo "arm64" ;;
    *)
      echo "Unsupported architecture: $1" >&2
      exit 1
      ;;
  esac
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --arch)
      ARCH="$(normalize_arch "$2")"
      shift 2
      ;;
    --dist-dir)
      DIST_DIR="$2"
      shift 2
      ;;
    --help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 1
      ;;
  esac
done

if [[ -z "$ARCH" ]]; then
  echo "--arch is required" >&2
  usage >&2
  exit 1
fi

if [[ ! -d "$DIST_DIR" ]]; then
  echo "Dist directory not found: $DIST_DIR" >&2
  exit 1
fi

if [[ "$ARCH" == "x64" ]]; then
  DEB_ARCH="amd64"
else
  DEB_ARCH="arm64"
fi

shopt -s nullglob
appimages=("$DIST_DIR"/DotAgents-*-${ARCH}.AppImage)
debs=("$DIST_DIR"/DotAgents_*_${DEB_ARCH}.deb)
shopt -u nullglob

if [[ ${#appimages[@]} -ne 1 ]]; then
  echo "Expected exactly one ${ARCH} AppImage in $DIST_DIR" >&2
  exit 1
fi

if [[ ${#debs[@]} -ne 1 ]]; then
  echo "Expected exactly one ${DEB_ARCH} .deb in $DIST_DIR" >&2
  exit 1
fi

APPIMAGE="${appimages[0]}"
DEB="${debs[0]}"

echo "== Linux release smoke check =="
echo "dist dir: $DIST_DIR"
echo "arch: $ARCH"
echo "appimage: $(basename "$APPIMAGE")"
echo "deb: $(basename "$DEB")"

if [[ -f "$DIST_DIR/SHA256SUMS" ]]; then
  echo
  echo "## Verifying checksums"
  (cd "$DIST_DIR" && sha256sum -c SHA256SUMS)
fi

echo
echo "## Artifact file types"
file "$APPIMAGE" "$DEB"

echo
echo "## Debian package metadata"
dpkg-deb -I "$DEB"

tmpdir="$(mktemp -d)"
cleanup() { rm -rf "$tmpdir"; }
trap cleanup EXIT

echo
echo "## Debian extracted content"
dpkg-deb -x "$DEB" "$tmpdir/deb"
test -f "$tmpdir/deb/opt/DotAgents/dotagents"
test -f "$tmpdir/deb/opt/DotAgents/resources/bin/dotagents-rs"
test -f "$tmpdir/deb/usr/share/applications/dotagents.desktop"
file "$tmpdir/deb/opt/DotAgents/dotagents" "$tmpdir/deb/opt/DotAgents/resources/bin/dotagents-rs"
stat -c 'chrome-sandbox mode=%a path=%n' "$tmpdir/deb/opt/DotAgents/chrome-sandbox"

echo
echo "## AppImage extraction"
cp "$APPIMAGE" "$tmpdir/DotAgents.AppImage"
chmod +x "$tmpdir/DotAgents.AppImage"
(cd "$tmpdir" && ./DotAgents.AppImage --appimage-extract >/dev/null)
test -f "$tmpdir/squashfs-root/dotagents"
test -f "$tmpdir/squashfs-root/resources/bin/dotagents-rs"
file "$tmpdir/squashfs-root/dotagents" "$tmpdir/squashfs-root/resources/bin/dotagents-rs"

echo
echo "Smoke check complete."
echo "Next manual step: launch the .deb and AppImage in a real desktop session to validate tray, mic, hotkeys, MCP, and deep links."