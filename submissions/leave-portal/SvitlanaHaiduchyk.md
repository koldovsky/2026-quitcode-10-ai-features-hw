# Здача WS10

## Дані

- Роль: dev
- Команда: leave-portal
- GitHub-логін: SvitlanaHaiduchyk
- Ваше репо: https://github.com/SvitlanaHaiduchyk/course-staff-management
- SHA: 3359af57f478cc20b8315ce78ce7a6f5c7db8c38
- Репо вимог PM: https://github.com/mkozlovskyi-ops/course-staff-management-spec
- Прод-URL: https://course-staff-management.vercel.app

## PM

—

### Вимога зрізу 4, готова до eval (трек A)

—

### Питання й уточнення (трек B)

—

### Приймання зрізу 4 (трек C)

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://course-staff-management.vercel.app/api/health — `{"ok":true,"sha":"3359af57f478cc20b8315ce78ce7a6f5c7db8c38","env":"production","db":"ok"}`
- Зелений прогін `smoke` на `main`: https://github.com/SvitlanaHaiduchyk/course-staff-management/actions/runs/44407098921
- `accounts.zip` на SHA: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/accounts.zip
- Ролі тестових акаунтів: адміністратор — admin@example.test; відповідальні менеджери — manager1@example.test, manager2@example.test; працівники — teacher1@example.test, teacher2@example.test. Паролі — лише в `accounts.zip`
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-ASSIST-01, AC-ASSIST-02, AC-ASSIST-03, AC-ASSIST-04, AC-ASSIST-05, AC-ASSIST-06, AC-ASSIST-07, AC-ASSIST-08, AC-ASSIST-09, AC-ASSIST-10, AC-ASSIST-11
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/64
- Спека `add-calendar-assistant` і план з розділом «AI» — PR «Специфікація»: https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/72 (спека, 11 AC) і https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/74 (план `impl-calendar-assistant`: `design.md` з розділами UI · Дані й RLS · Auth · AI, `tasks.md` із «Done when: AC-…»)
- Після уточнень PM: уточнень не було — вимога прийшла готовою разом із 10 golden cases (коміт PM `a0de666`, 2026-11-13), і `/requirements-sync` 2026-11-18 приніс її одним знімком
- Golden cases PM у `cases.json`: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/tests/fixtures/golden/cases.json — ті самі ID `GC-01` … `GC-10`, `expected` лише зі значень таблиці PM, `rubric` словами PM, плюс `mustMention` / `mustNotMention` там, де PM задав вимогу до вільного тексту
- ADR на залежності: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/docs/decisions/0003-ai-feature-openrouter.md
- Питання PM: питань не було. Це рішення, а не недогляд: розділ «Open questions» вимоги порожній, і кожне місце, де зазвичай виникає друге прочитання, PM закрив прикладом із очікуваним результатом — `GC-04` (числові дати день першим), `GC-05` (минула дата дозволена), `GC-07` (неможливу дату не «виправляємо»), `GC-06` (скорочений день без часу — це `needs_info`). Міркування записано в журнал читання: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/docs/spec-reading.md

### AI-функція (трек B)

- Ланцюжок моделей: `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3.5-super-vl:free` — усі `:free`. PDF немає: вимога PM приймає лише вставлений текст, тож плагін `file-parser` із набору курсу не підключений
- Схема й стани: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/src/lib/ai/schema.ts — `status: ok | needs_info | refused`, масив пропозицій, «невідоме» = `null`. Правила, перевірені кодом: межа 2000 символів **до** виклику моделі (`AC-ASSIST-10`); зведення скороченого дня до однієї дати; `ok` без жодної пропозиції — помилка, а не мовчазне «бракує подробиць». Порядок дат, крок 5 хвилин, довжина назви й перетини лишаються в `public.add_school_closure` з її дослівними текстами PM
- Ключ лише на сервері: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/src/lib/ai/openrouter.ts — єдиний файл у `src/`, що читає `OPENROUTER_API_KEY`, з `import "server-only"`; без ключа повертає `null`, і помічник показує стан із `AC-ASSIST-09`. Зелений `tests/ai-key.test.ts` у прогоні CI: https://github.com/SvitlanaHaiduchyk/course-staff-management/actions/runs/44407039668
- Людина підтверджує перед записом: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/src/app/calendar/assistant/actions.ts — `getClaims()` і роль із `profiles` **до** виклику моделі (чужий запит не витрачає денного ліміту) і ще раз до запису; `suggestClosures` нічого не пише, записує окрема дія `saveSuggestions` під сесією адміністратора. Пропозиції до збереження живуть у cookie, а не в таблиці: за `AC-ASSIST-01` їх не існує ніде, доки людина не збереже
- Збої: без ключа, 429, 429 у тілі HTTP 200, таймаут 30 с і відповідь не за схемою дають один дослівний текст `AC-ASSIST-09` — «The calendar assistant is unavailable right now. Try again later or add closures manually.», а додавання закриття руками працює далі. `maxRetries` — 1, без повторів у циклі
- Промпт з даними в межах: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/src/lib/ai/prompts/closures.ts — вхідний текст у межах `<document>…</document>`, самі теги з нього вирізаються (вставлений `</document>` інакше закрив би межу зсередини), довжина обрізається, версія промпту `assist-v1`. **Тексти відмови й «бракує подробиць» складає код, а не модель:** PM задав їх дослівно, і так у відповідь не може просочитися текст промпту — цього прямо вимагає `GC-10`
- PR задач «Реалізація»: https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/73 (ADR, залежності, ядро), https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/75 (екран і збереження), https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/76 (golden cases), https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/77 (живий eval), https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/78 (UAT) — усі злиті, усі з `@coderabbitai review`

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/tests/golden.test.ts — `it.each`, назви починаються з AC ID, розбиті за AC: `AC-ASSIST-01` (GC-01 … GC-05), `AC-ASSIST-05` (GC-06, GC-07), `AC-ASSIST-06` (GC-08), `AC-ASSIST-07` (GC-09, GC-10)
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/SvitlanaHaiduchyk/course-staff-management/actions/runs/44407039668 (job `app` — `npm test`; job `conformance` — `ac:coverage`); e2e без `@writes`: https://github.com/SvitlanaHaiduchyk/course-staff-management/actions/runs/44405750595
- Записи живого прогону: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/tests/fixtures/golden/recorded.json — усі 10 записані `RECORD=1 npm run eval` 2026-11-18, кожен із `modelId`, часом і `promptVersion: assist-v1`; **заглушок нема жодної**. Окремий тест стежить, щоб непозначена заглушка не прослизнула
- Тести збоїв та ін'єкції: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/tests/ai-suggest.test.ts (429, 429 у тілі 200, таймаут, не за схемою, «ok» без пропозицій, межа 2000 і рівно 2000, межа `<document>` — усі з AC ID) і https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/tests/ai-scorer.test.ts (оцінювачеві дають **хибні** відповіді й вимагають, щоб він їх назвав)
- Звіт живого eval: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/evals/reports/2026-11-18T20-50-58-414Z.md — **10/10 (100%)**, поріг PM виконано, NOT RUN 0, модель названа на кожен кейс. Перший прогін того ж дня лишено поруч: історію не переписуємо
- Пояснення FAIL і NOT RUN: **FAIL моделі немає жодного.** Натомість прогони знайшли три збої мого гарнеса, усі виправлені:
  - прогін `…T20-47` дістав 429 на дев'ятому кейсі, хоча денного ліміту лишалося 35 із 50: ліміт 20 запитів/хв рахує **кожну спробу ланцюжка**, а їх до трьох на кейс. Пауза 3 с із набору курсу розрахована на один виклик → `GAP_MS = 3_000 * PRODUCT_MODELS.length`;
  - той самий звіт писав «поріг PM виконано», хоча `GC-09` і `GC-10` не бігли: перевірка рахувала лише обов'язкові кейси, які **впали**. Тепер обов'язковий кейс має саме пройти. Хибний звіт видалено, а не виправлено руками;
  - у першому звіті чотири кейси показували модель як «—»: `modelId` не проносився крізь стани `needs_info` і `refused`, тобто звіт називав модель лише тоді, коли вона щось запропонувала, а коли **відмовилася** — ні, хоча саме відмови тут найцінніші

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: `/api/health` показує `3359af57f478cc20b8315ce78ce7a6f5c7db8c38` — це `main`. Міграцій у зрізі немає: збереження йде через наявну `public.add_school_closure` зі зрізу 3. `OPENROUTER_API_KEY` у Vercel — **лише Production**: змінна позначена Sensitive, і Vercel не дає додати Preview без перестворення; гайд курсу вимагає Production
- UAT на проді (≥ 2 AC): https://github.com/SvitlanaHaiduchyk/course-staff-management/tree/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/docs/qa/uat/2026-11-18 — **11 AC: PASS 9, FAIL 0, NEEDS-HUMAN 2**. Зі зрізу 4: `AC-ASSIST-02` (людина зберігає переглянуті пропозиції) і `AC-ASSIST-11` (відмова не-адміністраторові) — **PASS** за правилом R6; `AC-ASSIST-01` — NEEDS-HUMAN. Специфікації наживо (`@writes`) прибирають створені закриття за собою
- `docs/conformance.md`: https://github.com/SvitlanaHaiduchyk/course-staff-management/blob/3359af57f478cc20b8315ce78ce7a6f5c7db8c38/docs/conformance.md — дев'ять AC зрізу «реалізовано», два чесно «відкладено»: `AC-ASSIST-04` (часткове збереження написане, доказом може бути лише e2e `@writes`) і `AC-ASSIST-08` (кнопка стану працює, але засобів для тестів DOM у репозиторії немає, а React Testing Library — нова залежність)
- «eval готовий» у чаті команди: **не надсилала** — зріз робився 18.11, після строку здачі 16.11, тож приймання PM за ним уже не відбувалося
- Відхилення від PM: не надходило
- Акаунти для нових ролей зрізу 4: нових ролей немає — помічником користується наявний `admin@example.test`

### Два NEEDS-HUMAN у звіті UAT — про кадри, не про продукт

Обидва стосуються доказів, а не поведінки: усі одинадцять перевірок Playwright на проді зелені.

- `AC-ASSIST-01` — нативні поля дати малюють `11/20/2026` і `12:00 PM`, тобто формат браузера, а я просила агента процитувати дослівне `2026-11-20`. Вимагати того, чого на кадрі бути не може, — вада підказки;
- `AC-CAL-09` — розділ «Наявні закриття» не вмістився у видиму частину кадру.

Обидві виправлені в [#78](https://github.com/SvitlanaHaiduchyk/course-staff-management/pull/78) вже після того прогону, тож у самому звіті вони ще є: звіт згенерований, і правити його руками не можна.

Окремо варто назвати, **чому звіт спершу був порожній**: вкладений Claude Code відмовляється читати шляхи з короткими іменами Windows (`C:\Users\DEVELO~1\...`) і просить підтвердження, якого в режимі `-p` дати нікому. Агент чесно писав «жодного кадру я не побачив», і всі 11 AC виходили NEEDS-HUMAN. Виправлено в `scripts/uat/review.mjs`: `realpathSync.native(os.tmpdir())`.

### Спостереження про ланцюжок моделей

На **всі десять** кейсів відповіла `nvidia/nemotron-3.5-super-vl:free` — **третя** модель ланцюжка. Те саме в двох попередніх прогонах того дня: 6 із 6 і 8 із 8. Обидві `gemma-4`, які в ADR 0003 стоять першими, не відповіли жодного разу — найімовірніше через відсутність строгої JSON-схеми (`structured_outputs`), що видно й у `npm run ai:models`.

Порядок ланцюжка — рішення ADR, а зміна прийнятого ADR за `AGENTS.md` потребує окремого рішення, тому цифри зафіксовані, а порядок не чіпався.

### Знахідка агента, якої не дає жодна автоматична перевірка

Рецензент UAT помітив, що після прохання поле «Текст» порожнє: якщо помічник відповів `needs_info`, адміністраторові доводиться вставляти свої дві тисячі символів наново. Вимога PM цього не забороняє й не вимагає — це не відхилення, але на першому ж справжньому календарі людина на це наштовхнеться. Записано окремою задачею в плані зрізу, а не виправлено мовчки.

### Чесно про строк

Зріз 4 зроблено 18.11, тобто **після** строку здачі 16.11. Нічого не дописано заднім числом: усі PR, прогони й звіти мають свої справжні дати. Приймання PM за цим зрізом не відбувалося, бо його рахували на кінець 16.11.

## Бонус

—
