# iamjulia — Shopify theme

Theme for the iamjulia.shop store, based on Shopify Horizon v4.2.0 (upstream Shopify/horizon @ 5acd1b6).

Full setup and current state for a new session: [docs/HANDOFF.md](docs/HANDOFF.md).

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

- Branch flow: work and push on `dev` (draft theme "iamjulia — dev", previewed by the owner); the owner merges a PR
  `dev` → `main`; `main` is connected to the published (live) theme. Never push to `main` directly.
  Theme editor changes should be made only on the dev theme to avoid JSON merge conflicts.
- Releases happen from chat: the owner does not open GitHub. When the owner explicitly says to release
  (e.g. "выкатывай"), open (or reuse) a PR `dev` → `main`, confirm it is mergeable, merge it via the GitHub MCP
  tools, then screenshot the live site. Never merge to `main` without that explicit instruction in the
  current conversation. Rollback on request: revert the last release merge on `main` via a PR, same flow.
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
- Brand: fonts Fraunces SemiBold (headings) + Jost (body), both from the Shopify font library; palette background #FFFBF5, text #3A322B,
  accent sage #56715A (primary buttons), sand #F5EDE2, border #E6DACB.
- Product personalization: block `ij-personalization` (in `templates/product.json`) shows on products tagged
  `personalized` and saves the line item property "Child's name"; a second instance (field type "age") shows on
  products tagged `personalized-age` (cake topper, complete set — owner confirmed name + age on 2026-10-08) and saves "Age".
- Product gallery: Horizon carousel with thumbnails on the left (Amazon-like; white frames with shadow), its own zoom off; block `ij-lightbox`
  (+ `assets/ij-lightbox.js`) opens gallery photos in a modal viewer (dimmed page, fitted photo, close/arrows/counter,
  Esc, swipe) and its stylesheet frames the main photo and styles the thumbnails (selected one enlarged).
- Homepage first screen: `ij-hero` layout "fullscreen" (photo edge to edge, 100svh, text bottom-left over a gradient);
  header is transparent on the home page (logo centered, menu row below, white text, inverse logo); no announcement bar.
- Give every schema setting a sensible default; use proper setting types (`image_picker`, `color`, `range`, `select`).
- Respect `prefers-reduced-motion` for any animation.
- Deliberate Horizon core edits (re-apply when merging upstream): `sections/password-footer.liquid` —
  `show_powered_by` checkbox (default off) wraps the "powered by Shopify" line; `overlay` (default on) puts
  short "Enter password" / "Log in" links over the full-screen password page photo.
- Deliberate Horizon core edit: `snippets/product-media-gallery-content.liquid` — with "hide unselected variant media"
  on, also hides photos whose alt text starts with another palette name ("Blue ", "Pastel ", "Pink "), so each palette
  shows only its own gallery. `tools/seed-products.mjs` guarantees that alt prefix.
- Known upstream issue: `sections/header.liquid` (lines 90, 94) reuses static block id `header-menu`;
  the validator reports it. Not ours — leave it.

## Products and content

- **Content handoff (Codex → Git → Claude → preview → owner permission → publish).** At the start of any site work:
  `git -C ../iamjulia-site-content pull --ff-only`, read its `CLAUDE.md` and `docs/AGENT_WORKFLOW.md`, then run
  `python3 -I ../iamjulia-site-content/tools/check_site_updates.py --receipt "$PWD/content-receipt.json"` and report
  new/changed images and documents to the owner. Integrate into `dev`/preview only; publish only within the owner's
  explicit permission for that exact set. Record what was integrated (content commit, fingerprints, stage, site target,
  permission) in `content-receipt.json` here. Never mark something integrated that was only read.

- Product photos, prompts and product facts live in `serg8899i/iamjulia-site-content` (clone to `../iamjulia-site-content`,
  `git pull --ff-only` first). Follow its `AGENTS.md`: don't invent sizes, quantities, materials; never use private
  raw GitHub URLs as image hosting; all images are candidates (`publication_ready: false`).
- Products and their ordered photos come only from the library's cards `catalog/products/<handle>.json`
  (its `docs/SITE_CONTRACT.md`), never from folders or hero IDs. `tools/products.json` holds only the site-side data
  per handle: placeholder prices (USD), product type, English description, extra tags.
- `tools/seed-products.mjs` merges cards + `tools/products.json` and upserts the products by handle via the Admin GraphQL API (client credentials grant
  from a Dev Dashboard app) and publishes them to the Online Store. Needs env `SHOPIFY_STORE`, `SHOPIFY_CLIENT_ID`,
  `SHOPIFY_CLIENT_SECRET`. Run: `NODE_USE_ENV_PROXY=1 node tools/seed-products.mjs` (`--dry-run` to preview).
- Owner's standing permission (2026-10-09): while the storefront is password-protected, upload all card images to the
  store, including preview-only ones (`--include-preview`; the script checks the password itself and skips them when
  the store is open). Before launch: re-run without `--include-preview` and switch the content check back to ask-first.
- Validate GraphQL in `tools/graphql/` with `node .claude/skills/shopify/scripts/validate.mjs --api admin --file <f>`.
