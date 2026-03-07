# Linux Support Matrix

This document defines the **target support contract** for official DotAgents Linux releases.
It is the planning source of truth for Linux parity work and should guide packaging, CI, docs,
and release policy.

## Support Principles

- Linux is a **first-class desktop platform** for DotAgents.
- Linux support means **full DotAgents parity**, not dictation-only or preview-only behavior.
- Linux releases must ship with **full distribution parity** for both `x64` and `arm64`.
- `x64` and `arm64` are co-equal release targets; a Linux release is incomplete if either one is missing.

## Official Linux Targets

| Architecture | Reference hardware | Tier 1 distributions | Required artifacts |
|---|---|---|---|
| `arm64` | Dedicated `arm64` Linux hardware* | Ubuntu 24.04, Debian 12 | `.deb` + `.AppImage` |
| `x64` | Standard desktop/workstation | Ubuntu 22.04/24.04, Debian 12 | `.deb` + `.AppImage` |

*Example reference hardware used during validation: NVIDIA DGX Spark.*

## Tier Definitions

- **Tier 1**: release-gated, validated every release, documented as officially supported.
- **Tier 2**: best-effort compatibility for closely related Debian/Ubuntu derivatives.

## Full Linux Parity Definition

A platform only counts as fully supported when all of the following are available and working:

- desktop install/uninstall flows
- system tray behavior
- voice recording and dictation insertion
- MCP / agent execution
- remote server
- deep links via `dotagents://`
- bundled skills and `.agents` workflows
- local STT/TTS native resource loading
- global hotkeys
- autostart/login-on-boot equivalent behavior
- manual or guided update path consistent with release docs

## Artifact Policy

Every official Linux release must publish all four artifacts:

- `linux-x64 .deb`
- `linux-x64 .AppImage`
- `linux-arm64 .deb`
- `linux-arm64 .AppImage`

If any artifact is missing, Linux distribution parity is not met.

## Architecture Detection and Artifact Selection

DotAgents should publish separate Linux artifacts per architecture and **auto-select the correct one**.

### Architecture mapping

| Detected value | Normalized architecture |
|---|---|
| `x86_64`, `amd64` | `x64` |
| `aarch64`, `arm64` | `arm64` |

### Selection policy

1. Detect OS and architecture.
2. Prefer `.deb` on Debian/Ubuntu-family systems when a matching package exists.
3. Offer `.AppImage` as the portable fallback for the same architecture.
4. Always allow manual override so users can choose a different artifact intentionally.

### Runtime selection policy

At runtime, DotAgents should also load architecture-matched native resources automatically:

- Rust helper binary
- STT/TTS native libraries
- Electron/native addon resources

If the matching resource is missing, the app should fail clearly with an actionable error.

## Release Policy

Do not claim official Linux parity unless all of the following are true:

- `x64` and `arm64` both pass validation
- `.deb` and `.AppImage` artifacts are published for both architectures
- release notes and install docs match reality
- known Linux setup requirements are documented

## Current Directional Gaps To Close

These are known planning gaps relative to the target contract:

- ARM packaging must reach `.deb` parity, not AppImage-only behavior
- release automation must treat Linux as a first-class output
- public docs must stop underselling Linux/MCP support once parity is achieved
- Linux autostart and update UX need explicit product treatment

## Related Docs

- [LINUX_PARITY_CHECKLIST.md](LINUX_PARITY_CHECKLIST.md)
- [DEVELOPMENT.md](DEVELOPMENT.md)
- [BUILDING.md](BUILDING.md)