// Progress screen (#/progress): a summary, export (download a file / copy the text) and import (paste
// text / choose a file) that merges into this device's progress. Imported content is only ever parsed
// as JSON and shown through textContent; a failed import changes nothing.
import { t } from '../core/i18n.js';
import { merge, parse, serialize } from '../core/progress.js';
import { loadProgress, saveProgress } from '../progress-store.js';
import { downloadFile, el } from '../views/dom.js';

/** @param {Date} date @returns {string} YYYY-MM-DD in local time */
const localDate = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()].map((n) => String(n).padStart(2, '0')).join('-');

/**
 * @param {'en' | 'ru'} lang
 * @returns {HTMLElement}
 */
export function renderProgress(lang) {
  const root = el('section', 'screen progress');
  root.dataset.screen = 'progress';

  const bar = el('div', 'screen-bar');
  const back = el('a', 'back', '‹');
  back.href = '#/';
  back.dataset.action = 'home';
  back.setAttribute('aria-label', t('home', lang));
  bar.append(back, el('h2', 'screen-title', t('progressTitle', lang)));

  const practised = el('strong', 'stat-number');
  practised.dataset.progress = 'practised';
  const learned = el('strong', 'stat-number');
  learned.dataset.progress = 'learned';
  const stats = el('div', 'stats');
  for (const [number, label] of [[practised, 'practised'], [learned, 'learned']]) {
    const stat = el('p', 'stat');
    stat.append(number, el('span', 'stat-label', t(label, lang)));
    stats.append(stat);
  }
  const refresh = () => {
    const cards = Object.values(loadProgress().cards);
    practised.textContent = String(cards.length);
    learned.textContent = String(cards.filter((card) => card.box >= 4).length);
  };

  const status = el('p', 'progress-status');
  status.setAttribute('role', 'status');
  status.dataset.progress = 'status';
  const say = (state, text) => {
    status.dataset.state = state;
    status.textContent = text;
  };

  const exportText = () => serialize(loadProgress(), new Date().toISOString());
  const download = el('button', 'action', t('download', lang));
  download.type = 'button';
  download.dataset.action = 'download';
  download.addEventListener('click', () => {
    downloadFile(`ivrit-progress-${localDate(new Date())}.json`, exportText(), 'application/json');
  });
  const copy = el('button', 'control', t('copy', lang));
  copy.type = 'button';
  copy.dataset.action = 'copy';
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(exportText());
      say('ok', t('copied', lang));
    } catch {
      say('error', t('copyFailed', lang));
    }
  });
  const exportBlock = el('section', 'progress-block');
  const exportActions = el('div', 'progress-actions');
  exportActions.append(download, copy);
  exportBlock.append(el('h3', 'block-title', t('exportTitle', lang)), el('p', 'block-hint', t('exportHint', lang)), exportActions);

  const paste = el('textarea', 'paste');
  paste.id = 'progress-paste';
  paste.rows = 3;
  paste.spellcheck = false;
  paste.dataset.progress = 'paste';
  const pasteLabel = el('label', 'visually-hidden', t('pasteLabel', lang));
  pasteLabel.htmlFor = paste.id;
  paste.placeholder = t('pasteLabel', lang);

  const fileInput = el('input', 'visually-hidden');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json,.txt';
  fileInput.id = 'progress-file';
  fileInput.dataset.progress = 'file';
  const fileLabel = el('label', 'control file-label', t('chooseFile', lang));
  fileLabel.htmlFor = fileInput.id;
  const fileName = el('span', 'file-name');
  fileInput.addEventListener('change', () => {
    fileName.textContent = fileInput.files?.[0]?.name ?? '';
  });

  const importButton = el('button', 'action', t('import', lang));
  importButton.type = 'button';
  importButton.dataset.action = 'import';
  importButton.addEventListener('click', async () => {
    const chosen = fileInput.files?.[0];
    const text = chosen ? await chosen.text() : paste.value.trim();
    if (!text) return say('error', t('emptyImport', lang));
    const result = parse(text);
    if (!result.ok) return say('error', `${t(`error_${result.error}`, lang)} ${t('unchanged', lang)}`);
    saveProgress(merge(loadProgress(), result.progress));
    paste.value = '';
    fileInput.value = '';
    fileName.textContent = '';
    refresh();
    say('ok', t('imported', lang, { count: String(Object.keys(result.progress.cards).length) }));
  });

  const importBlock = el('section', 'progress-block');
  const importActions = el('div', 'progress-actions');
  importActions.append(fileLabel, fileInput, fileName, importButton);
  importBlock.append(el('h3', 'block-title', t('importTitle', lang)), pasteLabel, paste, importActions);

  const body = el('div', 'progress-body');
  body.append(stats, exportBlock, importBlock, status);
  root.append(bar, body);
  refresh();
  return root;
}
