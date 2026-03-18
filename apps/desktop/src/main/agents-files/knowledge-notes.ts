// Re-export directly from source so desktop main-process code sees in-repo changes
// immediately without depending on a prebuilt @dotagents/core package artifact.
export {
  AGENTS_KNOWLEDGE_DIR,
  getAgentsKnowledgeDir,
  getAgentsKnowledgeBackupDir,
  knowledgeNoteSlugToDirPath,
  knowledgeNoteSlugToFilePath,
  buildKnowledgeNoteStorageLocation,
  stringifyKnowledgeNoteMarkdown,
  parseKnowledgeNoteMarkdown,
  loadAgentsKnowledgeNotesLayer,
  writeKnowledgeNoteFile,
} from "../../../../../packages/core/src/agents-files/knowledge-notes"
export type { AgentsKnowledgeNoteOrigin, LoadedAgentsKnowledgeNotesLayer } from "../../../../../packages/core/src/agents-files/knowledge-notes"