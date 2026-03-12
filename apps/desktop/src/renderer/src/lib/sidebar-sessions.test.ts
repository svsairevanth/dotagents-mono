import { describe, expect, it } from "vitest"

import {
  filterPastSessionsAgainstActiveSessions,
  orderActiveSessionsByPinnedFirst,
} from "./sidebar-sessions"

const activeSession = (id: string, conversationId?: string) => ({
  id,
  conversationId,
})
const pastSession = (id: string, conversationId?: string) => ({
  session: { id, conversationId },
})

describe("orderActiveSessionsByPinnedFirst", () => {
  it("moves pinned active sessions to the top while preserving each group's order", () => {
    const ordered = orderActiveSessionsByPinnedFirst(
      [
        activeSession("session-1", "conversation-1"),
        activeSession("session-2", "conversation-2"),
        activeSession("session-3", "conversation-3"),
      ],
      new Set(["conversation-2"]),
    )

    expect(ordered.map((session) => session.id)).toEqual([
      "session-2",
      "session-1",
      "session-3",
    ])
  })
})

describe("filterPastSessionsAgainstActiveSessions", () => {
  it("removes past entries whose conversation is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [
        pastSession("history-1", "conversation-1"),
        pastSession("history-2", "conversation-2"),
      ],
      [activeSession("session-1", "conversation-1")],
    )

    expect(filtered).toEqual([pastSession("history-2", "conversation-2")])
  })

  it("removes fallback past entries whose session id is already active", () => {
    const filtered = filterPastSessionsAgainstActiveSessions(
      [pastSession("session-1"), pastSession("session-2")],
      [activeSession("session-1")],
    )

    expect(filtered).toEqual([pastSession("session-2")])
  })
})
