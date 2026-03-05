---
title: "Writing Cross-Platform Hooks for AI Coding Agents"
pubDate: 2026-03-05
description: "How to write a single hook script that works across Claude Code and Cursor, giving you deterministic control over agent behaviour when it matters most."
author: "Schalk Neethling"
tags: ["ai", "developer-tools"]
---

AI coding agents, and AI/LLMs in general, come with certain knowledge baked in from their training data. When you ask an agent to run your tests, it will often reach for `npx vitest` or `npx playwright test`, which are perfectly reasonable commands, but when your project has a unified test runner with specific flags, filtering options, and conventions that the agent does not know about, getting it to use your test runner consistently is a challenge.

You could document your test runner in an `AGENTS.md` or `CLAUDE.md` file and hope the agent picks it up. This helps, but it is non-deterministic. The agent might read the file and still reach for `npx vitest`, or flip-flop between using the test runner and calling tools directly. Documentation provides guidance; it does not enforce behaviour.

Hooks give us a way to intercept agent actions before they execute, allowing us to guide behaviour programmatically. In this post, I will walk through building a hook that works across both Claude Code and Cursor, explain the approach, and share what I learned about the differences between these platforms.

## The Problem We Are Solving

As mentioned, our project has a test runner at `tests/test-runner.js` that wraps Vitest and Playwright with a consistent interface. Instead of remembering different commands and flags for unit tests, component tests, end-to-end tests, and visual regression tests, developers use:

```bash
yarn test:unit
yarn test:e2e
yarn test:component
yarn test:vrt
```

The test runner handles project filtering, browser selection, UI mode, and snapshot updates through a unified set of flags. It is well-documented and the team knows how to use it.

But AI agents do not read your documentation (at least, not by default). They pattern-match from weighted training data and reach for the tools they know. The result: agents bypass the test runner entirely, running commands that might work but miss project-specific configuration and that do not match CI.

We needed a way to intercept these commands and redirect the agent to our test runner, and we need to do this in a deterministic way.

## Why a Hook?

Hooks operate at a different level than documentation. They run during specific lifecycles, for example the moment the agent tries to use a tool like executing a shell command, and can then allow, deny, or modify that action. This allows us to enforce project conventions as rules and not mere suggestions.

Think of hooks as guardrails that catch the agent when it drifts toward generic behaviour and nudge it back toward your project's conventions.

### The Hook Lifecycle

Both [Claude Code](https://claude.com/product/claude-code) and [Cursor](cursor.com) support hooks. For example, both support hooks that run before tool execution. The timing is similar, but the naming differs:

- **Claude Code**: `PreToolUse` with a `Bash` matcher
- **Cursor**: `beforeShellExecution` or `preToolUse` with a `Shell` matcher

In both cases, the hook receives JSON on stdin describing the command about to execute, and returns JSON on stdout indicating whether to allow or deny the action. [There are other lifecycle events](https://cursor.com/docs/agent/hooks#hook-events), but for our use case, we need to intercept commands before they run.

### Detecting the Hook System

The first challenge: our hook needs to work in both environments, but they send different JSON structures.

Claude Code sends:

```json
{
  "hook_event_name": "PreToolUse",
  "tool_name": "Bash",
  "tool_input": {
    "command": "npx vitest run"
  }
}
```

Cursor's `beforeShellExecution` sends:

```json
{
  "hook_event_name": "beforeShellExecution",
  "command": "npx vitest run"
}
```

Notice the difference: Claude Code nests the command inside `tool_input`, while Cursor puts it at the top level. Our hook needs to handle both.

Here is how we detect which system we are running in:

```typescript
interface DetectedHook {
  system: "claude-code" | "cursor-shell" | "cursor-tool" | "unknown";
  command: string;
}

function detectHookSystem(input: HookInput): DetectedHook {
  const eventName: string = input.hook_event_name ?? "";

  // Cursor beforeShellExecution - command at top level
  if (eventName === "beforeShellExecution") {
    return {
      system: "cursor-shell",
      command: input.command ?? "",
    };
  }

  // Claude Code PreToolUse with Bash tool
  if (eventName === "PreToolUse" || input.tool_name === "Bash") {
    return {
      system: "claude-code",
      command: input.tool_input?.command ?? "",
    };
  }

  return { system: "unknown", command: "" };
}
```

This pattern detects the system and normalise the input and is the foundation that makes cross-platform hooks possible.

### Building the Response

The response format also differs between platforms. Claude Code expects:

```typescript
interface ClaudeCodeResponse {
  hookSpecificOutput: {
    hookEventName: string;
    permissionDecision: "allow" | "deny";
    permissionDecisionReason?: string;
  };
}
```

While Cursor expects:

```typescript
interface CursorShellResponse {
  permission: "allow" | "deny" | "ask";
  user_message?: string;
  agent_message?: string;
}
```

Our hook builds the appropriate response based on the detected system:

```typescript
function buildClaudeCodeResponse(
  blocked: BlockedPattern | null,
  command: string,
): ClaudeCodeResponse | null {
  if (!blocked) {
    return null; // Allow by returning nothing
  }

  return {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: buildBlockMessage(command, blocked),
    },
  };
}

function buildCursorShellResponse(
  blocked: BlockedPattern | null,
  command: string,
): CursorShellResponse {
  if (!blocked) {
    return { permission: "allow" };
  }

  return {
    permission: "deny",
    user_message: `Blocked direct ${blocked.tool} invocation.`,
    agent_message: buildBlockMessage(command, blocked),
  };
}
```

### Pattern Matching

The core logic matches commands against blocked patterns and checks for exceptions:

```typescript
interface BlockedPattern {
  regex: RegExp;
  tool: string;
  suggestion: string;
}

const BLOCKED_PATTERNS: BlockedPattern[] = [
  {
    regex: /\b(npx|yarn|pnpm)\s+vitest\b/i,
    tool: "Vitest",
    suggestion: "yarn test:unit",
  },
  {
    regex: /\b(npx|yarn|pnpm)\s+playwright\s+test\b/i,
    tool: "Playwright",
    suggestion: "yarn test:e2e (or test:component, test:vrt)",
  },
];

const ALLOWED_PATTERNS: RegExp[] = [
  /node\s+tests\/test-runner\.js/i,
  /\byarn\s+test(:|$)/i,
  /playwright\s+show-report/i,
];

function checkBlocked(command: string): BlockedPattern | null {
  // Check exceptions first
  for (const pattern of ALLOWED_PATTERNS) {
    if (pattern.test(command)) {
      return null;
    }
  }

  // Check blocked patterns
  for (const blocked of BLOCKED_PATTERNS) {
    if (blocked.regex.test(command)) {
      return blocked;
    }
  }

  return null;
}
```

Checking allowed patterns first serves as a short-circuit: if a command is explicitly permitted, we skip checking all the blocked patterns. It also acts as a safeguard against accidentally adding an overly broad blocked pattern in the future.

### The Block Message

When we deny a command, we do not just say "no", we explain what to use instead. The block message becomes part of the agent's context, steering it towards the correct approach:

```typescript
function buildBlockMessage(command: string, blocked: BlockedPattern): string {
  return `BLOCKED: Direct ${blocked.tool} invocation is not permitted.

Command attempted: ${command}

This project uses a unified test runner. Please use:
  ${blocked.suggestion}

Available yarn scripts:
  yarn test:unit       Unit tests (Vitest)
  yarn test:component  Component tests (Playwright)
  yarn test:e2e        End-to-end tests (Playwright)
  yarn test:vrt        Visual regression tests (Playwright)

For filtering and advanced options, see: tests/docs/test-runner.md

If the test runner cannot accomplish what you need, explain WHY.`;
}
```

This message serves two purposes: it tells the agent exactly what to do instead, and it points to documentation for edge cases the agent might encounter.

## Language Choice

Hooks are language-agnostic. They read JSON from stdin, make a decision, and write JSON to stdout. The hook systems do not care what language you use, they just execute a shell command. You could write hooks in Python, Bash, Ruby, or anything else that can handle standard input and output.

I chose TypeScript because Node.js is already part of our frontend toolchain. No additional runtime to install, no separate build process for the hook itself.

### TypeScript with Erasable Types

The hook uses erasable types that Node.js can strip at runtime without a build step.

Node.js 22.6+ supports `--experimental-strip-types`, and Node.js 23.6+ handles `.ts` files without any flags. This means we get full type safety during development without adding a compilation step to our workflow.

The key restriction is avoiding TypeScript features that require transformation rather than simple removal. For example, enums, namespaces, and parameter properties are out.

```typescript
// These work (erasable)
interface BlockedPattern {
  regex: RegExp;
  tool: string;
  suggestion: string;
}

const patterns: BlockedPattern[] = [];

// These do not work (require transformation)
enum Status {
  Allow,
  Deny,
} // Use const objects instead
```

## Fail-Open Behaviour

One design decision worth highlighting: the hook fails open. If something goes wrong while parsing input or the system cannot be detected, the hook allows the command to proceed rather than blocking legitimate work.

```typescript
async function main(): Promise<void> {
  let input: HookInput;

  try {
    const rawInput: string = await readStdin();
    input = JSON.parse(rawInput) as HookInput;
  } catch (error) {
    console.error(`Hook error: ${error}`);
    process.exit(0); // Fail open - allow the command
  }

  // ... rest of the logic
}
```

This is a pragmatic choice. The hook exists to guide, not to obstruct. If something unexpected happens, it is better to let the agent proceed than to block work entirely.

## Configuration

The hook script can live anywhere in your project, the config just specifies a command to run. For a cross-platform hook, a shared location makes sense:

```text
project/
├── hooks/
│   └── enforce-test-runner.ts
├── .claude/
│   └── settings.json
└── .cursor/
    └── hooks.json
```

For Claude Code, add to `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node --experimental-strip-types hooks/enforce-test-runner.ts",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

For Cursor, add to `.cursor/hooks.json`:

```json
{
  "version": 1,
  "hooks": {
    "beforeShellExecution": [
      {
        "command": "node --experimental-strip-types hooks/enforce-test-runner.ts"
      }
    ]
  }
}
```

Both use the same relative path from the project root.

## Beyond Test Runners

While this hook enforces test runner usage, the pattern applies to any situation where you need deterministic control over agent behaviour:

- Enforcing code style tools (use `yarn lint` instead of `npx eslint`)
- Preventing direct database access (use migration scripts instead)
- Requiring specific deployment commands
- Blocking commands that should not run in development

The core pattern remains the same: detect the system, extract the command, match against patterns, and return the appropriate response.

## Source Code

The complete hook, configuration files, and documentation [are available on GitHub](https://github.com/schalkneethling/cross-platform-hooks)

## Further Reading

- [Claude Code Hooks Documentation](https://docs.anthropic.com/en/docs/claude-code/hooks)
- [Cursor Hooks Documentation](https://cursor.com/docs/agent/hooks)
- [Node.js Type Stripping](https://nodejs.org/api/typescript.html#type-stripping)
