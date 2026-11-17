# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: yuriivynar
- Ваше репо: https://github.com/yuriivynar/property-workflows
- SHA: 94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-eta.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-eta.vercel.app/api/health — `"db":"ok"`, `"sha":"94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd"`
- Зелений прогін `smoke` на `main`: https://github.com/yuriivynar/property-workflows/actions/runs/43909596659
- `accounts.zip` на SHA: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, pm-admin@example.test; менеджер — manager.a@example.test, manager.b@example.test, manager.c@example.test, pm-manager@example.test; вендор — vendor@example.test, pm-vendor@example.test
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/yuriivynar/property-workflows/pull/86 (вимога solomchaak/property-workflows-spec#59). До 16.11 вимоги PM з AC не було: спершу golden cases solomchaak/property-workflows-spec#40 і тимчасові AC розробника за правилом README «Якщо вимоги зрізу 4 ще немає».
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/yuriivynar/property-workflows/pull/81 (спека `add-document-parsing`, тимчасові AC), https://github.com/yuriivynar/property-workflows/pull/82 (план `impl-document-parsing` з розділом «AI»)
- Після уточнень PM: PR «Оновлення вимог» https://github.com/yuriivynar/property-workflows/pull/86 і `clarify-document-parsing` https://github.com/yuriivynar/property-workflows/pull/87 — тимчасові AC замінено AC-DOCAI-01…16 PM (рішення solomchaak/property-workflows-spec#55); обидва злито 16.11
- Golden cases PM у `cases.json`: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/tests/fixtures/golden/cases.json — GC-01…GC-10 з solomchaak/property-workflows-spec#40; поле `ac` — AC вимоги PM (GC-02, GC-03, GC-06 власного AC у #59 не мають і входять лише в поріг)
- ADR на залежності: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/docs/decisions/0009-ai-feature-openrouter.md
- Питання PM: https://github.com/solomchaak/property-workflows-spec/issues/55, https://github.com/solomchaak/property-workflows-spec/issues/56, https://github.com/solomchaak/property-workflows-spec/issues/57, https://github.com/solomchaak/property-workflows-spec/issues/58 — усі з відповіддю PM (варіант A, вимога #59); питання колеги solomchaak/property-workflows-spec#52–#54 не дублював

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free; PDF немає (поза scope PM, лише текст і `.txt`)
- Схема й стани: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/lib/ai/schema.ts — ok / needs_info / refused; кодом перевірено телефон (ddd-dddd), суму кошторису й попередження, сталі тексти відмови й приміток, ознаки ін'єкції (https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/lib/documents/values.ts)
- Ключ лише на сервері: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/lib/ai/openrouter.ts (`server-only`) і зелений `tests/ai-key.test.ts` у https://github.com/yuriivynar/property-workflows/actions/runs/43960901243; ім'я змінної — `OPENROUTER_API_KEY`
- Людина підтверджує перед записом: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/app/runs/[id]/_document/actions.ts і https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/lib/documents/service.ts — `currentUser()` (`getClaims()` + роль з `profiles`) до виклику моделі й до запису, повторна валідація zod, insert під RLS (`run_document_values`)
- Збої: без ключа, 429 (і 429 у тілі HTTP 200), таймаут, відповідь не за схемою, помилка постачальника → «The assistant is not available now. Fill in the values yourself.» і порожня форма для ручного вводу (AC-DOCAI-13)
- Промпт з даними в межах: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізано, довжина обмежена; версія `docai-v4` (правило терміновості дослівно з #59)
- PR задач «Реалізація»: https://github.com/yuriivynar/property-workflows/pull/83, https://github.com/yuriivynar/property-workflows/pull/84, https://github.com/yuriivynar/property-workflows/pull/88, https://github.com/yuriivynar/property-workflows/pull/89 — злиті, з відповіддю на кожну знахідку CodeRabbit

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/yuriivynar/property-workflows/actions/runs/43960901243
- Записи живого прогону: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/tests/fixtures/golden/recorded.json — `RECORD=1`, `modelId`, `recordedAt`, `promptVersion`; заглушок немає (тест це перевіряє). Записи — від `docai-v3` (GC-06 — `docai-v1`); `docai-v4` 16.11 о 22:50 живим прогоном ще не перезаписано через денний ліміт — причина в `OLDER_RECORDS`, прогін — 17.11 до приймання PM
- Тести збоїв та ін'єкції: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/tests/golden.test.ts (AC-DOCAI-13 — збої, AC-DOCAI-10 — ін'єкція)
- Звіт живого eval: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/evals/reports/2026-11-16T11-00-03-288Z.md (повний, `docai-v3`, 7/10) і https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/evals/reports/2026-11-16T11-59-06-058Z.md (дорозбір GC-03, GC-10, суддя `judge-v2`) — разом 9/10, поріг ≥ 8 з 10 і GC-09, GC-10 досягнуто; журнал усіх прогонів і `docai-v4` — https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/evals/reports/README.md
- Пояснення FAIL і NOT RUN: «GC-06 FAIL — модель nemotron написала примітку "smell of gas" замість "possible gas leak": правка промпту v3 перегнула; нова версія потребує повного живого прогону, а денного ліміту на нього й приймання PM не вистачало»; «GC-03, GC-10 FAIL у повному прогоні v3 — помилки судді (граматичні слова як "службові", стала примітка застосунку як "інструкція"); суддю виправлено загально (judge-v2), обидва ✅ у дорозборі»; NOT RUN немає

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: /api/health з SHA 94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd; `db-deploy` (міграція `run_document_values`) — https://github.com/yuriivynar/property-workflows/actions/runs/43881886257
- UAT на проді (≥ 2 AC): https://github.com/yuriivynar/property-workflows/tree/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/docs/qa/uat/2026-11-16/ — AC-DOCAI-04 (людина виправляє й підтверджує) і AC-DOCAI-09 (відмова): PASS 2/2 на проді, 16.11 23:01
- `docs/conformance.md`: https://github.com/yuriivynar/property-workflows/blob/94b67a2d50a2a9d69ed77c4eba4b04aaea20b2dd/docs/conformance.md — AC-DOCAI-01…16 PM, кожен «реалізовано» з кодом і тестом
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило (PM приймає 17.11)
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

> Зроблено 17.11 — після строку здачі (16.11, 23:59); додано окремим комітом, основну частину файла не змінено.

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code (Claude Opus 5.5, Claude Code 2.1.325, власна підписка)
- Репо працівника: https://github.com/yuriivynar/property-workflows-dispatcher
- SHA репо працівника: e00d9a19c8418046dd18ba509a3e0f0a63d6420c
- Звіт: https://github.com/yuriivynar/property-workflows-dispatcher/blob/e00d9a19c8418046dd18ba509a3e0f0a63d6420c/docs/worker/README.md
- Картка ролі: «диспетчер вхідних звернень» — щоранку розбирає вхідну пошту агенції (листи орендарів, кошториси, інше) і пише зведення для чергового менеджера: термінове з телефоном і квартирою — першим; тригер — розклад (`run.ps1` / `run.sh`) або `/dispatcher data/<дата>`; канал — файл у `out/`
- Межі: https://github.com/yuriivynar/property-workflows-dispatcher/blob/e00d9a19c8418046dd18ba509a3e0f0a63d6420c/.claude/settings.json — вузький allow (скіл, перевіряльник, `node scripts/triage.mjs *`, запис лише в `out/**`), deny на дані, скрипти, власні інструкції, мережу й `.env*`; `--permission-mode dontAsk` і `--allowedTools` у `run.ps1` / `run.sh`
- Перевіряльник і людина в контурі: детермінований `scripts/triage.mjs check` (телефон з тексту, ознака небезпеки ↔ urgent, суми кошторису й попередження, примітка про ін'єкцію) і субагент `dispatcher-verifier` у чистому контексті (лише читання, сам перечитує документи); людині лишається створити запуск у Property workflows, подзвонити, погодити кошторис
- Журнал запуску без людини: https://github.com/yuriivynar/property-workflows-dispatcher/tree/e00d9a19c8418046dd18ba509a3e0f0a63d6420c/docs/worker/runs
- Golden data: set-1 (затоплення, посудомийка, кошторис) — очікувано ГОТОВО, отримано ГОТОВО, еталон 3/3; set-2 (ін'єкція, сума кошторису 130 ≠ 120, оголошення, без телефону) — очікувано ПОТРЕБУЄ УВАГИ, отримано ПОТРЕБУЄ УВАГИ, еталон 4/4; set-3 (порожня тека) — очікувано і отримано НЕ ПЕРЕВІРЕНО
- Вартість і ліміти: 5 запусків, num_turns 6–17, total_cost_usd 0.32–0.62 за запуск (≈ 2.43 разом; оцінка, не рахунок — у межах підписки); `--max-turns 40` не досягнуто. Зламалось: агент склеював команду скрипта з `echo` — `dontAsk` відхиляв (перший запуск — чесне НЕ ПЕРЕВІРЕНО); зведення перезаписало попереднє — додано час у назву; regex опалення не ловив «heating … has been off» — виправлено

### PM

—
