# Spec: Ivrit Studio («Ivrit Cheatsheet»)

> Источник идеи и обоснования решений: `docs/ideas/ivrit-studio.md`. Эта спецификация — контракт для реализации; при расхождении приоритет у неё.

## Objective
Статический сайт-шпаргалка и тренажёр иврита для учеников ульпана уровня Алеф (автор + одногруппники). Цель автора: через месяц **читать печатный и прописной иврит с огласовками без запинок**.

Каждый раздел — JSON-файл с данными, у которого два режима:
- **Cheatsheet** — справка, которая целиком помещается на экран (без вертикальной/горизонтальной прокрутки и свайпов); большие разделы делятся на подвкладки (tabs), переключаемые тапом.
- **Blitz** — тренировка: «выбор из 4» и «карточки» (перевернуть → «знал / не знал»), с учётом ошибок (коробки Лейтнера) и похожими вариантами-ловушками.

Сквозные функции: светлая/тёмная тема (по системе + переключатель), огласовки вкл/выкл, интерфейс EN/RU, переводы EN (основной) + RU (дополнительный, включается), прогресс в `localStorage` с экспортом/импортом и слиянием, экспорт раздела в Anki (TSV).

**Главное ограничение:** минимум токенов на разработку и поддержку. Еженедельное пополнение = только JSON-данные, код не меняется.

### User stories
- Как ученик, я открываю «Алфавит» на телефоне и вижу все буквы печатным и прописным шрифтом на одном экране.
- Как ученик, я выключаю огласовки, чтобы проверить, читаю ли без них.
- Как ученик, я прохожу Блиц по прописным буквам, и буквы, на которых ошибаюсь, возвращаются чаще, а варианты ответа — похожие буквы (ה/ח/ת).
- Как ученик, я экспортирую прогресс с телефона, вставляю его на ноутбуке, и прогресс с обоих устройств объединяется.
- Как ученик, я скачиваю раздел для Anki.
- Как автор, после урока я даю агенту сводку учительницы, получаю `data/weeks/<дата>.json`, прогоняю `npm run check` и пушу — сайт обновлён.

## Capability Map

| Module id | Ответственность | Зависит от |
|---|---|---|
| `content-schema` | Формат JSON разделов и недель, загрузка и слияние данных, `scripts/validate.mjs` | — |
| `app-shell` | `index.html`, роутинг, шапка, вкладки, настройки (тема, огласовки, язык), шрифты, правило «один экран» | — |
| `cheatsheet` | Рендер вида Cheatsheet: 4 типа `view` | content-schema, app-shell |
| `progress` | Хранилище, экспорт/импорт, слияние, версия формата | — |
| `blitz` | Выбор карточек, варианты-ловушки, режимы «выбор» и «карточки» | content-schema, app-shell, progress |
| `anki-export` | TSV по разделу | content-schema |
| `content` | Данные разделов | content-schema |

**Порядок сборки:** `content-schema` → `app-shell` → `cheatsheet` + `content/alphabet` → `progress` → `blitz` → `anki-export` → `content` (nikud, countries, geresh, неделя 2026-10-11).

**MVP:** все модули + разделы `alphabet`, `nikud`, `countries`, `geresh`, `vocab` (слова из файла недели 2026-10-11).
**После MVP (только данные + при необходимости view `forms-table`):** `colors`, `days`, `months`, `gender-number`, `greetings`.

## Tech Stack
- HTML5, CSS (custom properties, grid, `clamp()`, `100dvh`), JavaScript ES2022 modules. **Ноль зависимостей в рантайме**, нет сборки, нет фреймворка.
- Данные: JSON (браузер парсит нативно).
- Шрифты (self-hosted, SIL OFL 1.1, урезанные `woff2`): **Heebo** — печатный и интерфейс; **Gveret Levin** — пропись. Кириллица → `system-ui` (в Heebo её нет).
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
  css/app.css              → токены темы (:root, dark), сетки, правило «один экран»
  js/
    main.js                → bootstrap, hash-роутер, сборка экрана           [DOM]
    ui/                    → шапка, вкладки, настройки, экраны progress/home [DOM]
    views/                 → letter-grid.js, letter-rows.js, card-grid.js, table.js [DOM]
    blitz-view.js          → UI Блица                                         [DOM]
    storage.js             → обёртка localStorage (try/catch)                 [DOM]
    loader.js              → fetch index/sections/weeks → core/content.js     [DOM]
    core/                  → ТОЛЬКО [pure]-модули; покрытие считается по этой папке
      i18n.js              → строки интерфейса { en, ru }
      hebrew.js            → stripNikud, isHebrew и т. п.
      content.js           → слияние недель в разделы, выборка вкладок
      schema.js            → validateSection/validateWeek/validateAll (общий для сайта и scripts/)
      progress.js          → parse/serialize/merge/record
      blitz.js             → выбор карточки, ловушки, Лейтнер
      anki.js              → toTsv(section)
  fonts/                   → heebo.woff2, gveret-levin.woff2, OFL-*.txt
data/
  index.json               → порядок разделов и список недель
  sections/<id>.json       → alphabet, nikud, countries, geresh, vocab, …
  weeks/<YYYY-MM-DD>.json  → материал недели
scripts/validate.mjs, scripts/subset-fonts.sh, scripts/floor-guard.mjs, scripts/diff-coverage.mjs
tests/unit/*.test.mjs      → node:test для core/ + data.test.mjs (валидатор по data/)
tests/e2e/*.spec.mjs       → Playwright (один экран, axe, вес, внешние запросы, сценарии)
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
  "tab": "eu-1",                   // id подвкладки раздела (если есть вкладки)
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
  "icon": "אֶרֶץ",                 // опционально: буква или короткое слово, рисуется прописью на плитке раздела на главной
  "view": "card-grid",             // letter-grid | letter-rows | card-grid | table (| forms-table после MVP)
  "nikudToggle": true,             // false для alphabet: дагеш и точки שׁ/שׂ не убираются
  "tabs": [{ "id": "eu-1", "title": { "en": "EU I", "ru": "ЕС I" }, "view": "card-grid" }],  // view вкладки переопределяет раздел
  "blitz": [{ "id": "flag-to-he", "ask": "emoji", "answer": "he" }],
  "confusables": [["alphabet.he", "alphabet.het", "alphabet.tav"]],
  "items": [ /* Entry[] */ ]
}
```
Поля для `ask`/`answer`: `he`, `heCursive` (тот же `he`, шрифт прописи), `translit`, `meaning` (en, + ru если включён), `emoji`, `related.he`, `forms.<ms|fs|mp|fp>`.

### Week (`data/weeks/<YYYY-MM-DD>.json`)
```jsonc
{
  "week": "2026-10-11",
  "letters": ["א", "ב", "ג"],      // буквы, пройденные к этой неделе (фильтр Блица по алфавиту)
  "items": [{ "section": "vocab", /* Entry без tab → tab = "week-2026-10-11" */ }]
}
```
При загрузке записи недели добавляются в указанный раздел; вкладка недели создаётся автоматически.

### Validator (`scripts/validate.mjs`, через `schema.js`) — падает с ненулевым кодом, если:
- `id` не уникален или не соответствует `<section>.<slug>`;
- нет обязательных полей (`id`, `he`, `translit`, `en`, `ru`, `verified`);
- `he` не содержит ни одной еврейской буквы;
- `tab`, `confusables`, `blitz.ask/answer`, `week.items[].section` ссылаются на несуществующее;
- в одной вкладке больше 14 записей (кроме view `letter-grid`/`letter-rows`, у которых свой лимит 24).
Предупреждение (не ошибка): количество записей с `verified: false`.

## Behaviour Contracts

**Огласовки (`hebrew.js`).** `stripNikud` удаляет U+0591–U+05AF, U+05B0–U+05BD, U+05BF, U+05C1, U+05C2, U+05C4, U+05C5, U+05C7; сохраняет макаф U+05BE, гереш U+05F3, гершаим U+05F4, апостроф. При выключенных огласовках показывается `plain ?? stripNikud(he)`. Разделы с `nikudToggle: false` не меняются.

**Один экран (`app-shell`).** Корневой контейнер `height: 100dvh`, шапка + вкладки + контент; размеры шрифтов и ячеек через `clamp()`/контейнерные единицы. Ни один вид Cheatsheet и Блица не создаёт прокрутку. Тест-вьюпорты: **360×640** (худший телефон), **390×664** (iPhone с панелями Safari), **1280×720** (ноутбук) — в самом плотном режиме (переводы EN+RU включены).

**Настройки.** `theme: system|light|dark` (по умолчанию `system`), `nikud: true`, `uiLang: en|ru` (по умолчанию из `navigator.language`), `showRu: false`. Хранятся в `localStorage` отдельно от прогресса. Иврит всегда в элементах с `lang="he" dir="rtl"`.

**Роутинг (hash).** `#/` — главная (сетка разделов), `#/<section>/<tab?>` — Cheatsheet, `#/<section>/blitz` — Блиц, `#/progress` — экспорт/импорт.

**Блиц (`blitz.js`).** Сессия — 10 вопросов. Ключ карточки: `"<itemId>|<templateId>"`. Коробки Лейтнера 0–5 (0 = новая); верно → `box + 1` (макс. 5), неверно → `box = 1`. Вес выбора: `{0: 4, 1: 16, 2: 8, 3: 4, 4: 2, 5: 1}`, не больше 3 новых карточек за сессию. Варианты-ловушки (3 шт.): сначала из личных путаниц (`confusedWith`), затем из группы `confusables`, затем из той же вкладки, затем из раздела; без дублей, правильный ответ всегда среди 4. Для `alphabet` при наличии недель — по умолчанию только буквы из последнего `letters`. ГСЧ передаётся параметром (детерминированные тесты).

**Прогресс (`progress.js`).**
```jsonc
{ "app": "ivrit-studio", "version": 1, "exportedAt": "2026-10-19T12:00:00Z",
  "cards": { "alphabet.bet|print-to-name": { "box": 2, "seen": 5, "wrong": 1,
             "lastSeen": "2026-10-19T11:58:00Z", "confusedWith": { "alphabet.kaf": 1 } } } }
```
- Ключ `localStorage`: `ivrit-studio:progress`. Любой доступ в `try/catch`; без хранилища сайт работает, прогресс живёт до перезагрузки.
- Экспорт: скачать `ivrit-progress-YYYY-MM-DD.json` и «скопировать как текст».
- Импорт: файл или вставленный текст → `merge(local, incoming)`: объединение ключей, при конфликте побеждает более поздний `lastSeen`. Чужой `app`, более новая `version` или битый JSON → понятное сообщение, локальные данные не меняются. Старая `version` → миграция.

**Anki (`anki.js`).** UTF-8 TSV, первые строки `#separator:tab`, `#html:false`, `#tags column:3`; колонки: лицевая (`he`), оборот (`translit — en / ru`), теги (`ivrit::<section> ivrit::<tab>`). Табы и переводы строк в полях заменяются пробелом. Файл `ivrit-<section>.tsv`.

## Code Style
ES-модули, только именованные экспорты, `const` по умолчанию, чистые функции без классов, где это возможно. 2 пробела, точки с запятой, одинарные кавычки. Файлы `kebab-case.js`, функции `camelCase`, константы `UPPER_SNAKE`. Экспортируемые функции — с JSDoc-типами. Комментарии и код на английском. Никаких глобальных переменных, кроме точки входа `main.js`.

```js
// assets/js/progress.js

/** @typedef {{ box: number, seen: number, wrong: number, lastSeen: string, confusedWith: Record<string, number> }} CardStats */

/**
 * Merges two progress snapshots; the newer record wins per card.
 * @param {Record<string, CardStats>} local
 * @param {Record<string, CardStats>} incoming
 * @returns {Record<string, CardStats>}
 */
export function mergeCards(local, incoming) {
  const merged = { ...local };
  for (const [key, card] of Object.entries(incoming)) {
    const current = merged[key];
    if (!current || card.lastSeen > current.lastSeen) merged[key] = card;
  }
  return merged;
}
```

## Testing Strategy
- **Unit (`node --test`, `node:assert/strict`)** — для всех `[pure]`-модулей, пишутся до реализации:
  `hebrew` (stripNikud на примерах `שָׁלוֹם`, `בּ`, `צ'ילה`, `plain`), `schema` (каждое правило валидатора — свой тест), `progress` (merge: объединение, побеждает новее, отказ на чужой/новой версии и битом вводе без потери данных, миграция), `blitz` (Лейтнер, веса с фиксированным ГСЧ, ловушки без дублей и с правильным ответом, приоритет путаниц, лимит новых), `anki` (заголовки, экранирование, теги), `content` (слияние недель в разделы).
- **E2E (Playwright: chromium 360×640 и 1280×720, webkit 390×664; webServer = `python3 -m http.server`)**:
  - для каждого раздела × вкладки × Блица: `scrollHeight <= clientHeight` и `scrollWidth <= clientWidth` у документа и контейнера контента, с огласовками и без, при `showRu: true`;
  - axe (wcag2a, wcag2aa, wcag21aa): 0 critical/serious на главной, каждом разделе, Блице и экране прогресса — в светлой и тёмной теме;
  - переключатель темы и `prefers-color-scheme` (оба значения) + скриншоты главной в обеих темах;
  - огласовки вкл/выкл меняют текст иврита, кроме `alphabet`;
  - Блиц: 10 вопросов проходятся, ошибка отражается в прогрессе;
  - экспорт → импорт в **другом** браузерном контексте даёт объединённый прогресс;
  - скачивание TSV из раздела;
  - нет ни одного запроса к внешним доменам; вес первой загрузки ≤ 200 КБ.
- **Данные:** `tests/unit/data.test.mjs` прогоняет валидатор по `data/` — часть `npm run check:task`.
- **Пороги** (покрытие, вес, axe и т. д.) — в `CONSTRAINTS.md`.
- **Ручная проверка (один раз):** импорт TSV в Anki; вид прописи против почерка учительницы.

## Boundaries
- **Always:**
  - соблюдать `CONSTRAINTS.md`; `npm run check:task` перед каждым коммитом, `npm run check:full` перед push;
  - логику писать в `[pure]`-модулях, тест — до реализации;
  - данные и код — в разных коммитах; еженедельное пополнение меняет только `data/`;
  - новые записи — с `verified: false`;
  - `localStorage` — только через `storage.js`.
- **Ask first:**
  - любая новая зависимость (рантайм — по умолчанию нет);
  - изменение формата данных или прогресса (требует bump `version` + миграцию);
  - переименование `id`;
  - выставление `verified: true`;
  - смена шрифтов;
  - новые разделы или view вне карты модулей;
  - `git push`, создание GitHub-репозитория, включение Pages, домен.
- **Never:**
  - внешние запросы в рантайме (CDN, Google Fonts, аналитика, трекеры);
  - копирование упражнений и страниц учебника;
  - коммит `node_modules` или секретов;
  - отмечать огласовки проверенными без подтверждения человека;
  - озвучка/TTS, SVG-флаги, фреймворки, шаг сборки, YAML (решено в идее — пересматривается только по запросу автора);
  - удалять или ослаблять тесты, чтобы стало зелёным.

## Success Criteria
1. `npm run check:full` и CI зелёные (все пороги из `CONSTRAINTS.md`).
2. Все MVP-разделы (`alphabet`, `nikud`, `countries` — 6 вкладок, ~75 стран; `geresh`, `vocab`) открываются в Cheatsheet и Блице без прокрутки на 360×640, 390×664 и 1280×720.
3. Алфавит: 22 буквы + 5 конечных + варианты בּ/ב, כּ/כ, פּ/פ, שׁ/שׂ, каждая печатным (Heebo) и прописным (Gveret Levin) начертанием; отдельная вкладка «печатные над прописными».
4. Переключатели темы, огласовок, языка интерфейса и RU-перевода работают и запоминаются.
5. Экспорт/импорт прогресса между двумя контекстами объединяет данные; битый ввод ничего не ломает.
6. TSV импортируется в Anki без ручной правки.
7. Первая загрузка ≤ 200 КБ, ноль внешних запросов, каждый шрифт ≤ 60 КБ.
8. Сайт опубликован на `https://<user>.github.io/ivrit-studio/` и открывается в iOS Safari и Chrome на Android.
9. Добавление недели: агент получает только `SPEC.md` (раздел Data Contract) + сводку → JSON проходит `node scripts/validate.mjs` без правок кода.

## Open Questions
- Есть ли в группе родные страны, которых нет в списке из `docs/ideas/ivrit-studio.md`?
- Кто сверяет огласовки и как отмечаем: автор через Dicta Nakdan, сомнительное — учительнице?
- Хватит ли лимита 24 записи на вкладку для `letter-grid` на 360×640, или вкладку «буквы» придётся делить (решается первым e2e-тестом алфавита).
