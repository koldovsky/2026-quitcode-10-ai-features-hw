import { Output, generateText, type LanguageModel } from "ai";
import { z } from "zod";
import { JUDGE_INSTRUCTIONS, judgePrompt } from "./prompts/judge";
import type { Draft } from "./schema";

// Один golden case від PM: вхід → очікуване. Формат файлу — tests/fixtures/golden/cases.json.
export type GoldenCase = {
  id: string; // "GC-01"
  input: string;
  // Лише ті поля, які PM фіксує однозначно (переліки, дати). Порівнюються точно.
  expected: Partial<Pick<Draft, "status" | "category" | "priority" | "dueDate">>;
  // Слова PM: що вільний текст (summary) має містити / чого не має містити. Оцінює LLM-суддя лише в живому eval.
  rubric?: string;
};

// (1) Детермінована частина: точний збіг полів, зафіксованих PM у golden case.
export function scoreFields(expected: GoldenCase["expected"], actual: Draft) {
  const mismatches = (Object.keys(expected) as (keyof GoldenCase["expected"])[])
    .filter((k) => expected[k] !== actual[k])
    .map((k) => ({ field: k, expected: expected[k], actual: actual[k] }));
  return { pass: mismatches.length === 0, mismatches };
}

// (2) Нечітка частина: LLM-суддя лише для вільного тексту, двійковий вердикт із причиною.
const Verdict = z.object({ pass: z.boolean(), reason: z.string().max(300) });
export type JudgeVerdict = z.infer<typeof Verdict>;

export async function judgeSummary(judge: LanguageModel, rubric: string, summary: string): Promise<JudgeVerdict> {
  const { output } = await generateText({
    model: judge,
    instructions: JUDGE_INSTRUCTIONS,
    prompt: judgePrompt(rubric, summary),
    output: Output.object({ name: "verdict", schema: Verdict }),
    temperature: 0,
    maxRetries: 0, // повтор на безкоштовному тарифі витрачає той самий денний ліміт
  });
  return output;
}

// Частка успіху (pass rate) — визначення з WS8: прогін на задачах із відомими відповідями (ключ) → бал.
export function passRate(results: { pass: boolean }[]): { passed: number; total: number; rate: number } {
  const passed = results.filter((r) => r.pass).length;
  return { passed, total: results.length, rate: results.length ? passed / results.length : 0 };
}
