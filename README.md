# iamjulia — тема Shopify

Тема магазина iamjulia на основе [Shopify Horizon](https://github.com/Shopify/horizon) v4.2.0 (upstream-коммит `5acd1b6`).

## Подключение к Shopify

**Через GitHub (рекомендуется):** Shopify admin → Online Store → Themes → Add theme → Connect from GitHub → выбрать репозиторий и ветку. Пуши в ветку автоматически попадают в тему; правки из редактора Shopify коммитятся обратно — делайте `git pull` перед работой.

**Через Shopify CLI:**

```bash
npm install -g @shopify/cli
shopify theme dev --store <store>.myshopify.com   # локальное превью
shopify theme push --store <store>.myshopify.com  # загрузка темы
shopify theme check                               # линтер
```

## Структура

`layout/` · `templates/` · `sections/` · `blocks/` · `snippets/` · `assets/` · `config/` · `locales/` — стандартная структура темы Online Store 2.0.

## Лицензия

Основано на Horizon © Shopify Inc., см. [LICENSE.md](LICENSE.md).
