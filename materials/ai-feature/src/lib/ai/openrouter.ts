import "server-only"; // помилка збірки, якщо цей файл колись імпортує Client Component
import { makeProductModel } from "./models";

// Ключ OPENROUTER_API_KEY — ваш власний безкоштовний ключ OpenRouter:
//   локально — у .env.local (він у .gitignore); у проді — Vercel → Project Settings → Environment Variables.
// НІКОЛИ не з префіксом NEXT_PUBLIC_: такі значення вбудовуються в JavaScript для браузера.
// Цей файл — єдине місце в src/, яке читає ключ (це перевіряє tests/ai-key.test.ts).
export function productModel() {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");
  return makeProductModel(key);
}
