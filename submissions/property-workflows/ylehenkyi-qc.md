# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: ylehenkyi-qc
- Ваше репо: https://github.com/ylehenkyi-qc/property-workflows
- SHA: 746d42e90d884cdb16371d00e97ba32d65c322cd
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://pmwp-ylehenkyi.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://pmwp-ylehenkyi.vercel.app/api/health — відповідь `{"ok":true,"sha":"746d42e90d884cdb16371d00e97ba32d65c322cd","env":"production","db":"ok"}`
- Зелений прогін `smoke` на `main`: https://github.com/ylehenkyi-qc/property-workflows/actions/runs/43958620520
- `accounts.zip` на SHA: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, pm-admin@example.test; менеджер — manager1@example.test, manager2@example.test, pm-manager@example.test; вендор — vendor1@example.test, vendor2@example.test. Паролі — лише в accounts.zip
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/ylehenkyi-qc/property-workflows/pull/62
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/ylehenkyi-qc/property-workflows/pull/56 (add-document-parsing з тимчасовими AC, коли вимоги PM ще не було; план impl-document-parsing з розділом «AI» — design.md)
- Після уточнень PM: PR «Оновлення вимог» https://github.com/ylehenkyi-qc/property-workflows/pull/62 і PR «Специфікація» update-document-parsing (перехід на AC-DOCAI-01…16 вимоги PM замість тимчасових AC): https://github.com/ylehenkyi-qc/property-workflows/pull/63
- Golden cases PM у `cases.json`: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/tests/fixtures/golden/cases.json — 10 кейсів PM (solomchaak/property-workflows-spec#40), ті самі GC-01…GC-10 за порядком кейсів PM. Тимчасові кейси не використовувались: кейси PM були до початку роботи; тимчасовими були лише AC-DOCAI-NN (до вимоги PM solomchaak/property-workflows-spec#59), замінені в https://github.com/ylehenkyi-qc/property-workflows/pull/63 і https://github.com/ylehenkyi-qc/property-workflows/pull/64
- ADR на залежності: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/docs/decisions/0005-ai-document-parsing-openrouter.md
- Питання PM: https://github.com/solomchaak/property-workflows-spec/issues/52, https://github.com/solomchaak/property-workflows-spec/issues/53, https://github.com/solomchaak/property-workflows-spec/issues/54, https://github.com/solomchaak/property-workflows-spec/issues/55, https://github.com/solomchaak/property-workflows-spec/issues/56, https://github.com/solomchaak/property-workflows-spec/issues/57, https://github.com/solomchaak/property-workflows-spec/issues/58 — відповіді PM 2026-11-16, відображено у вимозі https://github.com/solomchaak/property-workflows-spec/issues/59

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free (лише `:free`, maxRetries 0–1); у прогонах eval відповідала nvidia/nemotron-3.5-super-vl:free; PDF немає (вимога PM: лише вставлений текст і .txt)
- Схема й стани: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/schema.ts — `ok` / `refused` + прапорці `injectionDetected`, `twoProblems`, `safetyNote`; стани коду https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/parse.ts: ok / refused / empty / unavailable; правила, що перевіряє код, а не модель: сума рядків кошторису й попередження, тексти відмови й приміток, категорії
- Ключ лише на сервері: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/openrouter.ts (`import "server-only"`) і зелений tests/ai-key.test.ts: https://github.com/ylehenkyi-qc/property-workflows/actions/runs/43958549113. Значення ключа НЕ пишемо
- Людина підтверджує перед записом: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/app/runs/%5Bid%5D/document-actions.ts і https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/document-flow.ts — `requireRole` (getClaims + роль з profiles.role) до моделі й до запису, перевірка права на запуск, повторна валідація zod (https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/confirm.ts), запис під сесією користувача (RLS)
- Збої: без ключа, 429 (і 429 в тілі HTTP 200), HTTP 5xx, мережа, таймаут, відповідь не за схемою — користувач бачить «The assistant is not available now. Fill in the values yourself.» (AC-DOCAI-13), тип документа й значення порожні та редаговані
- Промпт з даними в межах: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/prompts/parse.ts — теги `<document>`, версія `parse-v2`, теги з вхідного тексту вирізаються
- PR задач «Реалізація»: https://github.com/ylehenkyi-qc/property-workflows/pull/57, https://github.com/ylehenkyi-qc/property-workflows/pull/58, https://github.com/ylehenkyi-qc/property-workflows/pull/59, https://github.com/ylehenkyi-qc/property-workflows/pull/60, https://github.com/ylehenkyi-qc/property-workflows/pull/61, https://github.com/ylehenkyi-qc/property-workflows/pull/64 — злиті; відповіді на знахідки CodeRabbit у https://github.com/ylehenkyi-qc/property-workflows/pull/60 (AC ID в назвах тестів); у https://github.com/ylehenkyi-qc/property-workflows/pull/61 і https://github.com/ylehenkyi-qc/property-workflows/pull/64 CodeRabbit повернув «Review limit reached» — рев'ю не відбулося

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/tests/golden.test.ts — назви починаються з AC ID (кейси 2, 3 і 6 без окремого AC у вимозі PM)
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/ylehenkyi-qc/property-workflows/actions/runs/43958549113
- Записи живого прогону: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/tests/fixtures/golden/recorded.json — записано RECORD=1 (modelId, дата, версія промпту parse-v2), не заглушки
- Тести збоїв та ін'єкції: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/parse.test.ts (AC-DOCAI-13 збої, AC-DOCAI-10 ін'єкція, AC-DOCAI-11 порожній текст), https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/src/lib/ai/document-flow.test.ts, https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/tests/ai-no-key.test.ts
- Звіт живого eval: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/evals/reports/2026-11-16T15-29-21-631Z.md (parse-v2, 9 з 10: nemotron-3.5-super-vl; суддя nemotron-3.5-super-vl) і https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/evals/reports/2026-11-16T15-34-02-421Z.md (GC-06 повторно, пройшов); попередній прогін parse-v1: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/evals/reports/2026-11-16T14-57-51-903Z.md
- Пояснення FAIL і NOT RUN: GC-01, GC-02, GC-03 FAIL у parse-v1 — суддя: опис без «for three days», «in apartment 7», «apartment 31»; виправлено промптом parse-v2 · GC-07…GC-10 NOT RUN у parse-v1 — 429 постачальника на GC-07, не ліміт акаунта · GC-06 FAIL (`invalid_output`) у першому прогоні parse-v2, при повторі пройшов · деталі: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/evals/reports/README.md. Поріг PM («8 з 10; кейси 9 і 10 завжди») виконано: прогін parse-v2 — 9 з 10 з GC-09 і GC-10, GC-06 повторно пройшов

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://pmwp-ylehenkyi.vercel.app/api/health з SHA 746d42e90d884cdb16371d00e97ba32d65c322cd; db-deploy https://github.com/ylehenkyi-qc/property-workflows/actions/runs/43878204576 (міграція run_document_values з https://github.com/ylehenkyi-qc/property-workflows/pull/59)
- UAT на проді (≥ 2 AC): https://github.com/ylehenkyi-qc/property-workflows/tree/746d42e90d884cdb16371d00e97ba32d65c322cd/docs/qa/uat/2026-11-16/ — AC-DOCAI-04 (людина підтверджує), AC-DOCAI-09 (відмова), AC-DOCAI-14, AC-DOCAI-16 — усі чотири PASS (R6), прогін на проді (коміт збірки d91543f і сценарії AC-16 з тесту @ ce73e23; прод після merge — SHA вище)
- `docs/conformance.md`: https://github.com/ylehenkyi-qc/property-workflows/blob/746d42e90d884cdb16371d00e97ba32d65c322cd/docs/conformance.md — кожен AC-DOCAI-01…16 зі статусом
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
