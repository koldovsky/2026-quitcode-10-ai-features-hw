#!/usr/bin/env node
// Скрипт-перевірка віртуального працівника «звіряльник оплат». Node 24, без залежностей.
// Головне правило шаблону: РАХУЄ СКРИПТ, а не модель. Агент лише запускає його й пояснює результат.
// Замініть логіку на свою задачу, але залиште три речі:
//   1) таблиця для людини + маркер ###JSON### і машиночитний JSON для агента;
//   2) код виходу як жорсткий сигнал: 0 — розбіжностей немає, 1 — є розбіжності, 2 — не вдалося прочитати вхід;
//   3) прапорці (⚠) — це ДАНІ для правил, а не рішення: рішення — у references/rules.md і в людини.
//
//   node scripts/reconcile.mjs check-draft data/2026-10   арифметика чернетки звіту (лише сама з собою)
//   node scripts/reconcile.mjs reconcile   data/2026-10   звірка чернетки з першоджерелами (рахунки + банк)
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const [cmd, dirArg] = process.argv.slice(2);

function fail(message) {
  console.error(`ПОМИЛКА ВХОДУ: ${message}`);
  process.exit(2);
}

if (!["check-draft", "reconcile"].includes(cmd) || !dirArg) {
  fail("використання: node scripts/reconcile.mjs <check-draft|reconcile> <тека періоду, напр. data/2026-10>");
}
const dir = path.resolve(ROOT, dirArg);
// Межа: лише теки всередині data/ цього проєкту.
if (!dir.startsWith(path.join(ROOT, "data") + path.sep)) fail(`тека має бути всередині data/: ${dirArg}`);

// Гроші — у копійках (цілі числа), щоб 0.1 + 0.2 не давало 0.30000000000000004.
const toCents = (v, where) => {
  const s = String(v).trim().replace(/\s/g, "").replace(",", ".");
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) fail(`не сума: «${v}» (${where})`);
  return Math.round(Number(s) * 100);
};
const money = (c) => (c / 100).toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function readJson(file) {
  if (!existsSync(file)) fail(`немає файлу ${path.relative(ROOT, file)}`);
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(`не JSON: ${path.relative(ROOT, file)} (${e.message})`);
  }
}

// Мінімальний CSV: кома-роздільник, лапки "..." для значень із комою, перший рядок — заголовки.
function readCsv(file) {
  if (!existsSync(file)) fail(`немає файлу ${path.relative(ROOT, file)}`);
  const lines = readFileSync(file, "utf8").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  const split = (line) => {
    const out = [];
    let cur = "";
    let q = false;
    for (const ch of line) {
      if (ch === '"') q = !q;
      else if (ch === "," && !q) {
        out.push(cur);
        cur = "";
      } else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const [head, ...rows] = lines.map(split);
  return rows.map((r, i) => ({ ...Object.fromEntries(head.map((h, j) => [h, r[j] ?? ""])), _line: i + 2 }));
}

const draft = readJson(path.join(dir, "report_draft.json"));
const lines = (draft.lines ?? []).map((l, i) => ({
  invoice: l.invoice,
  client: l.client,
  invoiced: toCents(l.invoiced, `lines[${i}].invoiced`),
  paid: toCents(l.paid, `lines[${i}].paid`),
}));
const totals = Object.fromEntries(
  ["invoiced", "paid", "outstanding", "overpaid"].map((k) => [k, toCents(draft.totals?.[k] ?? "", `totals.${k}`)]),
);

if (cmd === "check-draft") {
  // Лише внутрішня узгодженість: чи сходяться підсумки чернетки з її ж рядками. Це НЕ звірка з джерелами.
  const expected = {
    invoiced: lines.reduce((s, l) => s + l.invoiced, 0),
    paid: lines.reduce((s, l) => s + l.paid, 0),
    outstanding: lines.reduce((s, l) => s + Math.max(l.invoiced - l.paid, 0), 0),
    overpaid: lines.reduce((s, l) => s + Math.max(l.paid - l.invoiced, 0), 0),
  };
  const bad = Object.keys(expected).filter((k) => expected[k] !== totals[k]);
  console.log(`## Арифметика чернетки ${draft.period ?? ""}\n`);
  console.log("| Підсумок | У чернетці | Сума рядків | Збіг |\n|---|---|---|---|");
  for (const k of Object.keys(expected)) {
    console.log(`| ${k} | ${money(totals[k])} | ${money(expected[k])} | ${bad.includes(k) ? "**⚠ ні**" : "так"} |`);
  }
  console.log(`\n${bad.length ? "АРИФМЕТИКА: ПОМИЛКА" : "АРИФМЕТИКА: OK (чернетка узгоджена сама з собою — це ще не означає, що вона правильна)"}`);
  console.log("###JSON###");
  console.log(JSON.stringify({ check: "draft-arithmetic", ok: bad.length === 0, mismatched: bad }));
  process.exit(bad.length ? 1 : 0);
}

// ---- reconcile: чернетка проти першоджерел ----
const profile = readJson(path.join(ROOT, "references", "profile.json"));
const ownNames = new Set(profile.own_names ?? []);
const invoices = readCsv(path.join(dir, "invoices.csv")).map((r) => ({ ...r, cents: toCents(r.amount, `invoices.csv:${r._line}`) }));
const invoiceIds = new Set(invoices.map((i) => i.invoice));
const payments = readCsv(path.join(dir, "payments.csv")).map((r) => ({ ...r, cents: toCents(r.amount, `payments.csv:${r._line}`) }));

const seenRefs = new Set();
for (const p of payments) {
  p.invoiceRef = (p.purpose.match(/INV-\d{4}-\d{3}/) ?? [null])[0];
  p.flags = [];
  if (p.bank_ref && seenRefs.has(p.bank_ref)) p.flags.push("dup"); // той самий банківський ID удруге — рядок експорту, не новий платіж
  seenRefs.add(p.bank_ref);
  if (ownNames.has(p.payer)) p.flags.push("own"); // власний переказ — не оплата клієнта
  if (!p.invoiceRef) p.flags.push("no_invoice"); // без номера рахунку — не приписуємо жодному рахунку за збігом суми
  else if (!invoiceIds.has(p.invoiceRef)) p.flags.push("unknown_invoice");
}

const naiveTotal = payments.reduce((s, p) => s + p.cents, 0);
// Правила (references/rules.md): дублікат рахуємо один раз; власні перекази й платежі без номера рахунку — не оплата рахунку.
const counted = payments.filter((p) => !p.flags.includes("dup") && !p.flags.includes("own") && p.invoiceRef && invoiceIds.has(p.invoiceRef));

const perInvoice = invoices.map((inv) => {
  const paid = counted.filter((p) => p.invoiceRef === inv.invoice).reduce((s, p) => s + p.cents, 0);
  const draftLine = lines.find((l) => l.invoice === inv.invoice);
  const status = paid === inv.cents ? "оплачено" : paid === 0 ? "не оплачено" : paid < inv.cents ? "частково" : "переплата";
  return { invoice: inv.invoice, client: inv.client, invoiced: inv.cents, paid, draftPaid: draftLine?.paid ?? null, status };
});
const truth = {
  invoiced: perInvoice.reduce((s, r) => s + r.invoiced, 0),
  paid: perInvoice.reduce((s, r) => s + r.paid, 0),
  outstanding: perInvoice.reduce((s, r) => s + Math.max(r.invoiced - r.paid, 0), 0),
  overpaid: perInvoice.reduce((s, r) => s + Math.max(r.paid - r.invoiced, 0), 0),
};
const lineMismatches = perInvoice.filter((r) => r.draftPaid !== r.paid).map((r) => r.invoice);
const missingInDraft = perInvoice.filter((r) => r.draftPaid === null).map((r) => r.invoice);
const totalMismatches = Object.keys(truth).filter((k) => truth[k] !== totals[k]);

console.log(`## Звірка ${draft.period ?? ""}: чернетка проти першоджерел\n`);
console.log("### Платежі банку\n\n| Рядок | bank_ref | Дата | Платник | Рахунок | Сума | Прапорці |\n|---|---|---|---|---|---|---|");
for (const p of payments) {
  const f = p.flags.map((x) => `⚠${x}`).join(" ") || "—";
  console.log(`| ${p._line} | ${p.bank_ref} | ${p.date} | ${p.payer} | ${p.invoiceRef ?? "—"} | ${money(p.cents)} | ${f} |`);
}
console.log(`\nНаївна сума всіх надходжень: ${money(naiveTotal)}; «оплачено» в чернетці: ${money(totals.paid)}` +
  (naiveTotal === totals.paid ? " — **збігаються, але це не доказ**: наївна сума містить дублікати й власні перекази." : "."));
console.log("\n### Рахунки (за правилами references/rules.md)\n\n| Рахунок | Клієнт | Виставлено | Оплачено за джерелами | У чернетці | Статус | Збіг |\n|---|---|---|---|---|---|---|");
for (const r of perInvoice) {
  const ok = r.draftPaid === r.paid;
  console.log(`| ${r.invoice} | ${r.client} | ${money(r.invoiced)} | ${money(r.paid)} | ${r.draftPaid === null ? "немає" : money(r.draftPaid)} | ${r.status} | ${ok ? "так" : "**⚠ ні**"} |`);
}
console.log("\n| Підсумок | За джерелами | У чернетці | Збіг |\n|---|---|---|---|");
for (const k of Object.keys(truth)) {
  console.log(`| ${k} | ${money(truth[k])} | ${money(totals[k])} | ${totalMismatches.includes(k) ? "**⚠ ні**" : "так"} |`);
}
const problems = lineMismatches.length + totalMismatches.length + missingInDraft.length;
console.log(`\n${problems ? `ЗВІРКА: РОЗБІЖНОСТІ (${problems})` : "ЗВІРКА: розбіжностей немає"}`);
console.log("###JSON###");
console.log(
  JSON.stringify({
    check: "reconcile",
    period: draft.period ?? null,
    ok: problems === 0,
    cents: { naiveTotal, truth, draft: totals },
    lineMismatches,
    missingInDraft,
    totalMismatches,
    flagged: payments.filter((p) => p.flags.length).map((p) => ({ line: p._line, bank_ref: p.bank_ref, flags: p.flags, cents: p.cents })),
  }),
);
process.exit(problems ? 1 : 0);
