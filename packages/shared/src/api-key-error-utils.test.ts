import { describe, it, expect } from 'vitest'
import { isMissingApiKeyErrorMessage } from './api-key-error-utils'

describe('isMissingApiKeyErrorMessage', () => {
  it('returns true for "API key is required"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required')).toBe(true)
  })

  it('returns true for "API key is required for openai"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required for openai')).toBe(true)
  })

  it('returns true for "api key is required for groq" (case-insensitive)', () => {
    expect(isMissingApiKeyErrorMessage('api key is required for groq')).toBe(true)
  })

  it('returns true for "API key is required some-provider.v2"', () => {
    expect(isMissingApiKeyErrorMessage('API key is required some-provider.v2')).toBe(true)
  })

  it('returns false for unrelated error messages', () => {
    expect(isMissingApiKeyErrorMessage('Connection timed out')).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isMissingApiKeyErrorMessage('')).toBe(false)
  })

  it('returns true when the message is embedded in a longer string', () => {
    expect(isMissingApiKeyErrorMessage('Error: API key is required for anthropic. Please configure it.')).toBe(true)
  })
})
