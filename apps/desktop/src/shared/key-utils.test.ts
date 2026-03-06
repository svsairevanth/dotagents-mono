import { describe, expect, it } from "vitest"

import { parseKeyCombo, validateKeyCombo } from "./key-utils"

describe("parseKeyCombo", () => {
  it("parses modifiers and the main key case-insensitively", () => {
    expect(parseKeyCombo("Ctrl-Shift-Escape")).toEqual({
      ctrl: true,
      shift: true,
      alt: false,
      meta: false,
      key: "escape",
    })
  })

  it("treats cmd as meta", () => {
    expect(parseKeyCombo("cmd-k")).toEqual({
      ctrl: false,
      shift: false,
      alt: false,
      meta: true,
      key: "k",
    })
  })
})

describe("validateKeyCombo", () => {
  it("rejects empty shortcuts", () => {
    expect(validateKeyCombo("")).toEqual({
      valid: false,
      error: "Key combination cannot be empty",
    })
  })

  it("rejects shortcuts without a modifier or function key", () => {
    expect(validateKeyCombo("q")).toEqual({
      valid: false,
      error:
        "Key combination must include at least one modifier key (Ctrl, Shift, Alt, Meta) or be a function key",
    })
  })

  it("allows the built-in emergency stop shortcut", () => {
    expect(validateKeyCombo("ctrl-shift-escape")).toEqual({ valid: true })
  })

  it("allows function keys without modifiers", () => {
    expect(validateKeyCombo("f12")).toEqual({ valid: true })
  })

  it("rejects reserved system shortcuts", () => {
    expect(validateKeyCombo("ctrl-alt-delete")).toEqual({
      valid: false,
      error: "This key combination is reserved by the system",
    })
    expect(validateKeyCombo("alt-f4")).toEqual({
      valid: false,
      error: "This key combination is reserved by the system",
    })
  })
})