function getErrorText(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === "string") return error
  if (error && typeof error === "object" && typeof (error as { message?: unknown }).message === "string") {
    return (error as { message: string }).message
  }
  return ""
}

export function getSettingsSaveErrorMessage(error: unknown): string {
  const rawMessage = getErrorText(error).trim()
  const lowerMessage = rawMessage.toLowerCase()

  if (!rawMessage) {
    return "Couldn't save your settings. Please try again."
  }

  if (
    lowerMessage.includes("eacces") ||
    lowerMessage.includes("eperm") ||
    lowerMessage.includes("permission denied")
  ) {
    return "Couldn't save your settings because DotAgents doesn't have permission to write its config files."
  }

  if (lowerMessage.includes("enospc") || lowerMessage.includes("no space left")) {
    return "Couldn't save your settings because your disk is full. Free up some space and try again."
  }

  if (lowerMessage.includes("erofs") || lowerMessage.includes("read-only")) {
    return "Couldn't save your settings because the config location is read-only."
  }

  const details = rawMessage.replace(/^Failed to save settings to disk\.?\s*/i, "")
  return details
    ? `Couldn't save your settings. ${details}`
    : "Couldn't save your settings. Please try again."
}