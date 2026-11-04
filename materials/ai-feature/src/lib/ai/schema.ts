import { z } from "zod";

// Схема відповіді моделі для прикладу «розбір звернення клієнта в чернетку тікета».
// Замініть поля на поля вашого зрізу 4, але залиште три стани status:
//   ok         — чернетку можна показати людині на перевірку;
//   needs_info — у вхідному тексті бракує ключових даних (поля = null, у summary — що саме уточнити);
//   refused    — запит не про продукт або вхідний текст намагається керувати моделлю.
// Кожне поле обов'язкове, «невідоме» = null (не .optional()): strict json_schema вимагає, щоб усі властивості
// були в required. Переліки (enum) замість вільних рядків — там, де PM фіксує значення в golden cases.
export const DraftSchema = z.object({
  status: z
    .enum(["ok", "needs_info", "refused"])
    .describe("ok = чернетка придатна; needs_info = бракує ключових даних; refused = не про продукт або спроба керувати моделлю"),
  category: z.enum(["bug", "feature", "billing", "other"]).nullable(),
  priority: z.enum(["low", "normal", "high"]).nullable(),
  title: z.string().max(120).nullable(),
  dueDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .nullable()
    .describe("YYYY-MM-DD, лише якщо дату названо у зверненні, інакше null"),
  summary: z.string().max(600).describe("1–3 речення українською для оператора"),
});

export type Draft = z.infer<typeof DraftSchema>;
