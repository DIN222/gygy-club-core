# CONTRACT.md — контракт модулей GY-GY Club Core

Этот документ фиксирует обязательные правила для любого файла в `core/` и `modules/`.
Правила проверены на практике — каждое введено в ответ на конкретный баг,
найденный при ревью старого репозитория (`gy-gy-club`).

## 1. Только ES-модули

Каждый файл — `export`/`import`. Никаких `window.X` глобальных объектов.

```js
// Правильно
export function on(event, callback) { ... }

// Неправильно — так делал старый core/eventBus.js
window.EventBus = { ... };
```

Причина: смешение `window.X` и `import` в одном проекте приводило к рантайм-ошибкам
(старый `modules/hall.js` пытался `import { EventBus }` из файла без единого `export`).

## 2. Общение только через EventBus

Модуль никогда не импортирует и не вызывает напрямую функции другого модуля того же уровня
(`modules/` не вызывает `modules/`). Единственный канал — `core/eventBus.js`:

```js
import { emit, on } from '../core/eventBus.js';

emit('PROFILE_SAVED', { id: 'GY-001' });
on('PROFILE_SAVED', (data) => { ... });
```

Исключение: модуль может импортировать `core/*` напрямую (eventBus, storage, localization) —
это инфраструктура, а не «соседний экран».

## 3. Данные — только через Storage

Прямой вызов `localStorage.getItem/setItem` где-либо, кроме `core/storage.js`, запрещён.

```js
// Правильно
import { get, set } from '../core/storage.js';
const passport = get('passport');

// Неправильно — так делал старый modules/hall.js
const isBoss = localStorage.getItem('gygy_is_boss') === 'true';
```

Причина: при изменении схемы хранения (например, версионирование) все места
прямого обращения к `localStorage` придётся находить и чинить вручную.

## 4. Жизненный цикл модуля

Каждый файл в `modules/` обязан экспортировать три метода:

```js
export function init(container) {
    // подписка на события через EventBus.on()
    // рендер разметки внутрь container (не всей страницы!)
}

export function update(data) {
    // реакция на изменение состояния
}

export function destroy() {
    // EventBus.off() для каждой подписки, сделанной в init()
    // очистка DOM внутри container, если нужно
}
```

Каждый `on()` в `init()` должен иметь парный `off()` в `destroy()`. Без этого при повторном
входе в комнату колбэки накапливаются и начинают срабатывать многократно.

## 5. Модуль не владеет всей страницей

Модуль
