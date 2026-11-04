// Спільні функції для скриптів бухгалтерського помічника (демо).
// Без залежностей: лише Node.js 18+. Усі гроші — цілі копійки (integer), щоб не було похибок float.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const ROWS = ['06', '08', '11', '12', '13', '14.1', '14', '23', '24', '25'];
export const JSON_MARK = '###JSON###';

// ---------- текст і числа ----------
export function readText(file) {
  return fs.readFileSync(file, 'utf8').replace(/^﻿/, '');
}

/** "1 234,56" | "1 234,56" | "-150,00" | "64000,00" | 1234.56 → копійки (integer). null, якщо не число. */
export function toKop(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Math.round(v * 100);
  let s = String(v).trim().replace(/[\s   ']/g, '').replace(/\*\*/g, '');
  if (!/^[-−]?\d+([.,]\d{1,2})?$/.test(s)) return null;
  s = s.replace('−', '-').replace(',', '.');
  const neg = s.startsWith('-');
  const [i, f = ''] = s.replace('-', '').split('.');
  const kop = Number(i) * 100 + Number((f + '00').slice(0, 2));
  return neg ? -kop : kop;
}

/** копійки → "1 234 567,89" (звичайний пробіл як роздільник тисяч) */
export function fmt(kop) {
  if (kop === null || kop === undefined) return '—';
  const sign = kop < 0 ? '-' : '';
  const a = Math.abs(kop);
  const int = String(Math.floor(a / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${sign}${int},${String(a % 100).padStart(2, '0')}`;
}

/** Відсоток від суми в копійках з округленням до копійки (half up для додатних сум). rate у відсотках, напр. 5 або 1. */
export function percent(kop, rate) {
  return Math.round((kop * rate) / 100);
}

/** "30.09.2026" | "30.09.2026 23:58:01" | "2026-09-30" → "2026-09-30" */
export function isoDate(s) {
  if (!s) return null;
  const t = String(s).trim();
  let m = t.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  return null;
}
export const uaDate = (iso) => (iso ? iso.split('-').reverse().join('.') : '—');

// ---------- CSV ----------
export function parseCSV(text, sep = ';') {
  const rows = [];
  let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false;
      } else cell += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n') { row.push(cell.replace(/\r$/, '')); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell !== '' || row.length) { row.push(cell.replace(/\r$/, '')); rows.push(row); }
  return rows;
}

// ---------- профіль платника ----------
export function loadProfile(file = path.join(ROOT, 'references', 'profile.md')) {
  const t = readText(file);
  const id = (t.match(/РНОКПП[^0-9]*(\d{10})/) || [])[1] || null;
  const ibans = [...new Set(t.match(/UA\d{27}/g) || [])];
  const name = (t.match(/ПІБ[^:]*:\s*\**([^\n*]+)/) || [])[1]?.trim() || null;
  return { id, ibans, name, file };
}

// ---------- періоди ----------
/** "2026-Q3" → { year, q, from: "2026-07-01", to: "2026-09-30", yearFrom: "2026-01-01" } */
export function quarter(code) {
  const m = String(code).match(/^(\d{4})-Q([1-4])$/);
  if (!m) throw new Error(`Невідомий період "${code}" (очікую формат 2026-Q3)`);
  const y = Number(m[1]), q = Number(m[2]);
  const ends = { 1: '03-31', 2: '06-30', 3: '09-30', 4: '12-31' };
  const starts = { 1: '01-01', 2: '04-01', 3: '07-01', 4: '10-01' };
  return { year: y, q, from: `${y}-${starts[q]}`, to: `${y}-${ends[q]}`, yearFrom: `${y}-01-01` };
}
export const quarterOf = (iso) => (iso ? `${iso.slice(0, 4)}-Q${Math.floor((Number(iso.slice(5, 7)) - 1) / 3) + 1}` : null);

// ---------- банківські виписки ----------
/**
 * Нормалізує виписку будь-якого з двох форматів у список операцій:
 * { bank, account, ref, docDate, incomeDate, amount(kop, + надходження / − списання), counterparty, cpId, cpIban, purpose, line }
 * incomeDate — дата зарахування коштів на рахунок (Банк А: «Дата операції»; Банк Б: «Дата валютування»).
 */
export function loadStatement(file) {
  const rows = parseCSV(readText(file));
  const hi = rows.findIndex((r) => r.includes('Дата операції') || r.includes('Дата валютування'));
  if (hi < 0) throw new Error(`${file}: не знайдено рядок заголовків виписки`);
  const preamble = rows.slice(0, hi).flat().join(' ');
  const bank = (preamble.match(/Банк\s+([А-ЯҐЄІЇ])(?![а-яґєії])/) || [])[0] || null;
  const account = (preamble.match(/UA\d{27}/) || [])[0] || null;
  const H = rows[hi];
  const col = (name) => H.indexOf(name);
  const ops = [];
  const fmtA = col('Дата документа') >= 0 && col('Кредит') >= 0;
  for (let i = hi + 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length < H.length - 1) continue;
    const g = (name) => (col(name) >= 0 ? (r[col(name)] ?? '').trim() : '');
    if (fmtA) {
      const docDate = isoDate(g('Дата документа')), incomeDate = isoDate(g('Дата операції'));
      if (!incomeDate) continue;
      const cr = toKop(g('Кредит')), db = toKop(g('Дебет'));
      ops.push({
        bank, account, ref: g('Номер документа'), docDate, incomeDate,
        amount: cr ? cr : -(db || 0), counterparty: g('Контрагент'), cpId: g('Код контрагента'),
        cpIban: g('Рахунок контрагента'), purpose: g('Призначення платежу'), line: i + 1,
      });
    } else {
      const docDate = isoDate(g('Дата і час операції')), incomeDate = isoDate(g('Дата валютування'));
      if (!incomeDate) continue;
      ops.push({
        bank, account, ref: g('Референс операції'), docDate, incomeDate,
        amount: toKop(g('Сума')), counterparty: g('Контрагент'), cpId: g('Код контрагента'),
        cpIban: g('IBAN контрагента'), purpose: g('Опис операції'), line: i + 1,
      });
    }
  }
  return { file, bank, account, format: fmtA ? 'А' : 'Б', ops };
}

/** Позначки для операції. Скрипт ПОЗНАЧАЄ, правила з references/rules.md ВИРІШУЮТЬ. */
export function flagsFor(op, profile, period) {
  const f = [];
  let commission = null;
  if (op.amount > 0) {
    if (/еквайринг|платіжними картками|покриття за проведені/i.test(op.purpose)) f.push('нетто-еквайринг');
    if (/оплата частинами|покупка частинами/i.test(op.purpose)) f.push('нетто-частинами');
    if (f.length) {
      const m = op.purpose.match(/комісі[юяї][^0-9]{0,30}([0-9][0-9   ]*,\d{2})/i);
      commission = m ? toKop(m[1]) : null;
      if (commission === null) f.push('комісію-не-знайдено');
    }
    if (/повернення|повернуто|неуспішн/i.test(op.purpose)) f.push('повернення');
  }
  const own = (profile.id && op.cpId === profile.id) || (op.cpIban && profile.ibans.includes(op.cpIban));
  if (own) f.push('власні');
  if (period) {
    if (op.incomeDate < period.from || op.incomeDate > period.to) f.push('поза-періодом');
    if (op.docDate && quarterOf(op.docDate) !== quarterOf(op.incomeDate)) f.push('межа-періоду');
  }
  return { flags: f, commission };
}

/**
 * Дохід за правилами (references/rules.md) для однієї операції: { income, reason, unverified }.
 * Використовує reconcile.mjs. parse-statement.mjs цю функцію НЕ викликає — він лише позначає.
 */
export function incomeByRules(op, fl) {
  if (op.amount <= 0) return { income: 0, reason: 'списання' };
  if (fl.flags.includes('власні')) return { income: 0, reason: 'власні кошти — не дохід (правило 2)' };
  if (fl.flags.includes('повернення')) return { income: 0, reason: 'повернення власних коштів — не дохід (правило 2)' };
  if (fl.flags.includes('поза-періодом')) return { income: 0, reason: `зараховано ${uaDate(op.incomeDate)} — інший звітний період (правило 3)` };
  if (fl.flags.includes('нетто-еквайринг') || fl.flags.includes('нетто-частинами')) {
    if (fl.commission === null) return { income: op.amount, reason: 'нетто-зарахування без суми комісії', unverified: true };
    return { income: op.amount + fl.commission, reason: `брутто = нетто ${fmt(op.amount)} + комісія ${fmt(fl.commission)} (правило 1)` };
  }
  return { income: op.amount, reason: 'дохід' };
}

// ---------- акти банку ----------
const MONTHS = { 'січ': '01', 'лют': '02', 'бер': '03', 'кві': '04', 'тра': '05', 'чер': '06', 'лип': '07', 'сер': '08', 'вер': '09', 'жов': '10', 'лис': '11', 'гру': '12' };
export function loadAct(file) {
  const rows = parseCSV(readText(file));
  const hi = rows.findIndex((r) => r.some((c) => /брутто/i.test(c)));
  if (hi < 0) throw new Error(`${file}: не знайдено заголовок акта (колонка «брутто»)`);
  const pre = rows.slice(0, hi).flat().join(' ');
  const bank = (pre.match(/Банк\s+([А-ЯҐЄІЇ])(?![а-яґєії])/) || [])[0] || null;
  const kind = /частинами/i.test(pre) ? 'нетто-частинами' : 'нетто-еквайринг';
  const H = rows[hi];
  const ci = (re) => H.findIndex((c) => re.test(c));
  const iG = ci(/брутто/i), iC = ci(/комісія/i), iN = ci(/нетто/i);
  const months = [];
  let total = null;
  for (const r of rows.slice(hi + 1)) {
    if (!r[0]) continue;
    const rec = { label: r[0], gross: toKop(r[iG]), commission: toKop(r[iC]), net: toKop(r[iN]) };
    const m = r[0].toLowerCase().match(/^([а-яґєії]{3})[а-яґєії]*\s+(\d{4})/);
    if (m && MONTHS[m[1]]) months.push({ ...rec, month: `${m[2]}-${MONTHS[m[1]]}` });
    else if (/разом/i.test(r[0])) total = rec;
  }
  return { file, bank, kind, months, total };
}

// ---------- декларації ----------
/** JSON або Markdown → { file, system, period, rows: {код: kop}, ledger: [{date, bank, ref, counterparty, amount}] | null } */
export function loadDeclaration(file) {
  const t = readText(file);
  if (file.toLowerCase().endsWith('.json')) {
    const j = JSON.parse(t);
    const rows = {};
    for (const [k, v] of Object.entries(j.rows || {})) rows[k] = toKop(v);
    const ledger = j.incomeLedger
      ? j.incomeLedger.map((x) => ({ date: isoDate(x.date), bank: x.bank, ref: String(x.ref), counterparty: x.counterparty, amount: toKop(x.amount) }))
      : null;
    return { file, system: j.system || j.document || path.basename(file), period: j.period || null, status: j.status || null, rows, ledger };
  }
  // Markdown: таблиця показників «| 06 | ... | 1 002 216,14 |» і таблиця книги доходів з датами
  const rows = {};
  let ledger = null;
  let period = null;
  const pm = t.match(/(I{1,3}|IV)\s+квартал\s+(\d{4})/);
  if (pm) period = `${pm[2]}-Q${{ I: 1, II: 2, III: 3, IV: 4 }[pm[1]]}`;
  let inLedger = false;
  for (const line of t.split(/\r?\n/)) {
    if (/^#+\s/.test(line)) inLedger = /книга обліку доходів/i.test(line);
    if (!line.trim().startsWith('|')) continue;
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (!inLedger) {
      const code = cells[0];
      if (/^\d{2}(\.\d)?$/.test(code)) {
        const v = toKop(cells[cells.length - 1]);
        if (v !== null) rows[code] = v;
      }
    } else {
      const d = isoDate(cells[0]);
      if (d) {
        ledger ||= [];
        ledger.push({ date: d, bank: cells[1], ref: cells[2], counterparty: cells[3], amount: toKop(cells[4]) });
      }
    }
  }
  const sys = (t.match(/Сформовано:\s*([^,(\n]+)/) || [])[1]?.trim() || path.basename(file);
  return { file, system: sys, period, rows, ledger };
}

/** Рядки демо-форми з доходу (06) і поданої декларації за попередній період (references/rules.md, розділ 1). */
export function calcRows(income06, prior) {
  const r = {};
  r['06'] = income06;
  r['08'] = income06;
  r['11'] = percent(r['08'], 5);
  r['12'] = r['11'];
  r['13'] = prior ? prior['12'] : 0;
  r['14.1'] = r['12'] - r['13'];
  r['14'] = Math.max(r['14.1'], 0);
  r['23'] = percent(r['06'], 1);
  r['24'] = prior ? prior['23'] : 0;
  r['25'] = r['23'] - r['24'];
  return r;
}

// ---------- аргументи і вивід ----------
export function parseArgs(argv, multi = []) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const vals = [];
      while (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) vals.push(argv[++i]);
      if (multi.includes(key)) out[key] = [...(out[key] || []), ...vals];
      else out[key] = vals.length ? vals.join(' ') : true;
    } else out._.push(a);
  }
  return out;
}

export function table(headers, rows, align = []) {
  const esc = (s) => String(s ?? '').replace(/\|/g, '\\|');
  const L = [`| ${headers.map(esc).join(' | ')} |`, `|${headers.map((_, i) => (align[i] === 'r' ? '---:' : '---')).join('|')}|`];
  for (const r of rows) L.push(`| ${r.map(esc).join(' | ')} |`);
  return L.join('\n');
}

export function emitJSON(obj) {
  console.log('\n' + JSON_MARK);
  console.log(JSON.stringify(obj, (k, v) => v, 2));
}
