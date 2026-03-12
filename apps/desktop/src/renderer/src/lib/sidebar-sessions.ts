type SessionLike = {
  id: string
  conversationId?: string
}

export function orderActiveSessionsByPinnedFirst<T extends SessionLike>(
  sessions: T[],
  pinnedSessionIds: ReadonlySet<string>,
): T[] {
  if (sessions.length <= 1 || pinnedSessionIds.size === 0) {
    return sessions
  }

  const pinnedSessions: T[] = []
  const unpinnedSessions: T[] = []

  for (const session of sessions) {
    if (
      session.conversationId &&
      pinnedSessionIds.has(session.conversationId)
    ) {
      pinnedSessions.push(session)
    } else {
      unpinnedSessions.push(session)
    }
  }

  return [...pinnedSessions, ...unpinnedSessions]
}

export function filterPastSessionsAgainstActiveSessions<
  T extends { session: SessionLike },
>(pastSessions: T[], activeSessions: SessionLike[]): T[] {
  if (pastSessions.length === 0 || activeSessions.length === 0) {
    return pastSessions
  }

  const activeConversationIds = new Set(
    activeSessions
      .map((session) => session.conversationId)
      .filter((conversationId): conversationId is string => !!conversationId),
  )
  const activeSessionIds = new Set(activeSessions.map((session) => session.id))

  return pastSessions.filter((item) => {
    if (activeSessionIds.has(item.session.id)) {
      return false
    }

    const conversationId = item.session.conversationId
    return !conversationId || !activeConversationIds.has(conversationId)
  })
}
