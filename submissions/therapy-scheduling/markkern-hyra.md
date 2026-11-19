# Здача WS10

## Дані

- Роль: dev
- Команда: therapy-scheduling
- GitHub-логін: markkern-hyra
- Ваше репо: https://github.com/markkern-hyra/therapy-scheduling
- SHA: 2c70f47a69b57b584dab3f38ccd7c0879c27106a
- Репо вимог PM: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling-spec
- Прод-URL: https://therapy-scheduling-theta.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://therapy-scheduling-theta.vercel.app/api/health — `"db":"ok"`, `"sha":"2c70f47a69b57b584dab3f38ccd7c0879c27106a"`
- Зелений прогін `smoke` на `main`: https://github.com/markkern-hyra/therapy-scheduling/actions/runs/44379614865
- `accounts.zip` на SHA: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, admin1@example.test; планувальник — scheduler1@example.test, scheduler2@example.test; терапевт — therapist1@example.test, therapist2@example.test
- Версія `next`: next@16.4.6

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-INTAKE-01, AC-INTAKE-02, AC-INTAKE-03, AC-INTAKE-04, AC-INTAKE-05, AC-INTAKE-06, AC-INTAKE-07, AC-INTAKE-08, AC-INTAKE-09
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/markkern-hyra/therapy-scheduling/pull/45
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/markkern-hyra/therapy-scheduling/pull/46 (`add-client-intake-draft` і `impl-client-intake-draft`)
- Після уточнень PM: «/requirements-sync 2026-11-18: Вимоги актуальні» — знімок #45 зроблено після уточнень PM (останню зміну HryhoriiHaponiukQuitCode/therapy-scheduling-spec#36 внесено 2026-11-13), тож окремого `clarify-<зріз4>` не потрібно
- Golden cases PM у `cases.json`: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/fixtures/golden/cases.json — GC-01…GC-10, ті самі ID і значення, що в таблиці PM
- ADR на залежності: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/docs/decisions/0010-ai-intake-draft-claude-api.md
- Питання PM: питань не було (кандидати й чому їх відкинуто — https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/docs/spec-reading.md, «Питання до PM — зріз 4»)

### AI-функція (трек B)

- Ланцюжок моделей: `claude-sonnet-5-5` через офіційний `@anthropic-ai/sdk` на командному ключі Claude API (рішення команди замість OpenRouter `:free`, ADR 0010); на відмову класифікатора безпеки — серверний fallback API (`fallbacks: "default"`); `maxRetries` 1, таймаут 25 с, без повторів у циклі; власний денний ліміт — 50 запитів у базі (`take_assistant_request`); PDF немає — лише вставлений текст
- Схема й стани: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/src/lib/ai/intake-schema.ts (zod) і https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/src/lib/ai/intake-draft.ts — стани `ok` / `needs_info` / `refused` / `unavailable`; кодом: дата народження не пізніша за сьогодні, вік < 18 → Child, email з «@», мова лише English/Spanish, «Missing: …» у порядку форми, вказівки помічнику в тексті → відмова до моделі
- Ключ лише на сервері: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/src/lib/ai/anthropic.ts (єдиний файл з `ANTHROPIC_API_KEY`, `import "server-only"`) і зелений `tests/ai-key.test.ts` — https://github.com/markkern-hyra/therapy-scheduling/actions/runs/44379540136
- Людина підтверджує перед записом: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/src/app/clients/new/actions.ts — `requestIntakeDraft`: `getClaims()` і роль до ліміту й моделі, нічого не пише; запис — лише «Create client» (`createClientCard` у `src/app/clients/actions.ts`: `getClaims()` і роль з `profiles`, повторна серверна валідація `validateCard` — правила картки в TS за ADR 0009, а відповідь моделі валідує zod; запис під сесією користувача, RLS)
- Збої: немає ключа, вичерпаний денний ліміт, 429, 529/5xx, таймаут, відповідь не за схемою → «The assistant is unavailable right now. Fill in the form manually.» (AC-INTAKE-08), введене у форму не змінюється, картку можна створити вручну; `stop_reason: refusal` → «This text can't be used to draft a client card. Paste the client's request or fill in the form manually.»
- Промпт з даними в межах: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/src/lib/ai/prompts/intake.ts — текст між `<intake_text>…</intake_text>`, теги з вхідного тексту вирізано, довжину обмежено, версія `intake-v2`
- PR задач «Реалізація»: https://github.com/markkern-hyra/therapy-scheduling/pull/48, https://github.com/markkern-hyra/therapy-scheduling/pull/49, https://github.com/markkern-hyra/therapy-scheduling/pull/50 — злиті, з відповіддю на кожну знахідку CodeRabbit

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/golden.test.ts — `it.each(…)("AC-INTAKE-NN: golden $id", …)`
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/markkern-hyra/therapy-scheduling/actions/runs/44379540136
- Записи живого прогону: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/fixtures/golden/recorded.json — записано `RECORD=1` (`modelId`, дата, `intake-v2`), 10 кейсів, не заглушки
- Тести збоїв та ін'єкції: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/ai/intake-call.test.ts, https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/ai/intake-draft.test.ts, https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/scheduling/intake-action.test.ts, https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/tests/db/assistant-quota.test.ts — AC-INTAKE-06, 07, 08, 09
- Звіт живого eval: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/evals/reports/2026-11-18T17-44-12-724Z.md — `claude-sonnet-5-5` на кожен кейс, 10/10, 2026-11-18, `intake-v2`, на `main` 8c6777d (код `src/lib/ai` той самий, що на SHA здачі)
- Пояснення FAIL і NOT RUN: FAIL немає, NOT RUN немає (так само в попередніх звітах `2026-11-18T14-53-12-514Z.md` на `intake-v1` і `2026-11-18T16-16-59-738Z.md` на `intake-v2`, з якого записано `recorded.json`)

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://therapy-scheduling-theta.vercel.app/api/health — SHA 2c70f47; `db-deploy` міграції `assistant_quota`: https://github.com/markkern-hyra/therapy-scheduling/actions/runs/44354507384 (повторний запуск після відновлення призупиненого проєкту Supabase)
- UAT на проді (≥ 2 AC): https://github.com/markkern-hyra/therapy-scheduling/tree/2c70f47a69b57b584dab3f38ccd7c0879c27106a/docs/qa/uat/2026-11-18 — PASS 5 з 5: AC-INTAKE-03 (людина підтверджує: без «Create client» картки немає), AC-INTAKE-06 (відмова), AC-INTAKE-07 (ін'єкція), AC-INTAKE-01, AC-INTAKE-09
- `docs/conformance.md`: https://github.com/markkern-hyra/therapy-scheduling/blob/2c70f47a69b57b584dab3f38ccd7c0879c27106a/docs/conformance.md — AC-INTAKE-01…09 «реалізовано»
- «eval готовий» у чаті команди: 19.11 (Київ), eval 18.11 (UTC) — звіт `evals/reports/2026-11-18T17-44-12-724Z.md`
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
