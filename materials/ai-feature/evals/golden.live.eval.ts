import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { proposeDraft } from "@/lib/ai/draft";
import { JUDGE_MODEL, PRODUCT_MODELS, makeJudgeModel, makeProductModel } from "@/lib/ai/models";
import { DRAFT_PROMPT_VERSION } from "@/lib/ai/prompts/draft";
import { DraftSchema } from "@/lib/ai/schema";
import { judgeSummary, passRate, scoreFields, type GoldenCase } from "@/lib/ai/scorer";
import casesJson from "../tests/fixtures/golden/cases.json";

// `npm run eval` — ЖИВИЙ прогін golden cases на безкоштовних моделях OpenRouter. Ніколи не в `npm test` і не в CI.
// Потрібен ваш ключ у .env.local (OPENROUTER_API_KEY). Без ключа всі кейси пропускаються — це не помилка.
//   RUNS=2    — кілька прогонів поспіль для частки успіху (pass rate); бюджет див. нижче.
//   RECORD=1  — успішні відповіді дописати в tests/fixtures/golden/recorded.json (для офлайн-реплею в CI).
// PowerShell: $env:RECORD="1"; npm run eval   (а потім Remove-Item Env:RECORD)

const cases = casesJson as GoldenCase[];
const key = process.env.OPENROUTER_API_KEY;
const RECORD = process.env.RECORD === "1";
const RUNS = Math.max(1, Number(process.env.RUNS ?? 1) || 1);
const RECORDED_PATH = "tests/fixtures/golden/recorded.json";
const REPORT_DIR = "evals/reports";

// Бюджет: на прогін — 10 викликів моделі + до 10 викликів судді, з одного денного лічильника акаунта
// (50/день без покупки ≥10 кредитів). Ланцюжок `models` цей ліміт не обходить, спроби fallback теж можуть рахуватися.
const NEEDED = RUNS * (cases.length + cases.filter((c) => c.rubric).length);
const GAP_MS = 3_000; // ≤ 20 запитів/хв навіть коли модель і суддя відповідають швидко

type Recording = { modelId: string; recordedAt: string; promptVersion: string; text: string };
type Row = { run: number; id: string; modelId: string; fields: boolean; judge?: boolean; pass: boolean; why?: string };
const rows: Row[] = [];
const fresh: Record<string, Recording> = {};

describe.skipIf(!key)("golden cases, живий прогін (безкоштовні моделі OpenRouter)", () => {
  beforeAll(async () => {
    // Скільки безкоштовних запитів лишилось сьогодні (UTC-доба; у листопаді скидається о 02:00 за Києвом).
    const res = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${key}` } });
    const body = (await res.json()) as { data?: { free_model_daily_requests?: { remaining?: number } } };
    const remaining = body.data?.free_model_daily_requests?.remaining;
    if (typeof remaining === "number" && remaining < NEEDED) {
      throw new Error(`Сьогодні лишилось ${remaining} безкоштовних запитів, потрібно ${NEEDED}. Запустіть завтра або зменште RUNS.`);
    }
  });

  for (let run = 1; run <= RUNS; run++) {
    for (const c of cases) {
      it(`прогін ${run}: golden ${c.id}`, async () => {
        await sleep(GAP_MS);
        // maxRetries 0: денний 429 повтором не виправити, повтор лише з'їдає ліміт.
        const result = await proposeDraft({ text: c.input }, makeProductModel(key), { maxRetries: 0, timeoutMs: 90_000 });
        expect(result.ok, result.ok ? "" : `${result.reason}: ${result.message}`).toBe(true);
        if (!result.ok) {
          rows.push({ run, id: c.id, modelId: "—", fields: false, pass: false, why: result.reason });
          return;
        }
        const fields = scoreFields(c.expected, result.draft);
        const verdict = c.rubric ? await judgeSummary(makeJudgeModel(key), c.rubric, result.draft.summary) : undefined;
        const pass = fields.pass && (verdict?.pass ?? true);
        rows.push({ run, id: c.id, modelId: result.modelId, fields: fields.pass, judge: verdict?.pass, pass, why: verdict?.reason });
        // Записуємо ЛИШЕ успішні відповіді: офлайн-реплей у CI має лишатися зеленим.
        if (RECORD && pass) {
          fresh[c.id] = {
            modelId: result.modelId,
            recordedAt: new Date().toISOString(),
            promptVersion: DRAFT_PROMPT_VERSION,
            text: JSON.stringify(DraftSchema.parse(result.draft)),
          };
        }
        expect(fields.mismatches).toEqual([]);
        if (verdict) expect(verdict.pass, verdict.reason).toBe(true);
      });
    }
  }

  afterAll(() => {
    console.table(rows); // яка модель з ланцюжка відповіла на кожен кейс: бал — за модель, а не «за AI»
    writeReport();
    if (RECORD && Object.keys(fresh).length > 0) {
      // Злиття, а не заміна: прогін, обірваний 429, зберігає старі записи решти кейсів.
      const old = JSON.parse(readFileSync(RECORDED_PATH, "utf8")) as Record<string, Recording>;
      writeFileSync(RECORDED_PATH, JSON.stringify({ ...old, ...fresh }, null, 2) + "\n");
    }
  });
});

// Звіт для домашки: частка успіху загалом і за моделлю + кожен кейс. Файл комітять (він без секретів).
function writeReport() {
  if (rows.length === 0) return;
  const total = passRate(rows);
  const byModel = new Map<string, Row[]>();
  for (const r of rows) byModel.set(r.modelId, [...(byModel.get(r.modelId) ?? []), r]);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const lines = [
    `# Живий прогін golden cases — ${new Date().toISOString()}`,
    "",
    `- Промпт: \`${DRAFT_PROMPT_VERSION}\`; ланцюжок моделей: ${PRODUCT_MODELS.map((m) => `\`${m}\``).join(" → ")}; суддя: \`${JUDGE_MODEL}\``,
    `- Прогонів: ${RUNS}; кейсів у прогоні: ${cases.length}`,
    `- **Частка успіху: ${total.passed}/${total.total} (${Math.round(total.rate * 100)}%)**`,
    "",
    "| Модель, що відповіла | Пройшло | Усього |",
    "|---|---|---|",
    ...[...byModel].map(([m, rs]) => `| \`${m}\` | ${passRate(rs).passed} | ${rs.length} |`),
    "",
    "| Прогін | Кейс | Модель | Поля | Суддя | Результат | Причина судді / помилка |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.run} | ${r.id} | \`${r.modelId}\` | ${r.fields ? "так" : "ні"} | ${r.judge === undefined ? "—" : r.judge ? "так" : "ні"} | ${r.pass ? "✅" : "❌"} | ${(r.why ?? "").replaceAll("|", "/")} |`,
    ),
    "",
  ];
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(`${REPORT_DIR}/${stamp}.md`, lines.join("\n"));
  console.log(`Звіт: ${REPORT_DIR}/${stamp}.md`);
}
