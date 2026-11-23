# Здача WS10

## Дані

- Роль: dev
- Команда: school-purchasing
- GitHub-логін: kdeineko-tech
- Ваше репо: https://github.com/kdeineko-tech/school-purchasing
- SHA: 9dee66cdad5236b97b11e76628f72308a6cae23e
- Репо вимог PM: https://github.com/ValiaBihun/2026-quitcode-dream-team
- Прод-URL: https://school-purchasing-lemon.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://school-purchasing-lemon.vercel.app/api/health — `sha` 9dee66c, `db` ok
- Зелений прогін `smoke` на `main`: https://github.com/kdeineko-tech/school-purchasing/actions/runs/45166062084 (SHA здачі)
- `accounts.zip` на SHA: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/accounts.zip
- Ролі тестових акаунтів: працівник (requester) — pm-requester@example.test, member1@example.test, member2@example.test; схвалювач — pm-approver@example.test (права схвалення видає адміністратор за відділом); адміністратор — pm-admin@example.test, admin@example.test
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-AI-01, AC-AI-02, AC-AI-03, AC-AI-04, AC-AI-05, AC-AI-06
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/kdeineko-tech/school-purchasing/pull/76
- Спека `add-ai-line-suggestions` і план `impl-ai-line-suggestions` з розділом «AI» — PR «Специфікація»: спека `add-ai-line-suggestions` — https://github.com/kdeineko-tech/school-purchasing/pull/77; план `impl-ai-line-suggestions` з розділом «AI» — https://github.com/kdeineko-tech/school-purchasing/pull/78; уточнення після PM `update-ai-line-suggestions-english` — https://github.com/kdeineko-tech/school-purchasing/pull/82
- Після уточнень PM (AC і golden cases англійською, рішення PM від 16.11): `/requirements-sync` 2026-11-23 — https://github.com/kdeineko-tech/school-purchasing/pull/81; зміна специфікації MODIFIED — https://github.com/kdeineko-tech/school-purchasing/pull/82; реалізація — https://github.com/kdeineko-tech/school-purchasing/pull/83. Знімок 2026-11-23 збігається з https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/71 на момент здачі
- Golden cases PM у `cases.json`: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/tests/fixtures/golden/cases.json — кейси PM з https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/70 (англійська версія), ті самі ID (GC-01, 05, 06, 07, 08, 09, 11, 12, 13, 14)
- ADR на залежності: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/docs/decisions/0006-ai-line-suggestions-openrouter.md
- Питання PM: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/77, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/79, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/80, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/81, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/82

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free; PDF немає
- Схема й стани: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/src/lib/ai/schema.ts — стани ok / refused / injection (AC-AI-01, 02, 06); кодом перевірено: кількість — ціле число від 1, ціна — число від 0 (інакше повідомлення, а не рядок), назва й мета ≤ 200 символів
- Ключ лише на сервері: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/src/lib/ai/openrouter.ts і зелений `tests/ai-key.test.ts` у CI на SHA здачі: https://github.com/kdeineko-tech/school-purchasing/actions/runs/45165996397
- Людина підтверджує перед записом: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/src/app/purchases/new/suggest-action.ts — AI лише заповнює рядок форми й нічого не пише в базу (getViewer() до моделі); запис — лише кнопкою «Submit» людини: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/src/app/purchases/actions.ts — getViewer(), повторна перевірка validateSubmission, rpc submit_purchase з RLS
- Збої: немає ключа, таймаут 15 с, відповідь не за схемою — «Could not get a suggestion. Fill in the lines manually» (AC-AI-04); 429 і 429 у тілі HTTP 200 — «The assistant is unavailable today. Fill in the lines manually» (AC-AI-05); рядків у формі не додано
- Промпт з даними в межах: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/src/lib/ai/prompts/suggest.ts — опис у `<description>`, теги з тексту вирізано; опис довший за 1000 символів відхилено до виклику моделі; версія suggest-v3
- PR задач «Реалізація»: https://github.com/kdeineko-tech/school-purchasing/pull/79, https://github.com/kdeineko-tech/school-purchasing/pull/83; UAT — https://github.com/kdeineko-tech/school-purchasing/pull/80, https://github.com/kdeineko-tech/school-purchasing/pull/84

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/kdeineko-tech/school-purchasing/actions/runs/45165996397
- Записи живого прогону: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/tests/fixtures/golden/recorded.json — RECORD=1, suggest-v3, 22.11.2026
- Тести збоїв та ін'єкції: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/tests/golden.test.ts (AC-AI-04, AC-AI-05, AC-AI-06), https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/tests/purchases/ai-suggest.test.tsx (зокрема ін'єкція після 1000-го символу)
- Звіт живого eval (поточний, suggest-v3, англійські кейси): https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/evals/reports/2026-11-22T22-33-43-522Z.md (8/8) і дозапуск https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/evals/reports/2026-11-22T22-36-41-333Z.md (2/2) — разом 10/10. Попередні прогони українських кейсів: suggest-v1 — 2026-11-22T15-45-26-494Z.md (8/10), suggest-v2 — 2026-11-22T15-48-57-500Z.md + 2026-11-22T15-51-17-385Z.md (10/10)
- Пояснення FAIL і NOT RUN:
  - GC-12 FAIL (v1) — модель відмовила текстом, не за схемою; правило «завжди один JSON» у промпті, suggest-v2, https://github.com/kdeineko-tech/school-purchasing/pull/79
  - GC-14 FAIL (v1) — «для дошки» потрапило в назву, мета порожня; правило «for … — це мета», suggest-v2, той самий PR
  - GC-12, 13, 14 NOT RUN (v2, 15-48-57) — хвилинний ліміт 429; дозапуск 15-51-17: 3/3
  - GC-13, 14 NOT RUN (v3, 22-33-43) — хвилинний ліміт 429; дозапуск 22-36-41: 2/2

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://school-purchasing-lemon.vercel.app/api/health — `sha` 9dee66c (англійська версія — злиття #83 `07c56e6`); міграцій немає
- UAT на проді (≥ 2 AC): https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/docs/qa/uat/2026-11-23-en/report.md — AC-AI-01 (людина підтверджує: рядок «A4 paper» / «For printing» / 3 / 20.00, закупівлю без «Submit» не подано) і AC-AI-02 (відмова: «I can only help with purchases»): PASS 2/2, прогін 23.11.2026 на `/api/health` 07c56e6
- `docs/conformance.md`: https://github.com/kdeineko-tech/school-purchasing/blob/9dee66cdad5236b97b11e76628f72308a6cae23e/docs/conformance.md — AC-AI-01…06 «реалізовано»
- «eval готовий» у чаті команди: 23.11, eval 22.11 (живий прогін suggest-v3 — 22.11 UTC)
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
