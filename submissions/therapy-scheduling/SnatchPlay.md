# Здача WS10

## Дані

- Роль: dev
- Команда: therapy-scheduling
- GitHub-логін: SnatchPlay
- Ваше репо: https://github.com/SnatchPlay/therapy-scheduling
- SHA: 78f00d6b8e4327ba2da3818b3796d0ba0b924dd6
- Репо вимог PM: https://github.com/HryhoriiHaponiukQuitCode/therapy-scheduling-spec
- Прод-URL: https://therapy-scheduling-weld.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://therapy-scheduling-weld.vercel.app/api/health — на момент здачі `{"ok":true,"sha":"78f00d6b8e4327ba2da3818b3796d0ba0b924dd6","env":"production","db":"ok","reason":""}`
- Зелений прогін `smoke` на `main`: https://github.com/SnatchPlay/therapy-scheduling/actions/runs/43711659670
- `accounts.zip` на SHA: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/accounts.zip
- Ролі тестових акаунтів: admin — admin@example.test; планувальники — scheduler1@example.test, scheduler2@example.test; терапевти — therapist1@example.test, therapist2@example.test; користувач без ролі — newuser1@example.test; акаунти PM — pm-admin@example.test, pm-scheduler@example.test, pm-therapist@example.test, pm-therapist2@example.test, pm-noaccess@example.test. Паролі — лише в accounts.zip
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-INTAKE-01, AC-INTAKE-02, AC-INTAKE-03, AC-INTAKE-04, AC-INTAKE-05, AC-INTAKE-06, AC-INTAKE-07, AC-INTAKE-08, AC-INTAKE-09
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/SnatchPlay/therapy-scheduling/pull/77
- Спека `add-intake-draft` і план з розділом «AI» — PR «Специфікація»: https://github.com/SnatchPlay/therapy-scheduling/pull/78 (спека) і https://github.com/SnatchPlay/therapy-scheduling/pull/79 (план `impl-intake-draft`, `design.md` з розділом про AI)
- Після уточнень PM: /requirements-sync 2026-11-14: Вимоги актуальні (вимогу зрізу 4, issue 36, PM востаннє оновила 2026-11-13, до знімка)
- Golden cases PM у `cases.json`: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/tests/fixtures/golden/cases.json — ті самі GC-01…10, що в PM; тимчасових кейсів немає
- ADR на залежності: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/docs/decisions/0008-ai-feature-claude-api.md (поточне рішення: Claude API) і https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/docs/decisions/0006-ai-feature-openrouter.md (перший варіант на OpenRouter, замінено ADR 0008)
- Питання PM: питань не було

### AI-функція (трек B)

- Ланцюжок моделей: одна модель `claude-haiku-5-5` (Claude API, платна, без fallback). Це відхилення від правила «лише `:free`», я обрав його свідомо й записав в ADR 0008; щоб обмежити витрати, є ліміт 10 чернеток на годину на користувача (міграція `intake_draft_quota`, перевірка в базі). PDF у функції немає
- Схема й стани: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/lib/ai/schema.ts — стани ok / needs_info / refused; правила (дата й тип за віком, email, мова, перелік «Missing: …») перевіряє код у https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/lib/ai/intake.ts
- Ключ лише на сервері: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/lib/ai/anthropic.ts (єдиний файл у `src/` з `server-only`, що читає `ANTHROPIC_API_KEY`; ключ не OpenRouter, бо модель — Claude) і зелений `tests/ai-key.test.ts` у https://github.com/SnatchPlay/therapy-scheduling/actions/runs/43711621310. Значення ключа не пишу
- Людина підтверджує перед записом: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/app/clients/actions.ts — `requestIntakeDraft` лише повертає чернетку у форму (роль через `getViewer()` до виклику моделі, ліміт у базі, модель без інструментів і без запису); картку створює окрема дія `createClientCard` з повторною валідацією й записом під сесією користувача (RLS)
- Збої: без ключа, 429, таймаут, відповідь не за схемою, вичерпаний ліміт — той самий дослівний текст зі стану AC-INTAKE-08: «The assistant is unavailable right now. Fill in the form manually.»; форма працює вручну. Причина йде лише в лог сервера
- Промпт з даними в межах: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/lib/ai/prompts/draft.ts — текст у `<document>…</document>`, версія `intake-v1`
- PR задач «Реалізація»: https://github.com/SnatchPlay/therapy-scheduling/pull/80, https://github.com/SnatchPlay/therapy-scheduling/pull/81, https://github.com/SnatchPlay/therapy-scheduling/pull/84, https://github.com/SnatchPlay/therapy-scheduling/pull/85, https://github.com/SnatchPlay/therapy-scheduling/pull/86 — злиті; CodeRabbit у цих PR не запускався (автоматично не рецензує), тож коментарів до відповіді немає; перед злиттям кожен PR проходив рев'ю незалежними субагентами Claude Code, знахідки виправлено

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/tests/golden.test.ts — назви починаються з AC ID
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/SnatchPlay/therapy-scheduling/actions/runs/43711621310
- Записи живого прогону: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/tests/fixtures/golden/recorded.json — записано `RECORD=1` 2026-11-14 (`claude-haiku-5-5`, версія промпту `intake-v1`), не заглушки
- Тести збоїв та ін'єкції: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/lib/ai/draft.test.ts (AC-INTAKE-08: не за схемою, 429, таймаут, помилка постачальника) і https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/src/app/clients/intake-draft-action.test.ts (AC-INTAKE-07 ін'єкція; AC-INTAKE-08 немає ключа, ліміт; AC-INTAKE-09 ролі)
- Звіт живого eval: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/evals/reports/2026-11-14T14-37-55-233Z.md — `claude-haiku-5-5`, версія `intake-v1`, один прогін, 10/10 (поріг PM ≥ 8, GC-09 і GC-10 обов'язкові)
- Пояснення FAIL і NOT RUN: FAIL немає, NOT RUN немає (один прогін; повторних для стабільності не робив)

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://therapy-scheduling-weld.vercel.app/api/health показує SHA злиття `78f00d6b8e4327ba2da3818b3796d0ba0b924dd6`; міграцію `intake_draft_quota` застосовано `db-deploy` у https://github.com/SnatchPlay/therapy-scheduling/actions/runs/43614869500
- UAT на проді (≥ 2 AC): https://github.com/SnatchPlay/therapy-scheduling/tree/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/docs/qa/uat/2026-11-15-intake-draft — AC-INTAKE-06 (відмова) PASS; AC-INTAKE-03 (чернетка не створює картку) — перевірки пройшли, але вердикт агента NEEDS-HUMAN: на проді вже була картка «Client Ten», створена до UAT, тому тест доводить незмінну кількість карток до й після чернетки, а не їх відсутність. Рішення за PM. Прод-UAT знайшов і виправив дубль панелі після відповіді (PR 85)
- `docs/conformance.md`: https://github.com/SnatchPlay/therapy-scheduling/blob/78f00d6b8e4327ba2da3818b3796d0ba0b924dd6/docs/conformance.md — усі AC-INTAKE-01…09 «реалізовано»
- «eval готовий» у чаті команди: повідомлення в чаті команди ще не надіслано, надішлю до 16.11 і вкажу дату коментарем у цьому PR; живий eval — 14.11 (UTC-доба 14.11)
- Відхилення від PM: не надходило (станом на здачу); виправлення після здачі — коментарем «Виправлено: …» в issue до 18:00 Пн 16.11
- Акаунти для нових ролей зрізу 4: нових ролей немає

## Бонус

—
