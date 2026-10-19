// Entry point: hash router and screen assembly.
import { loadIndex, loadSection } from './loader.js';
import { renderHome } from './ui/home.js';

const app = document.getElementById('app');
const content = document.getElementById('content');

/**
 * `#/` home, `#/progress`, `#/<section>/blitz`, `#/<section>/<tab?>`.
 * @param {string} hash
 */
function parseHash(hash) {
  const [first, second] = hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent);
  if (first === undefined) return { name: 'home' };
  if (first === 'progress') return { name: 'progress' };
  if (second === 'blitz') return { name: 'blitz', section: first };
  return { name: 'section', section: first, tab: second };
}

// Section, Blitz and progress screens arrive with their tasks; until then every route shows home.
const screens = {
  home: async () => {
    const index = await loadIndex();
    return renderHome(await Promise.all(index.sections.map(loadSection)));
  },
};

async function render() {
  app.dataset.ready = 'false';
  const route = parseHash(location.hash);
  const screen = screens[route.name] ?? screens.home;
  try {
    content.replaceChildren(await screen(route));
  } catch (error) {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = `Could not load: ${error.message}`;
    content.replaceChildren(message);
  }
  app.dataset.ready = 'true';
}

window.addEventListener('hashchange', render);
render();
