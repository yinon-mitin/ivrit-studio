// Home screen: one link per section, in index.json order.

/**
 * @param {Array<{ id: string, title: { en: string, ru: string } }>} sections
 * @returns {HTMLElement}
 */
export function renderHome(sections) {
  const screen = document.createElement('section');
  screen.dataset.screen = 'home';
  screen.setAttribute('aria-labelledby', 'home-title');
  const title = document.createElement('h2');
  title.id = 'home-title';
  title.className = 'screen-title';
  title.textContent = 'Sections';
  const list = document.createElement('ul');
  list.className = 'home-grid';
  for (const section of sections) {
    const link = document.createElement('a');
    link.href = `#/${section.id}`;
    link.dataset.section = section.id;
    link.textContent = section.title.en;
    const item = document.createElement('li');
    item.append(link);
    list.append(item);
  }
  screen.append(title, list);
  return screen;
}
