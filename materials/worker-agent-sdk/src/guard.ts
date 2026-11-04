// Межа працівника в коді: писати можна лише в теку out/.
// Правило в промпті («пиши лише в out/») модель може порушити; хук PreToolUse — ні: він спрацьовує ДО виклику.
import path from "node:path";
import type { HookCallback, PreToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";

export type PathCheck = { ok: true; resolved: string } | { ok: false; reason: string };

/**
 * Чиста функція: чи лежить filePath (відносний до cwd або абсолютний) всередині allowedDir.
 * Ловить «..», абсолютні шляхи деінде і інший диск Windows (path.relative тоді повертає абсолютний шлях).
 */
export function checkWritePath(
  filePath: unknown,
  cwd: string,
  allowedDir: string,
  p: typeof path = path,
): PathCheck {
  if (typeof filePath !== "string" || filePath.trim() === "") {
    return { ok: false, reason: "немає шляху до файлу" };
  }
  const base = p.resolve(cwd, allowedDir);
  const target = p.resolve(cwd, filePath);
  const rel = p.relative(base, target);
  if (rel === "" || rel.startsWith("..") || p.isAbsolute(rel)) {
    return { ok: false, reason: `запис дозволено лише всередині ${allowedDir}/, а не в ${filePath}` };
  }
  return { ok: true, resolved: target };
}

const WRITE_TOOLS = new Set(["Write", "Edit", "MultiEdit", "NotebookEdit"]);

/** Хук PreToolUse: забороняє інструменти запису поза allowedDir. Решту інструментів не чіпає. */
export function makeWriteGuard(allowedDir: string, log: (line: string) => void = () => {}): HookCallback {
  return async (input) => {
    if (input.hook_event_name !== "PreToolUse") return {};
    const pre = input as PreToolUseHookInput;
    if (!WRITE_TOOLS.has(pre.tool_name)) return {};
    const toolInput = (pre.tool_input ?? {}) as Record<string, unknown>;
    const filePath = toolInput.file_path ?? toolInput.notebook_path;
    const check = checkWritePath(filePath, pre.cwd, allowedDir);
    if (check.ok) return {};
    log(`ВІДМОВА ${pre.tool_name}: ${check.reason}`);
    return {
      hookSpecificOutput: {
        hookEventName: "PreToolUse",
        permissionDecision: "deny",
        permissionDecisionReason: check.reason,
      },
    };
  };
}
