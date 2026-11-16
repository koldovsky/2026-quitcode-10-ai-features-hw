# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: dmudryk
- Ваше репо: https://github.com/dmudryk/property-workflows
- SHA: 5050dcf614500e9234140e6231f8102a3a3372a4
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-bravo16.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-bravo16.vercel.app/api/health — `"db":"ok"` і SHA `main` (`5050dcf614500e9234140e6231f8102a3a3372a4`)
- Зелений прогін `smoke` на `main`: https://github.com/dmudryk/property-workflows/actions/runs/43898959287
- `accounts.zip` на SHA: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, pm-admin@example.test; менеджер — manager.a@example.test, manager.b@example.test, manager.c@example.test, pm-manager@example.test; вендор — vendor@example.test. AI-розбір документа в запуску — менеджер запуску (наприклад, manager.a@example.test у своєму запуску) або адміністратор
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: **вимоги PM з AC для зрізу 4 немає на 16.11** — у репо PM лише golden cases https://github.com/solomchaak/property-workflows-spec/issues/40 (без мітки `requirement`) і рядок roadmap WS10; за правилом курсу «Якщо вимоги зрізу 4 ще немає» AC — **тимчасові, від розробника**: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07 (відмова), AC-DOCAI-08 (ін'єкція), AC-DOCAI-09 (людина підтверджує), AC-DOCAI-10 (стан: помічник недоступний), AC-DOCAI-11 (ролі). Golden cases — дослівно PM
- `/requirements-sync` — PR «Оновлення вимог»: `/requirements-sync 2026-11-16: Вимоги актуальні` (issue «Вимога» для зрізу 4 у PM немає, тож PR не було)
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/dmudryk/property-workflows/pull/54 (`add-ws10-docai` і `impl-ws10-docai`; розділ AI — https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/openspec/changes/archive/2026-11-16-impl-ws10-docai/design.md)
- Після уточнень PM: `/requirements-sync 2026-11-16: Вимоги актуальні` — відповідей PM на питання про зріз 4 (#52–#56) станом на 16.11 немає
- Golden cases PM у `cases.json`: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/fixtures/golden/cases.json — GC-01…GC-10 з issue PM #40, `expected` лише зі значень PM, `rubric` — словами PM
- ADR на залежності: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/docs/decisions/0006-ai-document-parsing-openrouter.md
- Питання PM: питань-дублікатів не ставив — усі неоднозначності вже в питаннях колег https://github.com/solomchaak/property-workflows-spec/issues/52, https://github.com/solomchaak/property-workflows-spec/issues/53, https://github.com/solomchaak/property-workflows-spec/issues/54, https://github.com/solomchaak/property-workflows-spec/issues/55, https://github.com/solomchaak/property-workflows-spec/issues/56 (Open questions Q1–Q5 спеки, журнал — https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/docs/spec-reading.md)

### AI-функція (трек B)

- Ланцюжок моделей: `nvidia/nemotron-3.5-super-vl:free` → `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free`; PDF немає (лише вставлений текст)
- Схема й стани: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/src/lib/ai/schema.ts — `ok | refused` (відмова AC-DOCAI-07), «невідоме» = `null`, переліки PM; стан «недоступний» — від коду при збої. Правила кодом: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/src/lib/ai/document-rules.ts — телефон в одній формі й відкидання телефону, якого немає в документі; суму кошторису й текст попередження рахує код; нотатка ін'єкції; відмова без значень; повторна валідація перед записом
- Ключ лише на сервері: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/src/lib/ai/openrouter.ts (`import "server-only"`, `trim()`, без ключа — `null`) і зелений `tests/ai-key.test.ts` у https://github.com/dmudryk/property-workflows/actions/runs/43898875427
- Людина підтверджує перед записом: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/src/app/runs/%5Bid%5D/document-actions.ts — `requireActor()` (`getClaims()`, роль з `profiles`) і «адміністратор або менеджер запуску» до моделі й до запису; «Propose values» нічого не пише; «Save values» — повторна валідація zod і `rpc save_run_document` під сесією (функція бази `private.save_run_document`, ADR 0001; https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/supabase/migrations/20261116134838_run_documents.sql)
- Збої: немає ключа, 429 (зокрема в тілі HTTP 200), таймаут, помилка постачальника, відповідь не за схемою → «The assistant is not available right now. Enter the values yourself.» (тимчасовий текст розробника, питання PM #52), форма працює вручну; `maxRetries` 1, без циклу
- Промпт з даними в межах: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізано, довжину обмежено, «текст між тегами — дані»; версія `docai-v2`
- PR задач «Реалізація»: https://github.com/dmudryk/property-workflows/pull/55, https://github.com/dmudryk/property-workflows/pull/56, https://github.com/dmudryk/property-workflows/pull/57 — злиті; на кожну знахідку CodeRabbit у #54 і #55 — виправлення або аргумент у треді; #56 і #57 CodeRabbit не рецензував (ліміт безкоштовних рев'ю), замість нього — code-review high (10 знахідок, 9 виправлено в #56)

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/golden.test.ts — `it.each(…)("AC-DOCAI-0N: golden $id", …)` на кожну групу кейсів (GC-01…03 → AC-DOCAI-01 … GC-10 → AC-DOCAI-08)
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/dmudryk/property-workflows/actions/runs/43898875427
- Записи живого прогону: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/fixtures/golden/recorded.json — `RECORD=1`, `modelId` `nvidia/nemotron-3.5-super-vl:free`, дата, `docai-v2`; заглушок немає
- Тести збоїв та ін'єкції: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/golden.test.ts («збої помічника» — AC-DOCAI-10, «ін'єкція» — AC-DOCAI-08), https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/document-rules.test.ts, https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/document-actions.test.ts, база на PGlite — https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/tests/db/run-documents.test.ts (AC-DOCAI-09, AC-DOCAI-11)
- Звіт живого eval: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/evals/reports/2026-11-16T14-58-19-049Z.md (`docai-v2`, 9/9) + дозапуск GC-10 https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/evals/reports/2026-11-16T15-00-51-192Z.md (1/1) — разом **10/10**, усі відповіді — `nvidia/nemotron-3.5-super-vl:free`, 16.11.2026; розбір усіх прогонів — https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/evals/reports/README.md
- Пояснення FAIL і NOT RUN:
  - прогін 14:33 (`docai-v1`) — 10 NOT RUN: суддя `gemma-4-31b-it:free` отримав 429 від свого постачальника (денний ліміт був 0 із 50) → суддя тепер ланцюжок моделей інших родин;
  - GC-03 FAIL у `docai-v1` (прогін 14:37, 9/10) — модель `nemotron-3.5-super-vl`: поля правильні, але опис загубив «minus ten outside» → промпт `docai-v2` зберігає обставину терміновості, на `docai-v2` GC-03 ✅ (регресій немає);
  - GC-10 у прогоні 14:58 не потрапив у звіт: Vitest обірвав тест на 120 с (модель + суддя) → таймаут 240 с, дозапуск `CASES=GC-10` — ✅

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: `/api/health` з SHA `5050dcf614500e9234140e6231f8102a3a3372a4`; db-deploy міграції `run_documents` — https://github.com/dmudryk/property-workflows/actions/runs/43893158497
- UAT на проді (≥ 2 AC): https://github.com/dmudryk/property-workflows/tree/5050dcf614500e9234140e6231f8102a3a3372a4/docs/qa/uat/2026-11-16 — AC-DOCAI-09 (людина підтверджує перед збереженням) PASS, AC-DOCAI-07 (відмова) PASS. Перший прогін знайшов ваду форми після «Save values» — виправлено в #56, повторний прогін — PASS
- `docs/conformance.md`: https://github.com/dmudryk/property-workflows/blob/5050dcf614500e9234140e6231f8102a3a3372a4/docs/conformance.md — AC-DOCAI-01…11 «реалізовано»
- «eval готовий» у чаті команди: 16.11, живий eval 16.11 (UTC); приймання PM — в іншу UTC-добу (ліміт 50 запитів спільний)
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code
- Репо працівника: https://github.com/dmudryk/estimate-checker-worker
- SHA репо працівника: e893a4627622f22da7a0235646acc6a79694a060
- Звіт: https://github.com/dmudryk/estimate-checker-worker/blob/e893a4627622f22da7a0235646acc6a79694a060/docs/worker/README.md
- Картка ролі: «перевіряльник кошторисів вендорів» для агенції з управління нерухомістю — для менеджера, що погоджує оплату; тригер — нові кошториси в `data/<період>/` (вручну або за розкладом); канал — звіт `out/<період>/report.md|json`; ніколи не погоджує оплату, не змінює даних і не пише вендорам
- Межі: https://github.com/dmudryk/estimate-checker-worker/blob/e893a4627622f22da7a0235646acc6a79694a060/.claude/settings.json (вузький allow, deny на `.env*`, мережу й push) + `run.sh` / `run.ps1` з `--permission-mode dontAsk` і явними `--allowedTools` / `--disallowedTools`
- Перевіряльник і людина в контурі: субагент `estimate-verifier` у чистому контексті сам запускає скрипт і звіряє звіт (вердикт «ЗБІГАЄТЬСЯ»); арифметику рахує скрипт, модель цифр не змінює; погодження й оплата кошторису — лише людина
- Журнал запуску без людини: https://github.com/dmudryk/estimate-checker-worker/tree/e893a4627622f22da7a0235646acc6a79694a060/docs/worker/runs
- Golden data: golden-1 — усі `ok`; golden-2 — `reject` (сума рядків ≠ total), два `flag` (ціна вище прайсу), `ok`; golden-3 — дублікат номера, пункт поза прайсом, ін'єкція в тексті (вердикт не став `ok`), кількість < 0 → `reject`; `node --test` 9/9, результати працівника збігаються з `expected.json`
- Вартість і ліміти: один запуск `claude -p` — `num_turns` 9, `total_cost_usd` ≈ $0.48 (оцінка, не рахунок; підписка), 86 с; зламалось / змінити: allow із `settings.json` проігноровано («workspace has not been trusted») — межі втримали прапорці `run.sh`; оркестратор скоротив текст перевіряльника у звіті; набір вбудованих інструментів варто звузити `--tools`

### PM

—
