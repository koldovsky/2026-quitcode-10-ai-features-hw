# Здача WS10

## Дані

- Роль: pm
- Команда: property-workflows
- GitHub-логін: solomchaak
- Ваше репо: https://github.com/solomchaak/property-workflows-spec
- SHA: f287b4160a281167acd17a251c86961c353f35f5
- Репо вимог PM: https://github.com/solomchaak/property-workflows-spec
- Прод-URL: —

## PM

### Вимога зрізу 4, готова до eval (трек A)

- Сховище вимог: issues
- Зріз 4: менеджер запуску чи адміністратор вставляє на сторінці запуску текст заявки орендаря чи кошторису підрядника (або завантажує `.txt`), AI пропонує значення, а людина перевіряє й зберігає їх із запуском.
- Roadmap «WS10»: рядок WS10 у https://github.com/solomchaak/property-workflows-spec/issues/1; переставлено й перепозначено (WS9 — умови, необов'язково; WS10 — розбір документа) — https://github.com/solomchaak/property-workflows-spec/issues/1#issuecomment-7240353983
- Вимога зрізу 4: https://github.com/solomchaak/property-workflows-spec/issues/59
- AC відмови, стану й ін'єкції: AC-DOCAI-09 (відмова: не заявка й не кошторис), AC-DOCAI-11 (відмова: порожній текст), AC-DOCAI-12 (відмова: файл не `.txt`), AC-DOCAI-16 (відмова: прямий запит ролі без права), AC-DOCAI-03 (стан: обробка), AC-DOCAI-13 (стан: помічник недоступний, ручне введення), AC-DOCAI-10 (ін'єкція)
- Golden cases: https://github.com/solomchaak/property-workflows-spec/issues/40 — 10 кейсів; точні поля (телефон, категорія, терміновість, позиції, сума, застереження, відмова) окремо від вільного опису, який перевіряється за змістом; складні — 3, 5, 6, 8, 10; відмова — 9; ін'єкція — 10
- Поріг приймання: «At least 8 of 10 cases pass. Case 9 (not a request or an estimate) and case 10 (instruction hidden inside) must always pass.»

### Питання й уточнення (трек B)

- Питання, на які надано відповідь: https://github.com/solomchaak/property-workflows-spec/issues/52, https://github.com/solomchaak/property-workflows-spec/issues/53, https://github.com/solomchaak/property-workflows-spec/issues/54, https://github.com/solomchaak/property-workflows-spec/issues/55, https://github.com/solomchaak/property-workflows-spec/issues/56, https://github.com/solomchaak/property-workflows-spec/issues/57, https://github.com/solomchaak/property-workflows-spec/issues/58, https://github.com/solomchaak/property-workflows-spec/issues/60, https://github.com/solomchaak/property-workflows-spec/issues/61, https://github.com/solomchaak/property-workflows-spec/issues/62
- Зміни вимог із журналом змін: https://github.com/solomchaak/property-workflows-spec/issues/40#issuecomment-6921430462 (кейс 5, правило опису, поріг), https://github.com/solomchaak/property-workflows-spec/issues/59#issuecomment-7228083267 (адміністратор-виконавець), https://github.com/solomchaak/property-workflows-spec/issues/40#issuecomment-7228084393 (кейс 6). Вимогу опубліковано 16.11 і уточнено 27.11 — після строку 12.11.

### Приймання зрізу 4 (трек C)

- Таблиця приймання PM: заповнено: вкладка property-workflows, розробники @yuriivynar, @dmudryk, @OleksandrMartynov, @vsmrnk (оцінки 0–3), @vhrytsyndyshynquitcode, @ylehenkyi-qc (прийнято без тестування, без оцінки: PM передав завдання із запізненням, 28.11 — останній день, коли PM може перевірити, а їхні проди відповідали `"db":"down"`); AC зрізу 4: AC-DOCAI-01 … AC-DOCAI-16
- Golden cases на проді: @yuriivynar: 10/10, прогін 28.11; @dmudryk: 10/10, прогін 28.11; @OleksandrMartynov: 10/10, прогін 28.11 (GC-07 з другої спроби — перша відповідь «помічник недоступний»); @vsmrnk: 5/5 прогнаних (GC-01…05), прогін 28.11; GC-06…10 не прогнано — вичерпано денний ліміт моделей; @vhrytsyndyshynquitcode, @ylehenkyi-qc: не прогнано — прод не відповідав, 28.11
- Звірка зі звітом eval: @yuriivynar — у docai-v4 9/10 (GC-06 FAIL за правилом до рішення #60), docai-v5 10/10, мій прогін 10/10 — збігається; @dmudryk — docai-v2 10/10, мій 10/10 — розбіжностей немає; @OleksandrMartynov — звіт 9/10, мій 10/10, поріг в обох досягнуто; @vsmrnk — звіт eval 18.11 10/10, мій прогін 5/5 на тих самих кейсах — розбіжностей немає
- Відхилення від вимог: відхилень немає
- Підпис у репо розробників: https://github.com/yuriivynar/property-workflows/pull/135#issuecomment-7229576134, https://github.com/dmudryk/property-workflows/pull/61#issuecomment-7239849340, https://github.com/OleksandrMartynov/property-workflows/pull/98#issuecomment-7240197139, https://github.com/vsmrnk/property-workflows/pull/59#issuecomment-7240532901, https://github.com/vhrytsyndyshynquitcode/property-workflows/pull/57#issuecomment-7240532024, https://github.com/ylehenkyi-qc/property-workflows/pull/65#issuecomment-7240532446
- Повторні перевірки: «Виправлено» не надходило

## Розробник

—

## Бонус

—
