# Linux x64 Validation

Use this checklist on a separate Linux `x64` machine to validate the DotAgents desktop release artifacts.

## Goal

Confirm that Linux `x64` reaches the same release-quality bar as the validated `arm64` Linux release flow:

- `x64 .AppImage` builds successfully
- `x64 .deb` builds successfully
- checksums and manifest are generated
- install and launch behavior are clean in a real desktop session

## Build Commands

Run from the repository root on the `x64` machine:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm --filter @dotagents/desktop run build:linux:release:x64
```

## Artifact Checks

Expected outputs in `apps/desktop/dist`:

- `DotAgents-<version>-x64.AppImage`
- `DotAgents_<version>_amd64.deb`
- `SHA256SUMS`
- `linux-release-manifest.json`

Quick verification:

```bash
cd apps/desktop/dist
sha256sum -c SHA256SUMS
ls -lh DotAgents-*-x64.AppImage DotAgents_*_amd64.deb
file DotAgents-*-x64.AppImage DotAgents_*_amd64.deb
```

## Automated Smoke Check

Run the shared smoke-check helper:

```bash
bash scripts/smoke-check-linux-release.sh --arch x64
```

This verifies:

- checksums
- package architecture metadata
- extracted `.deb` contents
- AppImage extractability
- main binary and Rust helper architecture

## Real Desktop Validation

Run the following in an actual desktop session (not just headless SSH):

### Debian package

```bash
sudo apt install ./apps/desktop/dist/DotAgents_*_amd64.deb
dotagents
```

Verify:

- app opens successfully
- tray icon appears
- microphone capture works
- dictation works
- hotkeys work
- MCP/agent flow works
- deep-link/auth callback flow works

### AppImage

```bash
chmod +x apps/desktop/dist/DotAgents-*-x64.AppImage
./apps/desktop/dist/DotAgents-*-x64.AppImage
```

Verify:

- app launches in the desktop session
- tray appears
- core voice + MCP flows are usable

## Report Back

Please capture:

- distro and version
- desktop session type (`Wayland` or `X11`)
- whether `.deb` installed cleanly
- whether AppImage launched cleanly
- any tray, hotkey, mic, or MCP regressions

## Pass Criteria

Linux `x64` is considered validated when:

- build command exits `0`
- artifact smoke check passes
- `.deb` installs and launches
- AppImage launches
- core desktop behavior matches the Linux parity checklist