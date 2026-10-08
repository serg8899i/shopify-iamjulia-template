# iamjulia — Shopify theme

Theme for the iamjulia.shop store, based on Shopify Horizon v4.2.0 (upstream Shopify/horizon @ 5acd1b6).

## Environment notes (cloud sessions)

- **Plugins are not available** in this environment. The official Shopify AI Toolkit skill is vendored
  as a project skill in `.claude/skills/shopify` (from Shopify/shopify-ai-toolkit @ 8692e6a, MIT).
- Run the skill's Node helpers with `NODE_USE_ENV_PROXY=1 OPT_OUT_INSTRUMENTATION=true`
  (Node's fetch ignores HTTPS_PROXY otherwise; telemetry stays off). Never run `log_skill_use.mjs`.
- Install the skill's dependencies once per session: `npm i --prefix .claude/skills/shopify`.
- Validate theme files before every push:
  `node .claude/skills/shopify/scripts/validate.mjs --api liquid --theme-path . --files <rel1,rel2>`
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
- Put custom blocks in `blocks/` with the `ij-` prefix, custom sections in `sections/` with `ij-`,
  custom styles in `assets/ij-custom.css`, and use new template JSON files instead of editing stock ones.
- Scope block CSS to the block's own ID/class; no block styles in global CSS.
- Give every schema setting a sensible default; use proper setting types (`image_picker`, `color`, `range`, `select`).
- Respect `prefers-reduced-motion` for any animation.
- Known upstream issue: `sections/header.liquid` (lines 90, 94) reuses static block id `header-menu`;
  the validator reports it. Not ours — leave it.
