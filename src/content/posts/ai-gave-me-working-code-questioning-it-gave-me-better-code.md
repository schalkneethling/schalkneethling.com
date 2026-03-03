---
title: "AI Gave Me Working Code. Questioning It Gave Me Better Code."
pubDate: 2026-03-03
description: "Working code isn't understood code. When AI-generated code feels hard to parse, that's a signal to ask questions, and sometimes, the answer leads to something better."
author: "Schalk Neethling"
tags: ["ai", "best-practices"]
---

AI coding assistants are remarkably good at producing working code. They'll solve your problem, often in ways you didn't expect. But there's a trap here: the code works, so you move on. You stop asking questions. You should never stop asking questions.

I was recently reviewing some agent-generated code and came across this function:

```javascript
function parseScope(messageData) {
  if (messageData === "reloadParent") {
    return "parent";
  }

  if (typeof messageData === "string" && messageData.length === 0) {
    return "iframe";
  }

  try {
    const parsed = JSON.parse(messageData);
    return parsed.scope || "iframe";
  } catch {
    return "iframe";
  }
}
```

It worked. The tests passed. But I couldn't parse the reasoning behind it, even though I knew the context around the current changeset. Why check for the literal string `"reloadParent"`? Why dthe verbose `typeof messageData === "string" && messageData.length === 0` when `messageData === ""` is enough? Why do so many of the branches all end in "iframe"?

No comments. No explanation. Just code that happened to do the right thing.

## Asking the Question

Instead of accepting it and moving on, I highlighted the function and asked the agent: "This function is a bit hard to parse for me. What is the thinking and reasoning behind it?"

The answer was revealing: backwards compatibility. The system was transitioning between an old string-based protocol and a new JSON-based one. The function needed to handle both gracefully.

The flow made sense once explained. If the message is the old `"reloadParent"` string, return `"parent"`. If it's an empty string (another legacy case), return `"iframe"`. Otherwise, try parsing it as JSON and extract the `scope` property. If anything fails, fall back to `"iframe"`. Always return a valid target, never crash.

Suddenly the function wasn't mysterious, it was defensive. But I only understood that because I asked.

## The Refactor That Followed

Here's where it gets interesting. Because I questioned the code, the agent proposed a refactor:

```javascript
function parseLegacyScope(messageData) {
  if (messageData === "reloadParent") {
    return "parent";
  }

  if (typeof messageData === "string" && messageData.length === 0) {
    return "iframe";
  }

  return null;
}

function parseJsonScope(messageData) {
  try {
    const parsed = JSON.parse(messageData);
    return parsed.scope || "iframe";
  } catch {
    return "iframe";
  }
}

function parseScope(messageData) {
  const legacyScope = parseLegacyScope(messageData);
  if (legacyScope) {
    return legacyScope;
  }

  return parseJsonScope(messageData);
}
```

I then jumped in and simplified the one conditional a bit more:

```javascript
function parseLegacyScope(messageData) {
  if (messageData === "reloadParent") {
    return "parent";
  }

  if (messageData === "") {
    return "iframe";
  }

  return null;
}
```

Three functions instead of one. Each with a clear, single responsibility. `parseLegacyScope` handles the old protocol. `parseJsonScope` handles the new one. `parseScope` orchestrates between them.

This refactor is a must-have. Not because the original didn't work, but because it makes the intent obvious. When you come back to this code in two months, you'll immediately understand what's happening. And when the legacy protocol can finally be dropped, the path forward is clear: delete `parseLegacyScope` and simplify the orchestrator.

None of this would have happened if I'd just accepted the first solution.

## The Habit Worth Building

AI assistants are trained to give you answers, not necessarily to explain their reasoning unprompted. They'll produce code that works. Your job is to understand _why_ it works and whether it's the right solution or just _a_ solution.

When code feels hard to parse, that's a signal. Ask the question. Demand the reasoning. You'll often find that the AI has a legitimate explanation you hadn't considered. And sometimes, like in this case, you'll find that asking leads to something better.

The tools have changed. The need for critical thinking hasn't.
