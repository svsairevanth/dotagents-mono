import fs from "fs"
import path from "path"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  downloadHubBundleToTempFile,
  findHubBundleInstallBundleUrl,
  parseHubBundleInstallDeepLink,
} from "./hub-install"

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("parseHubBundleInstallDeepLink", () => {
  it("extracts the remote bundle URL from dotagents install links", () => {
    const result = parseHubBundleInstallDeepLink(
      "dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Ffeatured-agent.dotagents",
    )

    expect(result).toEqual({
      bundleUrl: "https://hub.dotagentsprotocol.com/bundles/featured-agent.dotagents",
    })
  })

  it("ignores non-install deep links and non-http bundle targets", () => {
    expect(
      parseHubBundleInstallDeepLink("dotagents://oauth/callback?code=abc&state=123"),
    ).toBeNull()
    expect(
      parseHubBundleInstallDeepLink(
        "dotagents://install?bundle=file%3A%2F%2F%2Ftmp%2Fbundle.dotagents",
      ),
    ).toBeNull()
  })
})

describe("findHubBundleInstallBundleUrl", () => {
  it("returns the first valid install bundle URL from argv-style inputs", () => {
    const deepLink =
      "dotagents://install?bundle=https%3A%2F%2Fhub.dotagentsprotocol.com%2Fbundles%2Ffrom-argv.dotagents"

    expect(
      findHubBundleInstallBundleUrl(["electron", "--inspect", deepLink, "dotagents://oauth/callback?code=1"]),
    ).toBe("https://hub.dotagentsprotocol.com/bundles/from-argv.dotagents")
  })
})

describe("downloadHubBundleToTempFile", () => {
  it("downloads a remote bundle into a temp .dotagents file", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response('{"manifest":{"name":"Hub Bundle"}}', { status: 200 })),
    )

    const filePath = await downloadHubBundleToTempFile(
      "https://hub.dotagentsprotocol.com/bundles/featured-agent",
    )

    expect(path.basename(filePath)).toBe("featured-agent.dotagents")
    expect(fs.existsSync(filePath)).toBe(true)
    expect(fs.readFileSync(filePath, "utf-8")).toContain('"Hub Bundle"')

    fs.rmSync(path.dirname(filePath), { recursive: true, force: true })
  })
})