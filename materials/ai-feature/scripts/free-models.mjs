#!/usr/bin/env node
// npm run ai:models — які безкоштовні моделі OpenRouter доступні СЬОГОДНІ і що вони вміють.
// Публічний список https://openrouter.ai/api/v1/models — ключ не потрібен, нічого не витрачає.
// Колонки: SO = structured_outputs (строга json_schema), RF = response_format, tools = виклик інструментів.
// Наприкінці — чи всі моделі з ланцюжка в src/lib/ai/models.ts ще є в списку.
//   node scripts/free-models.mjs          таблиця
//   node scripts/free-models.mjs --json   JSON для власних скриптів
import { existsSync, readFileSync } from "node:fs";

const URL = "https://openrouter.ai/api/v1/models";
const MODELS_FILE = "src/lib/ai/models.ts";

const res = await fetch(URL);
if (!res.ok) {
  console.error(`GET ${URL} → HTTP ${res.status}`);
  process.exit(1);
}
const { data } = await res.json();

const isZero = (v) => v === undefined || v === null || Number(v) === 0;
const rows = data
  .filter((m) => m.id.endsWith(":free") || (isZero(m.pricing?.prompt) && isZero(m.pricing?.completion)))
  .map((m) => {
    const sp = m.supported_parameters ?? [];
    return {
      id: m.id,
      // Нульова ціна без суфікса :free (stealth-моделі, генерація музики тощо) — не плутати з безкоштовними LLM.
      note: m.id.endsWith(":free") ? "" : "ціна 0, але без :free — перевірте опис",
      context: m.context_length ?? m.top_provider?.context_length ?? null,
      input: (m.architecture?.input_modalities ?? []).join("+"),
      tools: sp.includes("tools"),
      SO: sp.includes("structured_outputs"),
      RF: sp.includes("response_format"),
      expires: m.expiration_date ?? "",
    };
  })
  .sort((a, b) => Number(b.SO) - Number(a.SO) || a.id.localeCompare(b.id));

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

console.log(`OpenRouter, ${new Date().toISOString()}: моделей усього ${data.length}, безкоштовних (або з ціною 0) ${rows.length}`);
const yes = (b) => (b ? "так" : "—");
console.table(
  rows.map((r) => ({
    id: r.id,
    "контекст": r.context,
    "вхід": r.input,
    tools: yes(r.tools),
    SO: yes(r.SO),
    RF: yes(r.RF),
    "до": r.expires,
    "увага": r.note,
  })),
);

// Звірка з ланцюжком у коді (лише рядки ID з `:free`, знайдені в тексті файлу).
if (existsSync(MODELS_FILE)) {
  const chain = [...readFileSync(MODELS_FILE, "utf8").matchAll(/"([a-z0-9._-]+\/[a-z0-9._-]+:free)"/gi)].map((m) => m[1]);
  const known = new Set(rows.map((r) => r.id));
  const gone = [...new Set(chain)].filter((id) => !known.has(id));
  if (gone.length) {
    console.log(`\nУВАГА: у ${MODELS_FILE} є моделі, яких сьогодні немає в списку: ${gone.join(", ")}. Оновіть ланцюжок.`);
    process.exitCode = 2;
  } else if (chain.length) {
    console.log(`\nУсі моделі з ${MODELS_FILE} є в списку (${[...new Set(chain)].length}).`);
  }
}
