#!/bin/bash
set -e

# Install Zig toolchain (needed for OpenTUI in milestone 3+)
if ! command -v zig &> /dev/null; then
  echo "Installing Zig toolchain via Homebrew..."
  brew install zig
fi

# Install dependencies
pnpm install

# Build shared package (dependency for everything)
pnpm --filter @dotagents/shared build

# Build core package if it exists (dependency for desktop and cli)
if [ -d "packages/core" ]; then
  pnpm --filter @dotagents/core build 2>/dev/null || true
fi

echo "Environment setup complete."
