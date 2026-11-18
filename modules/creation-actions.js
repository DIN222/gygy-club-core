/**
 * GY-GY Club — reusable actions for a completed creative work.
 * v1.0.0
 *
 * Usage:
 *   const actions = initCreationActions({
 *     root: document.querySelector('#creationActions'),
 *     getWork: () => ({ situation, phrase }),
 *     getAtelierUrl: () => atelierUrl,
 *     onStatus: message => { status.textContent = message; }
 *   });
 *   // When the host view is destroyed:
 *   actions.destroy();
 *
 * The module does not assume a particular content type. The caller supplies
 * the work and destination URL. Server-dependent actions are deliberately
 * reported as unavailable until a real endpoint is provided.
 */

const ARCHIVE_KEY = 'gygy-club-personal-creation-archive-v1';

function normalizeWork(value) {
  const situation = String(value?.situation ?? '').trim();
  const phrase = String(value?.phrase ?? '').trim();
  return { situation, phrase };
}

function formatWork(work) {
  return `СЛУЧАЙ\n${work.situation}\n\nКРЕПКОЕ ВЫРАЖЕНИЕ\n${work.phrase}`;
}

function readArchive() {
  try {
    const value = JSON.parse(localStorage.getItem(ARCHIVE_KEY) || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function createNewsChoice(root, onSubmit, onCancel) {
  const old = root.querySelector('.creation-news-choice');
  if (old) old.remove();

  const panel = document.createElement('div');
  panel.className = 'creation-news-choice';
  panel.setAttribute('role', 'group');
  panel.setAttribute('aria-label', 'Категория GY-GY NEWS');

  const label = document.createElement('label');
  label.textContent = 'Предложить в рубрику: ';
  const select = document.createElement('select');
  select.setAttribute('aria-label', 'Рубрика GY-GY NEWS');

  [
    ['THIS_IS_GREAT', 'ЭТО КРУТО'],
    ['WHAT_A_CASE', 'ВОТ ЭТОТ СЛУЧАЙ']
  ].forEach(([value, text]) => {
    const option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    select.append(option);
  });

  label.append(select);

  const submit = document.createElement('button');
  submit.type = 'button';
  submit.className = 'gold-button';
  submit.textContent = 'Подготовить предложение';
  submit.addEventListener('click', () => onSubmit(select.value));

  const cancel = document.createElement('button');
  cancel.type = 'button';
  cancel.className = 'outline-button';
  cancel.textContent = 'Отмена';
  cancel.addEventListener('click', () => {
    panel.remove();
    onCancel?.();
  });

  panel.append(label, submit, cancel);
  root.append(panel);
  select.focus();

  return panel;
}

export function initCreationActions({
  root,
  getWork,
  getAtelierUrl,
  onStatus = () => {}
} = {}) {
  if (!root || typeof getWork !== 'function') {
    throw new TypeError('[creation-actions] root and getWork are required.');
  }

  let destroyed = false;
  let newsPanel = null;

  const status = message => {
    if (!destroyed) onStatus(message);
  };

  const getCompleteWork = () => {
    const work = normalizeWork(getWork());

    if (!work.situation || !work.phrase) {
      status('Сначала собери целую авторскую работу: случай + крепкое выражение.');
      return null;
    }

    return work;
  };

  const openTelegram = work => {
    const text = formatWork(work);

    const shareUrl =
      'https://t.me/share/url?url=' +
      encodeURIComponent(location.href) +
      '&text=' +
      encodeURIComponent(text + '\n— GY-GY Club');

    window.open(shareUrl, '_blank', 'noopener,noreferrer');

    status('Открываю Telegram. Проверь текст и подтверди отправку там.');
  };

  const onClick = async event => {
    const button = event.target.closest('[data-creation-action]');

    if (!button || !root.contains(button) || destroyed) return;

    const action = button.dataset.creationAction;
    const work = getCompleteWork();

    if (!work) return;

    const text = formatWork(work);

    switch (action) {
      case 'atelier': {
        if (typeof getAtelierUrl !== 'function') {
          status('Переход в Ателье пока не настроен для этого раздела.');
          return;
        }

        const url = getAtelierUrl(work);

        if (!url) {
          status('Не удалось подготовить ссылку на Ателье.');
          return;
        }

        window.location.href = url;
        return;
      }

      case 'telegram':
        openTelegram(work);
        return;

      case 'friend': {
        try {
          if (navigator.share) {
            await navigator.share({
              title: 'GY-GY Club — авторская работа',
              text
            });

            status('Окно отправки закрыто. Доставка зависит от выбранного приложения.');
          } else if (navigator.clipboard?.writeText) {
            await navigator.clipboard.writeText(text);

            status('Работа скопирована. Теперь можно отправить её другу.');
          } else {
            status('Отправка не поддерживается этим браузером. Скопируй текст вручную.');
          }
        } catch (error) {
          if (error?.name !== 'AbortError') {
            status('Не удалось открыть отправку. Попробуй скопировать текст вручную.');
          }
        }

        return;
      }

      case 'archive': {
        try {
          const archive = readArchive();

          archive.unshift({
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            createdAt: new Date().toISOString(),
            ...work
          });

          localStorage.setItem(
            ARCHIVE_KEY,
            JSON.stringify(archive.slice(0, 200))
          );

          status('Сохранено в личный архив этого браузера. Синхронизации с другими устройствами пока нет.');
        } catch {
          status('Браузер не разрешил сохранить работу в локальный архив.');
        }

        return;
      }

      case 'chat':
        status('Чат De-Stress Studio ещё строится. Работа пока не опубликована и не отправлена.');
        return;

      case 'news': {
        newsPanel?.remove();

        newsPanel = createNewsChoice(
          root,
          category => {
            newsPanel?.remove();
            newsPanel = null;

            const categoryName =
              category === 'THIS_IS_GREAT'
                ? 'ЭТО КРУТО'
                : 'ВОТ ЭТОТ СЛУЧАЙ';

            status(
              `Предложение для GY-GY NEWS («${categoryName}») подготовлено. Серверная отправка и публикация пока не подключены.`
            );
          },
          () => {
            newsPanel = null;
          }
        );

        status('Выбери рубрику для предложения. Публикация пока не отправляется на сервер.');
        return;
      }

      default:
        status('Это действие пока не настроено.');
    }
  };

  root.addEventListener('click', onClick);

  return {
    destroy() {
      if (destroyed) return;

      destroyed = true;
      root.removeEventListener('click', onClick);
      newsPanel?.remove();
      newsPanel = null;
    }
  };
}

export default initCreationActions;
