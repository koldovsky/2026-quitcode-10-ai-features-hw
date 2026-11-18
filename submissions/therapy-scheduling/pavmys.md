# Здача WS10

## Дані

- Роль: dev
- Команда: therapy-scheduling
- GitHub-логін: pavmys
- Ваше репо: https://github.com/pavmys/therapy-scheduling
- SHA: cae004c2a6b73d61e0e49f58407f085b2a96cdcd
- Репо вимог PM: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling-spec
- Прод-URL: https://therapy-scheduling-three.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://therapy-scheduling-three.vercel.app/api/health — `"db":"ok"`, `"sha":"cae004c2a6b73d61e0e49f58407f085b2a96cdcd"`
- Зелений прогін `smoke` на `main`: https://github.com/pavmys/therapy-scheduling/actions/runs/44322776246
- `accounts.zip` на SHA: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/accounts.zip
- Ролі тестових акаунтів: адміністратор — pm-admin@example.test; планувальник — pm-scheduler@example.test; терапевт — pm-therapist@example.test (сид: admin1@example.test, scheduler1@example.test, scheduler2@example.test, therapist1@example.test, therapist2@example.test)
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-INTAKE-01, AC-INTAKE-02, AC-INTAKE-03, AC-INTAKE-04, AC-INTAKE-05, AC-INTAKE-06, AC-INTAKE-07, AC-INTAKE-08, AC-INTAKE-09
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/pavmys/therapy-scheduling/pull/50
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/pavmys/therapy-scheduling/pull/51 (`add-client-intake-draft`), https://github.com/pavmys/therapy-scheduling/pull/52 (`impl-client-intake-draft`, design.md з розділом «AI»)
- Після уточнень PM: /requirements-sync 2026-11-16: Вимоги актуальні (вимогу HryhoriiHaponiukQuitCode/therapy-scheduling-spec#36 востаннє змінено 2026-11-13, знімок — 2026-11-16)
- Golden cases PM у `cases.json`: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/tests/fixtures/golden/cases.json — GC-01…10 з таблиці PM
- ADR на залежності: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/docs/decisions/0006-ai-feature-openrouter.md
- Питання PM: питань не було

### AI-функція (трек B)

- Ланцюжок моделей: `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3.5-super-vl:free`; PDF немає (лише вставлений текст)
- Схема й стани: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/lib/ai/schema.ts — модель повертає `ok / refused`; стани для людини (ready / incomplete / refused / unavailable) і правила коду — https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/lib/ai/intake.ts: дата народження — справжня й не пізніша за сьогодні (America/Los_Angeles), вік < 18 → Child, email у нижньому регістрі й з «@», мова лише English / Spanish, «Missing: …» у порядку форми
- Ключ лише на сервері: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/lib/ai/openrouter.ts (`import "server-only"`, `OPENROUTER_API_KEY` без `NEXT_PUBLIC_`), `tests/ai-key.test.ts` зелений — https://github.com/pavmys/therapy-scheduling/actions/runs/44049760246
- Людина підтверджує перед записом: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/app/clients/new/draft-actions.ts — `getCurrentUser()` (`getClaims()` + роль з `profiles`) до моделі, нічого не пише; запис — лише кнопкою «Create client card» через `createClientCard` (https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/app/clients/actions.ts): роль, повторна валідація полів, insert під сесією користувача (RLS)
- Збої: без ключа, на 429 (і 429 у тілі HTTP 200), таймаут (25 с), відповідь не за схемою — «The assistant is unavailable right now. Fill in the form manually.», поля форми не змінено, картку можна створити вручну; `maxRetries: 0`
- Промпт з даними в межах: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/lib/ai/prompts/draft.ts — `<document>…</document>`, теги з тексту вирізано (зокрема вкладені), ≤ 2000 символів, «сьогодні» поза межею, версія `intake-v1`
- PR задач «Реалізація»: https://github.com/pavmys/therapy-scheduling/pull/53, https://github.com/pavmys/therapy-scheduling/pull/54, https://github.com/pavmys/therapy-scheduling/pull/55

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/pavmys/therapy-scheduling/actions/runs/44049760246
- Записи живого прогону: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/tests/fixtures/golden/recorded.json — RECORD=1, усі 10 від `nvidia/nemotron-3.5-super-vl:free`, промпт `intake-v1`
- Тести збоїв та ін'єкції: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/tests/golden.test.ts (AC-INTAKE-07, AC-INTAKE-08), https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/tests/openrouter-key.test.ts (AC-INTAKE-08), https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/src/lib/ai/intake.test.ts
- Звіт живого eval: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/evals/reports/2026-11-16T15-12-53-287Z.md — 9/10 (90%), GC-09 ✅, GC-10 ✅, промпт `intake-v1`
- Пояснення FAIL і NOT RUN: GC-06 FAIL — відповідь моделі не за схемою (`invalid_output`, разовий збій моделі; код показав би стан AC-INTAKE-08), промпт і код не змінювали; повторний виклик GC-06 тим самим промптом — правильна відповідь, записана в `recorded.json`. NOT RUN немає

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://therapy-scheduling-three.vercel.app/api/health — SHA `cae004c2a6b73d61e0e49f58407f085b2a96cdcd`; міграцій для зрізу 4 немає
- UAT на проді (≥ 2 AC): https://github.com/pavmys/therapy-scheduling/tree/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/docs/qa/uat/2026-11-16 — AC-INTAKE-03 (людина створює картку, чернетка — ні) і AC-INTAKE-06 (відмова), PASS
- `docs/conformance.md`: https://github.com/pavmys/therapy-scheduling/blob/cae004c2a6b73d61e0e49f58407f085b2a96cdcd/docs/conformance.md — AC-INTAKE-01…09 «реалізовано»
- «eval готовий» у чаті команди: 16.11, eval 16.11 (UTC-доба 2026-11-16)
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
