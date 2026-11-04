// Speaking (SPEC Speech): a listen button beside the Hebrew of words and phrases, shown only while the
// browser has a Hebrew voice. The browser's speech synthesis is replaced by a recorder (headless
// browsers have no voices), so the test sees what would be said, with which voice, and how fast.
import { test, expect } from '@playwright/test';
import { open, seedSettings, expectNoSeriousAxe, expectNoHorizontalOverflow } from './helpers.mjs';

const HEBREW = { lang: 'he-IL', name: 'Test Hebrew', localService: true };

/** Installs the recorder before the page loads; `voices` is what getVoices() returns at first. */
async function fakeSpeech(page, voices) {
  await page.addInitScript((initial) => {
    const listeners = new Set();
    const spoken = [];
    const state = { voices: initial, cancels: 0 };
    class Utterance extends EventTarget {
      constructor(text) {
        super();
        this.text = text;
      }
    }
    const synth = {
      getVoices: () => state.voices,
      addEventListener: (type, listener) => { if (type === 'voiceschanged') listeners.add(listener); },
      cancel: () => { state.cancels += 1; },
      speak: (utterance) => spoken.push(utterance),
    };
    Object.defineProperty(window, 'speechSynthesis', { value: synth, configurable: true });
    window.SpeechSynthesisUtterance = Utterance;
    window.fakeSpeech = {
      spoken: () => spoken.map(({ text, lang, rate, voice }) => ({ text, lang, rate, voice: voice?.name })),
      cancels: () => state.cancels,
      finish: () => spoken.at(-1).dispatchEvent(new Event('end')),
      addVoices: (more) => { state.voices = [...state.voices, ...more]; listeners.forEach((listener) => listener()); },
    };
  }, voices);
}

const spoken = (page) => page.evaluate(() => window.fakeSpeech.spoken());

test.describe('the listen button', () => {
  test('is not on the page while the browser has no Hebrew voice', async ({ page }) => {
    await fakeSpeech(page, [{ lang: 'en-US', name: 'English', localService: true }]);
    await open(page, '#/around');
    await expect(page.locator('[data-entry="home.bayit"]')).toHaveCount(1);
    await expect(page.locator('.speak:visible')).toHaveCount(0);
    await expect(page.locator('html')).not.toHaveAttribute('data-speech');
  });

  test('works without speech synthesis at all', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: undefined, configurable: true });
      delete window.SpeechSynthesisUtterance;
    });
    await open(page, '#/around');
    await expect(page.locator('.speak:visible')).toHaveCount(0);
  });

  test('beside a word, says it without nikud, slowly, in the Hebrew voice', async ({ page }) => {
    await fakeSpeech(page, [HEBREW]);
    await open(page, '#/around');
    const button = page.locator('[data-entry="home.pinat-okhel"] .speak');
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName('Listen: Pinat okhel');
    await button.click();
    expect(await spoken(page)).toEqual([{ text: 'פינת אוכל', lang: 'he-IL', rate: 0.85, voice: 'Test Hebrew' }]);
    await expect(button).toHaveAttribute('data-speaking', '');
    await page.evaluate(() => window.fakeSpeech.finish());
    await expect(button).not.toHaveAttribute('data-speaking');
  });

  test('is named in Russian when the language is Russian', async ({ page }) => {
    await fakeSpeech(page, [HEBREW]);
    await seedSettings(page, { lang: 'ru' });
    await open(page, '#/around');
    await expect(page.locator('[data-entry="home.bayit"] .speak')).toHaveAccessibleName('Прослушать: Bayit');
  });

  test('a second press stops it, and another word replaces it', async ({ page }) => {
    await fakeSpeech(page, [HEBREW]);
    await open(page, '#/around');
    const first = page.locator('[data-entry="home.bayit"] .speak');
    const second = page.locator('[data-entry="home.dira"] .speak');
    await first.click();
    await second.click();
    await expect(first).not.toHaveAttribute('data-speaking');
    await expect(second).toHaveAttribute('data-speaking', '');
    expect((await spoken(page)).map((s) => s.text)).toEqual(['בית', 'דירה']);
    await second.click();
    await expect(second).not.toHaveAttribute('data-speaking');
    expect(await spoken(page)).toHaveLength(2);
  });

  test('appears once the browser has loaded its voices', async ({ page }) => {
    await fakeSpeech(page, []);
    await open(page, '#/around');
    await expect(page.locator('.speak:visible')).toHaveCount(0);
    await page.evaluate((voice) => window.fakeSpeech.addVoices([voice]), HEBREW);
    await expect(page.locator('[data-entry="home.bayit"] .speak')).toBeVisible();
  });

  test('is on every form of a phrase', async ({ page }) => {
    await fakeSpeech(page, [HEBREW]);
    await open(page, '#/phrases');
    const card = page.locator('.phrase:has(.phrase-tag)').first();
    const rows = card.locator('.phrase-row');
    expect(await rows.count()).toBeGreaterThan(1);
    await expect(card.locator('.speak')).toHaveCount(await rows.count());
    const last = rows.last();
    await last.locator('.speak').click();
    const [said] = await spoken(page);
    expect(said.text).toBe(await last.locator('.phrase-he').evaluate((node) => node.textContent.normalize('NFD').replace(/[֑-ׇ]/g, '').normalize('NFC')));
  });

  test('keeps the page free of overflow and axe violations, and is not printed', async ({ page }) => {
    await fakeSpeech(page, [HEBREW]);
    for (const hash of ['#/around', '#/phrases', '#/words']) {
      await open(page, hash);
      await expect(page.locator('.speak:visible').first()).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expectNoSeriousAxe(page);
    }
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.speak:visible')).toHaveCount(0);
  });
});
