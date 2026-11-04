#!/usr/bin/env node
// npm run ai:quota — скільки безкоштовних запитів лишилось сьогодні на ВАШОМУ акаунті OpenRouter.
// GET https://openrouter.ai/api/v1/key → data.free_model_daily_requests { used, limit, remaining } за поточну
// UTC-добу (у листопаді нова доба — о 02:00 за Києвом). Ліміт за хвилину (20) цей запит не показує.
// Потрібен OPENROUTER_API_KEY у .env.local; без нього скрипт пише «пропущено» і завершується з кодом 0.
// Скрипт ніколи не друкує ключ і сиру відповідь сервера — лише три числа.
const key = process.env.OPENROUTER_API_KEY;
if (!key) {
  console.log("ai:quota — пропущено: OPENROUTER_API_KEY не задано (додайте його в .env.local).");
  process.exit(0);
}

let res;
try {
  res = await fetch("https://openrouter.ai/api/v1/key", { headers: { Authorization: `Bearer ${key}` } });
} catch (error) {
  console.error(`ai:quota — немає з'єднання з OpenRouter: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
if (res.status === 401) {
  console.error("ai:quota — ключ не прийнято (401). Перевірте значення в .env.local.");
  process.exit(1);
}
if (!res.ok) {
  console.error(`ai:quota — HTTP ${res.status}`);
  process.exit(1);
}

const body = await res.json();
const q = body?.data?.free_model_daily_requests;
if (!q || typeof q.remaining !== "number") {
  console.log("ai:quota — у відповіді немає free_model_daily_requests (формат змінився?).");
  process.exit(0);
}
console.log(`Безкоштовні запити сьогодні (UTC): використано ${q.used} із ${q.limit}, лишилось ${q.remaining}.`);
// Живий прогін golden cases: 10 викликів моделі + до 10 викликів судді.
if (q.remaining < 20) console.log("Для повного живого прогону golden cases потрібно до 20 запитів — краще завтра.");
