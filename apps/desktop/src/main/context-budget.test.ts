import { beforeEach, describe, expect, it, vi } from 'vitest'

const { mockConfig, makeTextCompletionWithFetchMock } = vi.hoisted(() => ({
  mockConfig: {
    mcpContextReductionEnabled: true,
    mcpContextTargetRatio: 0.5,
    mcpContextLastNMessages: 3,
    mcpContextSummarizeCharThreshold: 2000,
    mcpMaxContextTokensOverride: 1200,
    mcpToolsProviderId: 'openai',
    mcpToolsOpenaiModel: 'gpt-4.1-mini',
  },
  makeTextCompletionWithFetchMock: vi.fn(),
}))

vi.mock('./config', () => ({
  configStore: { get: () => mockConfig },
}))

vi.mock('./debug', () => ({
  isDebugLLM: () => false,
  logLLM: vi.fn(),
}))

vi.mock('./llm-fetch', () => ({
  makeTextCompletionWithFetch: makeTextCompletionWithFetchMock,
}))

vi.mock('./system-prompts', () => ({
  constructMinimalSystemPrompt: () => '[minimal system prompt]',
}))

vi.mock('./state', () => ({
  agentSessionStateManager: {
    shouldStopSession: () => false,
  },
}))

vi.mock('./summarization-service', () => ({
  summarizationService: {
    getSummaries: () => [],
    getImportantSummaries: () => [],
  },
}))

vi.mock('@dotagents/shared', () => ({
  sanitizeMessageContentForDisplay: (content: string) => content,
}))

import { shrinkMessagesForLLM } from './context-budget'

describe('shrinkMessagesForLLM replacement policy', () => {
  beforeEach(() => {
    makeTextCompletionWithFetchMock.mockReset()
    Object.assign(mockConfig, {
      mcpContextReductionEnabled: true,
      mcpContextTargetRatio: 0.5,
      mcpContextLastNMessages: 3,
      mcpContextSummarizeCharThreshold: 2000,
      mcpMaxContextTokensOverride: 1200,
      mcpToolsProviderId: 'openai',
      mcpToolsOpenaiModel: 'gpt-4.1-mini',
    })
  })

  it('truncates oversized tool results before tier-1 summarization', async () => {
    const toolPayload = `[server:search] ${'x'.repeat(3500)}`

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-truncate',
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'inspect this result' },
        { role: 'tool', content: toolPayload },
      ],
    })

    expect(makeTextCompletionWithFetchMock).not.toHaveBeenCalled()
    expect(result.appliedStrategies).toContain('aggressive_truncate')
    expect(result.messages.some((msg) => msg.content.includes('Large tool result truncated for context management'))).toBe(true)
  })

  it('batch-summarizes contiguous oversized conversational messages in one call', async () => {
    makeTextCompletionWithFetchMock.mockResolvedValue('condensed findings and decisions')

    const result = await shrinkMessagesForLLM({
      sessionId: 'session-batch',
      lastNMessages: 1,
      messages: [
        { role: 'system', content: 'system prompt' },
        { role: 'user', content: 'Original user request' },
        { role: 'assistant', content: 'a'.repeat(2600) },
        { role: 'user', content: 'b'.repeat(2400) },
        { role: 'assistant', content: 'c'.repeat(2300) },
        { role: 'user', content: 'latest follow up' },
      ],
    })

    expect(makeTextCompletionWithFetchMock).toHaveBeenCalledTimes(1)
    expect(result.appliedStrategies).toContain('batch_summarize')
    expect(result.messages).toHaveLength(4)
    expect(result.messages.some((msg) => msg.content.includes('[Earlier Context Summary: 3 messages]'))).toBe(true)
  })
})