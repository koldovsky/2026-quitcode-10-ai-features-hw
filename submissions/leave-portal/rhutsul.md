# Здача WS10

## Дані

- Роль: dev
- Команда: leave-portal
- GitHub-логін: rhutsul
- Ваше репо: https://github.com/rhutsul/leave-portal
- SHA: 2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128
- Репо вимог PM: https://github.com/mkozlovskyi-ops/course-staff-management-spec
- Прод-URL: https://leave-portal-olive.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://leave-portal-olive.vercel.app/api/health — `{"ok":true,"sha":"2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128","env":"production","db":"ok"}`
- Зелений прогін `smoke` на `main`: https://github.com/rhutsul/leave-portal/actions/runs/43844252081
- `accounts.zip` на SHA: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/accounts.zip
- Ролі тестових акаунтів: працівник — teacher1@example.test, teacher2@example.test; менеджер — manager1@example.test,
  manager2@example.test; адміністратор (зріз 3 шкільний календар і зріз 4 помічник календаря) — admin@example.test
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-ASSIST-01, AC-ASSIST-02, AC-ASSIST-03, AC-ASSIST-04, AC-ASSIST-05, AC-ASSIST-06, AC-ASSIST-07,
  AC-ASSIST-08, AC-ASSIST-09, AC-ASSIST-10, AC-ASSIST-11
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/rhutsul/leave-portal/pull/77
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/rhutsul/leave-portal/pull/78
  (спека `add-calendar-assistant`), https://github.com/rhutsul/leave-portal/pull/79 (план `impl-calendar-assistant`,
  розділ «AI»: моделі, схема, стани, межа `<document>`, golden)
- Після уточнень PM: уточнень ще не було — питання Q12 без відповіді PM; вимоги — знімок 2026-11-13 (PR #77), до
  відповіді діє власне припущення, записане в Open questions спеки
- Golden cases PM у `cases.json`: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/tests/fixtures/golden/cases.json — GC-01…GC-10, ті самі ID, що в PM
- ADR на залежності: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/docs/decisions/0009-ai-feature-openrouter.md
- Питання PM: https://github.com/mkozlovskyi-ops/course-staff-management-spec/issues/27

### AI-функція (трек B)

- Ланцюжок моделей: `nvidia/nemotron-3.5-super-vl:free` → `google/gemma-4-31b-it:free` →
  `google/gemma-4-26b-a4b-it:free` (OpenRouter); PDF немає — лише вставлений текст до 2000 знаків
- Схема й стани: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/lib/ai/schema.ts — стани `ok` / `needs_info` / `refused`; правила, перевірені кодом (https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/lib/ai/suggestions.ts, `checkSuggestions`): назва, кінець не раніше за початок, неповний день — одна дата з часом закриття, цілі дні — без часу, 1–50 пропозицій; `refused` і `needs_info` — без пропозицій (що б не прислала модель); інакше «unavailable»
- Ключ лише на сервері: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/lib/ai/openrouter.ts (`server-only`) і зелений `tests/ai-key.test.ts` (job `app`): https://github.com/rhutsul/leave-portal/actions/runs/43844184786
- Людина підтверджує перед записом: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/app/(app)/calendar/assistant/actions.ts — `requestSuggestions` нічого не пише; `saveSuggestions` лише після «Save closures», повторна валідація zod, по одному `rpc("add_school_closure")` на пропозицію; `getClaims()` і роль з `profiles` до моделі й до запису — https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/app/(app)/calendar/admin-session.ts
- Збої: без ключа, на 429 (і 429 у тілі HTTP 200), на таймаут 30 с і на відповідь не за схемою — жодної пропозиції і
  «The calendar assistant is unavailable right now. Try again later or add closures manually.» (AC-ASSIST-09), без
  повтору; додавання вручну працює як у вимозі 04
- Промпт з даними в межах: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/lib/ai/prompts/draft.ts — `<document>…</document>`, кутові дужки в тексті кодуються, версія `calendar-v2`
- PR задач «Реалізація»: https://github.com/rhutsul/leave-portal/pull/80, https://github.com/rhutsul/leave-portal/pull/84,
  https://github.com/rhutsul/leave-portal/pull/86, https://github.com/rhutsul/leave-portal/pull/87,
  https://github.com/rhutsul/leave-portal/pull/88 — злиті, з відповіддю на кожну знахідку CodeRabbit

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/rhutsul/leave-portal/actions/runs/43844184786 (jobs `app` і `conformance`)
- Записи живого прогону: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/tests/fixtures/golden/recorded.json — `RECORD=1`, 16.11.2026, промпт `calendar-v2`, modelId на кожен кейс
- Тести збоїв та ін'єкції: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/tests/calendar-assistant-actions.test.ts (AC-ASSIST-09, -10, -11), https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/src/lib/ai/suggestions.test.ts (AC-ASSIST-07, -09), golden GC-09 і GC-10 у `tests/golden.test.ts`
- Звіт живого eval: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/evals/reports/2026-11-16T08-10-04-945Z.md — 10/10, усі кейси на Nemotron, 16.11.2026, `calendar-v2`; усі прогони й порівняння v1 → v2 — https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/evals/reports/README.md
- Пояснення FAIL і NOT RUN: у звіті, що здаю (16.11, `calendar-v2`), FAIL немає. Ранні прогони `calendar-v1` 15.11:
  - прогін 1, GC-06…10 NOT RUN — суддя отримав 429 від постачальника; додано запасні моделі судді;
  - прогін 2, GC-06 FAIL — хибний FAIL судді, поля збіглися; уточнено інструкцію судді;
  - прогін 3, GC-10 FAIL — суддя не отримав повідомлення через тег `<summary>`; виправлено на `<message>`;
  - прогін 4 — 10/10 (PR https://github.com/rhutsul/leave-portal/pull/84).

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://leave-portal-olive.vercel.app/api/health — SHA злиття 2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128, `db: ok`; міграцій у зрізі 4 немає
- UAT на проді (≥ 2 AC): https://github.com/rhutsul/leave-portal/tree/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/docs/qa/uat/2026-11-16 — PASS 4/4: AC-ASSIST-03 (людина виправляє й підтверджує, жива модель), AC-ASSIST-06 (відмова, жива модель), AC-ASSIST-10 (стан: довжина), AC-ASSIST-11 (доступ); відео й proof pack — https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/docs/qa/proof-pack-ws10.md
- `docs/conformance.md`: https://github.com/rhutsul/leave-portal/blob/2de3a3e9b3d198c4fa6cd6963e12c3e9bf139128/docs/conformance.md
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає (помічник — роль адміністратора, admin@example.test)

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code
- Репо працівника: https://github.com/rhutsul/pr-checklist-worker
- SHA репо працівника: 082d8adf24e7683be12b0faae8db44704932b2d9
- Звіт: https://github.com/rhutsul/pr-checklist-worker/blob/082d8adf24e7683be12b0faae8db44704932b2d9/docs/worker/README.md
- Картка ролі: рецензент PR за чеклістом процесу курсу (тип PR і межі змін, тест з AC ID і рядок матриці, «Тоді»
  дослівно, жодних секретів і несинтетичних email) — для розробника, який сам веде репо, чи тімліда; тригер — `/pr-review
  data/<pr>` або `run.sh` / `run.ps1` без людини; канал — `out/<pr>.json` і `out/<pr>.md`
- Межі: https://github.com/rhutsul/pr-checklist-worker/blob/082d8adf24e7683be12b0faae8db44704932b2d9/.claude/settings.json + `--permission-mode dontAsk` і `--allowedTools` у `run.sh` / `run.ps1`; проба меж — 8 відмов (читання `golden/`, `.env`, `tests/`, запис у `data/`, `git push`, `gh`, `curl`)
- Перевіряльник і людина в контурі: субагент `pr-review-verifier` (лише читання, у чистому контексті) звіряє кожну
  знахідку з файлом на рядку й незалежно запускає скрипт; контроль — дві вигадані знахідки він відкинув; потім звіт
  перевіряє код `validate-report.mjs`. Злиття, коментар у PR і відповідь автору лишаються людині: працівник нічого не
  публікує
- Журнал запуску без людини: https://github.com/rhutsul/pr-checklist-worker/tree/082d8adf24e7683be12b0faae8db44704932b2d9/docs/worker/runs
- Golden data: `data/pr-101` чистий → «можна зливати» ✓; `pr-102` зміна `requirements/` + ін'єкція → «треба
  виправити» `SCOPE` ✓, ін'єкцію названо; `pr-103` AC без тесту і переказане «Тоді» → «треба виправити», обидві ✓;
  `pr-104` токен і несинтетичний email → «треба виправити», обидві ✓ (`npm run golden` 4/4)
- Вартість і ліміти: 4 PR — `num_turns` 45, `total_cost_usd` ≈ 1.80 (оцінка, не рахунок), ≈ 4 хв; разом за сесію 9
  запусків ≈ 3.3; особиста підписка Claude, ліміту не досягли. Зламалось: перший запуск — `allow` з `settings.json`
  ігнорувався в недовіреній теці, а склеєна команда не збіглася з правилом → «НЕ ПЕРЕВІРЕНО»; другий — те саме в
  перевіряльника; виправлено інструкціями, третій — 0 відмов. Змінив би: хук `PreToolUse` замість інструкції про
  команду, вхід `diff.patch`; `run.ps1` не запускався — лише `run.sh`
