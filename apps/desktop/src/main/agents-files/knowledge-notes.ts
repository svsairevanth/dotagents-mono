// Re-export from @dotagents/core
export {
  AGENTS_KNOWLEDGE_DIR,
  getAgentsKnowledgeDir,
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToDirPath,
  knowledgeNoteSlugToFilePath,
  stringifyKnowledgeNoteMarkdown,
  parseKnowledgeNoteMarkdown,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
} from "@dotagents/core"
export type { AgentsKnowledgeNoteOrigin, LoadedAgentsKnowledgeNotesLayer } from "@dotagents/core"