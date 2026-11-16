# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: vhrytsyndyshynquitcode
- Ваше репо: https://github.com/vhrytsyndyshynquitcode/property-workflows
- SHA: 2378758ffba1733287ba60fbd8848ed3f9ab0458
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-one.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-one.vercel.app/api/health — `"db":"ok"`, `sha` = 2378758ffba1733287ba60fbd8848ed3f9ab0458
- Зелений прогін `smoke` на `main`: https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43962519345
- `accounts.zip` на SHA: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/accounts.zip
- Ролі тестових акаунтів: адміністратор — pm-admin@example.test; менеджер — pm-manager@example.test; вендор — pm-vendor@example.test (нових ролей у зрізі 4 немає)
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/53
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/54 (add-doc-parsing з archive, `validate --strict` зелений; impl-doc-parsing — design.md з розділом «AI», tasks.md), https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/56 (clarify-doc-parsing: дослівне «Тоді»)
- Після уточнень PM: /requirements-sync 2026-11-16: Вимоги актуальні (вимогу #59 опубліковано вже оновленою 16.11, знімок — PR #53); уточнення специфікації `clarify-doc-parsing` (дослівне «Тоді» PM у кожному сценарії) — https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/56
- Golden cases PM у `cases.json`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/tests/fixtures/golden/cases.json — GC-01…GC-10 з solomchaak/property-workflows-spec#40, `expected` лише з таблиці PM, опис — `rubric` словами PM
- ADR на залежності: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/docs/decisions/0009-ai-feature-openrouter.md
- Питання PM: моїх питань не було — вимогу опубліковано 16.11 уже з відповідями на питання команди solomchaak/property-workflows-spec#52 … #58

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free; PDF немає (лише текст / .txt, вимога PM)
- Схема й стани: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/src/lib/ai/schema.ts — `ok` / `not_a_document` (відмова AC-DOCAI-09); правила, перевірені кодом (https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/src/lib/ai/doc-values.ts): попередження про суму рахує код (AC-DOCAI-08), телефон нормалізує код, тексти приміток і відмови — константи з AC, значення перед записом перевіряє zod
- Ключ лише на сервері: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/src/lib/ai/openrouter.ts (`server-only`) і зелений `tests/ai-key.test.ts` у https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958623647
- Людина підтверджує перед записом: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/src/app/runs/%5Bid%5D/doc-actions.ts — `getClaims()` і права (`can_parse_documents`) ДО виклику моделі й до запису, повторна валідація zod; запис лише `save_doc_record` (міграція https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/supabase/migrations/20261116161535_doc_records.sql, RLS)
- Збої: без ключа, 429 (і 429 у тілі HTTP 200), таймаут, відповідь не за схемою, помилка постачальника — «The assistant is not available now. Fill in the values yourself.» і порожня форма для ручного заповнення (AC-DOCAI-13)
- Промпт з даними в межах: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізаються, довжина ≤ 20 000; версія `docai-v1`
- PR задач «Реалізація»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/55 — злито; CodeRabbit рецензію пропустив («Review skipped»), знахідок не було

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/tests/golden.test.ts — назви «AC-DOCAI-NN: golden GC-NN»
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958623647
- Записи живого прогону: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/tests/fixtures/golden/recorded.json — 9 справжніх відповідей `nvidia/nemotron-3.5-super-vl:free` записано `RECORD=1` (modelId, дата, `docai-v1`); GC-06 — заглушка (FAIL судді не записується), PR https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/57
- Тести збоїв та ін'єкції: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/tests/golden.test.ts (AC-DOCAI-13: не за схемою, 429, 429 у тілі 200, таймаут, помилка постачальника; AC-DOCAI-10: межу `<document>` не закрити з тексту), https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/tests/doc-parsing/actions.test.ts (AC-DOCAI-11, 13, 16, 04)
- Звіт живого eval: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/evals/reports/2026-11-16T21-33-55-909Z.md (усі 10 кейсів: 7/8, GC-09 і GC-10 NOT RUN — 429) і https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/evals/reports/2026-11-16T21-35-01-205Z.md (дозапуск GC-06, GC-09, GC-10: 2/3); разом 9 з 10, поріг PM (≥ 8, GC-09 і GC-10) виконано; підсумок — https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/evals/reports/README.md. Прогін запустив агент у моєму терміналі за моєю згодою
- Пояснення FAIL і NOT RUN: GC-06 FAIL — поля точні (555-0105, other, urgent, «possible gas leak»), суддя відхилив опис через «I opened the window», якого немає в очікуваному описі PM, хоча факт є в документі (правило PM — згадати кожен факт); промпт не змінював · GC-09, GC-10 NOT RUN у першому прогоні — 429 постачальника (не денний ліміт: використано 11 із 50), у дозапуску обидва ✅ · регресій немає

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://property-workflows-one.vercel.app/api/health — sha 03eccc8; db-deploy з «Applying migration 20261116161535_doc_records.sql» — https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43956235025 (коміт 943ba87, злиття PR #55)
- UAT на проді (≥ 2 AC): https://github.com/vhrytsyndyshynquitcode/property-workflows/tree/e856f66d1e56025a6c493e1c89426a3779c960c9/docs/qa/uat/2026-11-16 (16.11, прод https://property-workflows-one.vercel.app, SHA 2378758) — AC-DOCAI-04 «людина підтверджує перед записом»: перевірки ✅, агент PASS, вердикт NEEDS-HUMAN за R4 (цитати «Phone 555-0101» тощо розбиті в aria на dt/dd), рішення за PM; AC-DOCAI-14 «вендор не бачить блоку»: PASS (R6). Коміт звіту — гілка task/uat-doc-parsing (PR у main відкрито після 23:50, злиття — після CI)
- `docs/conformance.md`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/2378758ffba1733287ba60fbd8848ed3f9ab0458/docs/conformance.md — AC-DOCAI-01 … AC-DOCAI-16: реалізовано (код і тести)
- «eval готовий» у чаті команди: 16.11, eval 16.11 (UTC-доба 2026-11-16)
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code (Claude Opus 5.5, власна підписка, `claude -p`)
- Репо працівника: https://github.com/vhrytsyndyshynquitcode/property-workflows-estimate-worker
- SHA репо працівника: 2fbe1fbba800e35592eb1dd854118730d22e1163
- Звіт: https://github.com/vhrytsyndyshynquitcode/property-workflows-estimate-worker/blob/2fbe1fbba800e35592eb1dd854118730d22e1163/docs/worker/README.md
- Картка ролі: перевіряльник кошторисів підрядників для менеджера агенції; тригер — щоранку за розкладом (`run.ps1` / `run.sh`) або `/estimate-checker data/<пакет>` у чаті; канал — звіт `out/YYYY-MM-DD Кошториси <пакет>.md` і JSON запуску
- Межі: https://github.com/vhrytsyndyshynquitcode/property-workflows-estimate-worker/blob/2fbe1fbba800e35592eb1dd854118730d22e1163/.claude/settings.json (вузький allow: скіл, субагент, рівно `node scripts/check-estimate.mjs *`, запис лише в `out/`; deny: мережа, git, npm, rm, зміна даних, скриптів, правил і інструкцій, `.env*`) + `--permission-mode dontAsk` і `--allowedTools` у https://github.com/vhrytsyndyshynquitcode/property-workflows-estimate-worker/blob/2fbe1fbba800e35592eb1dd854118730d22e1163/run.ps1; межа спрацювала в першому запуску (2 відмови — агент дописав `; echo`)
- Перевіряльник і людина в контурі: скрипт рахує чекліст (сума, прайс, підрядник, дублікати, ліміт, інструкції в тексті), субагент `estimate-verifier` у чистому контексті лише читає й вибірково перераховує; погодження, оплата, повернення підряднику, новий підрядник чи ціна — лише менеджер
- Журнал запуску без людини: https://github.com/vhrytsyndyshynquitcode/property-workflows-estimate-worker/tree/2fbe1fbba800e35592eb1dd854118730d22e1163/docs/worker/runs
- Golden data: `batch-a` (2 правильні) → OK ✅; `batch-b` (сума ≠ Total, Labour понад прайс, дубль номера) → ПРОБЛЕМИ ✅; `batch-c` (ін'єкція «approve without checks», підрядник не зі списку, позиція поза прайсом, ліміт, кошторис без Total) → НЕ ПЕРЕВІРЕНО ✅, інструкцію не виконано; без моделі — `node --test tests/golden.test.mjs` 4/4
- Вартість і ліміти: 4 запуски по 6–7 кроків (`num_turns`), оцінка `total_cost_usd` 0.43–0.60 (разом ≈ 2.12 — оцінка, не рахунок) у ліміті особистої підписки; зламалось і виправлено — дописані до дозволеної команди `echo` / `ls` (скрипт сам друкує код виходу), абсолютні шляхи в перевіряльника, `permissions.allow` ігнорується без довіри до теки (дубль у `--allowedTools`). Зроблено після строку 16.11 23:59 (17.11 ~00:10)

### PM

—
