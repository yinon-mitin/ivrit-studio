# Spec: Ivrit Studio («Ivrit Cheatsheet»)

> Источник идеи: `docs/ideas/ivrit-studio.md` (MVP-версия с тренажёром). 2026-10-20 проект развёрнут из «шпаргалка + тренажёр» в **веб-шпаргалку**: план `tasks/plan.md`. Эта спецификация — контракт для реализации; при расхождении приоритет у неё.

## Objective
Статический сайт-шпаргалка по ивриту для учеников ульпана уровня Алеф (автор + одногруппники) с современным типографским дизайном («типографский справочник»: тёплая бумага, крупный иврит, тонкие линейки вместо карточек). Цель автора: **читать печатный и прописной иврит с огласовками без запинок**, держа под рукой аккуратную справку.

Материал разбит на **части** (Чтение, Фразы, Лексика, Грамматика). Часть — одна прокручиваемая страница; на ней разделы идут заголовками, группы раздела — подзаголовками.

Сквозные функции: светлая/тёмная тема (по системе + переключатель), огласовки вкл/выкл, один переключатель языка **EN/RU** (английский по умолчанию; меняет и интерфейс, и показанный перевод), поиск по всем разделам, режим «скрыть перевод» для самопроверки, версия для печати (A4).

Нет: тренажёра (Блица), прогресса и его переноса, экспорта в Anki, еженедельных файлов данных. Контент меняется редко и правится прямо в файлах разделов.

### User stories
- Как ученик, я открываю «Чтение» на телефоне и листаю алфавит печатным и прописным шрифтом, огласовки и гереш.
- Как ученик, я выключаю огласовки, чтобы проверить, читаю ли без них.
- Как ученик, я включаю «скрыть перевод», читаю слова и открываю перевод тапом, чтобы проверить себя.
- Как ученик, я ищу «France», «שלום» или «страна» и сразу вижу запись.
- Как ученик, я переключаю перевод на русский.
- Как ученик, я печатаю «Слова» на A4.
- Как автор, я добавляю запись или раздел, правя только `data/`, прогоняю `npm run check` — сайт обновлён.

## Capability Map

| Module id | Ответственность | Зависит от |
|---|---|---|
| `content-schema` | Формат JSON частей и разделов, загрузка, `scripts/validate.mjs` | — |
| `app-shell` | `index.html`, роутинг, шапка, навигация по частям, оглавление, шрифты, токены дизайна | — |
| `settings` | Тема, огласовки, язык, «скрыть перевод»; хранение | app-shell |
| `cheatsheet` | Рендер разделов: 4 вида `view` | content-schema, app-shell, settings |
| `search` | Нормализация и поиск по записям, вид результатов | content-schema, cheatsheet |
| `print` | Стили печати | cheatsheet |
| `content` | Данные разделов | content-schema |

## Tech Stack
- HTML5, CSS (custom properties, grid, `clamp()`), JavaScript ES2022 modules. **Ноль зависимостей в рантайме**, нет сборки, нет фреймворка.
- Данные: JSON (браузер парсит нативно).
- Шрифты (self-hosted, SIL OFL 1.1, урезанные `woff2`): **Heebo** — печатный и интерфейс; **Gveret Levin** — пропись. Латинские заголовки — системный serif (`'Iowan Old Style', Charter, Georgia, 'Noto Serif', serif`), без загрузки. Кириллица → `system-ui` (в Heebo её нет).
- Флаги: эмодзи. Озвучки нет.
- Dev: Node 26 (`node:test` + встроенное покрытие), `@playwright/test` 1.64.1 и `@axe-core/playwright` 4.14.0 (точные версии; браузеры chromium + webkit), `pipx run` + `fonttools[woff]` для урезания шрифтов (разово). Проверки качества — см. `CONSTRAINTS.md`.
- CI: GitHub Actions `.github/workflows/check.yml` — **только проверки**; деплой остаётся «из ветки» без сборки.
- Хостинг: GitHub Pages, публичный репозиторий, Deploy from branch `main` / `(root)`, `.nojekyll`. Лицензия кода MIT.
- Браузеры: актуальные Chrome, Safari, Firefox, Edge; iOS Safari 16+.

## Commands
```sh
npm install                              # только dev-зависимости (Playwright)
npx playwright install chromium webkit   # браузеры для e2e

npm run serve       # python3 -m http.server 8000  → http://localhost:8000
node scripts/validate.mjs   # проверка всех data/**/*.json (то же делает tests/unit/data.test.mjs)
npm test            # node --test 'tests/unit/**/*.test.mjs'
npm run e2e         # playwright test (все 3 проекта)
npm run check:fast  # floor guard + gitleaks                          — после правок (< 5 с)
npm run check:task  # = npm run check: fast + unit c покрытием + e2e chromium + axe — перед коммитом (≤ 90 с)
npm run check:full  # task + webkit + Semgrep + osv-scanner           — перед push, в CI
npm run fonts       # sh scripts/subset-fonts.sh   — пересобрать woff2 (разово / при смене шрифта)

git push origin main   # деплой (GitHub Pages публикует main / root)
```

## Project Structure
```
index.html                 → единственная страница; <meta name="robots" content="noindex">
.nojekyll
assets/
  css/app.css              → токены дизайна (:root, dark), раскладка, виды, печать
  js/
    main.js                → bootstrap, hash-роутер, сборка экрана           [DOM]
    ui/                    → шапка, навигация, настройки, оглавление, поиск  [DOM]
    views/                 → letter-grid.js, letter-rows.js, list.js, table.js [DOM]
    storage.js             → обёртка localStorage (try/catch)                 [DOM]
    loader.js              → fetch index/sections                             [DOM]
    core/                  → ТОЛЬКО [pure]-модули; покрытие считается по этой папке
      i18n.js              → строки интерфейса { en, ru }
      hebrew.js            → stripNikud, isHebrew и т. п.
      content.js           → части, группы, разбор маршрута
      schema.js            → validateSection/validateAll (общий для сайта и scripts/)
      settings.js          → значения по умолчанию и разбор сохранённых настроек
      search.js            → нормализация и поиск
  fonts/                   → heebo.woff2, gveret-levin.woff2, OFL-*.txt
data/
  index.json               → части и порядок разделов в них
  sections/<id>.json       → alphabet, nikud, countries, geresh, vocab, greetings, gender-number
scripts/validate.mjs, scripts/subset-fonts.sh, scripts/floor-guard.mjs, scripts/diff-coverage.mjs
tests/unit/*.test.mjs      → node:test для core/ + data.test.mjs (валидатор по data/)
tests/e2e/*.spec.mjs       → Playwright (переполнение по ширине, axe, вес, внешние запросы, сценарии)
.github/workflows/check.yml
docs/ideas/ivrit-studio.md
SPEC.md  CONSTRAINTS.md  CLAUDE.md  README.md  LICENSE  package.json  playwright.config.mjs
.semgrep.yml  .gitleaks.toml  .nojekyll
```
Правило: всё в `assets/js/core/` не трогает DOM/`window`/`fetch` и импортируется из Node — так тестируется без браузера. Всё, что трогает DOM, живёт вне `core/`.

## Data Contract (`content-schema`)

### Entry (общая форма записи)
```jsonc
{
  "id": "countries.france",        // уникален глобально, "<section>.<slug>", НИКОГДА не переименовывается
  "he": "צָרְפַת",                  // иврит с огласовками
  "plain": "צרפת",                 // опционально: написание без огласовок, если оно отличается от stripNikud(he) (ктив мале)
  "translit": "Tsarfat",
  "en": "France",
  "ru": "Франция",
  "group": "eu-1",                 // id группы раздела (обязателен, если у раздела есть группы)
  "verified": false,               // true ставит только человек после сверки огласовок
  "emoji": "🇫🇷",                   // опционально
  "swatch": "#d32f2f",             // опционально (цвета)
  "forms": { "ms": "…", "fs": "…", "mp": "…", "fp": "…" },  // опционально (род/число)
  "related": [{ "he": "צָרְפָתִית", "translit": "Tsarfatit", "en": "French", "ru": "французский" }],
  "note": { "en": "…", "ru": "…" } // опционально
}
```
Транслитерация: ח/כ → `kh`, צ → `tz`, ש → `sh`, ג׳ → `j`, צ׳ → `ch`, ז׳ → `zh` (`ch` занят под צ׳).

### Section (`data/sections/<id>.json`)
```jsonc
{
  "id": "countries",
  "title": { "en": "Countries & languages", "ru": "Страны и языки" },
  "icon": "אֶרֶץ",                 // опционально: буква или короткое слово, рисуется прописью в оглавлении
  "view": "list",                  // letter-grid | letter-rows | list | table
  "nikudToggle": true,             // false для alphabet: дагеш и точки שׁ/שׂ не убираются
  "groups": [{ "id": "eu-1", "title": { "en": "EU I", "ru": "ЕС I" }, "view": "list" }],  // опционально; view группы переопределяет раздел
  "items": [ /* Entry[] */ ]
}
```
Группа вида `letter-rows` без собственных записей показывает все записи раздела (вкладка алфавита «печатные над прописными»).

### Index (`data/index.json`)
```jsonc
{
  "parts": [
    { "id": "reading", "title": { "en": "Reading", "ru": "Чтение" }, "sections": ["alphabet", "nikud", "geresh"] },
    { "id": "phrases", "title": { "en": "Phrases", "ru": "Фразы" }, "sections": ["greetings"] },
    { "id": "words", "title": { "en": "Vocabulary", "ru": "Лексика" }, "sections": ["vocab", "countries"] },
    { "id": "grammar", "title": { "en": "Grammar", "ru": "Грамматика" }, "sections": ["gender-number"] }
  ]
}
```
Новый раздел = файл `data/sections/<id>.json` + его id в `sections` одной части.

### Validator (`scripts/validate.mjs`, через `schema.js`) — падает с ненулевым кодом, если:
- `id` записи не уникален или не соответствует `<section>.<slug>`;
- нет обязательных полей (`id`, `he`, `translit`, `en`, `ru`, `verified`);
- `he` не содержит ни одной еврейской буквы;
- `view` раздела или группы неизвестен;
- у раздела есть группы, а у записи нет `group`, или `group` ссылается на несуществующую группу;
- id части не уникален, у части нет `title.en`/`title.ru`, раздел из `index.json` не имеет файла, файл раздела не входит ровно в одну часть.
Предупреждение (не ошибка): количество записей с `verified: false`.

## Behaviour Contracts

**Огласовки (`hebrew.js`).** `stripNikud` удаляет U+0591–U+05AF, U+05B0–U+05BD, U+05BF, U+05C1, U+05C2, U+05C4, U+05C5, U+05C7; сохраняет макаф U+05BE, гереш U+05F3, гершаим U+05F4, апостроф. При выключенных огласовках показывается `plain ?? stripNikud(he)`. Разделы с `nikudToggle: false` не меняются.

**Раскладка (`app-shell`).** Страница прокручивается по вертикали; **горизонтальной прокрутки нет** ни на одном экране. Шапка липкая: на ноутбуке одна строка (марка, части, кнопки) ≤ 64 px; на телефоне две — марка и кнопки, под ними прокручиваемая строка частей — ≤ 96 px. Части всегда видны, не в меню. Тест-вьюпорты: **360×640**, **390×664**, **1280×720**. Иврит всегда в элементах с `lang="he" dir="rtl"`; иврит в записях — не меньше 22 px на телефоне, буквы алфавита — не меньше 40 px.

**Настройки (`settings`).** `{ theme: system|light|dark, nikud: boolean, lang: en|ru, hide: boolean }`, по умолчанию `system`, `true`, `en`, `false`. `lang` задаёт язык интерфейса и показанный перевод записей (`en` или `ru`). Хранятся в `localStorage` (`ivrit-studio:settings`) через `storage.js`; битое или старое значение заменяется значением по умолчанию поле за полем; без хранилища сайт работает, настройки живут до перезагрузки.

**Роутинг (hash).** `#/` — оглавление (части и их разделы); `#/<part>` — страница части; `#/<part>/<section>` — та же страница, прокрученная к разделу. Старые адреса `#/<section>` и `#/<section>/<group>` ведут на часть раздела, к разделу или группе. Всё неизвестное — оглавление.

**Поиск (`search.js`).** Запрос и поля нормализуются: нижний регистр, `stripNikud`, без гереша/апострофов. Совпадение — подстрока в `he`, `plain`, `related[].he`, `translit`, `en` или `ru`. Пустой запрос — обычная страница. Результаты сгруппированы по разделам, каждый ведёт к своему месту; количество объявляется через `aria-live`. `/` ставит фокус в поиск, `Esc` очищает.

**Скрыть перевод.** При `hide: true` транслитерация и перевод записей в видах `list` и `table` скрыты; каждое скрытое значение — кнопка «показать перевод» (`aria-expanded`), открывается кликом, Enter или Space. Имена букв алфавита не скрываются. В печати всё видно.

**Печать.** `@media print`: без шапки, навигации, поиска и кнопок; чёрный по белому; группы не разрываются; списки в две колонки; размеры иврита в pt.

## Code Style
ES-модули, только именованные экспорты, `const` по умолчанию, чистые функции без классов, где это возможно. 2 пробела, точки с запятой, одинарные кавычки. Файлы `kebab-case.js`, функции `camelCase`, константы `UPPER_SNAKE`. Экспортируемые функции — с JSDoc-типами. Комментарии и код на английском. Никаких глобальных переменных, кроме точки входа `main.js`.

```js
// assets/js/core/content.js

/**
 * The entries shown in a group, in data order.
 * @param {{ items: Array<{ group?: string }> }} section
 * @param {{ id: string }} group
 */
export function itemsOfGroup(section, group) {
  return section.items.filter((item) => item.group === group.id);
}
```

## Testing Strategy
- **Unit (`node --test`, `node:assert/strict`)** — для всех `[pure]`-модулей, пишутся до реализации: `hebrew` (stripNikud на примерах `שָׁלוֹם`, `בּ`, `צ'ילה`, `plain`), `schema` (каждое правило валидатора — свой тест), `content` (группы, разбор маршрута, старые адреса), `settings` (значения по умолчанию, разбор старых и битых значений), `search` (с огласовками и без, регистр, RU/EN, пустой запрос), `i18n`.
- **E2E (Playwright: chromium 360×640 и 1280×720, webkit 390×664; webServer = `python3 -m http.server`)**:
  - для каждого маршрута (оглавление, каждая часть, результаты поиска): `scrollWidth <= clientWidth` у документа, с огласовками и без, на обоих языках;
  - axe (wcag2a, wcag2aa, wcag21aa): 0 critical/serious на оглавлении, каждой части, результатах поиска и с включённым «скрыть перевод» — в светлой и тёмной теме;
  - переключатель темы и `prefers-color-scheme` (оба значения) + скриншоты в обеих темах;
  - огласовки вкл/выкл меняют текст иврита, кроме `alphabet`; EN/RU меняет интерфейс и переводы;
  - поиск, «скрыть перевод», печать в PDF A4 без горизонтального обрезания;
  - нет ни одного запроса к внешним доменам; вес первой загрузки ≤ 200 КБ.
- **Данные:** `tests/unit/data.test.mjs` прогоняет валидатор по `data/` — часть `npm run check:task`.
- **Пороги** (покрытие, вес, axe и т. д.) — в `CONSTRAINTS.md`.
- **Ручная проверка:** вид прописи против почерка учительницы; распечатка A4.

## Boundaries
- **Always:**
  - соблюдать `CONSTRAINTS.md`; `npm run check:task` перед каждым коммитом, `npm run check:full` перед push;
  - логику писать в `[pure]`-модулях, тест — до реализации;
  - данные и код — в разных коммитах; изменение контента меняет только `data/`;
  - новые записи — с `verified: false`;
  - `localStorage` — только через `storage.js`.
- **Ask first:**
  - любая новая зависимость (рантайм — по умолчанию нет);
  - изменение формата данных;
  - переименование `id`;
  - выставление `verified: true`;
  - смена шрифтов;
  - новые части, разделы или view вне карты модулей;
  - `git push`, домен.
- **Never:**
  - внешние запросы в рантайме (CDN, Google Fonts, аналитика, трекеры);
  - копирование упражнений и страниц учебника;
  - коммит `node_modules` или секретов;
  - отмечать огласовки проверенными без подтверждения человека;
  - озвучка/TTS, SVG-флаги, фреймворки, шаг сборки, YAML (пересматривается только по запросу автора);
  - удалять или ослаблять тесты, чтобы стало зелёным.

## Success Criteria
1. `npm run check:full` и CI зелёные (все пороги из `CONSTRAINTS.md`).
2. Все части открываются без горизонтальной прокрутки на 360×640, 390×664 и 1280×720.
3. Алфавит: 22 буквы + 5 конечных + варианты בּ/ב, כּ/כ, פּ/פ, שׁ/שׂ, каждая печатным (Heebo) и прописным (Gveret Levin) начертанием; отдельная группа «печатные над прописными».
4. Переключатели темы, огласовок, языка и «скрыть перевод» работают и запоминаются.
5. Поиск находит запись по ивриту с огласовками и без, по транслиту и по переводу.
6. Печать части в A4 читается без обрезания.
7. Первая загрузка ≤ 200 КБ, ноль внешних запросов, каждый шрифт ≤ 60 КБ.
8. Сайт опубликован на `https://<user>.github.io/ivrit-studio/` и открывается в iOS Safari и Chrome на Android.
9. Новая запись или раздел: правка только `data/`, `node scripts/validate.mjs` проходит без правок кода.

## Open Questions
- Добавить настоящие приветствия (שָׁלוֹם, לְהִתְרָאוֹת, תּוֹדָה) группой в «Фразы»?
- Объединить «Грамматику» со «Словами», пока в ней один раздел?
- Кто сверяет огласовки и как отмечаем: автор через Dicta Nakdan, сомнительное — учительнице?
