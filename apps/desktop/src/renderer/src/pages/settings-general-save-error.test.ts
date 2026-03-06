import { describe, expect, it } from "vitest"
import { getSettingsSaveErrorMessage } from "./settings-general-save-error"

describe("getSettingsSaveErrorMessage", () => {
  it("maps permission errors to a friendly message", () => {
    expect(getSettingsSaveErrorMessage(new Error("EACCES: permission denied"))).toBe(
      "Couldn't save your settings because DotAgents doesn't have permission to write its config files.",
    )
  })

  it("maps disk-full errors to a friendly message", () => {
    expect(getSettingsSaveErrorMessage(new Error("ENOSPC: no space left on device"))).toBe(
      "Couldn't save your settings because your disk is full. Free up some space and try again.",
    )
  })

  it("keeps useful details while stripping the internal prefix", () => {
    expect(
      getSettingsSaveErrorMessage(
        new Error(
          "Failed to save settings to disk. Could not write the legacy config file (Temporary I/O failure)",
        ),
      ),
    ).toBe(
      "Couldn't save your settings. Could not write the legacy config file (Temporary I/O failure)",
    )
  })
})