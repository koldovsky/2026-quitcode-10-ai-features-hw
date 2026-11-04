#!/usr/bin/env node
// reconcile.mjs — звірка доходу за операціями: виписки + акти банків + подана декларація за попередній період
// проти рядка 06 і книги доходів кожної чернетки. Правила класифікації — references/rules.md (розділи 2–4).
//
// Використання:
//   node scripts/reconcile.mjs --draft <чернетка> [--draft <чернетка> ...] \
//        --statement <виписка.csv> [--statement ...] [--act <акт.csv> ...] --prior <подана-за-попередній-період.json> [--period 2026-Q3]
//
// Вихід: таблиця доходу за правилами по кожній операції, звірка нетто-зарахувань з актами,
// для кожної чернетки — різниці по операціях і рядки демо-форми «чернетка vs за правилами»; потім ###JSON###.
// Код виходу: 0 — усе зійшлося; 1 — є розбіжності; 2 — помилка читання / бракує даних.
import path from 'node:path';
import {
  loadStatement, loadProfile, loadAct, loadDeclaration, flagsFor, incomeByRules, calcRows, quarter,
  fmt, uaDate, table, emitJSON, parseArgs, ROWS,
} from './lib.mjs';

const args = parseArgs(process.argv.slice(2), ['draft', 'statement', 'act']);
const draftsF = args.draft || [], stmF = args.statement || [], actF = args.act || [];
if (!draftsF.length || !stmF.length) {
  console.error('Використання: node scripts/reconcile.mjs --draft <файл> [--draft ...] --statement <csv> [--statement ...] [--act <csv> ...] --prior <файл> [--period 2026-Q3]');
  process.exit(2);
}

let profile, drafts, stmts, acts, prior = null, period;
try {
  profile = loadProfile();
  drafts = draftsF.map(loadDeclaration);
  stmts = stmF.map(loadStatement);
  acts = actF.map(loadAct);
  if (args.prior) prior = loadDeclaration(args.prior);
  const pcode = args.period || drafts[0].period;
  if (!pcode) throw new Error('не вдалося визначити звітний період; задай --period 2026-Q3');
  period = quarter(pcode);
} catch (e) {
  console.error('ПОМИЛКА: ' + e.message);
  process.exit(2);
}

let bad = false;
const unverified = [];
if (period.q > 1 && !prior) unverified.push('немає --prior: рядок 06 наростаючим підсумком і рядки 13/24 не перевірено');

// ---------- 1. Дохід за правилами по кожній операції ----------
const ops = [];
for (const st of stmts) {
  if (!st.bank) unverified.push(`${st.file}: банк не визначено з шапки виписки`);
  for (const op of st.ops) {
    const fl = flagsFor(op, profile, period);
    const r = incomeByRules(op, fl);
    if (r.unverified) unverified.push(`${st.bank} ${op.ref}: ${r.reason}`);
    ops.push({ ...op, ...fl, rules: r.income, reason: r.reason });
  }
}
const credits = ops.filter((o) => o.amount > 0);
const qIncome = credits.reduce((s, o) => s + o.rules, 0);

console.log(`# Звірка доходу за операціями — ${period.year}, ${period.q} квартал (${uaDate(period.from)}–${uaDate(period.to)})`);
console.log('');
console.log('Джерела: ' + [...stmF, ...actF, ...(args.prior ? [args.prior] : [])].map((f) => path.basename(f)).join(', '));
console.log(`Власні рахунки й РНОКПП платника — з ${path.relative(process.cwd(), profile.file) || profile.file}`);
console.log('');
console.log('## 1. Надходження і дохід за правилами');
console.log(table(
  ['Банк', 'Документ / реф.', 'Зараховано', 'Контрагент', 'У виписці', 'Дохід за правилами', 'Підстава'],
  credits.map((o) => [o.bank, o.ref, uaDate(o.incomeDate), o.counterparty, fmt(o.amount), fmt(o.rules), o.reason]),
  ['', '', '', '', 'r', 'r', ''],
));
console.log(`| | | | **Разом** | **${fmt(credits.reduce((s, o) => s + o.amount, 0))}** | **${fmt(qIncome)}** | дохід кварталу за правилами |`);
console.log('');

// ---------- 2. Нетто-зарахування проти актів банку ----------
console.log('## 2. Нетто-зарахування проти актів банку');
const actRows = [];
const kinds = [...new Set(credits.flatMap((o) => o.flags.filter((f) => f.startsWith('нетто-')).map((f) => `${o.bank}|${f}`)))];
for (const key of kinds) {
  const [bank, kind] = key.split('|');
  const act = acts.find((a) => a.bank === bank && a.kind === kind);
  const mine = credits.filter((o) => o.bank === bank && o.flags.includes(kind) && !o.flags.includes('поза-періодом'));
  if (!act) {
    unverified.push(`${bank}, ${kind}: немає акта банку — брутто і комісію не звірено з першоджерелом`);
    actRows.push([bank, kind, '—', '—', '—', '—', '—', 'НЕ ПЕРЕВІРЕНО: немає акта']);
    continue;
  }
  const months = [...new Set([...act.months.map((m) => m.month), ...mine.map((o) => o.incomeDate.slice(0, 7))])].sort();
  for (const m of months) {
    const a = act.months.find((x) => x.month === m);
    const os = mine.filter((o) => o.incomeDate.slice(0, 7) === m);
    const net = os.reduce((s, o) => s + o.amount, 0), com = os.reduce((s, o) => s + (o.commission || 0), 0);
    const ok = a && a.net === net && a.commission === com && a.gross === net + com;
    if (!ok) bad = true;
    actRows.push([bank, kind, m, fmt(net), fmt(com), a ? `${fmt(a.net)} / ${fmt(a.commission)} / ${fmt(a.gross)}` : '— немає в акті', fmt(net + com), ok ? 'OK' : '**⚠ розбіжність**']);
  }
  if (act.total) {
    const s = act.months.reduce((t, x) => ({ g: t.g + x.gross, c: t.c + x.commission, n: t.n + x.net }), { g: 0, c: 0, n: 0 });
    if (s.g !== act.total.gross || s.c !== act.total.commission || s.n !== act.total.net) {
      bad = true;
      actRows.push([bank, kind, 'разом', '', '', 'рядок «Разом» акта ≠ сумі місяців', '', '**⚠ розбіжність**']);
    }
  }
}
for (const a of acts) if (!kinds.includes(`${a.bank}|${a.kind}`)) unverified.push(`${path.basename(a.file)}: акт є, а відповідних зарахувань у виписках не знайдено`);
console.log(table(['Банк', 'Вид', 'Місяць', 'Виписка: нетто', 'Виписка: комісія', 'Акт: нетто / комісія / брутто', 'Брутто (дохід)', 'Стан'], actRows, ['', '', '', 'r', 'r', 'r', 'r', '']));
console.log('');

// ---------- 3. Кожна чернетка проти правил ----------
const base06 = prior ? prior.rows['06'] : 0;
const expected = calcRows(base06 + qIncome, prior ? prior.rows : null);
const results = [];
drafts.forEach((d, idx) => {
  console.log(`## 3.${idx + 1}. Чернетка: ${path.basename(d.file)} (${d.system})`);
  const diffs = [];
  if (!d.ledger) {
    unverified.push(`${path.basename(d.file)}: у чернетці немає книги доходів — різниці по операціях не визначити, лише по рядку 06`);
  } else {
    const seen = new Set();
    for (const e of d.ledger) {
      const op = credits.find((o) => o.bank === e.bank && o.ref === e.ref);
      if (!op) {
        diffs.push({ bank: e.bank, ref: e.ref, date: e.date, counterparty: e.counterparty, draft: e.amount, rules: null, diff: null, why: 'немає у виписках — НЕ ПЕРЕВІРЕНО' });
        unverified.push(`${path.basename(d.file)}: запис ${e.bank} ${e.ref} не знайдено у виписках`);
        continue;
      }
      seen.add(`${op.bank}|${op.ref}`);
      const dateNote = e.date !== op.incomeDate ? `; у чернетці дата ${uaDate(e.date)}, зараховано ${uaDate(op.incomeDate)}` : '';
      if (e.amount !== op.rules) diffs.push({ bank: op.bank, ref: op.ref, date: op.incomeDate, counterparty: op.counterparty, draft: e.amount, rules: op.rules, diff: e.amount - op.rules, why: op.reason + dateNote });
    }
    for (const op of credits) {
      if (op.rules > 0 && !seen.has(`${op.bank}|${op.ref}`)) diffs.push({ bank: op.bank, ref: op.ref, date: op.incomeDate, counterparty: op.counterparty, draft: 0, rules: op.rules, diff: -op.rules, why: 'дохід є у виписці, але немає в книзі доходів чернетки' });
    }
  }
  const ledgerSum = d.ledger ? d.ledger.reduce((s, e) => s + e.amount, 0) : null;
  if (diffs.length) {
    bad = true;
    console.log(table(['Банк', 'Документ / реф.', 'Дата зарахування', 'Контрагент', 'У чернетці', 'За правилами', 'Різниця', 'Чому'],
      diffs.map((x) => [x.bank, x.ref, uaDate(x.date), x.counterparty, fmt(x.draft), x.rules === null ? '—' : fmt(x.rules), x.diff === null ? '—' : fmt(x.diff), x.why]),
      ['', '', '', '', 'r', 'r', 'r', '']));
    const net = diffs.reduce((s, x) => s + (x.diff || 0), 0);
    console.log(`| | | | **Разом різниця** | | | **${fmt(net)}** | ${diffs.length} операцій |`);
  } else if (d.ledger) {
    console.log('Різниць по операціях немає.');
  }
  console.log('');
  const rowsCmp = ROWS.map((k) => [k, fmt(d.rows[k]), fmt(expected[k]), fmt((d.rows[k] ?? 0) - expected[k]), d.rows[k] === expected[k] ? 'OK' : '**⚠**']);
  const rowBad = rowsCmp.filter((r) => r[4] !== 'OK').length;
  if (rowBad) bad = true;
  console.log(`Рядок 06 = 06 попереднього періоду ${fmt(base06)} + дохід кварталу за правилами ${fmt(qIncome)} = ${fmt(expected['06'])}`);
  if (ledgerSum !== null) console.log(`Книга доходів чернетки за квартал: ${fmt(ledgerSum)} (різниця з правилами ${fmt(ledgerSum - qIncome)})`);
  console.log('');
  console.log(table(['Рядок', 'Чернетка', 'За правилами', 'Різниця', ''], rowsCmp, ['', 'r', 'r', 'r', '']));
  console.log('');
  results.push({ file: d.file, system: d.system, ledgerSum, diffs, rows: d.rows, rowMismatches: rowsCmp.filter((r) => r[4] !== 'OK').map((r) => r[0]) });
});

// ---------- 4. Підсумок ----------
console.log('## 4. Підсумок');
console.log(`Дохід кварталу за правилами: ${fmt(qIncome)} · 06 за правилами: ${fmt(expected['06'])} · до сплати: 14 = ${fmt(expected['14'])}, 25 = ${fmt(expected['25'])}, разом 14 + 25 = ${fmt(expected['14'] + expected['25'])}`);
for (const d of drafts) {
  const d14 = d.rows['14'], d25 = d.rows['25'];
  if (d14 !== undefined && d25 !== undefined) console.log(`За чернеткою ${path.basename(d.file)}: 14 = ${fmt(d14)}, 25 = ${fmt(d25)}, разом 14 + 25 = ${fmt(d14 + d25)}`);
}
if (drafts.length > 1) {
  const same = drafts.every((d) => ROWS.every((k) => d.rows[k] === drafts[0].rows[k]));
  console.log(same ? 'Чернетки між собою збігаються — і це не доказ правильності.' : 'Чернетки між собою розходяться.');
}
if (unverified.length) {
  console.log('');
  console.log('НЕ ПЕРЕВІРЕНО:');
  for (const u of [...new Set(unverified)]) console.log('- ' + u);
}
console.log('');
console.log(bad ? 'ПІДСУМОК: ⚠ дохід у чернетках не збігається з першоджерелами (код виходу 1)' : unverified.length ? 'ПІДСУМОК: розбіжностей не знайдено, але є неперевірене (код виходу 0)' : 'ПІДСУМОК: дохід зійшовся з першоджерелами (код виходу 0)');

emitJSON({
  period: `${period.year}-Q${period.q}`, quarterIncome: qIncome, priorFile: args.prior || null, expectedRows: expected,
  operations: credits.map(({ bank, ref, incomeDate, docDate, amount, counterparty, flags, commission, rules, reason }) => ({ bank, ref, incomeDate, docDate, amount, counterparty, flags, commission, rules, reason })),
  acts: actRows, drafts: results, unverified: [...new Set(unverified)], ok: !bad, note: 'суми — у копійках',
});
process.exit(bad ? 1 : 0);
