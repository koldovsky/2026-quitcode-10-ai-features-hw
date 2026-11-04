"use server";

// Server Actions зрізу 4: два кроки, між ними — людина.
//   1. requestDraft  — перевірити, хто кличе (getClaims), спитати модель, ПОВЕРНУТИ чернетку у форму. Нічого не пише.
//   2. confirmDraft  — людина переглянула й, можливо, виправила чернетку та натиснула «Зберегти»:
//                      перевірити ще раз на сервері (клієнт може надіслати що завгодно) і лише тоді писати в базу.
// Шлях `src/app/ai-draft/` — приклад: перенесіть у сторінку вашого зрізу.
import { proposeDraft, USER_MESSAGES, isFileType, type DraftInput, type DraftResult } from "@/lib/ai/draft";
import { productModel } from "@/lib/ai/openrouter";
import { DraftSchema } from "@/lib/ai/schema";
import { createClient } from "@/lib/supabase/server";

export type RequestDraftState = (DraftResult & { userMessage?: string }) | null;

export async function requestDraft(_prev: RequestDraftState, formData: FormData): Promise<RequestDraftState> {
  // 0. Авторизація ДО виклику моделі: інакше будь-хто з інтернету витратить ваш денний ліміт (50 запитів).
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { ok: false, reason: "provider_error", message: "unauthorized", userMessage: "Увійдіть, щоб скористатися підказкою." };
  // Якщо функція лише для певної ролі — перевірте роль з public.profiles (як у src/app/page.tsx), не з user_metadata.

  const text = String(formData.get("text") ?? "").slice(0, 20_000);
  if (!text.trim()) return { ok: false, reason: "invalid_output", message: "empty input", userMessage: "Опишіть звернення текстом." };

  // Server Actions: тіло запиту — до 1 МБ за замовчуванням (next.config serverActions.bodySizeLimit); функції Vercel — до 4,5 МБ.
  const file = formData.get("file");
  const mediaType = file instanceof File ? file.type : "";
  const input: DraftInput =
    file instanceof File && file.size > 0 && file.size < 1_000_000 && isFileType(mediaType)
      ? { text, file: { data: new Uint8Array(await file.arrayBuffer()), mediaType, filename: file.name } }
      : { text };

  const model = productModel();
  if (!model) return { ok: false, reason: "provider_error", message: "no model key", userMessage: USER_MESSAGES.provider_error };
  const result = await proposeDraft(input, model);
  return result.ok ? result : { ...result, userMessage: USER_MESSAGES[result.reason] };
}

export async function confirmDraft(raw: unknown): Promise<{ saved: boolean; error?: string }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) return { saved: false, error: "unauthorized" };

  const parsed = DraftSchema.safeParse(raw);
  if (!parsed.success) return { saved: false, error: "invalid draft" };
  if (parsed.data.status !== "ok") return { saved: false, error: `cannot save a ${parsed.data.status} draft` };

  // Запис — у вашу таблицю під сесією користувача (RLS), однією функцією Postgres, якщо записів кілька:
  // await supabase.from("<ваша_таблиця>").insert({ ...поля з parsed.data, created_by: data.claims.sub });
  return { saved: true };
}
