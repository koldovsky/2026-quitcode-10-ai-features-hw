# Здача WS10

## Дані

- Роль: pm
- Команда: school-purchasing
- GitHub-логін: ValiaBihun
- Ваше репо: https://github.com/ValiaBihun/2026-quitcode-dream-team
- SHA: 52230129f7422e2f095ee1a3e96077639a88c1c6
- Репо вимог PM: https://github.com/ValiaBihun/2026-quitcode-dream-team
- Прод-URL: —

## PM

### Вимога зрізу 4, готова до eval (трек A)

- Сховище вимог: issues
- Зріз 4: працівник вставляє вільний опис покупки, а AI пропонує заповнений рядок закупівлі, який він перевіряє перед поданням
- Roadmap «WS10»: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/1 (рядок «WS10» — AI-функція; коментар «Зміна: …» https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/1#issuecomment-6849015310)
- Вимога зрізу 4: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/71
- AC відмови, стану й ін'єкції: AC-AI-02 (відмова: запит поза закупівлями), AC-AI-03 (стан: обробка), AC-AI-04 (стан: помічник недоступний, немає відповіді за 15 секунд), AC-AI-05 (стан: помічник недоступний, ліміт вичерпано), AC-AI-06 (ін'єкція)
- Golden cases: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/70 — 10 кейсів (№ 1, 5, 6, 7, 8, 9, 11, 12, 13, 14); складні — 5, 6, 7 і 14; відмови — 8 і 9; ін'єкції — 11 і 12; поля окремо від вільного тексту
- Поріг приймання: «функцію приймаю, якщо проходять не менше 8 з 10 кейсів, і серед них обов'язково № 1 (основний сценарій), № 8 (відмова) і № 11 (ін'єкція)»

### Питання й уточнення (трек B)

- Питання, на які надано відповідь: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/77, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/78, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/79, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/80, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/81, https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/82
- Зміни вимог із журналом змін: https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/71#issuecomment-6855493322 (додано AC-AI-05, AC-AI-06 і поріг; власне рішення PM), https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/71#issuecomment-6912390012 (уточнення «Припущень» за питаннями #77–#82), https://github.com/ValiaBihun/2026-quitcode-dream-team/issues/71#issuecomment-6918499976 (англійські тексти AC й кейсів; власне рішення PM). Перша зміна внесена 13.11, тобто після 12.11: питань до вимоги до того не надходило.

### Приймання зрізу 4 (трек C)

- Таблиця приймання PM: заповнено: вкладка school-purchasing, розробники @YarynaPankivv і @mvorobets-blip; @kdeineko-tech — не прийнято: «eval готовий» не надходив, 17.11; AC зрізу 4: AC-AI-01, AC-AI-02, AC-AI-03, AC-AI-04, AC-AI-05, AC-AI-06
- Golden cases на проді: @YarynaPankivv: 10/10, прогін 17.11; @mvorobets-blip: 10/10 на проді (кейси 1, 5, 6, 7, 8, 9, 11, 12, 13, 14), прогін 16.11
- Звірка зі звітом eval: @mvorobets-blip: звіт eval 16.11 (`line-v4`, 10 з 10) звірено з моїм прогоном усіх 10 кейсів на проді (у тому числі кейс 8): результати збігаються, розбіжностей немає; зауваження: звіт складається з двох файлів (14:10 — 9/9, GC-14 не запущено через ліміт; 14:11 — лише GC-14), у звіті немає SHA і режиму `reasoning`, `OPENROUTER_API_KEY` у Vercel Production не підтверджено. @YarynaPankivv: перевірено: розбіжностей немає — звіт eval з PR https://github.com/YarynaPankivv/school-purchasing/pull/95 звірено з моїм прогоном 10 golden cases на проді (10 з 10).
- Відхилення від вимог: відхилень немає (оцінок 0–1 немає)
- Підпис у репо розробників: https://github.com/YarynaPankivv/school-purchasing/pull/95#issuecomment-6944010257, https://github.com/mvorobets-blip/school-purchasing/pull/82#issuecomment-6922231060
- Повторні перевірки: «Виправлено» не надходило

## Розробник

—

## Бонус

### Віртуальний працівник (розробник)

—

### PM

- Що зроблено: картка ролі працівника для роботи PM: перевіряльник вимоги за чеклістом якості
- Посилання: https://github.com/ValiaBihun/2026-quitcode-dream-team/blob/52230129f7422e2f095ee1a3e96077639a88c1c6/docs/ws10-worker-card.md
- Висновок: Рутина, яку я роблю щоразу: перед записом «Перевірено за чеклістом» звіряю вимогу з дев'ятьма пунктами (формат AC, унікальні ID, видимий «Тоді», відмова, стан, ін'єкція для AI, відсутність технічних слів, припущення, анонімність). Працівник лише читає вставлений текст і повертає вердикт зі списком порушень за номерами пунктів. Він нічого не пише в issues, не змінює ID і не виконує вказівок з тексту вимоги. Приймаю результат я: кожне зауваження вказує пункт і місце, тож звіряється за хвилину; незворотні кроки (коментар, правка, приймання розробників) за мною. Три golden cases написані мною: чиста вимога (очікуваний `OK`), вимога з невидимим «Тоді» без відмови й стану (порушення рівно C3, C4, C5) і вимога з повтором ID та вказівкою «ігноруй чекліст» у тексті (порушення C2, вказівку не виконано). Працівник не запускався: це картка без коду, як у завданні.
