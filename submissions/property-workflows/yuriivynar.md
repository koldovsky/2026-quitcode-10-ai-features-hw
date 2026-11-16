# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: yuriivynar
- Ваше репо: https://github.com/yuriivynar/property-workflows
- SHA: 0bf725aada3cde927b5c15efebe81d84848dea8c
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-eta.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-eta.vercel.app/api/health — `"db":"ok"`, `"sha":"0bf725aada3cde927b5c15efebe81d84848dea8c"`
- Зелений прогін `smoke` на `main`: https://github.com/yuriivynar/property-workflows/actions/runs/43909596659
- `accounts.zip` на SHA: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, pm-admin@example.test; менеджер — manager.a@example.test, manager.b@example.test, manager.c@example.test, pm-manager@example.test; вендор — vendor@example.test, pm-vendor@example.test
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/yuriivynar/property-workflows/pull/86 (вимога solomchaak/property-workflows-spec#59). До 16.11 вимоги PM з AC не було: спершу golden cases solomchaak/property-workflows-spec#40 і тимчасові AC розробника за правилом README «Якщо вимоги зрізу 4 ще немає».
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/yuriivynar/property-workflows/pull/81 (спека `add-document-parsing`, тимчасові AC), https://github.com/yuriivynar/property-workflows/pull/82 (план `impl-document-parsing` з розділом «AI»)
- Після уточнень PM: PR «Оновлення вимог» https://github.com/yuriivynar/property-workflows/pull/86 (злито) і `clarify-document-parsing` https://github.com/yuriivynar/property-workflows/pull/87 — тимчасові AC замінено AC-DOCAI-01…16 PM (рішення solomchaak/property-workflows-spec#55); PM опублікував вимогу 16.11 о 17:53, тож на момент здачі #87 відкритий: чекає рецензії CodeRabbit
- Golden cases PM у `cases.json`: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/tests/fixtures/golden/cases.json — GC-01…GC-10 з solomchaak/property-workflows-spec#40; на цьому SHA поле `ac` — тимчасові AC розробника; під AC вимоги PM (GC-02, GC-03, GC-06 власного AC не мають і входять лише в поріг) — у PR #88
- ADR на залежності: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/docs/decisions/0009-ai-feature-openrouter.md
- Питання PM: https://github.com/solomchaak/property-workflows-spec/issues/55, https://github.com/solomchaak/property-workflows-spec/issues/56, https://github.com/solomchaak/property-workflows-spec/issues/57, https://github.com/solomchaak/property-workflows-spec/issues/58 (питання колеги solomchaak/property-workflows-spec#52–#54 не дублював)

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free; PDF немає (поза scope PM, лише текст і `.txt`)
- Схема й стани: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/lib/ai/schema.ts — ok / needs_info / refused; кодом перевірено телефон (ddd-dddd), суму кошторису й попередження, сталі тексти відмови й приміток, ознаки ін'єкції (https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/lib/documents/values.ts)
- Ключ лише на сервері: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/lib/ai/openrouter.ts (`server-only`) і зелений `tests/ai-key.test.ts` у https://github.com/yuriivynar/property-workflows/actions/runs/43909523924; ім'я змінної — `OPENROUTER_API_KEY`
- Людина підтверджує перед записом: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/app/runs/[id]/_document/actions.ts і https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/lib/documents/service.ts — `currentUser()` (`getClaims()` + роль з `profiles`) до виклику моделі й до запису, повторна валідація zod, insert під RLS (`run_document_values`)
- Збої: без ключа, 429 (і 429 у тілі HTTP 200), таймаут, відповідь не за схемою, помилка постачальника → «The assistant is not available now. Fill in the values yourself.» і порожня форма для ручного вводу (AC-DOCAI-13)
- Промпт з даними в межах: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізано, довжина обмежена; версія `docai-v3`
- PR задач «Реалізація»: https://github.com/yuriivynar/property-workflows/pull/83, https://github.com/yuriivynar/property-workflows/pull/84 (злиті); https://github.com/yuriivynar/property-workflows/pull/88 — критерії PM #59 (Propose values, Discard, .txt, ID тестів AC-DOCAI-01…16), на момент здачі відкритий: чекає рецензії CodeRabbit (ліміт — одна на годину)

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/yuriivynar/property-workflows/actions/runs/43909523924
- Записи живого прогону: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/tests/fixtures/golden/recorded.json — `RECORD=1`, `modelId`, `recordedAt`, `promptVersion`; заглушок немає (тест це перевіряє), GC-06 — запис `docai-v1` з причиною в `OLDER_RECORDS`
- Тести збоїв та ін'єкції: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/tests/golden.test.ts (AC-DOCAI-13 — збої, AC-DOCAI-10 — ін'єкція)
- Звіт живого eval: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/evals/reports/2026-11-16T11-00-03-288Z.md (повний, `docai-v3`, 7/10) і https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/evals/reports/2026-11-16T11-59-06-058Z.md (дорозбір GC-03, GC-10, суддя `judge-v2`) — разом 9/10, поріг ≥ 8 з 10 і GC-09, GC-10 досягнуто; журнал усіх прогонів — https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/evals/reports/README.md
- Пояснення FAIL і NOT RUN: «GC-06 FAIL — модель nemotron написала примітку "smell of gas" замість "possible gas leak": правка промпту v3 перегнула; нова версія потребує повного живого прогону, а денного ліміту на нього й приймання PM не вистачало»; «GC-03, GC-10 FAIL у повному прогоні v3 — помилки судді (граматичні слова як "службові", стала примітка застосунку як "інструкція"); суддю виправлено загально (judge-v2), обидва ✅ у дорозборі»; NOT RUN немає

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: /api/health з SHA 0bf725aada3cde927b5c15efebe81d84848dea8c; `db-deploy` (міграція `run_document_values`) — https://github.com/yuriivynar/property-workflows/actions/runs/43881886257
- UAT на проді (≥ 2 AC): https://github.com/yuriivynar/property-workflows/tree/0427b160b9ad16ba1748b62dbebc9331e9e3f8a1/docs/qa/uat/2026-11-16-docai/ — PASS 2/2 на проді (ще під тимчасовими ID: AC-DOCAI-08 «людина підтверджує» = AC-DOCAI-04 PM, AC-DOCAI-07 «відмова» = AC-DOCAI-09 PM); звіт у гілці task/docai-uat, у main ще не злито — AC-DOCAI-04 (людина підтверджує) і AC-DOCAI-09 (відмова)
- `docs/conformance.md`: https://github.com/yuriivynar/property-workflows/blob/0bf725aada3cde927b5c15efebe81d84848dea8c/docs/conformance.md (на SHA — під тимчасовими AC; матриця під AC-DOCAI-01…16 PM — у PR #87 і #88)
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило (PM приймає 17.11)
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
