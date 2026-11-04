#!/usr/bin/env node
// parse-statement.mjs — банківська виписка CSV → список операцій із позначками.
// Скрипт ПОЗНАЧАЄ підозрілі операції, але НЕ вирішує, що є доходом: це роблять правила (references/rules.md).
//
// Використання:
//   node scripts/parse-statement.mjs <виписка.csv> [--period 2026-Q3] [--all]
//   --period  звітний квартал: позначити операції, зараховані поза ним, і ті, що на межі кварталів
//   --all     показати також списання (за замовчуванням — лише надходження)
// Вихід: markdown-таблиця, підсумки за позначками, потім ###JSON### з машинним результатом. Код виходу 0; 2 — помилка читання.
import { loadStatement, loadProfile, flagsFor, quarter, fmt, uaDate, table, emitJSON, parseArgs } from './lib.mjs';

const args = parseArgs(process.argv.slice(2));
const file = args._[0];
if (!file) {
  console.error('Використання: node scripts/parse-statement.mjs <виписка.csv> [--period 2026-Q3] [--all]');
  process.exit(2);
}

let st, profile, period = null;
try {
  st = loadStatement(file);
  profile = loadProfile();
  if (args.period) period = quarter(args.period);
} catch (e) {
  console.error('ПОМИЛКА: ' + e.message);
  process.exit(2);
}

const ops = st.ops.map((op) => ({ ...op, ...flagsFor(op, profile, period) }));
const shown = args.all ? ops : ops.filter((o) => o.amount > 0);

console.log(`## Виписка: ${file}`);
console.log(`Банк: ${st.bank ?? 'не визначено'} · рахунок: ${st.account ?? 'не визначено'} · формат ${st.format} · операцій: ${ops.length} (надходжень ${ops.filter((o) => o.amount > 0).length})`);
console.log(`Дата отримання коштів = ${st.format === 'А' ? '«Дата операції»' : '«Дата валютування»'}${period ? ` · звітний період ${uaDate(period.from)}–${uaDate(period.to)}` : ''}`);
console.log('');
console.log(table(
  ['Рядок', 'Зараховано', 'Дата документа', 'Документ / реф.', 'Сума', 'Контрагент', 'Позначки', 'Комісія з призначення', 'Призначення'],
  shown.map((o) => [o.line, uaDate(o.incomeDate), uaDate(o.docDate), o.ref, fmt(o.amount), o.counterparty, o.flags.map((f) => '⚠' + f).join(' '), o.commission === null ? '' : fmt(o.commission), o.purpose.length > 90 ? o.purpose.slice(0, 87) + '…' : o.purpose]),
  ['', '', '', '', 'r', '', '', 'r', ''],
));

// Підсумки надходжень за позначками (лише в межах періоду за датою зарахування, якщо --period задано)
const credits = ops.filter((o) => o.amount > 0);
const inP = period ? credits.filter((o) => !o.flags.includes('поза-періодом')) : credits;
const sum = (arr, f = (o) => o.amount) => arr.reduce((s, o) => s + f(o), 0);
const has = (o, f) => o.flags.includes(f);
const netAcq = inP.filter((o) => has(o, 'нетто-еквайринг'));
const netInst = inP.filter((o) => has(o, 'нетто-частинами'));
const ownIn = inP.filter((o) => has(o, 'власні'));
const refunds = inP.filter((o) => has(o, 'повернення') && !has(o, 'власні'));
const plain = inP.filter((o) => o.flags.filter((f) => f !== 'межа-періоду').length === 0);
const outP = credits.filter((o) => has(o, 'поза-періодом'));
const boundary = credits.filter((o) => has(o, 'межа-періоду'));

const totals = {
  creditsAll: sum(credits),
  creditsInPeriod: sum(inP),
  plain: sum(plain),
  acquiringNet: sum(netAcq), acquiringCommission: sum(netAcq, (o) => o.commission || 0),
  instalmentsNet: sum(netInst), instalmentsCommission: sum(netInst, (o) => o.commission || 0),
  ownTransfersIn: sum(ownIn), refunds: sum(refunds), outsidePeriod: sum(outP),
};

console.log('');
console.log(`### Підсумки надходжень${period ? ' (за датою зарахування в межах періоду)' : ''}`);
console.log(table(['Група', 'К-сть', 'Сума'], [
  ['Усі надходження у файлі', credits.length, fmt(totals.creditsAll)],
  ...(period ? [['Надходження в періоді', inP.length, fmt(totals.creditsInPeriod)], ['⚠поза-періодом (не входять у рядки нижче)', outP.length, fmt(totals.outsidePeriod)]] : []),
  ['Без позначок', plain.length, fmt(totals.plain)],
  ['⚠нетто-еквайринг: зараховано (нетто)', netAcq.length, fmt(totals.acquiringNet)],
  ['⚠нетто-еквайринг: комісія з призначення', netAcq.length, fmt(totals.acquiringCommission)],
  ['⚠нетто-частинами: зараховано (нетто)', netInst.length, fmt(totals.instalmentsNet)],
  ['⚠нетто-частинами: комісія з призначення', netInst.length, fmt(totals.instalmentsCommission)],
  ['⚠власні (надходження)', ownIn.length, fmt(totals.ownTransfersIn)],
  ['⚠повернення', refunds.length, fmt(totals.refunds)],
  ['⚠межа-періоду (дата документа й дата зарахування в різних кварталах)', boundary.length, fmt(sum(boundary))],
], ['', 'r', 'r']));
console.log('');
console.log('Позначки — це питання, а не рішення. Що з цього дохід і в якій сумі — за references/rules.md; суми з комісією звір з актом банку.');

emitJSON({
  file, bank: st.bank, account: st.account, format: st.format, period: args.period || null,
  totals, ops: ops.map(({ line, ref, docDate, incomeDate, amount, counterparty, cpId, flags, commission, purpose }) => ({ line, ref, docDate, incomeDate, amount, counterparty, cpId, flags, commission, purpose })),
  note: 'amount і commission — у копійках',
});
