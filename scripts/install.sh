#!/usr/bin/env bash
# DotAgents Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/aj47/dotagents-mono/main/scripts/install.sh | bash
#
# Options (via env vars):
#   DOTAGENTS_FROM_SOURCE=1   Force build from source instead of downloading a release
#   DOTAGENTS_DIR=~/mydir     Custom install directory (default: ~/.dotagents)

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

info()  { printf "${CYAN}▸${NC} %s\n" "$*"; }
ok()    { printf "${GREEN}✔${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}⚠${NC} %s\n" "$*"; }
err()   { printf "${RED}✘${NC} %s\n" "$*" >&2; }
die()   { err "$*"; exit 1; }

# ── Detect OS & Arch ────────────────────────────────────────
detect_platform() {
  OS="$(uname -s)"
  ARCH="$(uname -m)"

  case "$OS" in
    Darwin) PLATFORM="mac" ;;
    Linux)  PLATFORM="linux" ;;
    MINGW*|MSYS*|CYGWIN*) PLATFORM="win" ;;
    *) die "Unsupported OS: $OS" ;;
  esac

  case "$ARCH" in
    x86_64|amd64)  ARCH="x64" ;;
    arm64|aarch64) ARCH="arm64" ;;
    *) die "Unsupported architecture: $ARCH" ;;
  esac
}

# ── Helpers ─────────────────────────────────────────────────
has() { command -v "$1" &>/dev/null; }

ensure_cmd() {
  has "$1" || die "Required command '$1' not found. Please install it first."
}

INSTALL_DIR="${DOTAGENTS_DIR:-$HOME/.dotagents}"
REPO="aj47/dotagents-mono"
REPO_URL="https://github.com/$REPO"
FROM_SOURCE="${DOTAGENTS_FROM_SOURCE:-0}"

# ── Download latest release ─────────────────────────────────
install_release() {
  info "Fetching latest release from GitHub..."

  RELEASE_JSON=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest")
  TAG=$(echo "$RELEASE_JSON" | grep '"tag_name"' | head -1 | sed 's/.*"tag_name": *"\([^"]*\)".*/\1/')

  if [ -z "$TAG" ]; then
    warn "Could not find a release. Falling back to building from source."
    install_from_source
    return
  fi

  info "Latest release: $TAG"

  # Find the right asset for this platform
  ASSET_URL=""
  case "$PLATFORM" in
    mac)
      ASSET_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep -i '\.dmg' | head -1 | sed 's/.*"\(https[^"]*\)".*/\1/')
      EXT="dmg"
      ;;
    linux)
      ASSET_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep -i '\.AppImage' | head -1 | sed 's/.*"\(https[^"]*\)".*/\1/')
      EXT="AppImage"
      ;;
    win)
      ASSET_URL=$(echo "$RELEASE_JSON" | grep '"browser_download_url"' | grep -i '\.exe' | head -1 | sed 's/.*"\(https[^"]*\)".*/\1/')
      EXT="exe"
      ;;
  esac

  if [ -z "$ASSET_URL" ]; then
    warn "No pre-built binary for $PLATFORM/$ARCH. Building from source."
    install_from_source
    return
  fi

  FILENAME="DotAgents.$EXT"
  mkdir -p "$INSTALL_DIR"

  info "Downloading $FILENAME..."
  curl -fSL --progress-bar -o "$INSTALL_DIR/$FILENAME" "$ASSET_URL"

  case "$PLATFORM" in
    mac)
      info "Mounting DMG..."
      MOUNT_DIR=$(hdiutil attach "$INSTALL_DIR/$FILENAME" -nobrowse -noverify | tail -1 | awk '{print $3}')
      APP_NAME=$(ls "$MOUNT_DIR" | grep -i '\.app$' | head -1)
      if [ -n "$APP_NAME" ]; then
        info "Installing $APP_NAME to /Applications..."
        cp -R "$MOUNT_DIR/$APP_NAME" /Applications/
        hdiutil detach "$MOUNT_DIR" -quiet
        rm "$INSTALL_DIR/$FILENAME"
        ok "DotAgents installed to /Applications/$APP_NAME"
        info "Open it from Applications or run: open /Applications/$APP_NAME"
      else
        hdiutil detach "$MOUNT_DIR" -quiet 2>/dev/null || true
        die "No .app found in DMG"
      fi
      ;;
    linux)
      chmod +x "$INSTALL_DIR/$FILENAME"
      # Symlink to ~/.local/bin if it exists
      if [ -d "$HOME/.local/bin" ]; then
        ln -sf "$INSTALL_DIR/$FILENAME" "$HOME/.local/bin/dotagents"
        ok "DotAgents installed! Run: dotagents"
      else
        ok "DotAgents installed to $INSTALL_DIR/$FILENAME"
        info "Run: $INSTALL_DIR/$FILENAME"
      fi
      ;;
    win)
      ok "Installer downloaded to $INSTALL_DIR/$FILENAME"
      info "Run the installer to complete setup."
      ;;
  esac
}

# ── Build from source ───────────────────────────────────────
install_from_source() {
  info "Installing from source..."

  # Check prerequisites
  ensure_cmd git
  ensure_cmd node

  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 20 ]; then
    die "Node.js 20+ required (found v$(node -v)). Install via: https://nodejs.org"
  fi

  if ! has pnpm; then
    info "Installing pnpm..."
    npm install -g pnpm
  fi

  # Clone or update
  if [ -d "$INSTALL_DIR/repo" ]; then
    info "Updating existing repo..."
    cd "$INSTALL_DIR/repo"
    git pull --ff-only origin main
  else
    info "Cloning $REPO..."
    mkdir -p "$INSTALL_DIR"
    git clone --depth 1 "$REPO_URL.git" "$INSTALL_DIR/repo"
    cd "$INSTALL_DIR/repo"
  fi

  info "Installing dependencies..."
  pnpm install

  info "Building shared packages..."
  pnpm build:shared

  # Build Rust binary if Rust is available
  if has cargo; then
    info "Building Rust native binary..."
    pnpm build-rs 2>/dev/null || warn "Rust build failed (optional — voice input may not work)"
  else
    warn "Rust not found. Skipping native binary build (voice input may not work)."
    warn "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
  fi

  # Create launcher script
  LAUNCHER="$INSTALL_DIR/dotagents"
  cat > "$LAUNCHER" << 'EOF'
#!/usr/bin/env bash
cd "$(dirname "$(readlink -f "$0" 2>/dev/null || echo "$0")")/repo" && exec pnpm dev "$@"
EOF
  chmod +x "$LAUNCHER"

  # Symlink to PATH
  if [ -d "$HOME/.local/bin" ]; then
    ln -sf "$LAUNCHER" "$HOME/.local/bin/dotagents"
    ok "DotAgents built from source! Run: dotagents"
  else
    mkdir -p "$HOME/.local/bin"
    ln -sf "$LAUNCHER" "$HOME/.local/bin/dotagents"
    ok "DotAgents built from source!"
    warn "Add ~/.local/bin to your PATH if 'dotagents' command is not found:"
    info '  export PATH="$HOME/.local/bin:$PATH"'
  fi

  info "Source directory: $INSTALL_DIR/repo"
  info "To update later: cd $INSTALL_DIR/repo && git pull && pnpm install && pnpm build:shared"
}

# ── Main ────────────────────────────────────────────────────
main() {
  printf "\n${BOLD}${CYAN}"
  printf "  ┌──────────────────────────────────┐\n"
  printf "  │     .a  DotAgents Installer       │\n"
  printf "  └──────────────────────────────────┘${NC}\n\n"

  detect_platform
  info "Detected: $PLATFORM/$ARCH"

  if [ "$FROM_SOURCE" = "1" ]; then
    install_from_source
  else
    install_release
  fi

  printf "\n${GREEN}${BOLD}Done!${NC} "
  printf "Documentation: ${CYAN}https://docs.dotagents.app${NC}\n\n"
}

main "$@"

