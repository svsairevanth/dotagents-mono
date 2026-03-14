const MISSING_API_KEY_ERROR_REGEX = /api key is required(?: for)?(?:\s+[a-z0-9._-]+)?/i

export function isMissingApiKeyErrorMessage(message: string): boolean {
  return MISSING_API_KEY_ERROR_REGEX.test(message)
}
