---
name: cli-builder-worker
description: Builds the standalone CLI application using OpenTUI and @dotagents/core.
---

# CLI Builder Worker

NOTE: Startup and cleanup are handled by `worker-base`. This skill defines the WORK PROCEDURE.

## When to Use This Skill

Use for features involving:
- Creating the apps/cli package structure
- Building TUI components with OpenTUI (@opentui/react)
- Wiring @dotagents/core services with CLI-specific adapters
- Implementing CLI-specific features (settings panel, profile management, etc.)
- Creating CLI entry point and command system

## Work Procedure

### 1. Understand the Feature

Read the feature description, preconditions, and expected behavior. Identify:
- Which TUI components or panels need to be built
- Which @dotagents/core services are consumed
- What CLI-specific adapters are needed
- What user interactions are expected

### 2. Research OpenTUI Patterns

If this is your first feature or you're building a new component type:
- Check `.factory/library/opentui.md` for patterns and conventions
- Read existing CLI components in `apps/cli/src/` for established patterns
- OpenTUI uses React (@opentui/react) with components like Box, Text, Input, Select, ScrollBox, Code

### 3. Write Tests First (TDD)

For each new component or service adapter:
1. Create test file alongside the component
2. Write tests for the component's behavior (rendering, user input handling, state changes)
3. For service adapters, test that they correctly implement the @dotagents/core interface
4. Run `pnpm --filter @dotagents/cli exec vitest run` to confirm tests fail
5. Then implement to make tests pass

### 4. Implement

For TUI components:
1. Create component in `apps/cli/src/components/` or `apps/cli/src/panels/`
2. Use OpenTUI primitives (Box, Text, Input, Select, ScrollBox)
3. Wire state management using React hooks
4. Connect to @dotagents/core services via the service container

For CLI-specific adapters:
1. Create adapter in `apps/cli/src/adapters/`
2. Implement the @dotagents/core interface (PathResolver, ProgressEmitter, UserInteraction, NotificationService)
3. Register with the service container in the CLI entry point

For the entry point:
1. `apps/cli/src/index.tsx` — main entry, initializes service container, renders root OpenTUI component
2. Register CLI-specific adapters
3. Start required services (MCP, etc.)

### 5. Verify

Run ALL of these commands:
1. `pnpm --filter @dotagents/cli exec vitest run` — CLI tests pass
2. `pnpm --filter @dotagents/cli build` — CLI builds
3. `pnpm typecheck` — full workspace typecheck
4. Test the CLI manually:
   - Start the CLI and verify the TUI renders
   - Test the specific feature (chat, settings, etc.)
   - Verify clean exit (Ctrl+C or /quit)
   - Record observations in interactiveChecks

### 6. Commit

Commit with message: `feat(cli): [description of what was built]`

## OpenTUI Component Patterns

Basic component structure:
```tsx
import { Box, Text, Input } from '@opentui/react'

function ChatInput({ onSubmit }: { onSubmit: (msg: string) => void }) {
  const [value, setValue] = React.useState('')
  
  return (
    <Box flexDirection="row" borderStyle="round">
      <Text color="cyan">&gt; </Text>
      <Input
        value={value}
        onChange={setValue}
        onSubmit={() => { onSubmit(value); setValue('') }}
        placeholder="Type a message..."
      />
    </Box>
  )
}
```

Layout with ScrollBox for chat history:
```tsx
<Box flexDirection="column" flexGrow={1}>
  <ScrollBox flexGrow={1}>
    {messages.map(msg => <MessageBubble key={msg.id} message={msg} />)}
  </ScrollBox>
  <ChatInput onSubmit={handleSend} />
</Box>
```

## Example Handoff

```json
{
  "salientSummary": "Built the CLI chat interface with streaming response display. User can type messages, see token-by-token streaming, and view completed responses. Tool calls show with spinner and result. Tested manually: sent 3 messages, all streamed correctly. vitest run passes with 12 tests.",
  "whatWasImplemented": "Created apps/cli/src/components/ChatView.tsx with ScrollBox message history, streaming text rendering via useStreamingText hook, and tool call display components. Created ChatInput.tsx with message submission. Wired to @dotagents/core LLM engine via service container. Added 12 unit tests covering message display, streaming state, and tool call rendering.",
  "whatWasLeftUndone": "",
  "verification": {
    "commandsRun": [
      { "command": "pnpm --filter @dotagents/cli exec vitest run", "exitCode": 0, "observation": "12 tests passed" },
      { "command": "pnpm --filter @dotagents/cli build", "exitCode": 0, "observation": "Built successfully" },
      { "command": "pnpm typecheck", "exitCode": 0, "observation": "All packages clean" }
    ],
    "interactiveChecks": [
      { "action": "Launched CLI, typed 'hello', pressed Enter", "observed": "Message appeared as user bubble, assistant response streamed token-by-token over 3 seconds, final response fully displayed" },
      { "action": "Sent 'list files in current directory' to trigger tool call", "observed": "Tool call indicator appeared with spinner, tool result displayed inline, agent incorporated result in response" },
      { "action": "Pressed Ctrl+C during streaming", "observed": "Streaming stopped, partial response preserved, input prompt returned" }
    ]
  },
  "tests": {
    "added": [
      { "file": "apps/cli/src/components/ChatView.test.tsx", "cases": [
        { "name": "renders user messages", "verifies": "User messages display correctly" },
        { "name": "renders streaming response incrementally", "verifies": "Streaming display works" },
        { "name": "renders tool call with spinner", "verifies": "Tool call display" }
      ]}
    ]
  },
  "discoveredIssues": []
}
```

## When to Return to Orchestrator

- OpenTUI APIs don't work as expected or have breaking changes
- A required @dotagents/core service doesn't exist yet
- The CLI can't import from core (build or package resolution issues)
- Zig toolchain issues prevent building OpenTUI components
- The feature requires core changes that aren't in scope for this feature
