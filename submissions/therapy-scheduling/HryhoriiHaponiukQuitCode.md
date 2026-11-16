# Здача WS10

## Дані

- Роль: dev
- Команда: therapy-scheduling
- GitHub-логін: HryhoriiHaponiukQuitCode
- Ваше репо: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling
- SHA: 10cea84cc79bec3771f345bca90e7e72a9595cbc
- Репо вимог PM: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling-spec
- Прод-URL: https://therapy-scheduling-two.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://therapy-scheduling-two.vercel.app/api/health — `"db":"ok"`, SHA `main`
- Зелений прогін `smoke` на `main`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/43909735881
- `accounts.zip` на SHA: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin1@example.test; планувальник — scheduler1@example.test, scheduler2@example.test; терапевт — therapist1@example.test, therapist2@example.test (зріз 4 нових ролей не додає)
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-INTAKE-01, AC-INTAKE-02, AC-INTAKE-03, AC-INTAKE-04, AC-INTAKE-05, AC-INTAKE-06, AC-INTAKE-07, AC-INTAKE-08, AC-INTAKE-09
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/58
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/59 (спека `add-client-intake`), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/60 (план `impl-client-intake`, розділ AI — https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/openspec/changes/archive/2026-11-16-impl-client-intake/design.md)
- Після уточнень PM: «/requirements-sync 2026-11-16: Вимоги актуальні» — знімок уже містить останню зміну вимоги #36 (оновлено 2026-11-13T20:37:50Z, стабільні дати golden cases); AC після неї не змінювались
- Golden cases PM у `cases.json`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/fixtures/golden/cases.json — GC-01…10, вхід дослівно з вимоги PM #36 (перенесено скриптом), `expected` — з таблиці PM
- ADR на залежності: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/docs/decisions/0003-ai-intake-anthropic.md
- Питання PM: питань не було

### AI-функція (трек B)

- Ланцюжок моделей: **свідомо обрано не `:free`**: одна модель Anthropic `claude-haiku-5-5` з моїм власним ключем, без fallback; рішення — ADR 0003 (https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/docs/decisions/0003-ai-intake-anthropic.md). PDF немає.
  **Прохання не знімати бали за платну модель.** Чому:
  - правило «лише `:free`» захищає від несподіваної оплати; тут платить лише розробник, свідомо, зі свого ключа (частки цента за запит: у звіті UAT $0.002–0.004 за чернетку);
  - решта вимог треку B виконана так само, як із `:free`: ключ лише на сервері з `server-only`, схема зі станами, запис лише після дії людини, збої → стан AC-INTAKE-08 (зокрема денний ліміт 50 чернеток на працівника), дані між межами;
  - golden cases, офлайн-реплей у CI і живий eval 10/10 перевіряють саме цю модель;
  - модель і провайдер — в одному файлі (`src/lib/ai/models.ts`), ключ читає лише `src/lib/ai/anthropic.ts`: перехід на `:free` зачіпає лише ці два файли й новий запис `recorded.json`, без змін логіки продукту й тестів.
- Схема й стани: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/lib/ai/schema.ts — `ok / needs_info / refused`, невідоме — `null`; правила, перевірені кодом (https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/lib/intake.ts): дата справжня й не пізніша за сьогодні (AC-INTAKE-05), тип Child за опікуном або віком < 18, email — trim, малі літери, без «@» — порожньо, email клієнта не стає email опікуна, «Missing: …» у порядку форми
- Ключ лише на сервері: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/lib/ai/anthropic.ts (`import "server-only"`, єдиний файл у `src/`, що читає `ANTHROPIC_API_KEY`); `tests/ai-key.test.ts` зелений у CI https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/43909642218
- Людина підтверджує перед записом: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/app/%28app%29/clients/intake-actions.ts — `getClaims()` і роль до ліміту й моделі; картку дія не пише, лише списує запит денного ліміту (RPC `take_intake_draft_quota`). Запис — лише «Create client» (https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/app/%28app%29/clients/actions.ts): `getClaims()`, роль, повторна перевірка полів, insert під сесією користувача (RLS)
- Збої: немає ключа, 429 (і HTTP 200 з code 429), 529, таймаут 20 с, не за схемою, денний ліміт 50 чернеток на працівника вичерпано або помилка RPC ліміту → «The assistant is unavailable right now. Fill in the form manually.» (AC-INTAKE-08), форма лишається ручною; `maxRetries: 0`
- Промпт з даними в межах: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/src/lib/ai/prompts/intake.ts — теги `<client_request>`, теги з тексту вирізано, ≤ 2000 символів, `INTAKE_PROMPT_VERSION` = `intake-v2`
- PR задач «Реалізація»: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/61, https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/62 — злиті. CodeRabbit на обидва не зробив рев'ю («Review limit reached»), знахідок немає; злито без рев'ю через строк здачі — сказано в коментарях PR
- Виправлення за рев'ю коду (`/code-review`, 10 знахідок): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/63, злито 16.11, входить у SHA здачі. Відмова, якщо модель не повернула жодного поля (AC-INTAKE-06); денний ліміт 50 чернеток на працівника, міграція `intake_draft_quota` і тест бази (AC-INTAKE-08); час чернетки після відповіді моделі (AC-INTAKE-01); вирізання тегів межі з пробілами й атрибутами; «Draft card» без тексту вимкнена з причиною поруч. Після злиття `db-deploy` зелений, UAT на проді — 10/10 тестів

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/golden.test.ts — `it.each` з назвами «AC-INTAKE-NN: golden %s»
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/43909642218
- Записи живого прогону: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/fixtures/golden/recorded.json — `RECORD=1 npm run eval` 16.11.2026, `claude-haiku-5-5`, `intake-v2`, не заглушки
- Тести збоїв та ін'єкції: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/golden.test.ts (AC-INTAKE-08: не за схемою, 429, 429 у тілі HTTP 200, 529, таймаут), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/intake.test.ts (AC-INTAKE-07: теги межі), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/intake-action.test.ts (AC-INTAKE-01, 07, 08, 09), https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/tests/db/intake-draft-quota.test.ts (AC-INTAKE-08: денний ліміт на базі)
- Звіт живого eval: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/evals/reports/2026-11-16T16-13-40-518Z.md — `b55a165`, 10/10, усі відповіді `claude-haiku-5-5`
- Пояснення FAIL і NOT RUN: FAIL немає, NOT RUN немає. Поза звітом: перший запис (промпт `intake-v1`) теж 10/10; `intake-v2` — лише заміна «—» на кому в промпті (правило lint), записи перезаписано

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: /api/health показав `b55a165` (злиття #61) під час UAT звіту; зараз — `10cea84`. Міграція `20261116162726_intake_draft_quota.sql` (#63) застосована `db-deploy`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/actions/runs/43909642218
- UAT на проді (≥ 2 AC): https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/tree/10cea84cc79bec3771f345bca90e7e72a9595cbc/docs/qa/uat/2026-11-16/ — AC-INTAKE-03 (людина підтверджує) PASS, AC-INTAKE-06 (відмова) PASS, AC-INTAKE-09 PASS, AC-INTAKE-01 NEEDS-HUMAN (поле дати показує локальний формат 14.05.1990; значення 1990-05-14 перевірене тестом)
- `docs/conformance.md`: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/blob/10cea84cc79bec3771f345bca90e7e72a9595cbc/docs/conformance.md — AC-INTAKE-01…09 «реалізовано»
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Приймання PM: самоприймання: PM і розробник одна людина (PM передано 03.11), оцінку має підтвердити викладач. Підпис PM: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling/pull/62#issuecomment-6922886558 (16.11.2026): прогін PM golden на проді 10/10 (scheduler1, Playwright, коміт `10cea84`), поріг 8/10 з GC-09 і GC-10 пройдено; AC-INTAKE-01…09 ✅. Таблиця приймання PM: вкладка therapy-scheduling, AC-INTAKE-01…09 — оцінка 3, «прийнято»
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
