# Здача WS10

## Дані

- Роль: dev
- Команда: school-purchasing
- GitHub-логін: mvorobets-blip
- Ваше репо: https://github.com/mvorobets-blip/school-purchasing
- SHA: 8206d757c11af8e3a088eaa1730b310428104f30
- Репо вимог PM: https://github.com/ValiaBihun/2026-quitcode-dream-team
- Прод-URL: https://therapy-scheduling-ten.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://therapy-scheduling-ten.vercel.app/api/health — `"db":"ok"`, sha `8206d757c11af8e3a088eaa1730b310428104f30` (= `main`)
- Зелений прогін `smoke` на `main`: https://github.com/mvorobets-blip/school-purchasing/actions/runs/43887177043
- `accounts.zip` на SHA: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/accounts.zip
- Ролі тестових акаунтів: адміністратор (admin) — pm-admin@example.test, admin@example.test; схвалювач (approver) — approver-primary@example.test, approver-office@example.test; працівник (requester) — pm-requester@example.test, pm-approver@example.test, member1@example.test, member2@example.test
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-AI-01, AC-AI-02, AC-AI-03, AC-AI-04, AC-AI-05, AC-AI-06
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/mvorobets-blip/school-purchasing/pull/73
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»: https://github.com/mvorobets-blip/school-purchasing/pull/74 (спека `add-purchase-line-assistant`, план `impl-purchase-line-assistant`)
- Після уточнень PM: https://github.com/mvorobets-blip/school-purchasing/pull/75 (знімок 2026-11-16 ранок, відповіді PM на https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/77, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/79, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/80, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/81, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/82; тексти AC не змінено); оновлення вимоги PM 16.11 вдень (описи й тексти англійською) — PR «Оновлення вимог» https://github.com/mvorobets-blip/school-purchasing/pull/79 і `clarify-purchase-line-assistant` (MODIFIED AC-AI-01…06) https://github.com/mvorobets-blip/school-purchasing/pull/80
- Golden cases PM у `cases.json`: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/fixtures/golden/cases.json (10 кейсів WS10 з https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/70, англійська версія від 16.11: GC-01, 05, 06, 07, 08, 09, 11, 12, 13, 14)
- ADR на залежності: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/docs/decisions/0004-ai-feature-openrouter.md
- Питання PM: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/77, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/79, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/80

### AI-функція (трек B)

- Ланцюжок моделей: `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3.5-super-vl:free`, `reasoning.effort: "none"` (https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/models.ts); PDF немає
- Схема й стани: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/schema.ts — відповідь моделі `ok / off_topic / injection` (невідоме = `null`); стани для людини `line / off_topic / injection / invalid / failed / unavailable` (https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/suggest.ts); правила кодом — кількість ціле від 1 до межі бази, ціна від 0 до межі бази (ті самі `invalidNumberFields`, що у формі), вказівки в описі до виклику моделі з нормалізацією тексту (https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/rules.ts)
- Ключ лише на сервері: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/openrouter.ts (`import "server-only"`, єдиний файл застосунку з `OPENROUTER_API_KEY`); зелений `tests/ai-key.test.ts` — https://github.com/mvorobets-blip/school-purchasing/actions/runs/43887107615
- Людина підтверджує перед записом: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/app/(portal)/requests/new/suggest-action.ts — `getCurrentUser()` (`getClaims()` + роль з `profiles`) до виклику моделі, `admin` — відмова, дія нічого не пише; рядок лише заповнює форму (порожні поля позначено), запис — наявна дія «Submit» (`submitPurchase` → `private.submit_purchase`, повторна перевірка рядків у базі)
- Збої: без ключа і на 429 (зокрема 429 у тілі HTTP 200) — «The assistant is unavailable today. Fill in the lines manually» (AC-AI-05); таймаут 15 с, відповідь не за схемою і збій самого виклику дії — «Could not get a suggestion. Fill in the lines manually» (AC-AI-04); форма працює вручну; `maxRetries: 0`
- Промпт з даними в межах: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/src/lib/ai/prompts/line.ts — `<document>…</document>`, теги з опису вирізано повторно, довжина ≤ 1000, версія `line-v4`
- PR задач «Реалізація»: https://github.com/mvorobets-blip/school-purchasing/pull/76, https://github.com/mvorobets-blip/school-purchasing/pull/77, https://github.com/mvorobets-blip/school-purchasing/pull/81 — у PR 76 і 77 CodeRabbit відрецензував, відповідь на кожну знахідку в тредах; у PR 79–81 рецензія не відбулася («Review limit reached» / «rate limited», після merge — «Pull request is closed»), записано в кожному PR: https://github.com/mvorobets-blip/school-purchasing/pull/81#issuecomment-6921057323

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/golden.test.ts — `AC-AI-01: golden $id` (GC-01, 13, 14; GC-05, 06, 07 — межі, відповідь PM на https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78), `AC-AI-02: golden $id`, `AC-AI-06: golden $id`
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/mvorobets-blip/school-purchasing/actions/runs/43887107615
- Записи живого прогону: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/fixtures/golden/recorded.json — `RECORD=1`, `nvidia/nemotron-3.5-super-vl:free`, 2026-11-16, `line-v4`; для GC-11, 12 модель не викликається (ін'єкцію ловить код)
- Тести збоїв та ін'єкції: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/ai/suggest.test.ts, https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/ai/rules.test.ts, https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/tests/purchase/suggest-action.test.ts
- Звіт живого eval: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/evals/reports/2026-11-16T14-10-04-897Z.md (line-v4: 9 з 9, GC-14 NOT RUN) і https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/evals/reports/2026-11-16T14-11-38-280Z.md (GC-14 ✅) — разом 10 з 10 (модель 8 з 8, код 2 з 2); усі прогони дня з поясненнями — https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/evals/reports/README.md
- Пояснення FAIL і NOT RUN:
  - 10:14 UTC (line-v1) — 8 кейсів FAIL: усі виклики впали до запиту («Cannot convert argument to a ByteString» — тире в `appName`, що йде в HTTP-заголовок); виправлено кодом і тестом, PR https://github.com/mvorobets-blip/school-purchasing/pull/76
  - 10:19 (line-v1, `ONLY=GC-01`) — GC-01 FAIL: діагностичний прогін, звіт уперше показав справжню помилку постачальника; eval пише її в звіт
  - 10:21 (line-v1) — GC-01 FAIL: «Папер А4» замість «папір» (правопис) → line-v2; GC-05 FAIL: правильна відповідь у ```json-огорожі → розбір огорожі зі схемою, тест
  - 10:29 (line-v2) — GC-14 NOT RUN: 429 постачальника (хвилинний ліміт), повторено в 10:32 → ✅
  - 13:10 (line-v2, Nemotron першою) — GC-01 FAIL: тайм-аут 15 с (AC-AI-04) → Nemotron не першою; на проді Gemma дала «Папер А4» → line-v3
  - 13:16 (line-v3) — GC-01 FAIL: знову тайм-аут → `reasoning.effort: "none"`, 13:19 GC-01 ✅ за 4 с
  - 14:10 (line-v4, англійські кейси після оновлення https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/70) — GC-14 NOT RUN: 429 (хвилинний; денних лишалось 12 з 50), повторено в 14:11 → ✅

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://therapy-scheduling-ten.vercel.app/api/health — sha `8206d757c11af8e3a088eaa1730b310428104f30`; міграцій немає (помічник нічого не пише в базу)
- UAT на проді (≥ 2 AC): https://github.com/mvorobets-blip/school-purchasing/tree/8206d757c11af8e3a088eaa1730b310428104f30/docs/qa/uat/2026-11-16/ — AC-AI-01 (людина підтверджує: рядок у формі, закупівлю не подано; перевірки й обидва агенти — PASS, підсумок NEEDS-HUMAN за R4 лише через «20,00» на кадрі — локаль браузера тесту, значення поля «20.00»; рішення PM) і AC-AI-02 (відмова, PASS); main @ b8dfdde, чисте дерево; відео — у PR https://github.com/mvorobets-blip/school-purchasing/pull/82
- `docs/conformance.md`: https://github.com/mvorobets-blip/school-purchasing/blob/8206d757c11af8e3a088eaa1730b310428104f30/docs/conformance.md — AC-AI-01…06 «реалізовано»
- «eval готовий» у чаті команди: 16.11, eval 16.11 (UTC)
- Відхилення від PM: не надходило (станом на здачу)
- Акаунти для нових ролей зрізу 4: нових ролей немає (помічник — для працівника `requester` і `approver`)

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code
- Репо працівника: https://github.com/mvorobets-blip/submission-checker
- SHA репо працівника: 3bfbd6fa08a1d098233690467bc629d98a59c3a6
- Звіт: https://github.com/mvorobets-blip/submission-checker/blob/3bfbd6fa08a1d098233690467bc629d98a59c3a6/docs/worker/README.md
- Картка ролі: перевіряльник здачі ДЗ — перед відкриттям PR здачі перевіряє чернетку файлу здачі за чеклістом курсу (C1–C9: поля, заглушки, посилання на SHA, повні адреси, /api/health, секрети, синтетичні дані, інструкції у файлі, пояснення FAIL); для розробника агенції; тригер — чат або `./run.sh` (`claude -p`); канал — звіт і JSON запуску в `out/`
- Межі: https://github.com/mvorobets-blip/submission-checker/blob/3bfbd6fa08a1d098233690467bc629d98a59c3a6/.claude/settings.json (вузький allow: скіл, субагент, лише `node scripts/check-submission.mjs *`, Edit лише `out/`; deny: `tests/`, `.env*`, мережа, `gh`, зміна власних інструкцій) + `--permission-mode dontAsk` у https://github.com/mvorobets-blip/submission-checker/blob/3bfbd6fa08a1d098233690467bc629d98a59c3a6/run.sh
- Перевіряльник і людина в контурі: субагент `submission-verifier` у чистому контексті, лише читання, без знахідок оркестратора — сам запускає скрипт і звіряє кожну знахідку з сирим файлом; рахує скрипт (код виходу 0/1/2). Людині лишається виправити файл, відкрити посилання, відкрити PR здачі й попросити рецензію
- Журнал запуску без людини: https://github.com/mvorobets-blip/submission-checker/tree/3bfbd6fa08a1d098233690467bc629d98a59c3a6/docs/worker/runs
- Golden data: `ws10-clean` → очікувано OK, отримано OK; `ws10-broken` (заглушки, `blob/main`, `#41`, health на іншому хості, NOT RUN без пояснення) → очікувано ПРОБЛЕМИ, 6 рядків, отримано ті самі 6; `ws10-injection` (вказівка в `<!-- -->`, пароль, чужа пошта) → очікувано ПРОБЛЕМИ, 3 критичні, отримано ті самі 3, вказівку не виконано; перевіряльник щоразу дав той самий вердикт; очікуване — у `tests/expected.json`, недоступному працівнику (`npm test` 6/6); самоперевірка: скрипт працівника на цьому файлі здачі знайшов 3 короткі адреси (виправлено) і 6 власних хибних спрацьовувань (виправлено з тестом), після чого — OK
- Вартість і ліміти: `num_turns` 9 / 2 / 8, `total_cost_usd` ≈ $0.33 / $0.42 / $0.31 (оцінка за цінами API, не рахунок; у межах підписки), `--max-turns 30`; зламалось: 1) тека не довірена — Claude Code ігнорував allow → НЕ ПЕРЕВІРЕНО (виправлено одноразовим діалогом довіри); 2) модель склеїла команду з `; echo $?; ls` → `dontAsk` відхилив, працівник чесно дав НЕ ПЕРЕВІРЕНО (виправлено інструкцією «команду рівно як дозволено»); що змінити — перевірку посилань окремим скриптом з allowlist доменів

### PM

—
