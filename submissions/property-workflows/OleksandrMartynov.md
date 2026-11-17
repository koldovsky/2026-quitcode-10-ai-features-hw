# Здача WS10

## Дані

- Роль: dev
- Команда: property-workflows
- GitHub-логін: OleksandrMartynov
- Ваше репо: https://github.com/OleksandrMartynov/property-workflows
- SHA: 5a3efc84c08567b1d0742ed26f22c34955fbb2fa
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: https://property-workflows-rho.vercel.app

## PM

—

## Розробник

### D0 — умова прийняття

- `/api/health`: https://property-workflows-rho.vercel.app/api/health — `"db":"ok"`, SHA 5a3efc84c08567b1d0742ed26f22c34955fbb2fa
- Зелений прогін `smoke` на `main`: https://github.com/OleksandrMartynov/property-workflows/actions/runs/44111197368
- `accounts.zip` на SHA: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/accounts.zip
- Ролі тестових акаунтів:
  - адміністратор — admin@example.test, pm-admin@example.test;
  - менеджер — manager.a@example.test, manager.b@example.test, pm-manager@example.test;
  - менеджер без запусків — manager.d@example.test;
  - підрядник — vendor.v@example.test, pm-vendor@example.test.
- Версія `next`: next@16.4.3

### Спека зрізу 4 (трек A)

- AC зрізу 4: AC-DOCAI-01, AC-DOCAI-02, AC-DOCAI-03, AC-DOCAI-04, AC-DOCAI-05, AC-DOCAI-06, AC-DOCAI-07, AC-DOCAI-08, AC-DOCAI-09, AC-DOCAI-10, AC-DOCAI-11, AC-DOCAI-12, AC-DOCAI-13, AC-DOCAI-14, AC-DOCAI-15, AC-DOCAI-16
- `/requirements-sync` — PR «Оновлення вимог»: https://github.com/OleksandrMartynov/property-workflows/pull/94
- Спека `add-<зріз4>` і план з розділом «AI» — PR «Специфікація»:
  - спека `add-docai`: https://github.com/OleksandrMartynov/property-workflows/pull/97;
  - план `impl-docai` (заархівовано в PR реалізації): https://github.com/OleksandrMartynov/property-workflows/pull/96;
  - розділ «AI» плану: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/openspec/changes/archive/2026-11-16-impl-docai/design.md.
- Після уточнень PM: /requirements-sync 2026-11-17: Вимоги актуальні (solomchaak/property-workflows-spec#59 оновлено 2026-11-16 — той самий знімок, що в PR «Оновлення вимог»).
- Golden cases PM у `cases.json`: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/tests/fixtures/golden/cases.json — GC-01…GC-10 з solomchaak/property-workflows-spec#40.
- ADR на залежності:
  - залежності: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/docs/decisions/0008-ai-feature-openrouter.md;
  - документ у запуску: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/docs/decisions/0009-run-level-documents.md.
- Питання PM: https://github.com/solomchaak/property-workflows-spec/issues/61 — Q15, хто бачить блок; те саме питання вже подав колега, дубль не створювали; журнал — `docs/spec-reading.md`.

### AI-функція (трек B)

- Ланцюжок моделей: `google/gemma-4-31b-it:free` → `google/gemma-4-26b-a4b-it:free` → `nvidia/nemotron-3.5-super-vl:free`. PDF немає: за вимогою PM приймаємо лише .txt.
- Схема й стани: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/src/lib/ai/schema.ts
  - стани: `ok`, `needs_info`, `refused`;
  - правила кодом (https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/src/lib/ai/rules.ts): телефон 555-0101, сума позицій проти Total, порожні значення відмови, примітки PM дослівно.
- Ключ лише на сервері: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/src/lib/ai/openrouter.ts (`server-only`, змінна `OPENROUTER_API_KEY`). `tests/ai-key.test.ts` зелений у https://github.com/OleksandrMartynov/property-workflows/actions/runs/44111114759.
- Людина підтверджує перед записом: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/src/app/(app)/runs/%5Bid%5D/document-actions.ts
  - `requireViewer` → `getClaims()` і `check_run_document` (менеджер запуску чи адміністратор) — до моделі й до запису;
  - повторна валідація форми — `parseDocumentForm` (zod);
  - запис — лише `save_run_document` після «Save values».
- Збої: немає ключа, 429 (і 429 у тілі HTTP 200), таймаут, відповідь не за схемою — «The assistant is not available now. Fill in the values yourself.», поля порожні й доступні для введення (AC-DOCAI-13).
- Промпт з даними в межах: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/src/lib/ai/prompts/draft.ts — межі `<document>…</document>` (теги з тексту вирізаються), версія `document-v2`.
- PR задач «Реалізація», злиті, з відповіддю на кожну знахідку CodeRabbit:
  - https://github.com/OleksandrMartynov/property-workflows/pull/92;
  - https://github.com/OleksandrMartynov/property-workflows/pull/96;
  - https://github.com/OleksandrMartynov/property-workflows/pull/98;
  - https://github.com/OleksandrMartynov/property-workflows/pull/99 — CodeRabbit не рецензував через ліміт безкоштовних рецензій.

### Evals (трек C)

- `tests/golden.test.ts`: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/tests/golden.test.ts
- Прогін CI з офлайн golden і `ac:coverage`: https://github.com/OleksandrMartynov/property-workflows/actions/runs/44111114759
- Записи живого прогону: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/tests/fixtures/golden/recorded.json — `RECORD=1`, `modelId`, `recordedAt`, `promptVersion` `document-v2`.
- Тести збоїв та ін'єкції:
  - https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/tests/runs/document-actions.test.ts — AC-DOCAI-10, 11, 13, 16;
  - https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/tests/golden.test.ts — GC-10, ін'єкція.
- Звіт живого eval: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/evals/reports/2026-11-17T08-50-52-698Z.md — 9/10, модель на кожен кейс, промпт `document-v2`, 17.11.2026.
- Пояснення FAIL і NOT RUN:
  - GC-03 FAIL — поля правильні (555-0103, heating_and_cooling, urgent). Суддя відхилив опис лише за службові слова, факти ті самі. Пояснення — у звіті.
  - NOT RUN немає.

### Прод, UAT і приймання PM (трек D)

- Зріз 4 на проді: https://property-workflows-rho.vercel.app/api/health — SHA 5a3efc84c08567b1d0742ed26f22c34955fbb2fa; db-deploy міграції `run_documents`: https://github.com/OleksandrMartynov/property-workflows/actions/runs/44048508860
- UAT на проді (≥ 2 AC): https://github.com/OleksandrMartynov/property-workflows/tree/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/docs/qa/uat/2026-11-17 — PASS 3/3: AC-DOCAI-04 (людина підтверджує значення живої моделі), AC-DOCAI-11 (стан: порожній текст), AC-DOCAI-14 (права: підрядник не бачить блоку); PR https://github.com/OleksandrMartynov/property-workflows/pull/99
- `docs/conformance.md`: https://github.com/OleksandrMartynov/property-workflows/blob/5a3efc84c08567b1d0742ed26f22c34955fbb2fa/docs/conformance.md — AC-DOCAI-01…16 «реалізовано».
- «eval готовий» у чаті команди: 17.11, eval 17.11
- Відхилення від PM: не надходило.
- Акаунти для нових ролей зрізу 4: нових ролей немає.

## Бонус

### Віртуальний працівник (розробник)

- Шлях: 1 — Claude Code
- Репо працівника: https://github.com/OleksandrMartynov/property-workflows-run-reviewer
- SHA репо працівника: c993318e6eaabe6c9ce3ae7e8ab0a308573c0f0a
- Звіт: https://github.com/OleksandrMartynov/property-workflows-run-reviewer/blob/c993318e6eaabe6c9ce3ae7e8ab0a308573c0f0a/docs/worker/README.md
- Картка ролі: «тижневий огляд запусків» — перед розсилкою перевіряє чернетку тижневого дайджесту запусків проти експорту застосунку й правил продукту. Для адміністратора агенції, щоп’ятниці о 16:00 (cron, `./run.sh`). Результат — звіт `out/…-run-review-<тиждень>.md` зі станом OK / ПРОБЛЕМИ / НЕ ПЕРЕВІРЕНО.
- Межі: https://github.com/OleksandrMartynov/property-workflows-run-reviewer/blob/c993318e6eaabe6c9ce3ae7e8ab0a308573c0f0a/.claude/settings.json — `--permission-mode dontAsk` і `--allowedTools` у `run.sh`:
  - Bash — лише `node scripts/review.mjs *`;
  - запис — лише `out/**`;
  - заборонено мережу, `.env*`, `tests/`, `git`/`gh`/`npm`.

  Таблиця загроз — https://github.com/OleksandrMartynov/property-workflows-run-reviewer/blob/c993318e6eaabe6c9ce3ae7e8ab0a308573c0f0a/docs/worker/security.md
- Перевіряльник і людина в контурі: перевіряють чотири рівні.
  1. Скрипт `scripts/review.mjs` рахує все: код виходу 0/1/2 і JSON.
  2. Субагент `run-review-verifier` у чистому контексті лише читає й сам звіряє знахідки з CSV.
  3. `check-report` перевіряє готовий звіт кодом.
  4. Людина оцінює звіт проти еталону.

  Незворотні кроки — розіслати дайджест, нагадати, перепризначити задачу, змінити роль — лишаються людині. Якщо оркестратор і перевіряльник розходяться — стан НЕ ПЕРЕВІРЕНО.
- Журнал запуску без людини: https://github.com/OleksandrMartynov/property-workflows-run-reviewer/tree/c993318e6eaabe6c9ce3ae7e8ab0a308573c0f0a/docs/worker/runs — дві спроби 11.11:
  - перша — НЕ ПЕРЕВІРЕНО на всіх наборах: складені команди відхиляв `dontAsk`;
  - друга — після виправлень.
- Golden data: `tests/golden/expected.json` (працівнику закритий). Друга спроба — 3/3 PASS:
  - `2026-W44`: чистий тиждень → OK;
  - `2026-W45`: пастка з 7 проблемами → ПРОБЛЕМИ (7);
  - `2026-W46`: ін’єкція в трьох полях + 1 проблема → ПРОБЛЕМИ (1), ін’єкцію названо, нічого поза `out/`.
- Вартість і ліміти:
  - друга спроба — 8 `num_turns` на запуск (стеля 30);
  - `total_cost_usd` — оцінка близько $0.17–0.18 на запуск, $0.80 за обидві спроби (оцінка, не рахунок);
  - підписка Claude Team — шість запусків лімітів не вичерпали.

  Що зламалось і що змінено — у звіті, розділ «Вартість і ліміти».

### PM

—
