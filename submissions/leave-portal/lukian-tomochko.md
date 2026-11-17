# Здача WS10

## Дані

- Роль: dev
- Команда: leave-portal
- GitHub-логін: lukian-tomochko
- Ваше репо: https://github.com/lukian-tomochko/leave-portal
- SHA: 0b018489f537e9368e263c2d77e5d9bf0198fd95
- Репо вимог PM: https://github.com/mkozlovskyi-ops/course-staff-management-spec
- Прод-URL: https://leave-portal-blush.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://leave-portal-blush.vercel.app/api/health — `{"ok":true,"sha":"0b018489f537e9368e263c2d77e5d9bf0198fd95","env":"production","db":"ok","reason":""}` (sha збігається з `main` на момент здачі)
- Зелений прогін `smoke` на `main`: https://github.com/lukian-tomochko/leave-portal/actions/runs/43858332795
- `accounts.zip` на SHA: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/accounts.zip
- Ролі тестових акаунтів: працівник — teacher1@example.test, teacher2@example.test; менеджер — manager1@example.test, manager2@example.test; адміністратор — admin@example.test. Паролі — лише в accounts.zip
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-ASSIST-01, AC-ASSIST-02, AC-ASSIST-03, AC-ASSIST-04, AC-ASSIST-05, AC-ASSIST-06, AC-ASSIST-07, AC-ASSIST-08, AC-ASSIST-09, AC-ASSIST-10, AC-ASSIST-11 (та уточнення AC-CAL-16…20 вимоги 04)
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/lukian-tomochko/leave-portal/pull/71
- Спека `add-calendar-assistant` і план з розділом «AI» — PR «Специфікація»: https://github.com/lukian-tomochko/leave-portal/pull/72
- Після уточнень PM: `/requirements-sync` 2026-11-16: Вимоги актуальні (останній коміт PM у репо вимог — 13.11.2026, знімок 15.11 його містить), clarify-зміна не потрібна
- Golden cases PM у `cases.json`: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/tests/fixtures/golden/cases.json — GC-01…GC-10 з вимоги PM, «сьогодні» 2026-11-13; не тимчасові
- ADR на залежності: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/docs/decisions/0010-ai-feature-openrouter.md
- Питання PM: власних питань до PM не було; питання іншого розробника (AC-CAL-20 і змішаний текст AC-ASSIST-05) відкриті в репо PM, до відповіді діють робочі рішення з `design.md` (D6, D11): https://github.com/mkozlovskyi-ops/course-staff-management-spec/issues/27, https://github.com/mkozlovskyi-ops/course-staff-management-spec/issues/28

### AI-функція (трек B)

- Ланцюжок моделей: `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3.5-super-vl:free`; PDF немає (лише вставлений текст до 2000 символів)
- Схема й стани: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/lib/ai/schema.ts — стани ok / needs_info / refused, «невідоме» = null; правила, перевірені кодом після моделі (існування дат, кінець не раніше початку, крок 5 хвилин, назва 1–100, узгодженість стану й закриттів): https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/lib/calendar-assistant/rules.ts
- Ключ лише на сервері: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/lib/ai/openrouter.ts (єдиний файл із `server-only`, без ключа повертає `null`) і зелений `tests/ai-key.test.ts` у прогоні CI https://github.com/lukian-tomochko/leave-portal/actions/runs/43858262173. Значення ключа не пишемо
- Людина підтверджує перед записом: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/app/calendar/assistant/actions.ts — `requestSuggestions` нічого не пише, `saveSuggestions` перевіряє `getClaims()` і роль до запису, повторно валідує кожен рядок (zod + правила вимоги 04) і зберігає наявною `add_school_closure` під сесією адміністратора
- Збої: без ключа, 429 (також у тілі HTTP 200), таймаут 30 с, відповідь не за схемою чи правилами → «The calendar assistant is unavailable right now. Try again later or add closures manually.»; ручне додавання закриття працює (`/calendar/manage`); текст понад 2000 символів → «The text can be at most 2000 characters» без виклику моделі; не-адмін → «Only an administrator can change the school calendar» без виклику моделі
- Промпт з даними в межах: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/lib/ai/prompts/calendar.ts — `<document>…</document>`, теги з вхідного тексту вирізано, версія `calendar-v1`
- PR задач «Реалізація»: https://github.com/lukian-tomochko/leave-portal/pull/74, https://github.com/lukian-tomochko/leave-portal/pull/75, https://github.com/lukian-tomochko/leave-portal/pull/76. Відповіді на знахідки CodeRabbit: на #72 було 7 знахідок, на кожну відповідь у треді або виправлення; на #74 CodeRabbit відповів «Review rate limited» (ліміт безкоштовних перевірок), тож знахідок немає, але й рев'ю не було; на #75 було 2 знахідки Minor до UAT-сценарію AC-ASSIST-08, відповіді в обох тредах, виправлення у #76

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/tests/golden.test.ts — назви починаються з AC ID (`AC-ASSIST-01/05/06/07: golden $id`)
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/lukian-tomochko/leave-portal/actions/runs/43858262173
- Записи живого прогону: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/tests/fixtures/golden/recorded.json — записано `RECORD=1` (modelId, дата, версія промпту `calendar-v1`), заглушок немає (тест це перевіряє)
- Тести збоїв та ін'єкції: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/lib/calendar-assistant/suggest.test.ts (AC-ASSIST-07, 09, 10), https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/src/app/calendar/assistant/actions.test.ts (AC-ASSIST-01, 02, 03, 04, 10, 11)
- Звіт живого eval: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/evals/reports/2026-11-16T08-28-16-158Z.md (прогін 1) і https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/evals/reports/2026-11-16T08-30-48-953Z.md (повтор для GC-02, GC-09, GC-10); підсумок: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/evals/reports/SUMMARY-2026-11-16.md — модель `nvidia/nemotron-3.5-super-vl:free`, промпт `calendar-v1`, 16.11.2026, **10 з 10 за двома прогонами**, поріг PM (≥ 8 з 10; GC-08, GC-09, GC-10 завжди) виконано
- Пояснення FAIL і NOT RUN: GC-02 прогін 1 — FAIL `invalid_output` (відповідь безкоштовної моделі не за схемою; недетермінована, у повторі пройшла, промпт не змінювали, регресії немає) · GC-09 і GC-10 прогін 1 — NOT RUN (429 від OpenRouter, використано лише 7 з 50 добового ліміту, тож ліміт за хвилину чи постачальника), повторено окремо з паузою 8 с і пройшли

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: `/api/health` із SHA `main` (див. вище), `OPENROUTER_API_KEY` у Vercel Production; міграцій немає
- UAT на проді (≥ 2 AC): https://github.com/lukian-tomochko/leave-portal/tree/0b018489f537e9368e263c2d77e5d9bf0198fd95/docs/qa/uat/2026-11-16 — AC-ASSIST-01 (пропозиції без запису: календар лишається порожнім) і AC-ASSIST-02 («людина зберігає»), AC-ASSIST-08 (стан очікування), AC-ASSIST-10 (відмова: 2001 символ), AC-ASSIST-11 (відмова за роллю): PASS ×5
- `docs/conformance.md`: https://github.com/lukian-tomochko/leave-portal/blob/0b018489f537e9368e263c2d77e5d9bf0198fd95/docs/conformance.md — рядок на кожен AC зрізу 4 (AC-CAL-20 — відкладено з причиною)
- «eval готовий» у чаті команди: 16.11, eval 16.11
- Відхилення від PM: не надходило станом на 2026-11-16 (issues «Відхилення від вимог» у репо немає). Виправлення після здачі — коментарем «Виправлено: …» у тому ж issue до 18:00 Пн 16.11
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 2 — Agent SDK, варіант B (OpenRouter, експеримент)
- Репо працівника: https://github.com/lukian-tomochko/leave-review-worker
- SHA репо працівника: 220b1f188ac7a18ce264330f90c2b1b6d2b31d1c
- Звіт: https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/docs/worker/README.md
- Картка ролі: попередня перевірка заявок на відпустку для менеджера школи (команда leave-portal); тригер: `npm start -- --set <набір>` вручну або ручний workflow без розкладу; канал: markdown-брифінг у `out/`, рядок у консолі, JSON запуску
- Межі: https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/src/options.ts (`tools: ["Write"]`, `allowedTools`, `permissionMode: "dontAsk"`) і https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/src/guard.ts (хук `PreToolUse`: запис лише в `out/`); середовище очищає `cleanEnv` у https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/src/config.ts
- Перевіряльник і людина в контурі: функція в коді `verifyReview` (https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/src/report.ts) звіряє відповідь моделі з прапорцями, які порахував код (https://github.com/lukian-tomochko/leave-review-worker/blob/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/src/checks.ts): модель не може зняти чи вигадати проблему; рішення по заявці (схвалити, відхилити, повернути) лишається менеджеру, у схемі відповіді поля рішення немає
- Журнал запуску без людини: https://github.com/lukian-tomochko/leave-review-worker/tree/220b1f188ac7a18ce264330f90c2b1b6d2b31d1c/docs/worker/runs
- Golden data: `clean` (усе готове до рішення), `problems` (8 заявок, п'ять видів проблем), `injection` (ін'єкція в коментарі плюс справжнє перевищення балансу); еталони вручну в `tests/golden-expected.ts`, працівник їх прочитати не може; результат 17.11.2026: усі три набори збіглися з еталоном, по одному прогону на набір (n = 1, це не pass rate)
- Вартість і ліміти: 4 кроки на запуск, оцінка `total_cost_usd` 0,046 / 0,074 / 0,051 $ (оцінка за цінами Claude, реальні витрати 0 $: модель `nvidia/nemotron-3-ultra-550b-a55b:free`); ≈ 12 запитів із 50 на добу OpenRouter. Зламалось і виправлено: схема з `$schema` (draft 2020-12) відхилялась Claude Code, а запуск із сесії іншого агента слав токен хоста замість ключа OpenRouter (401); хук запису наживо не спрацьовував (модель не пробувала вийти за `out/`), тому він перевірений лише офлайн; змінити б: кілька прогонів на набір для частки успіху й набір, де модель справді пробує вийти за межі

### PM

—
