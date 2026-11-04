import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Кандидати на 04.11.2026 (OpenRouter GET /api/v1/models). Безкоштовні моделі з'являються й зникають:
// перед роботою запустіть `npm run ai:models` і перевірте ланцюжок живим прогоном `npm run eval`.
// Порядок = пріоритет. Лише ID із `:free`: платна модель у списку fallback оплачується за її ціною.
//   gemma-4-31b / gemma-4-26b — найкраща заявка на багатомовність (українська — ймовірно, у картці не названа);
//     НЕ мають structured_outputs: json_schema може бути проігноровано, тому поля повторено в промпті, а zod — ворота.
//   nemotron-3.5-super-vl     — строга схема (structured_outputs) і зображення; української в її картці немає.
export const PRODUCT_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3.5-super-vl:free",
] as const;

// Суддя для живого eval — інша родина, ніж основна модель продукту (не оцінює відповіді своєї родини).
// Якщо відповідь дала резервна super-vl, суддя тієї ж родини: колонка modelId у звіті це показує.
export const JUDGE_MODEL = "nvidia/nemotron-3.5-super-vl:free";

// Фабрики приймають ключ параметром і НЕ читають process.env: так їх можна імпортувати в eval-скрипті.
// У коді застосунку модель бере лише src/lib/ai/openrouter.ts (server-only).
export function makeProductModel(apiKey: string | undefined) {
  const openrouter = createOpenRouter({ apiKey, appName: "QuitCode slice 4" });
  return openrouter.chat(PRODUCT_MODELS[0], {
    // OpenRouter пробує наступну модель при помилці, ліміті постачальника або простої.
    // Платформний ліміт безкоштовних моделей (20/хв, 50/день на акаунт) ланцюжок НЕ обходить.
    models: [...PRODUCT_MODELS],
    // Без provider.require_parameters: з ним OpenRouter може відкинути Gemma (немає structured_outputs).
    // PDF без нативної підтримки за замовчуванням іде в ПЛАТНИЙ mistral-ocr; cloudflare-ai — безкоштовний.
    plugins: [{ id: "file-parser", pdf: { engine: "cloudflare-ai" } }],
    // Портативний параметр `reasoning` з AI SDK 7 цей провайдер не передає — лише його власний.
    reasoning: { effort: "low", exclude: true },
  });
}

export function makeJudgeModel(apiKey: string | undefined) {
  const openrouter = createOpenRouter({ apiKey, appName: "QuitCode slice 4 eval" });
  return openrouter.chat(JUDGE_MODEL);
}
