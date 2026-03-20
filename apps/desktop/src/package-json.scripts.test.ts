import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const packageJson = JSON.parse(
  readFileSync(new URL("../package.json", import.meta.url), "utf8"),
) as { scripts?: Record<string, string> }

const buildReleaseWorkflow = readFileSync(
  new URL("../../../.github/workflows/build-release.yml", import.meta.url),
  "utf8",
)

const installScript = readFileSync(
  new URL("../../../scripts/install.sh", import.meta.url),
  "utf8",
)

const installPowerShellScript = readFileSync(
  new URL("../../../scripts/install.ps1", import.meta.url),
  "utf8",
)

const desktopBuilderConfig = readFileSync(
  new URL("../electron-builder.config.cjs", import.meta.url),
  "utf8",
)

const installationDoc = readFileSync(
  new URL("../../../docs-site/docs/getting-started/installation.md", import.meta.url),
  "utf8",
)

describe("desktop package scripts", () => {
  it("uses pnpm instead of npm run inside package scripts", () => {
    const scriptEntries = Object.entries(packageJson.scripts ?? {})
    const npmRunPattern = /(^|[;&|()\s])npm run\b/

    for (const [name, command] of scriptEntries) {
      expect(command, `script ${name} should avoid npm run`).not.toMatch(npmRunPattern)
    }
  })

  it("keeps the release workflow pointed at the current shared workspace package", () => {
    expect(buildReleaseWorkflow).toContain("pnpm --filter @dotagents/shared build")
    expect(buildReleaseWorkflow).not.toContain("@speakmcp/shared")
  })

  it("publishes desktop release assets from the current desktop build pipeline", () => {
    expect(buildReleaseWorkflow).toContain("tags:")
    expect(buildReleaseWorkflow).toContain("build-macos")
    expect(buildReleaseWorkflow).toContain("publish-release")
    expect(buildReleaseWorkflow).toContain("softprops/action-gh-release@v2")
    expect(buildReleaseWorkflow).not.toContain("speakmcp-rs")
  })

  it("ships cross-platform one-line installer entry points", () => {
    expect(installScript).toContain("DOTAGENTS_FROM_SOURCE")
    expect(installScript).toContain("select_release_asset_url")
    expect(installScript).toContain("DOTAGENTS_RELEASE_TAG")
    expect(installPowerShellScript).toContain("Install-Release")
    expect(installPowerShellScript).toContain("Invoke-RestMethod")
    expect(installationDoc).toContain("scripts/install.sh | bash")
    expect(installationDoc).toContain("scripts/install.ps1 | iex")
  })

  it("allows unsigned macOS CI release builds when identity auto-discovery is disabled", () => {
    expect(desktopBuilderConfig).toContain('process.env.CSC_IDENTITY_AUTO_DISCOVERY === "false"')
  })
})
