import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

// «Перевірка ключа»: ключ OpenRouter живе лише на сервері.
// Статична перевірка файлів репозиторію — без мережі й без значення ключа (його тест не читає).
const root = process.cwd();
const KEY_READER = "src/lib/ai/openrouter.ts"; // єдиний файл у src/, якому дозволено читати OPENROUTER_API_KEY

function walk(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : walk(p);
    return /\.(ts|tsx|js|jsx|mjs)$/.test(e.name) ? [p] : [];
  });
}

const srcFiles = walk(path.join(root, "src")).map((abs) => ({
  rel: path.relative(root, abs).replaceAll("\\", "/"),
  text: readFileSync(abs, "utf8"),
}));

describe("перевірка ключа: OPENROUTER_API_KEY лише на сервері", () => {
  it("імпорт обгортки з ключем поза серверним кодом падає (server-only)", async () => {
    // Тому чиста функція proposeDraft отримує модель параметром, а не імпортує src/lib/ai/openrouter.ts.
    await expect(import("@/lib/ai/openrouter")).rejects.toThrow(/Server Component/);
  });

  it("жодного NEXT_PUBLIC_ для ключа моделі — ні в src/, ні в .env.example", () => {
    const envExample = existsSync(path.join(root, ".env.example")) ? readFileSync(path.join(root, ".env.example"), "utf8") : "";
    const offenders = [...srcFiles, { rel: ".env.example", text: envExample }]
      .filter((f) => /NEXT_PUBLIC_[A-Z0-9_]*(OPENROUTER|LLM|AI_|MODEL|API_KEY)/.test(f.text))
      .map((f) => f.rel);
    expect(offenders).toEqual([]);
  });

  it(`ключ читає лише ${KEY_READER}, і цей файл починається з import "server-only"`, () => {
    const readers = srcFiles.filter((f) => /OPENROUTER_API_KEY/.test(f.text)).map((f) => f.rel);
    expect(readers).toEqual([KEY_READER]);
    const reader = srcFiles.find((f) => f.rel === KEY_READER);
    expect(reader?.text.trimStart().startsWith('import "server-only"')).toBe(true);
  });

  it('жоден файл із "use client" не імпортує модель чи обгортку з ключем', () => {
    const clientFiles = srcFiles.filter((f) => /^\s*["']use client["']/.test(f.text));
    const offenders = clientFiles.filter((f) => /@\/lib\/ai\/(openrouter|models)["']/.test(f.text)).map((f) => f.rel);
    expect(offenders).toEqual([]);
  });
});
