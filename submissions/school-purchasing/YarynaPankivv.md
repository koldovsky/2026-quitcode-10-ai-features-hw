# Здача WS10

## Дані

- Роль: dev
- Команда: school-purchasing
- GitHub-логін: YarynaPankivv
- Ваше репо: https://github.com/YarynaPankivv/school-purchasing
- SHA: d43406ebb084636963b1770a7d707729958d3e6e
- Репо вимог PM: https://github.com/ValiaBihun/2026-quitcode-dream-team
- Прод-URL: https://school-purchasing.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://school-purchasing.vercel.app/api/health — на момент здачі відповідь `{"ok":true,"sha":"d43406ebb084636963b1770a7d707729958d3e6e","env":"production","db":"ok","reason":""}`
- Зелений прогін `smoke` на `main`: https://github.com/YarynaPankivv/school-purchasing/actions/runs/43937681236
- `accounts.zip` на SHA: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test, pm-admin@example.test; працівник (requester) — member1@example.test, member2@example.test, pm-requester@example.test; працівник без заявок — pm-empty@example.test; схвалювач відділу — approver@example.test, pm-approver@example.test. Паролі — лише в accounts.zip
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-AI-01, AC-AI-02, AC-AI-03, AC-AI-04, AC-AI-05, AC-AI-06
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/YarynaPankivv/school-purchasing/pull/84
- Спека `add-ai-helper` і план `impl-ai-helper` з розділом «AI» — PR «Специфікація»: https://github.com/YarynaPankivv/school-purchasing/pull/85, https://github.com/YarynaPankivv/school-purchasing/pull/86
- Після уточнень PM: PR «Оновлення вимог» https://github.com/YarynaPankivv/school-purchasing/pull/88 і clarify-ai-helper https://github.com/YarynaPankivv/school-purchasing/pull/89; вимоги PM від 16.11 (англійські описи AC-AI-01…06) — https://github.com/YarynaPankivv/school-purchasing/pull/92 і clarify-ai-english-input https://github.com/YarynaPankivv/school-purchasing/pull/93
- Golden cases PM у `cases.json`: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/fixtures/golden/cases.json — ті самі ID кейсів, що в PM (№ 1, 5, 6, 7, 8, 9, 11, 12, 13, 14; відкладені PM № 2, 3, 4, 10 не використано); тимчасових кейсів немає
- ADR на залежності: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/docs/decisions/0006-ai-helper-openrouter.md (також https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/docs/decisions/0007-ai-helper-english-texts.md і https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/docs/decisions/0008-ai-helper-english-input-and-output.md)
- Питання PM: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/81 (денний ліміт — ліміт постачальника моделі), https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/82 (пропозиція заповнює порожній рядок, інакше додає новий) — мої, обидва закриті відповіддю PM; https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/77, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/79, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/80 — подав інший розробник команди, я їх не дублювала, спека й код спираються на відповіді PM

### AI-функція (трек B)

- Ланцюжок моделей: google/gemma-4-31b-it:free → google/gemma-4-26b-a4b-it:free → nvidia/nemotron-3.5-super-vl:free (OpenRouter пробує наступну при помилці чи ліміті); PDF немає
- Схема й стани: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/src/lib/ai/schema.ts — стани ok / needs_info / refused; межі (кількість — ціле від 1, ціна — число від 0) перевіряє код, а не лише промпт
- Ключ лише на сервері: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/src/lib/ai/openrouter.ts (починається з `import "server-only"`) і зелений https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/ai-key.test.ts у прогоні CI https://github.com/YarynaPankivv/school-purchasing/actions/runs/43937612929. Значення ключа ніде не пишу (лише назва `OPENROUTER_API_KEY`)
- Людина підтверджує перед записом: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/src/app/%28app%29/requests/%5Bid%5D/ai-actions.ts — `suggestLine` нічого не пише в БД, `getClaims()` і право автора редагувати рядки перевіряються до виклику моделі; `addLineWithValues` додає рядок лише після дії людини, з повторною валідацією zod і тими ж перевірками
- Збої: без ключа, таймаут 15 с, збій провайдера й відповідь не за схемою — «Could not get a suggestion. Fill in the lines manually»; 429 і 429 у тілі HTTP 200, а також 402 — «The assistant is unavailable today. Fill in the lines manually»; не про закупівлі — «I can only help with purchases»; вказівка в описі — «I don't follow instructions from the description. Describe the purchase»
- Промпт з даними в межах: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/src/lib/ai/prompts/draft.ts — вхід між тегами `<document>` (власні теги з вводу вирізаються), версія промпту `suggest-v2`
- PR задач «Реалізація»: https://github.com/YarynaPankivv/school-purchasing/pull/87, https://github.com/YarynaPankivv/school-purchasing/pull/90, https://github.com/YarynaPankivv/school-purchasing/pull/94, https://github.com/YarynaPankivv/school-purchasing/pull/95 — злиті, на кожну знахідку CodeRabbit є виправлення або відповідь з аргументом

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/golden.test.ts — назви починаються з AC ID (AC-AI-01, 02, 04, 05, 06)
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/YarynaPankivv/school-purchasing/actions/runs/43937612929
- Записи живого прогону: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/fixtures/golden/recorded.json — усі 10 справжні відповіді моделей, промпт `suggest-v2`, записані 16.11 (`RECORD=1`)
- Тести збоїв та ін'єкції: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/golden.test.ts (AC-AI-04 таймаут і не за схемою, AC-AI-05 ліміт 429 / 429 у тілі / 402, AC-AI-06 ін'єкція) і https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/tests/pur/ai-actions.test.ts (AC-AI-04 немає ключа, AC-AI-05 ліміт, AC-AI-06 вказівка в описі й чужа заявка)
- Звіт живого eval: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/evals/reports/2026-11-16T15-48-40-705Z.md — 16.11, промпт `suggest-v2`, відповіла nvidia/nemotron-3.5-super-vl:free (основна Gemma не відповіла), 9 з 9 відповідей пройшли, поріг PM (не менше 8 з 10, обов'язково № 1, 8, 11) виконано. Історія (перший прогін `suggest-v1` дав 7 з 10 і привів до `suggest-v2`) — https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/evals/reports/README.md
- Пояснення FAIL і NOT RUN: GC-14 NOT RUN — 429 від постачальника на останньому запиті прогону; його дописано окремим прогоном `ONLY=14` (пройшов; звіт підмножини за `.gitignore` лишився локально, у git його немає; перша спроба дала FAIL — відповідь моделі не за схемою `invalid_output`, недетермінованість безкоштовної моделі). Інших FAIL і NOT RUN немає. Попередній прогін `suggest-v1` (7 з 10) — FAIL у кейсах, де модель повертала назву й мету українською, промпт переписано (`suggest-v2`)

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://school-purchasing.vercel.app/api/health показує SHA останнього злиття (d43406ebb084636963b1770a7d707729958d3e6e, `"db":"ok"`); міграцій у зрізі 4 немає, тож `db-deploy` не потрібен
- UAT на проді (≥ 2 AC): https://github.com/YarynaPankivv/school-purchasing/tree/d43406ebb084636963b1770a7d707729958d3e6e/docs/qa/uat/2026-11-16 — AC-AI-01 («людина підтверджує»: чернетка не подана) на проді, коміт 1b0d6f2, PASS; https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/docs/qa/uat/2026-11-16-58fe065/report.md (звіт за формою «report.md», кадри поруч) — AC-AI-01, AC-AI-02 (відмова), AC-AI-06 (ін'єкція) на проді, коміт 58fe065, усі PASS. Повтор AC-AI-02 й AC-AI-06 на новішому коміті не вдалося: добовий ліміт безплатних запитів OpenRouter (50 на день) вичерпано, повтор — після скидання ліміту
- `docs/conformance.md`: https://github.com/YarynaPankivv/school-purchasing/blob/d43406ebb084636963b1770a7d707729958d3e6e/docs/conformance.md — усі шість AC зрізу 4 зі статусом «реалізовано»
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило (issues «Відхилення від вимог» у репо немає)
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code
- Репо працівника: https://github.com/YarynaPankivv/deviation-triage-worker
- SHA репо працівника: d7203d668e9f27813f29b214afb83f1212e1d5e6
- Звіт: https://github.com/YarynaPankivv/deviation-triage-worker/blob/d7203d668e9f27813f29b214afb83f1212e1d5e6/docs/worker/README.md
- Картка ролі: «Тріаж відхилень від вимог» — для розробника команди; за issue PM, текстом AC і журналом спостереження ставить вердикт DEVIATION / NOT_A_DEVIATION / UNCLEAR і пише чернетку відповіді PM; тригер — чат (`/triage`) або `claude -p` через `run.sh` / `run.ps1`; результат — файл у `out/`; повністю — у звіті
- Межі: https://github.com/YarynaPankivv/deviation-triage-worker/blob/d7203d668e9f27813f29b214afb83f1212e1d5e6/.claude/settings.json — вузький allow (лише `node scripts/triage.mjs`, читання, запис в `out/`) і deny (`.env*`, `tests/`, мережа, `gh`, `git push`, видалення) разом з `--permission-mode dontAsk` у `run.sh` і `run.ps1`
- Перевіряльник і людина в контурі: код (`scripts/triage.mjs`: `extract` витягує AC і шукає ін'єкції, `check-reply` перевіряє формат і дослівність цитат; 10 тестів) і субагент `triage-verifier` у чистому контексті, який ставить власний вердикт, розбіжність означає «НЕ ПЕРЕВІРЕНО». Незворотні кроки лишаються людині: надіслати відповідь PM, створити питання в репо PM, виправити код, закрити issue
- Журнал запуску без людини: https://github.com/YarynaPankivv/deviation-triage-worker/tree/d7203d668e9f27813f29b214afb83f1212e1d5e6/docs/worker/runs (успішні запуски `claude -p` на трьох кейсах і невдалі — у `runs/failed/`)
- Golden data: три синтетичні набори з відомим вердиктом — `case-01` (чисте відхилення) → DEVIATION, `case-02` (поведінка дослівно за AC) → NOT_A_DEVIATION, `case-03` (AC немає у вимогах, в issue ін'єкція) → UNCLEAR; працівник дав очікуваний вердикт на всіх трьох, ін'єкцію назвав і не виконав, перевіряльник збігся
- Вартість і ліміти: `num_turns` 8, 9 і 3; оцінка `total_cost_usd` 0.1935, 0.1848 і 0.2055 (разом близько 0.58, це оцінка, а не рахунок); власна підписка Claude, ліміту не досягнуто, ключі OpenRouter і платний Anthropic не використано. Зламалось: тека без довіри Claude Code (дозволи ігноруються), регістр шляху на Windows, складена команда з `;` не збіглася з правилом allow — усе описано в звіті й лишено в `runs/failed/`; наступний крок — більше кейсів і кілька запусків на кейс для частки збігів

### PM

—
