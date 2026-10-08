# iamjulia — Shopify theme

Theme for the iamjulia.shop store, based on Shopify Horizon v4.2.0 (upstream Shopify/horizon @ 5acd1b6).

## Environment notes (cloud sessions)

- **Plugins are not available** in this environment. The official Shopify AI Toolkit skill is vendored
  as a project skill in `.claude/skills/shopify` (from Shopify/shopify-ai-toolkit @ 8692e6a, MIT).
- Run the skill's Node helpers with `NODE_USE_ENV_PROXY=1 OPT_OUT_INSTRUMENTATION=true`
  (Node's fetch ignores HTTPS_PROXY otherwise; telemetry stays off). Never run `log_skill_use.mjs`.
- Install the skill's dependencies once per session: `npm i --prefix .claude/skills/shopify`.
- Validate theme files before every push:
  `node .claude/skills/shopify/scripts/validate.mjs --api liquid --theme-path "$PWD" --files <rel1,rel2>`
  (the theme path must be absolute; `.` fails).
- Network allows `shopify.dev`, `*.shopify.com`, `*.myshopify.com`. No Theme Access token is configured,
  so `shopify theme push` from here is not set up; deployment goes through the GitHub integration.

## Shopify ↔ GitHub

- The theme is connected to Shopify via the GitHub integration (branch `dev`, unpublished theme; `main` will be the live theme).
  Every push updates the theme in the store; edits saved in the Shopify editor are committed back
  (mostly `config/settings_data.json`, `templates/*.json`). Always `git pull` before changing files.
- Theme files must stay at the repository root.

## Horizon customization rules

- Don't edit Horizon core files (`assets/base.css`, core JS, stock sections/blocks) unless unavoidable —
  it breaks merging upstream Horizon updates.
- Put custom blocks in `blocks/` with the `ij-` prefix and custom sections in `sections/` with `ij-`.
  Each keeps its CSS in its own `{% stylesheet %}` with `ij-` class names (no layout edits needed).
- Template JSON (`templates/*.json`) and `config/settings_data.json` are store configuration, not Horizon core:
  editing them is fine (the homepage and product page are customized there), but pull first — the editor writes them too.
- Brand: fonts Fraunces (headings) + Nunito Sans (body); palette background #FFFBF5, text #3A322B,
  accent sage #56715A (primary buttons), sand #F5EDE2, border #E6DACB.
- Product personalization: block `ij-personalization` (in `templates/product.json`) shows on products tagged
  `personalized` and saves the line item property "Child's name".
- Give every schema setting a sensible default; use proper setting types (`image_picker`, `color`, `range`, `select`).
- Respect `prefers-reduced-motion` for any animation.
- Known upstream issue: `sections/header.liquid` (lines 90, 94) reuses static block id `header-menu`;
  the validator reports it. Not ours — leave it.

## Products and content

- Product photos, prompts and product facts live in `serg8899i/iamjulia-content` (clone to `../iamjulia-content`,
  `git pull --ff-only` first). Follow its `AGENTS.md`: don't invent sizes, quantities, materials; never use private
  raw GitHub URLs as image hosting; all images are candidates (`publication_ready: false`).
- `tools/products.json` is the mockup catalog (English, USD, placeholder prices) and records the content commit used.
- `tools/seed-products.mjs` upserts those products by handle via the Admin GraphQL API (client credentials grant
  from a Dev Dashboard app) and publishes them to the Online Store. Needs env `SHOPIFY_STORE`, `SHOPIFY_CLIENT_ID`,
  `SHOPIFY_CLIENT_SECRET`. Run: `NODE_USE_ENV_PROXY=1 node tools/seed-products.mjs` (`--dry-run` to preview).
- Validate GraphQL in `tools/graphql/` with `node .claude/skills/shopify/scripts/validate.mjs --api admin --file <f>`.
