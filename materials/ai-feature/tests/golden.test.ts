import { APICallError } from "ai";
import { MockLanguageModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { proposeDraft } from "@/lib/ai/draft";
import { DRAFT_PROMPT_VERSION } from "@/lib/ai/prompts/draft";
import { scoreFields, type GoldenCase } from "@/lib/ai/scorer";
import casesJson from "./fixtures/golden/cases.json";
import recordedJson from "./fixtures/golden/recorded.json";

// Офлайн-реплей golden cases: без мережі й без ключа, тож працює в CI (`npm test`, job `app`).
// Перевіряє КОД навколо моделі (промпт, межа <document>, схема, мапінг помилок, оцінювач), а НЕ якість моделі —
// якість міряє живий прогін `npm run eval` (evals/golden.live.eval.ts).

type Recording = { modelId: string; recordedAt: string; promptVersion?: string; text: string };
const cases = casesJson as GoldenCase[];
const recorded = recordedJson as Record<string, Recording>;

const usage = {
  inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
  outputTokens: { total: 20, text: 20, reasoning: undefined },
};

// Модель, що «відповідає» записаним текстом.
function replay(text: string, modelId = "recorded") {
  return new MockLanguageModelV4({
    modelId,
    doGenerate: async () => ({
      content: [{ type: "text", text }],
      finishReason: { unified: "stop", raw: undefined },
      usage,
      warnings: [],
    }),
  });
}

describe("golden cases, офлайн-реплей", () => {
  // AC-DRAFT-01 — ЗАМІНІТЬ на ID критерію PM про golden cases вашого зрізу 4.
  // Назва — звичайний рядок, що ПОЧИНАЄТЬСЯ з AC ID: `${AC} …` (шаблонний рядок) ac:coverage не зарахує.
  // Без .skip / .skipIf і без умови «є ключ»: пропущений тест не рахується як покриття.
  // Кілька AC (напр. окремий AC на відмови)? Розділіть: it.each(cases.filter(…))("AC-…-02: golden $id", …).
  it.each(cases)("AC-DRAFT-01: golden $id", async (c) => {
    const rec = recorded[c.id];
    expect(rec, `немає запису для ${c.id} у recorded.json`).toBeDefined();
    const model = replay(rec.text, rec.modelId);
    const result = await proposeDraft({ text: c.input }, model);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(scoreFields(c.expected, result.draft).mismatches).toEqual([]);
    // Недовірений вхід дійшов до моделі загорнутим як дані.
    expect(JSON.stringify(model.doGenerateCalls[0].prompt)).toContain("<document>");
  });

  it("кожен golden case має запис, записаний поточною версією промпту", () => {
    const missing = cases.map((c) => c.id).filter((id) => !recorded[id]);
    expect(missing).toEqual([]);
    const stale = Object.entries(recorded)
      .filter(([, r]) => r.promptVersion && r.promptVersion !== DRAFT_PROMPT_VERSION)
      .map(([id]) => id);
    // Змінили DRAFT_PROMPT_VERSION — перезапишіть записи живим прогоном (README, «Перезапис записів»).
    expect(stale).toEqual([]);
  });
});

describe("запобіжники й збої", () => {
  it("відповідь не за схемою → invalid_output, нічого не зберігаємо", async () => {
    const result = await proposeDraft({ text: "x" }, replay('{"status":"ok","category":"dragons"}'));
    expect(result).toMatchObject({ ok: false, reason: "invalid_output" });
  });

  it("429 → rate_limited, повтор рівно maxRetries разів", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new APICallError({
          message: "Rate limit exceeded: free-models-per-day",
          url: "https://openrouter.ai/api/v1/chat/completions",
          requestBodyValues: {},
          statusCode: 429,
        });
      },
    });
    const result = await proposeDraft({ text: "x" }, model, { maxRetries: 1 });
    expect(result).toMatchObject({ ok: false, reason: "rate_limited" });
    expect(model.doGenerateCalls).toHaveLength(2);
  });

  it("HTTP 200 з тілом помилки code 429 → rate_limited (ліміт постачальника за OpenRouter)", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async () => {
        throw new APICallError({
          message: "Provider returned error",
          url: "u",
          requestBodyValues: {},
          statusCode: 200,
          data: { code: 429, message: "upstream rate limit" },
        });
      },
    });
    const result = await proposeDraft({ text: "x" }, model, { maxRetries: 2 });
    expect(result).toMatchObject({ ok: false, reason: "rate_limited" });
    expect(model.doGenerateCalls).toHaveLength(1); // statusCode 200 не повторюється
  });

  it("повільна модель → timeout", async () => {
    const model = new MockLanguageModelV4({
      doGenerate: async ({ abortSignal }) => {
        await new Promise((resolve, reject) => {
          const t = setTimeout(resolve, 5_000);
          abortSignal?.addEventListener("abort", () => {
            clearTimeout(t);
            reject(abortSignal.reason);
          });
        });
        throw new Error("unreachable");
      },
    });
    const result = await proposeDraft({ text: "x" }, model, { timeoutMs: 50, maxRetries: 0 });
    expect(result).toMatchObject({ ok: false, reason: "timeout" });
  });
});
