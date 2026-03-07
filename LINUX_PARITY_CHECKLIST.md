# Linux Parity Checklist

Use this checklist before calling a Linux release "official" or "full parity".

## Release Gating Rule

Linux parity is blocked unless **all four** release artifacts exist and are validated:

- [ ] `linux-x64 .deb`
- [ ] `linux-x64 .AppImage`
- [ ] `linux-arm64 .deb`
- [ ] `linux-arm64 .AppImage`

## Packaging and Distribution

- [ ] artifact names clearly include architecture
- [ ] checksums are generated for all Linux artifacts
- [ ] `.deb` install succeeds on supported systems
- [ ] `.deb` uninstall/removal succeeds cleanly
- [ ] `.AppImage` launches after `chmod +x`
- [ ] desktop entry / icon integration is correct
- [ ] `dotagents` CLI / launcher path behavior works as documented

## Architecture Detection

- [ ] download/install flow normalizes `x86_64` / `amd64` to `x64`
- [ ] download/install flow normalizes `aarch64` / `arm64` to `arm64`
- [ ] Debian/Ubuntu-family systems prefer matching `.deb`
- [ ] `.AppImage` is offered as the portable fallback
- [ ] users can manually override artifact selection

## Runtime Native Resources

- [ ] Rust helper binary matches release architecture
- [ ] STT native resources load on `x64`
- [ ] STT native resources load on `arm64`
- [ ] TTS native resources load on `x64`
- [ ] TTS native resources load on `arm64`
- [ ] missing native resources fail with actionable messaging

## Core Product Functionality

- [ ] app launches to onboarding / main UI
- [ ] main window and panel window behave correctly
- [ ] tray works on supported Linux desktop environments
- [ ] microphone recording works
- [ ] dictation insertion works
- [ ] MCP / agent execution works end-to-end
- [ ] bundled skills are installed / loaded correctly
- [ ] remote server works
- [ ] `dotagents://` deep links work
- [ ] global hotkeys work or provide documented setup guidance
- [ ] autostart/login-on-boot equivalent works

## Linux `arm64` Validation

- [ ] validated on real `arm64` Linux hardware
- [ ] validated on the intended Ubuntu session type in active use
- [ ] tray behavior is acceptable on the target desktop environment
- [ ] hotkeys work with documented Linux setup requirements
- [ ] `arm64 .deb` installs and launches cleanly
- [ ] `arm64 .AppImage` launches cleanly
- [ ] no ARM-only regressions in MCP, dictation, or native resource loading

## Linux `x64` Validation

- [ ] Ubuntu 22.04 validation completed
- [ ] Ubuntu 24.04 validation completed
- [ ] Debian 12 validation completed
- [ ] `x64 .deb` installs and launches cleanly
- [ ] `x64 .AppImage` launches cleanly

## CI and Release Automation

- [ ] CI builds Linux `x64`
- [ ] CI builds Linux `arm64`
- [ ] CI produces both package types for both architectures
- [ ] release workflow uploads all Linux artifacts
- [ ] missing Linux artifacts fail the release process

## Docs and Truthfulness

- [ ] README platform support matches actual Linux status
- [ ] install docs cover `.deb` and `.AppImage`
- [ ] `arm64` support is documented explicitly
- [ ] Wayland / input-group setup requirements are documented if still required
- [ ] release notes describe Linux changes and caveats accurately

## Hard Blockers

Any of the following should block calling Linux "full parity":

- [ ] `arm64` is AppImage-only
- [ ] `arm64` validation has not been completed
- [ ] MCP works on one Linux architecture but not the other
- [ ] public docs still claim Linux is unsupported or partial
- [ ] release automation does not publish all four Linux artifacts