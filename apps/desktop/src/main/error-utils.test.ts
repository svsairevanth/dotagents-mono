import { describe, expect, it } from "vitest"
import { getErrorMessage, normalizeError } from "./error-utils"

describe("error-utils", () => {
  it("returns fallback for nullish thrown values", () => {
    expect(getErrorMessage(null, "Fallback message")).toBe("Fallback message")
    expect(getErrorMessage(undefined, "Fallback message")).toBe("Fallback message")
  })

  it("keeps explicit non-nullish error strings", () => {
    expect(getErrorMessage("Network timeout", "Fallback message")).toBe("Network timeout")
  })

  it("unwraps nested error objects to show the user-facing message", () => {
    expect(
      getErrorMessage({ error: { message: "Invalid API key" } }, "Fallback message"),
    ).toBe("Invalid API key")
  })

  it("falls back to cause and errors arrays when top-level messages are empty", () => {
    const errorWithCause = new Error("", { cause: new Error("Tunnel connection failed") })
    const aggregateLikeError = { errors: [{ message: "Primary provider unavailable" }] }

    expect(getErrorMessage(errorWithCause, "Fallback message")).toBe("Tunnel connection failed")
    expect(getErrorMessage(aggregateLikeError, "Fallback message")).toBe("Primary provider unavailable")
  })

  it("normalizes nullish values to Error with fallback message", () => {
    const normalizedNull = normalizeError(null, "Request failed")
    const normalizedUndefined = normalizeError(undefined, "Request failed")

    expect(normalizedNull).toBeInstanceOf(Error)
    expect(normalizedNull.message).toBe("Request failed")
    expect(normalizedUndefined).toBeInstanceOf(Error)
    expect(normalizedUndefined.message).toBe("Request failed")
  })

  it("normalizes nested error objects to a readable Error message", () => {
    const normalized = normalizeError({ error: { message: "Provider returned 401" } }, "Request failed")

    expect(normalized).toBeInstanceOf(Error)
    expect(normalized.message).toBe("Provider returned 401")
  })
})
