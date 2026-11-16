# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: vhrytsyndyshynquitcode
- Ваше репо: https://github.com/vhrytsyndyshynquitcode/property-workflows
- SHA: 03eccc86880435f99382d1bb4db69bf13eb0a920
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-one.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-one.vercel.app/api/health — `"db":"ok"`, `sha` = 03eccc86880435f99382d1bb4db69bf13eb0a920
- Зелений прогін `smoke` на `main`: https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958691276
- `accounts.zip` на SHA: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/accounts.zip
- Ролі тестових акаунтів: адміністратор — pm-admin@example.test; менеджер — pm-manager@example.test; вендор — pm-vendor@example.test (нових ролей у зрізі 4 немає)
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/53
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/54 (add-doc-parsing з archive, `validate --strict` зелений; impl-doc-parsing — design.md з розділом «AI», tasks.md), https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/56 (clarify-doc-parsing: дослівне «Тоді»)
- Після уточнень PM: /requirements-sync 2026-11-16: Вимоги актуальні (вимогу #59 опубліковано вже оновленою 16.11, знімок — PR #53); уточнення специфікації `clarify-doc-parsing` (дослівне «Тоді» PM у кожному сценарії) — https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/56
- Golden cases PM у `cases.json`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/tests/fixtures/golden/cases.json — GC-01…GC-10 з solomchaak/property-workflows-spec#40, `expected` лише з таблиці PM, опис — `rubric` словами PM
- ADR на залежності: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/docs/decisions/0009-ai-feature-openrouter.md
- Питання PM: моїх питань не було — вимогу опубліковано 16.11 уже з відповідями на питання команди solomchaak/property-workflows-spec#52 … #58

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free; PDF немає (лише текст / .txt, вимога PM)
- Схема й стани: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/src/lib/ai/schema.ts — `ok` / `not_a_document` (відмова AC-DOCAI-09); правила, перевірені кодом (https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/src/lib/ai/doc-values.ts): попередження про суму рахує код (AC-DOCAI-08), телефон нормалізує код, тексти приміток і відмови — константи з AC, значення перед записом перевіряє zod
- Ключ лише на сервері: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/src/lib/ai/openrouter.ts (`server-only`) і зелений `tests/ai-key.test.ts` у https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958623647
- Людина підтверджує перед записом: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/src/app/runs/%5Bid%5D/doc-actions.ts — `getClaims()` і права (`can_parse_documents`) ДО виклику моделі й до запису, повторна валідація zod; запис лише `save_doc_record` (міграція https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/supabase/migrations/20261116161535_doc_records.sql, RLS)
- Збої: без ключа, 429 (і 429 у тілі HTTP 200), таймаут, відповідь не за схемою, помилка постачальника — «The assistant is not available now. Fill in the values yourself.» і порожня форма для ручного заповнення (AC-DOCAI-13)
- Промпт з даними в межах: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізаються, довжина ≤ 20 000; версія `docai-v1`
- PR задач «Реалізація»: https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/55 — злито; CodeRabbit рецензію пропустив («Review skipped»), знахідок не було

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/tests/golden.test.ts — назви «AC-DOCAI-NN: golden GC-NN»
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958623647
- Записи живого прогону: не зроблено — `recorded.json` поки заглушки, написані вручну (позначено в `modelId`); живий прогін потребує мого ключа OpenRouter у `.env.local`, його на момент здачі немає
- Тести збоїв та ін'єкції: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/tests/golden.test.ts (AC-DOCAI-13: не за схемою, 429, 429 у тілі 200, таймаут, помилка постачальника; AC-DOCAI-10: межу `<document>` не закрити з тексту), https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/tests/doc-parsing/actions.test.ts (AC-DOCAI-11, 13, 16, 04)
- Звіт живого eval: не зроблено — немає ключа OpenRouter (див. вище)
- Пояснення FAIL і NOT RUN: живого прогону не було — усі 10 кейсів NOT RUN (немає ключа OpenRouter на момент здачі)

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://property-workflows-one.vercel.app/api/health — sha 03eccc8; db-deploy з «Applying migration 20261116161535_doc_records.sql» — https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43958623647
- UAT на проді (≥ 2 AC): не зроблено на проді — специфікації https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/tests/e2e/doc-parsing.spec.ts (AC-DOCAI-04 «людина підтверджує», AC-DOCAI-14 «вендор не бачить блоку») зелені в CI e2e на одноразовому Supabase: https://github.com/vhrytsyndyshynquitcode/property-workflows/actions/runs/43956234934; прогін на проді потребує ключів основного проєкту в локальному `.env.local`
- `docs/conformance.md`: https://github.com/vhrytsyndyshynquitcode/property-workflows/blob/03eccc86880435f99382d1bb4db69bf13eb0a920/docs/conformance.md — AC-DOCAI-01 … AC-DOCAI-16: реалізовано (код і тести)
- «eval готовий» у чаті команди: не надіслано — живого eval ще не було
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
