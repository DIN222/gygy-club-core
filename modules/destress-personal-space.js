/**
 * GY-GY Club — De-Stress Studio Personal Space
 * v1.1.0 — local prototype accepts a case-only story; shared Personal Space integration remains pending.
 * Server sync / Passport identity is intentionally not simulated.
 */
const KEYS = {
  archive: 'gygy:destress:archive:v1',
  bookmarks: 'gygy:destress:bookmarks:v1'
};
const readItems = key => {
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value : [];
  } catch { return []; }
};
const writeItems = (key, items) => {
  try { localStorage.setItem(key, JSON.stringify(items)); return true; }
  catch { return false; }
};
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[char]));
const makeId = () => globalThis.crypto?.randomUUID?.() || ('work-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8));

export function initDestressPersonalSpace({ root = document.body, getWork, onStatus = () => {} } = {}) {
  if (!root || typeof getWork !== 'function') throw new TypeError('[destress-personal-space] root and getWork are required.');
  let activeCollection = 'archive';

  const showStatus = message => onStatus(message);
  const completeWork = () => {
    const work = getWork() || {};
    const situation = String(work.situation || '').trim();
    const phrase = String(work.phrase || '').trim();
    if (!situation) {
      showStatus('Сначала расскажи, что произошло.');
      return null;
    }
    return { situation, phrase };
  };
  const save = (collection, work) => {
    const key = KEYS[collection];
    const items = readItems(key);
    const duplicate = items.some(item => item.situation === work.situation && item.phrase === work.phrase);
    if (duplicate) {
      showStatus(collection === 'archive' ? 'Эта работа уже есть в твоём архиве.' : 'Эта работа уже есть в закладках.');
      return;
    }
    items.unshift({
      id: makeId(),
      situation: work.situation,
      phrase: work.phrase,
      createdAt: new Date().toISOString(),
      source: location.href
    });
    if (!writeItems(key, items)) {
      showStatus('Браузер не разрешил локальное сохранение. Проверь настройки хранения сайта.');
      return;
    }
    showStatus(collection === 'archive' ? 'Работа сохранена в «Мой архив» на этом устройстве.' : 'Работа добавлена в «Закладки» на этом устройстве.');
    if (!panel.hidden && activeCollection === collection) render();
  };
  const panel = root.querySelector('#personalSpacePanel');
  const list = root.querySelector('#personalSpaceList');
  const title = root.querySelector('#personalSpacePanelTitle');

  function render() {
    if (!panel || !list || !title) return;
    const isArchive = activeCollection === 'archive';
    const items = readItems(KEYS[activeCollection]);
    title.textContent = isArchive ? 'МОЙ АРХИВ' : 'ЗАКЛАДКИ';
    if (!items.length) {
      list.innerHTML = '<p class="personal-space-empty">Пока здесь ничего нет.</p>';
      return;
    }
    list.innerHTML = items.map(item => {
      const date = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
      return '<article class="personal-space-item">' +
        '<div class="personal-space-item-date">' + escapeHtml(date) + '</div>' +
        '<h3>' + escapeHtml(item.situation) + '</h3>' +
        (item.phrase ? '<p>' + escapeHtml(item.phrase) + '</p>' : '') +
        '<button type="button" class="personal-space-remove" data-personal-remove="' + escapeHtml(item.id) + '" data-personal-collection="' + activeCollection + '">Удалить</button>' +
        '</article>';
    }).join('');
  }
  function open(collection) {
    activeCollection = collection;
    render();
    panel.hidden = false;
    panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  function close() { if (panel) panel.hidden = true; }

  const onClick = event => {
    const saveButton = event.target.closest('[data-personal-action]');
    if (saveButton) {
      const work = completeWork();
      if (work) save(saveButton.dataset.personalAction, work);
      return;
    }
    const openButton = event.target.closest('[data-personal-open]');
    if (openButton) { open(openButton.dataset.personalOpen); return; }
    if (event.target.closest('[data-personal-close]')) { close(); return; }
    const removeButton = event.target.closest('[data-personal-remove]');
    if (removeButton) {
      const collection = removeButton.dataset.personalCollection;
      const items = readItems(KEYS[collection]).filter(item => item.id !== removeButton.dataset.personalRemove);
      writeItems(KEYS[collection], items);
      render();
      showStatus('Запись удалена.');
    }
  };
  root.addEventListener('click', onClick);

  return {
    saveArchive: () => { const work = completeWork(); if (work) save('archive', work); },
    addBookmark: () => { const work = completeWork(); if (work) save('bookmarks', work); },
    destroy: () => root.removeEventListener('click', onClick)
  };
}
export default initDestressPersonalSpace;
