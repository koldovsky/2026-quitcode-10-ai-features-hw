import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import type { HookJSONOutput, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
import { checkWritePath, makeWriteGuard } from "../src/guard.ts";

const posix = path.posix;
const win = path.win32;

test("дозволено: файл усередині out/", () => {
  assert.equal(checkWritePath("out/2026-11-05-triage.md", "/w", "out", posix).ok, true);
  assert.equal(checkWritePath("/w/out/sub/a.md", "/w", "out", posix).ok, true);
});

test("відмова: «..», сусідня тека з префіксом out, сама тека out, чужий абсолютний шлях", () => {
  for (const p of ["../secrets.txt", "out/../src/x.ts", "output/x.md", "out", "/etc/passwd", "src/worker.ts", ""]) {
    assert.equal(checkWritePath(p, "/w", "out", posix).ok, false, p);
  }
});

test("Windows: інший диск і регістр літер", () => {
  assert.equal(checkWritePath("C:\\Windows\\x.txt", "D:\\w", "out", win).ok, false);
  assert.equal(checkWritePath("D:\\W\\OUT\\a.md", "D:\\w", "out", win).ok, true);
  assert.equal(checkWritePath("out\\..\\..\\x.md", "D:\\w", "out", win).ok, false);
});

test("не рядок замість шляху — відмова", () => {
  assert.equal(checkWritePath(undefined, "/w", "out", posix).ok, false);
  assert.equal(checkWritePath(42, "/w", "out", posix).ok, false);
});

function pre(tool_name: string, tool_input: unknown): PreToolUseHookInput {
  return {
    hook_event_name: "PreToolUse",
    session_id: "s",
    transcript_path: "t",
    cwd: process.cwd(),
    tool_name,
    tool_input,
    tool_use_id: "u",
  };
}

function decision(out: HookJSONOutput): string | undefined {
  const specific = "hookSpecificOutput" in out ? out.hookSpecificOutput : undefined;
  return specific && "permissionDecision" in specific ? specific.permissionDecision : undefined;
}

test("хук PreToolUse: Write/Edit поза out/ — deny з причиною; всередині й інші інструменти — без рішення", async () => {
  const lines: string[] = [];
  const guard = makeWriteGuard("out", (l) => lines.push(l));
  const opts = { signal: new AbortController().signal };
  assert.equal(decision(await guard(pre("Write", { file_path: "../secrets.txt", content: "x" }), "u", opts)), "deny");
  assert.equal(lines.length, 1);
  assert.deepEqual(await guard(pre("Write", { file_path: "out/a.md", content: "x" }), "u", opts), {});
  assert.deepEqual(await guard(pre("mcp__inbox__read_inbox", {}), "u", opts), {});
  assert.equal(decision(await guard(pre("Edit", { file_path: "src/worker.ts" }), "u", opts)), "deny");
});
