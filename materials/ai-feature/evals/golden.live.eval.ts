import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { classifyError, proposeDraft } from "@/lib/ai/draft";
import { JUDGE_MODEL, PRODUCT_MODELS, makeJudgeModel, makeProductModel } from "@/lib/ai/models";
import { DRAFT_PROMPT_VERSION } from "@/lib/ai/prompts/draft";
import { DraftSchema } from "@/lib/ai/schema";
import { judgeSummary, passRate, scoreFields, type GoldenCase } from "@/lib/ai/scorer";
import casesJson from "../tests/fixtures/golden/cases.json";

// `npm run eval` — ЖИВИЙ прогін golden cases на безкоштовних моделях OpenRouter. Ніколи не в `npm test` і не в CI.
// Потрібен ваш ключ у .env.local (OPENROUTER_API_KEY). Без ключа всі кейси пропускаються — це не помилка.
// Перший 429 (моделі чи судді) зупиняє прогін: цей і решта кейсів — NOT RUN з причиною у звіті, у частку успіху не входять.
// Таймаут, помилка постачальника, відповідь не за схемою — FAIL з причиною (входять у частку успіху).
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
// notRun — кейс не запускали через ліміт (429): у частку успіху не входить, у звіті — окремим рядком з причиною.
type Row = { run: number; id: string; modelId: string; fields: boolean; judge?: boolean; pass: boolean; notRun?: boolean; why?: string };
const rows: Row[] = [];
const fresh: Record<string, Recording> = {};
// Перший 429 зупиняє прогін (і наступні RUNS): денний ліміт повтором не виправити, решта кейсів — NOT RUN.
let stoppedAt: string | undefined;

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
      it(`прогін ${run}: golden ${c.id}`, async (ctx) => {
        if (stoppedAt) {
          rows.push({ run, id: c.id, modelId: "—", fields: false, pass: false, notRun: true, why: `NOT RUN: зупинено після 429 (${stoppedAt})` });
          return ctx.skip();
        }
        await sleep(GAP_MS);
        // maxRetries 0: денний 429 повтором не виправити, повтор лише з'їдає ліміт.
        const result = await proposeDraft({ text: c.input }, makeProductModel(key), { maxRetries: 0, timeoutMs: 90_000 });
        if (!result.ok) {
          // Рядок у звіт — ДО перевірки: інакше кейс зникає зі звіту, і частку успіху рахують з меншого знаменника.
          if (result.reason === "rate_limited") {
            stoppedAt = `${c.id}, прогін ${run}`;
            rows.push({ run, id: c.id, modelId: "—", fields: false, pass: false, notRun: true, why: `NOT RUN: 429 — ${result.message}` });
            return ctx.skip();
          }
          // Таймаут, помилка постачальника, відповідь не за схемою — це FAIL з причиною, він входить у частку успіху.
          rows.push({ run, id: c.id, modelId: "—", fields: false, pass: false, why: `${result.reason}: ${result.message}` });
        }
        expect(result.ok, result.ok ? "" : `${result.reason}: ${result.message}`).toBe(true);
        if (!result.ok) return;
        const fields = scoreFields(c.expected, result.draft);
        let verdict: { pass: boolean; reason: string } | undefined;
        if (c.rubric) {
          try {
            verdict = await judgeSummary(makeJudgeModel(key), c.rubric, result.draft.summary);
          } catch (error) {
            // Суддя теж може отримати 429 чи не відповісти — кейс лишається у звіті з причиною.
            const failure = classifyError(error);
            if (failure.reason === "rate_limited") {
              stoppedAt = `${c.id}, прогін ${run}, суддя`;
              rows.push({ run, id: c.id, modelId: result.modelId, fields: fields.pass, pass: false, notRun: true, why: `NOT RUN: суддя — 429` });
              return ctx.skip();
            }
            verdict = { pass: false, reason: `суддя: ${failure.reason}` };
          }
        }
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
  // Частка успіху — лише з кейсів, що дістали відповідь; NOT RUN (ліміт) — окремо, не як FAIL і не мовчки.
  const ran = rows.filter((r) => !r.notRun);
  const notRun = rows.filter((r) => r.notRun);
  const total = passRate(ran);
  const byModel = new Map<string, Row[]>();
  for (const r of ran) byModel.set(r.modelId, [...(byModel.get(r.modelId) ?? []), r]);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const lines = [
    `# Живий прогін golden cases — ${new Date().toISOString()}`,
    "",
    `- Промпт: \`${DRAFT_PROMPT_VERSION}\`; ланцюжок моделей: ${PRODUCT_MODELS.map((m) => `\`${m}\``).join(" → ")}; суддя: \`${JUDGE_MODEL}\``,
    `- Прогонів: ${RUNS}; кейсів у прогоні: ${cases.length}`,
    `- **Частка успіху: ${total.passed}/${total.total} (${Math.round(total.rate * 100)}%)** — з кейсів, що отримали відповідь`,
    `- Не запущено (NOT RUN): ${notRun.length}${stoppedAt ? ` — ліміт 429, зупинено на: ${stoppedAt}` : ""}`,
    "",
    "| Модель, що відповіла | Пройшло | Усього |",
    "|---|---|---|",
    ...[...byModel].map(([m, rs]) => `| \`${m}\` | ${passRate(rs).passed} | ${rs.length} |`),
    "",
    "| Прогін | Кейс | Модель | Поля | Суддя | Результат | Причина судді / помилка |",
    "|---|---|---|---|---|---|---|",
    ...rows.map(
      (r) =>
        `| ${r.run} | ${r.id} | \`${r.modelId}\` | ${r.fields ? "так" : "ні"} | ${r.judge === undefined ? "—" : r.judge ? "так" : "ні"} | ${r.notRun ? "NOT RUN" : r.pass ? "✅" : "❌"} | ${(r.why ?? "").replaceAll("|", "/")} |`,
    ),
    "",
  ];
  mkdirSync(REPORT_DIR, { recursive: true });
  writeFileSync(`${REPORT_DIR}/${stamp}.md`, lines.join("\n"));
  console.log(`Звіт: ${REPORT_DIR}/${stamp}.md`);
}
