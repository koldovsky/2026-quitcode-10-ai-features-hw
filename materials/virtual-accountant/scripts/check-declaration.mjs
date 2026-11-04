#!/usr/bin/env node
// check-declaration.mjs — арифметика чернетки декларації (демо-форма, references/rules.md, розділ 1).
//
// Режим 1, перевірка чернеток (JSON або Markdown), одна чи кілька:
//   node scripts/check-declaration.mjs <чернетка> [<чернетка> ...] [--prior <подана-за-попередній-період.json>]
//   Перевіряє 08, 11 (5%), 12, 14.1, 14, 23 (1%), 25; з --prior — ще 13, 24 і книгу доходів + попередні періоди = 06.
//   Кілька чернеток — порівнює їх між собою рядок за рядком.
//   Код виходу: 0 — арифметика сходиться і чернетки однакові; 1 — є розбіжність; 2 — помилка читання.
//   УВАГА: код 0 означає лише «внутрішньо узгоджено». Чи правильна база (рядок 06) — перевіряє reconcile.mjs.
//
// Режим 2, калькулятор (рахує скрипт, а не модель):
//   node scripts/check-declaration.mjs --calc <сума> [<сума> ...] --prior <подана-за-попередній-період.json>
//   Суми — складові доходу звітного кварталу (формат 1234,56 або 1234.56, без пробілів).
//   Друкує всі рядки демо-форми: 06 = 06 попереднього періоду + сума складових.
import { loadDeclaration, calcRows, percent, toKop, fmt, ROWS, table, emitJSON, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2), ['calc']);
const TOL = 1; // допуск 1 копійка
const near = (a, b) => a !== undefined && b !== undefined && a !== null && b !== null && Math.abs(a - b) <= TOL;

let prior = null;
if (args.prior) {
  try {
    prior = loadDeclaration(args.prior);
  } catch (e) {
    console.error('ПОМИЛКА читання --prior: ' + e.message);
    process.exit(2);
  }
}

// ---------- режим калькулятора ----------
if (args.calc) {
  const parts = args.calc.flatMap((s) => String(s).split('+')).filter(Boolean);
  const kops = parts.map(toKop);
  if (!parts.length || kops.some((x) => x === null)) {
    console.error('ПОМИЛКА: --calc чекає суми на кшталт 1234,56 (без пробілів), через пробіл або «+»');
    process.exit(2);
  }
  const q = kops.reduce((s, x) => s + x, 0);
  const base = prior ? prior.rows['06'] : 0;
  const r = calcRows(base + q, prior ? prior.rows : null);
  console.log('## Калькулятор демо-форми');
  console.log(`Складові доходу кварталу: ${kops.map(fmt).join(' + ')} = ${fmt(q)}`);
  console.log(`06 попереднього періоду: ${prior ? fmt(base) + ' (' + args.prior + ')' : '0 (без --prior)'}`);
  console.log('');
  console.log(table(['Рядок', 'Сума'], ROWS.map((k) => [k, fmt(r[k])]), ['', 'r']));
  console.log('');
  console.log(`До сплати: єдиний податок (14) ${fmt(r['14'])} + військовий збір (25) ${fmt(r['25'])} = ${fmt(r['14'] + r['25'])}`);
  emitJSON({ mode: 'calc', parts: kops, quarterIncome: q, priorFile: args.prior || null, rows: r, note: 'копійки' });
  process.exit(0);
}

// ---------- режим перевірки ----------
const files = args._;
if (!files.length) {
  console.error('Використання: node scripts/check-declaration.mjs <чернетка> [<чернетка> ...] [--prior <файл>]\n               node scripts/check-declaration.mjs --calc <сума> ... --prior <файл>');
  process.exit(2);
}

let bad = false;
const drafts = [];
for (const f of files) {
  let d;
  try {
    d = loadDeclaration(f);
  } catch (e) {
    console.error(`ПОМИЛКА читання ${f}: ${e.message}`);
    process.exit(2);
  }
  drafts.push(d);
  const r = d.rows;
  const checks = [];
  const missing = ROWS.filter((k) => r[k] === undefined);
  if (missing.length) checks.push(['наявність рядків', 'усі 10 рядків', `бракує: ${missing.join(', ')}`, false]);
  const c = (name, expected, actual) => checks.push([name, fmt(expected), fmt(actual), near(expected, actual)]);
  if (!missing.length) {
    c('08 = 06 (усі доходи за ставкою 5%)', r['06'], r['08']);
    c('11 = 08 × 5%', percent(r['08'], 5), r['11']);
    c('12 = 11', r['11'], r['12']);
    c('14.1 = 12 − 13', r['12'] - r['13'], r['14.1']);
    c('14 = 14.1, якщо 14.1 ≥ 0, інакше 0', Math.max(r['14.1'], 0), r['14']);
    c('23 = 06 × 1%', percent(r['06'], 1), r['23']);
    c('25 = 23 − 24', r['23'] - r['24'], r['25']);
    if (prior) {
      c(`13 = рядок 12 поданої за попередній період`, prior.rows['12'], r['13']);
      c(`24 = рядок 23 поданої за попередній період`, prior.rows['23'], r['24']);
      checks.push(['06 ≥ 06 попереднього періоду', `≥ ${fmt(prior.rows['06'])}`, fmt(r['06']), r['06'] >= prior.rows['06']]);
      if (d.ledger) {
        const ls = d.ledger.reduce((s, x) => s + (x.amount || 0), 0);
        c(`06 = 06 попереднього періоду + книга доходів чернетки (${d.ledger.length} записів, ${fmt(ls)})`, prior.rows['06'] + ls, r['06']);
      }
    }
  }
  const fails = checks.filter((x) => !x[3]).length;
  if (fails) bad = true;
  console.log(`## ${f}`);
  console.log(`Джерело: ${d.system}${d.period ? ' · період ' + d.period : ''}${d.status ? ' · ' + d.status : ''}`);
  console.log('');
  console.log(table(['Рядок', 'Сума'], ROWS.map((k) => [k, fmt(r[k])]), ['', 'r']));
  console.log('');
  console.log(table(['Перевірка', 'Очікується', 'У чернетці', 'Статус'], checks.map(([a, b, cc, ok]) => [a, b, cc, ok ? 'OK' : '**⚠ ПОМИЛКА**']), ['', 'r', 'r', '']));
  console.log('');
  console.log(fails ? `Арифметика: ⚠ ${fails} помилок` : 'Арифметика: OK (внутрішньо узгоджено; база 06 цим НЕ перевірена)');
  console.log('');
  d._checks = checks;
}

let compare = null;
if (drafts.length > 1) {
  const rows = ROWS.map((k) => [k, ...drafts.map((d) => fmt(d.rows[k])), drafts.every((d) => d.rows[k] === drafts[0].rows[k]) ? 'збіг' : '**⚠ різниця**']);
  const diff = rows.filter((r) => r[r.length - 1] !== 'збіг').length;
  if (diff) bad = true;
  compare = { identical: diff === 0, differingRows: rows.filter((r) => r[r.length - 1] !== 'збіг').map((r) => r[0]) };
  console.log('## Порівняння чернеток');
  console.log(table(['Рядок', ...drafts.map((d, i) => `${i + 1}: ${d.system}`), 'Стан'], rows, ['', ...drafts.map(() => 'r'), '']));
  console.log('');
  console.log(diff
    ? `Чернетки розходяться в ${diff} рядках.`
    : 'Чернетки збігаються в усіх рядках. Збіг двох систем ≠ правильність: базу 06 звір з першоджерелами (reconcile.mjs).');
  console.log('');
}

console.log(bad ? 'ПІДСУМОК: ⚠ є розбіжності (код виходу 1)' : 'ПІДСУМОК: арифметика OK (код виходу 0). Це не вердикт «можна подавати».');
emitJSON({
  mode: 'check', priorFile: args.prior || null, ok: !bad, compare,
  drafts: drafts.map((d) => ({ file: d.file, system: d.system, period: d.period, rows: d.rows, checks: d._checks.map(([name, expected, actual, ok]) => ({ name, expected, actual, ok })) })),
  note: 'rows — у копійках',
});
process.exit(bad ? 1 : 0);
