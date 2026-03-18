/**
 * Builtin Tool Definitions - Dependency-Free Module
 *
 * This module contains the static definitions for built-in MCP tools.
 * It is intentionally kept free of dependencies on other app modules
 * to avoid circular import issues.
 *
 * The tool execution handlers are in builtin-tools.ts, which can safely
 * import from services that might also need access to these definitions.
 */

import { BUILTIN_SERVER_NAME } from '../shared/builtin-tool-names'
import { acpRouterToolDefinitions } from './acp/acp-router-tool-definitions'

// Re-export for backward compatibility (single source of truth in @shared/builtin-tool-names)
export { BUILTIN_SERVER_NAME }

// Define a local type to avoid importing from mcp-service
export interface BuiltinToolDefinition {
  name: string
  description: string
  inputSchema: {
    type: string
    properties: Record<string, unknown>
    required: string[]
    [key: string]: unknown
  }
}

// Tool definitions — built-in tools use plain names (no server prefix)
export const builtinToolDefinitions: BuiltinToolDefinition[] = [
  {
    name: "list_mcp_servers",
    description: "List all configured MCP servers and their status (enabled/disabled, connected/disconnected)",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "toggle_mcp_server",
    description: "Enable or disable an MCP server by name. Disabled servers will not be initialized on next startup.",
    inputSchema: {
      type: "object",
      properties: {
        serverName: {
          type: "string",
          description: "The name of the MCP server to toggle",
        },
        enabled: {
          type: "boolean",
          description: "Whether to enable (true) or disable (false) the server. If not provided, toggles to the opposite of the current state.",
        },
      },
      required: ["serverName"],
    },
  },

  {
    name: "list_running_agents",
    description: "List all currently running agent sessions with their status, iteration count, and activity. Useful for monitoring active agents before terminating them.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "send_agent_message",
    description: "Send a message to another running agent session. The message will be queued and processed by the target agent's conversation. Use list_running_agents first to get session IDs. This enables agent coordination and task delegation.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID of the target agent (get this from list_running_agents)",
        },
        message: {
          type: "string",
          description: "The message to send to the target agent",
        },
      },
      required: ["sessionId", "message"],
    },
  },
  {
    name: "kill_agent",
    description: "Terminate agent sessions. Pass a sessionId to kill a specific agent, or omit it to kill ALL running agents. Aborts in-flight LLM requests, kills spawned processes, and stops agents immediately.",
    inputSchema: {
      type: "object",
      properties: {
        sessionId: {
          type: "string",
          description: "The session ID of the agent to terminate (get this from list_running_agents). Omit to kill all agents.",
        },
      },
      required: [],
    },
  },
  {
    name: "update_settings",
    description: "Get or update DotAgents settings. Call with no arguments to read current values. Pass any combination of setting keys to update them. Available settings: postProcessing, tts, toolApproval, verification, whatsapp.",
    inputSchema: {
      type: "object",
      properties: {
        postProcessing: {
          type: "boolean",
          description: "Enable/disable transcript post-processing (AI-powered transcript cleanup)",
        },
        tts: {
          type: "boolean",
          description: "Enable/disable text-to-speech (assistant responses read aloud)",
        },
        toolApproval: {
          type: "boolean",
          description: "Enable/disable tool approval dialog before execution (new sessions only)",
        },
        verification: {
          type: "boolean",
          description: "Enable/disable task completion verification before finishing",
        },
        whatsapp: {
          type: "boolean",
          description: "Enable/disable WhatsApp integration",
        },
      },
      required: [],
    },
  },
  // ACP router tools for agent delegation
  // These tools are logically distinct from settings management but are all treated as
  // built-in tools for execution purposes (see isBuiltinTool in builtin-tools.ts).
  ...acpRouterToolDefinitions,
  {
    name: "respond_to_user",
    description:
      "Send a response directly to the user. On voice interfaces this will be spoken aloud via TTS; on messaging channels (mobile, WhatsApp, etc.) it will be sent as a message. Regular assistant text is internal and not guaranteed to reach the user; use this tool to explicitly communicate with them. Provide at least one of: non-empty text or one/more images.",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description:
            "Optional response text for the user. Write naturally and conversationally. Markdown is allowed when helpful (for example links or image captions).",
        },
        images: {
          type: "array",
          description:
            "Optional images to include in the message. Each image can be provided as a URL/data URL, or as a local file path that will be embedded automatically.",
          items: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "HTTP(S) URL or data:image URL for the image.",
              },
              path: {
                type: "string",
                description: "Local image file path (absolute, or relative to the current working directory).",
              },
              alt: {
                type: "string",
                description: "Optional alt text shown with markdown image syntax.",
              },
            },
            required: [],
          },
        },
      },
      required: [],
    },
  },
  {
    name: "mark_work_complete",
    description: "Signal explicit completion for the current task. Call this only when all requested work is actually finished and ready for final delivery.",
    inputSchema: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Concise summary of what was completed for the user.",
        },
        confidence: {
          type: "number",
          description: "Optional confidence from 0 to 1 that the task is fully complete.",
        },
      },
      required: ["summary"],
    },
  },
  {
    name: "execute_command",
    description: "Execute any shell command. This is the primary tool for file operations, running scripts, and automation. Use for: reading files (cat), writing files (cat/echo with redirection), listing directories (ls), creating directories (mkdir -p), git operations, npm/python/node commands, and any shell command. If skillId is provided, the command runs in that skill's directory.",
    inputSchema: {
      type: "object",
      properties: {
        command: {
          type: "string",
          description: "The shell command to execute. Examples: 'cat file.txt' (read), 'echo content > file.txt' (write), 'ls -la' (list), 'mkdir -p dir' (create dir), 'git status', 'npm install', 'python script.py'",
        },
        skillId: {
          type: "string",
          description: "Optional skill ID to run the command in that skill's directory. Get skill IDs from the enabled skills in the system prompt.",
        },
        timeout: {
          type: "number",
          description: "Command timeout in milliseconds (default: 30000). Set to 0 for no timeout.",
        },
      },
      required: ["command"],
    },
  },

  {
    name: "save_note",
    description: "Create or update a knowledge note stored under .agents/knowledge. Prefer direct file editing for substantial notes; use this tool for compact structured note saves.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Optional stable note ID/slug. Provide this to update an existing note; omit to create a new one.",
        },
        title: {
          type: "string",
          description: "Optional note title. If omitted, the title is derived from the note body.",
        },
        body: {
          type: "string",
          description: "Markdown body for the note.",
        },
        summary: {
          type: "string",
          description: "Optional compact summary used for quick listing or runtime retrieval.",
        },
        context: {
          type: "string",
          enum: ["auto", "search-only"],
          description: "Retrieval context. Use auto only for notes that should be proactively considered without an explicit search.",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Optional note tags.",
        },
        references: {
          type: "array",
          items: { type: "string" },
          description: "Optional references such as conversation IDs, URLs, or external identifiers.",
        },
      },
      required: ["body"],
    },
  },
  {
    name: "list_notes",
    description: "List saved knowledge notes. Use this to inspect what is already captured before creating duplicates or deleting notes.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Optional search query to filter notes by title, body, summary, tags, or references.",
        },
        context: {
          type: "string",
          enum: ["auto", "search-only"],
          description: "Optional context filter.",
        },
      },
      required: [],
    },
  },
  {
    name: "delete_notes",
    description: "Delete knowledge notes. Pass noteIds to delete specific notes, or set deleteAll to true to remove all notes. Call list_notes first to get IDs.",
    inputSchema: {
      type: "object",
      properties: {
        noteIds: {
          type: "array",
          items: { type: "string" },
          description: "Array of note IDs to delete (from list_notes).",
        },
        deleteAll: {
          type: "boolean",
          description: "Set to true to delete ALL notes. Cannot be used with noteIds.",
        },
      },
      required: [],
    },
  },
  {
    name: "list_server_tools",
    description: "List all tools available from a specific MCP server. Use this to discover what tools a server provides before calling them.",
    inputSchema: {
      type: "object",
      properties: {
        serverName: {
          type: "string",
          description: "The name of the MCP server to list tools from (e.g., 'github', 'filesystem'). Use list_mcp_servers first to see available servers.",
        },
      },
      required: ["serverName"],
    },
  },
  {
    name: "get_tool_schema",
    description: "Get the full JSON schema for a specific tool, including all parameter details. Use this when you need to know the exact parameters to pass to a tool.",
    inputSchema: {
      type: "object",
      properties: {
        toolName: {
          type: "string",
          description: "The full tool name including server prefix (e.g., 'github:create_issue', 'filesystem:read_file')",
        },
      },
      required: ["toolName"],
    },
  },
  {
    name: "load_skill_instructions",
    description: "Load the full instructions for an agent skill. Skills are listed in the system prompt with just name and description. Call this tool to get the complete instructions when you need to use a skill.",
    inputSchema: {
      type: "object",
      properties: {
        skillId: {
          type: "string",
          description: "The skill ID to load instructions for. Get skill IDs from the Available Skills section in the system prompt.",
        },
      },
      required: ["skillId"],
    },
  },
  {
    name: "list_skills",
    description: "List all available skills with their name, description, and enabled/disabled status for each agent profile.",
    inputSchema: {
      type: "object",
      properties: {
        profileId: {
          type: "string",
          description: "Optional agent profile ID to show enabled/disabled status relative to. If omitted, shows global skill list.",
        },
      },
      required: [],
    },
  },
  {
    name: "toggle_agent_skill",
    description: "Enable or disable a skill for an agent profile. When a skill is disabled for an agent, it will not be available in that agent's system prompt.",
    inputSchema: {
      type: "object",
      properties: {
        profileId: {
          type: "string",
          description: "The agent profile ID to toggle the skill for.",
        },
        skillId: {
          type: "string",
          description: "The skill ID to toggle.",
        },
        enabled: {
          type: "boolean",
          description: "Whether to enable (true) or disable (false) the skill. If not provided, toggles to the opposite of the current state.",
        },
      },
      required: ["profileId", "skillId"],
    },
  },

  // ============================================================================
  // Repeat Task Management
  // ============================================================================
  {
    name: "list_repeat_tasks",
    description: "List all repeat tasks with their schedule, status, and last run time.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "save_repeat_task",
    description: "Create or update a repeat task. If id matches an existing task, it updates it; otherwise creates a new one. Omit id to auto-generate.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Task ID. If provided and exists, updates that task. Omit to create new.",
        },
        name: {
          type: "string",
          description: "Display name for the task.",
        },
        prompt: {
          type: "string",
          description: "The prompt text sent to the agent when the task runs.",
        },
        intervalMinutes: {
          type: "number",
          description: "How often to run in minutes (minimum 1).",
        },
        enabled: {
          type: "boolean",
          description: "Whether the task is active.",
        },
        runOnStartup: {
          type: "boolean",
          description: "If true, runs immediately on app start before first interval.",
        },
        profileId: {
          type: "string",
          description: "Optional agent profile ID to use for execution.",
        },
      },
      required: ["name", "prompt", "intervalMinutes"],
    },
  },
  {
    name: "delete_repeat_task",
    description: "Delete a repeat task by ID. Use list_repeat_tasks first to get IDs.",
    inputSchema: {
      type: "object",
      properties: {
        taskId: {
          type: "string",
          description: "The task ID to delete.",
        },
      },
      required: ["taskId"],
    },
  },

  // ============================================================================
  // Agent Profile Management
  // ============================================================================
  {
    name: "list_agent_profiles",
    description: "List all agent profiles with their name, role, connection type, and enabled status.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "save_agent_profile",
    description: "Create or update an agent profile. If id matches an existing profile, it updates it; otherwise creates a new one. Omit id to create new.",
    inputSchema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "Profile ID. If provided and exists, updates that profile. Omit to create new.",
        },
        name: {
          type: "string",
          description: "Display name for the agent.",
        },
        description: {
          type: "string",
          description: "What this agent does.",
        },
        systemPrompt: {
          type: "string",
          description: "System prompt that defines the agent's behavior.",
        },
        guidelines: {
          type: "string",
          description: "Additional guidelines for the agent.",
        },
        enabled: {
          type: "boolean",
          description: "Whether this agent is enabled (default: true).",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_agent_profile",
    description: "Delete an agent profile by ID. Built-in agents cannot be deleted. Use list_agent_profiles first to get IDs.",
    inputSchema: {
      type: "object",
      properties: {
        profileId: {
          type: "string",
          description: "The profile ID to delete.",
        },
      },
      required: ["profileId"],
    },
  },
]

/**
 * Get all builtin tool names (for disabling by default)
 */
export function getBuiltinToolNames(): string[] {
  return builtinToolDefinitions.map((tool) => tool.name)
}
