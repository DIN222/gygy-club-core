# GY-GY Club — аудит фактических операций и защиты OFFICE

**Версия:** 0.2 — 13.11.2026  
**Источник:** архив `gygy-club-core-main (5).zip`, предоставленный пользователем ранее.  
**Режим:** только чтение исходного кода. GitHub, Supabase, политики, функции, данные и развёртывание не изменялись.

## 1. Границы и статус проверки

Этот документ фиксирует подтверждённые обращения Supabase, найденные в HTML/JS архива. Он не является утверждением, что текущий live GitHub или Supabase полностью совпадают с архивом. В архиве не найден комплект SQL-миграций/DDL, поэтому фактические RLS-политики, grants, bucket policies и live schema этим проходом не подтверждаются. Для окончательной матрицы требуется сопоставить код с текущей БД и проверить все цепочки обработчиков/форм.

Обозначения:
- **Подтверждено кодом** — в исходнике найден прямой вызов Supabase или `requireAuth()`.
- **Не равно разрешению** — наличие UI/вызова не доказывает, что сервер разрешает операцию или что она безопасно ограничена.
- **Гостевой/public путь** — страница или модуль не вызывает `requireAuth()` перед операцией; это не доказывает, что RLS действительно допускает доступ.

## 2. Защита страниц

В архиве найден `requireAuth()` на 24 HTML-страницах:

`accounting.html`, `alien-admin.html`, `complexes-admin.html`, `destress-admin.html`, `embroidery-products.html`, `expense-ledger.html`, `expense.html`, `gallery.html`, `income-atelier.html`, `income-ledger.html`, `income-product.html`, `income-store.html`, `income.html`, `moon-admin.html`, `office.html`, `prints-admin.html`, `product-photos.html`, `production-pricing.html`, `production.html`, `reviews.html`, `space-admin.html`, `store-admin.html`, `suppliers.html`, `translations-admin.html`, `warehouse.html`.

`core/auth.js` реализует `requireAuth()` как проверку наличия Supabase Auth session и перенаправление на `login.html`. В коде этой функции нет проверки роли, набора permissions или scope сотрудника. Следовательно:

1. это базовая проверка входа, но не полноценная авторизация OFFICE;
2. любой пользователь с действующей Auth-сессией проходит клиентский guard;
3. разграничение по должностям и операциям должно проверяться на сервере (RLS/RPC/ограниченные представления), а не только в интерфейсе.

**Важное расхождение:** `revenue.html` читает `income_entries`, но `requireAuth()` в этой странице не найден. Требует отдельного исправления после проверки действующих RLS и безопасного маршрута чтения. Пока ничего не меняли.

## 3. Страницы и операции, найденные в коде

| Страница / модуль | Обращения и операции, подтверждённые исходником | Предварительная зона |
|---|---|---|
| `store.html` | `store_items SELECT`; `income_entries INSERT` при оформлении заказа | Публичный каталог и заказ; финансовую таблицу нельзя автоматически раскрывать гостям |
| `store-admin.html` | `store_items INSERT`, `SELECT`, `DELETE`; загрузка/чтение публичных URL изображений | Управление магазином |
| `atelier.html` | `storefront_config SELECT`; `club_prints SELECT`; `embroidery_products SELECT`; RPC `destress_bump`, `track_gallery_event`; `warehouse_stock SELECT/UPDATE`; `warehouse_movements INSERT`; `income_entries INSERT`; загрузка изображения в `club-prints` | Публичный витринный сценарий + чувствительные внутренние складские/заказные операции; нужен серверный посредник |
| `suppliers.html` | `supplier_orders SELECT/INSERT/UPDATE` (включая чтение/редактирование); `supplier_order_items INSERT/DELETE`; `suppliers SELECT/INSERT/UPDATE`; `warehouse_stock SELECT`; RPC `receive_supplier_order` | Закупки/поставщики/приёмка; финансовый эффект приёмки должен быть отдельно контролируем |
| `warehouse.html` | `warehouse_stock SELECT/INSERT/UPDATE`; `warehouse_movements INSERT/SELECT`; `income_entries SELECT` | Склад + отдельное чтение финансовых данных; проверить, действительно ли последняя выборка необходима кладовщику |
| `production.html` | `production_norms SELECT/INSERT`; `production_batches SELECT/INSERT`; `warehouse_stock SELECT/INSERT/UPDATE`; `warehouse_movements INSERT` | Производство и склад; права на нормы и проведение операций должны различаться |
| `revenue.html` | `income_entries SELECT` | Финансовый просмотр; `requireAuth()` не найден |
| `income-ledger.html` | `income_entries INSERT` | Внесение доходов; не тождественно просмотру/редактированию/утверждению |
| `income-product.html` | `pricing_params UPSERT`; `storefront_config UPSERT`; `income_entries SELECT/UPDATE` | Ценообразование и редактирование доходных записей — разные полномочия |
| `income-atelier.html` | `income_entries SELECT` | Финансовый просмотр по ателье |
| `income-store.html` | `requireAuth()` найден; прямые обращения в самой странице не обнаружены | Требуется проверить импортируемые модули/переходы |
| `income.html` | `requireAuth()` найден; прямые обращения в самой странице не обнаружены | Требуется проверить импортируемые модули/переходы |
| `expense.html` | `expense_entries SELECT` | Просмотр расходов; требует отдельного финансового права |
| `expense-ledger.html` | `suppliers SELECT`; `delivery_services SELECT/INSERT`; `suppliers INSERT`; `expense_entries INSERT` | Внесение расходов и справочники; права раздельные |
| `accounting.html` | `requireAuth()`; прямые обращения в самой странице не обнаружены | Проверить модули и все переходы бухгалтерского интерфейса |
| `gallery.html` | `club_prints SELECT count`; `embroidery_products SELECT`; `product_photos SELECT` | Сводный просмотр галереи; подтвердить публичность и минимальность данных |
| `prints-admin.html` | `club_prints SELECT/UPDATE/INSERT/DELETE`; `gallery_events SELECT`; загрузка/удаление файлов `club-prints` | Управление принтами и медиа |
| `embroidery-products.html` | `embroidery_products SELECT/INSERT/UPDATE/DELETE`; `club_prints SELECT`; `gallery_events SELECT`; загрузка/удаление файлов `club-prints` | Управление товарами/вышивкой и медиа |
| `product-photos.html` | `suppliers SELECT`; `supplier_orders SELECT`; `product_photos SELECT/INSERT/DELETE`; загрузка/удаление файлов `club-prints` | Управление фотографиями с доступом к данным поставщиков/заказов — проверить необходимость полей |
| `production-pricing.html` | `storefront_config SELECT/UPSERT`; `pricing_params UPSERT`; `club_prints SELECT` | Управление производственными параметрами/ценами |
| `reviews.html` | `reviews SELECT/UPDATE/DELETE` | Модерация отзывов |
| `destress-admin.html` | `destress_phrases SELECT/INSERT/UPDATE/DELETE` | Модерация фраз |
| `destress-studio.html` | `destress_situations INSERT`; `destress_phrases INSERT/SELECT`; RPC `destress_bump` | Гостевой пользовательский контент и публичное взаимодействие; необходимы статусы/лимиты/модерация |
| `book.html` | `destress_phrases INSERT/SELECT`; RPC `destress_bump` | Публичный контент/взаимодействие; проверить, какие вставки доступны гостям |
| `space-admin.html` | `space_posts SELECT/UPDATE/DELETE` | Модерация публикаций |
| `space-construction.html` | `space_posts SELECT`; `destress_phrases SELECT` (approved) | Публичное чтение контента/пространства |
| `complexes-admin.html` | `launch_complexes SELECT/UPDATE` | Управление Пусковыми Комплексами |
| `moon-admin.html` | `moon_modules SELECT/INSERT/UPDATE/DELETE`; `moon_deliveries SELECT` | Администрирование лунных модулей/поставок |
| `atelier-space.js` | `moon_modules SELECT`; `alien_requests INSERT` | Публичный/участнический сценарий космического проекта; проверить контекст страницы |
| `alien-admin.html` | `alien_requests SELECT/UPDATE/DELETE` | Обработка заявок |
| `translations-admin.html` | `translations_cache SELECT/INSERT/UPDATE` (операции внутри цепочки запроса требуют полного теста) | Администрирование переводов |
| `modules/moonData.js` | `moon_modules SELECT`; RPC `deliver_modules`; `moon_deliveries SELECT` | Публичный игровой/участнический сценарий + запись поставки через RPC |
| `modules/spaceForum.js` | `space_posts SELECT/INSERT` | Публичный форум/предложение публикаций |
| `modules/reviewBox.js` | `reviews SELECT/INSERT` | Публичная подача отзывов и чтение отзывов |
| `core/clubBase.js` | Таблица принтов: `SELECT/INSERT/UPDATE/DELETE`; `print_likes SELECT/INSERT`; storage upload/remove | Публичная галерея/лайки; нужно проверить реальное имя таблицы и точные права |
| `core/complexes.js` | `launch_complexes SELECT` | Общая логика статуса Пусковых Комплексов |
| `core/pricing.js` | `pricing_params SELECT`; `storefront_config SELECT` | Публичное чтение параметров цен/витрины — проверить, какие значения безопасно публиковать |
| `modules/incomeJournal.js` | `income_entries SELECT` | Финансовый журнал; права должны быть ограничены |
| `modules/expenseJournal.js` | `expense_entries SELECT` с `suppliers(name)` | Финансовый журнал и сведения о поставщиках |

## 4. Storage

В исходнике найдены обращения к двум bucket-именам:

- `club-prints` — загрузка/получение public URL/удаление изображений принтов, фотографий и товаров;
- `store-items` — загрузка изображений товаров магазина.

Код вызывает `getPublicUrl()`, что формирует публичный URL, но само по себе не доказывает, что bucket публичен или что политики загрузки/удаления безопасны. Требуется отдельная проверка Storage bucket settings и `storage.objects` policies в live Supabase.

## 5. Payment Terminal — не реальный приём платежей

`payment-terminal.html` запускает `modules/paymentTerminal.js`. Комментарии и реализация подтверждают, что это демонстрационная имитация: экран показывает «processing/approved», формирует локальную картинку-квитанцию и вызывает callback. В модуле не найдено интеграции с платёжным провайдером, реального списания денег или записи платежа в БД. Поэтому его нельзя считать действующим платёжным контуром или основанием для финансовых полномочий. Требуется будущая отдельная архитектура платежей до подключения реального провайдера.

## 6. Первичные архитектурные выводы

1. `requireAuth()` присутствует на 24 страницах, но это только наличие Auth-сессии; роли/permissions/scopes в этой функции не проверяются.
2. `revenue.html` читает `income_entries` без найденного `requireAuth()` — приоритетная проверка.
3. Публичные сценарии `store.html` и `atelier.html` записывают данные в `income_entries`. Не следует давать гостям прямой доступ к бухгалтерской таблице только ради оформления заказа. Правильное направление — отдельная серверная операция/таблица заказов или узкая RPC, которая принимает только безопасные поля и сама формирует финансовые записи.
4. `atelier.html` содержит сочетание публичной витрины и прямых складских/доходных операций. Это сильный кандидат на разделение публичного интерфейса и серверной бизнес-операции.
5. `suppliers.html` вызывает `receive_supplier_order`; операция имеет складские и расходные последствия. Право принять поставку, право вести поставщиков, право видеть финансы и право утверждать расход должны быть раздельными.
6. Страницы производства и склада используют одни и те же таблицы. Нельзя выдавать полные права на `warehouse_stock` или `warehouse_movements` всем сотрудникам, которые только читают складские сведения.
7. Публичные вставки `destress_*`, `space_posts`, `reviews`, `alien_requests` должны оставаться возможными там, где это часть клубного сценария, но только через ограниченные поля, статусы, ограничения частоты и модерацию.
8. Для `club_prints`, `store_items`, поставщиков, заказов и складских таблиц нужны проверка полей и безопасные представления: RLS ограничивает строки, но не скрывает отдельные колонки из `SELECT *`.

## 7. Что ещё нужно подтвердить до утверждения матрицы

- Текущие live RLS policies для всех затронутых таблиц, включая взаимодействие permissive policies через OR.
- Текущие grants для `anon`, `authenticated`, `public` на таблицы, функции и sequences.
- Полные определения RPC и SECURITY DEFINER, `search_path`, владельцы, EXECUTE grants и вызываемые ими таблицы.
- Триггеры на `income_entries` и `supplier_orders` и все побочные эффекты.
- Storage bucket visibility и политики на `storage.objects` для `club-prints` и `store-items`.
- Точные поля, выбираемые через `SELECT *`, особенно заметки персонала, себестоимость, контактные данные поставщиков и внутренние примечания.
- Все импортируемые модули на страницах с `requireAuth()` без прямых запросов.
- Сверка этого архива с актуальным GitHub и live deployment.
- Проверка сценариев для гостя, участника, сотрудника разных отделов, руководителя и создателя клуба.

## 8. Запрет на автономное внедрение

Этот аудит не меняет Supabase, GitHub или сайт. Ни одна политика, функция, таблица, роль, grant, bucket, страница или deployment не менялись. Любое внедрение возможно только после отдельного согласования плана, тестов и способа отката.
