// Формат результату працівника і «перевіряльник у коді».
// Модель повертає JSON за схемою (outputFormat), а ми ще раз перевіряємо його zod і звіряємо з вхідними заявками.
import { z } from "zod";
import { checkWritePath } from "./guard.ts";
import type { InboxRow } from "./inbox.ts";

export const TriageItem = z.object({
  id: z.string().describe("id заявки з inbox, напр. REQ-01"),
  category: z.enum(["bug", "question", "feature", "billing", "access", "spam"]),
  priority: z.enum(["high", "normal", "low"]),
  needs_human: z.boolean().describe("true, якщо рішення або відповідь має дати людина"),
  reason: z.string().min(1).describe("одне речення: чому така категорія і пріоритет"),
});

export const TriageReport = z.object({
  status: z.enum(["ok", "needs_human"]),
  items: z.array(TriageItem),
  report_file: z.string().describe("шлях до markdown-звіту, який записав працівник, напр. out/2026-11-05-triage.md"),
  summary: z.string().describe("2–3 речення для людини"),
});

export type TriageReport = z.infer<typeof TriageReport>;

/** JSON Schema для options.outputFormat — з тієї самої zod-схеми, щоб формат був в одному місці. */
export function triageJsonSchema(): Record<string, unknown> {
  return z.toJSONSchema(TriageReport) as Record<string, unknown>;
}

export type Verdict = { ok: true; report: TriageReport } | { ok: false; problems: string[] };

/**
 * Перевіряльник у коді (детермінований): схема, кожна заявка рівно один раз, без вигаданих id,
 * спам — з низьким пріоритетом, шлях звіту — всередині out/ (та сама перевірка, що й у хуку).
 * Чи файл справді існує, перевіряє worker.ts після запуску.
 */
export function verifyTriage(raw: unknown, inbox: InboxRow[], cwd: string, outDir = "out"): Verdict {
  const parsed = TriageReport.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, problems: parsed.error.issues.map((i) => `схема: ${i.path.join(".") || "(корінь)"} — ${i.message}`) };
  }
  const report = parsed.data;
  const problems: string[] = [];
  const expected = new Set(inbox.map((r) => r.id));
  const counts = new Map<string, number>();
  for (const item of report.items) counts.set(item.id, (counts.get(item.id) ?? 0) + 1);
  for (const id of expected) if (!counts.has(id)) problems.push(`заявку ${id} пропущено`);
  for (const [id, n] of counts) {
    if (!expected.has(id)) problems.push(`заявки ${id} немає у вхідних — вигаданий id`);
    else if (n > 1) problems.push(`заявку ${id} розібрано ${n} рази`);
  }
  for (const item of report.items) {
    if (item.category === "spam" && item.priority !== "low") problems.push(`${item.id}: спам має бути low`);
  }
  if (report.items.some((i) => i.needs_human) && report.status === "ok") {
    problems.push("є заявки для людини, а status = ok (має бути needs_human)");
  }
  const where = checkWritePath(report.report_file, cwd, outDir);
  if (!where.ok) problems.push(`звіт: ${where.reason}`);
  return problems.length ? { ok: false, problems } : { ok: true, report };
}
