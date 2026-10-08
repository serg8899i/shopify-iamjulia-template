# Handoff: iamjulia Shopify setup

Context for a new agent session. Talk to the owner in Russian. Project rules live in `CLAUDE.md`; this file
explains the whole setup and current state. Last updated 2026-10-08.

## The business

- **iamjulia** — a family project making personalized kids' birthday party decorations.
- Store: `iamjulia.shop` (Admin API domain `im1xd7-ev.myshopify.com`), password-protected while in development.
- Market: USA, English, USD. The content repo's `docs/PRODUCT_OFFER.md` also mentions Etsy; the owner chose
  Shopify for this site. Whether Etsy runs in parallel is not settled.
- Offer (confirmed): personalized banner (HAPPY BIRTHDAY + child's name, 2 lines); Decoration Set (banner +
  2 hanging strands × 6 pieces + 1 table garland = 5 strands); Complete Set (Decoration Set + cake topper +
  cupcake toppers); cake topper alone; cupcake toppers alone. Palettes: Blue (boys), Pastel (neutral), Pink.
  Sizes, materials, topper counts, prices, shipping and timelines are **not confirmed** — never invent them.

## Repositories (GitHub account `serg8899i`)

| Repo | Purpose |
|---|---|
| `shopify-iamjulia-template` | The theme (this repo). Horizon v4.2.0 base + `ij-` customizations, tools, docs. |
| `iamjulia-content` (private) | Product photos, prompts, QA reviews, product facts. Produced by a separate GPT session on the owner's computer, which pushes updates. Read its `AGENTS.md` before using anything. |

Clone the content repo next to the theme: `../iamjulia-content`, and `git pull --ff-only` before use.

## Branches and deployment

- `dev` — working branch, connected to Shopify via the **GitHub integration** as an unpublished theme.
  Every push updates that theme; preview it in Shopify admin → Online Store → Themes → ⋯ → Preview.
- Shopify commits editor changes back to the branch as `shopify[bot]` (mostly `config/settings_data.json`,
  `templates/*.json`). Always pull before editing. Sync was tested in both directions.
- `claude/charming-fermi-vmuzjv` — the original branch; its Shopify theme is being removed. Don't use it.
- `main` — created 2026-10-08 from `dev`; connected to the theme that gets published (live). Changes reach it
  only through PRs `dev` → `main` merged by the owner.
- The currently published theme in the store ("iamjulia.shop", stock Horizon from the Theme Store) is unrelated
  to this repo — don't touch it.

## Tools available in the cloud session

- **Plugins don't work** in this environment. The official Shopify AI Toolkit skill is vendored in
  `.claude/skills/shopify` (docs search + Liquid/GraphQL validators). Install deps once:
  `npm i --prefix .claude/skills/shopify`. Run helpers with `NODE_USE_ENV_PROXY=1 OPT_OUT_INSTRUMENTATION=true`.
- Validate theme files before every push (absolute theme path required):
  `node .claude/skills/shopify/scripts/validate.mjs --api liquid --theme-path "$PWD" --files <a,b>`
- Network allowlist includes `shopify.dev`, `*.shopify.com`, `*.myshopify.com`.
- **Admin API**: a Dev Dashboard app `iamjulia-builder` (client credentials grant) with scopes
  `read_products, write_products, write_inventory, read_publications, write_publications,
  write_online_store_navigation, write_content`. Env secrets: `SHOPIFY_STORE`, `SHOPIFY_CLIENT_ID`,
  `SHOPIFY_CLIENT_SECRET`. Seeded successfully on 2026-10-08 (5 products, published to Online Store).
- No Theme Access token, so no `shopify theme push`; theme deploys only through GitHub.

## What's built so far

- Brand settings: Fraunces headings + Nunito Sans body; palette bg #FFFBF5, text #3A322B, sage accent #56715A
  (primary buttons), sand #F5EDE2, border #E6DACB; pill buttons, rounded cards.
- Homepage (`templates/index.json`): `ij-hero` → Horizon product list ("Shop the party") → `ij-whats-included`
  → `ij-palettes` → `ij-steps` → `ij-faq`. Image pickers are empty (placeholders) until the owner uploads images
  in the theme editor. Copy uses only confirmed facts.
- Product page: `blocks/ij-personalization.liquid` ("Child's name" line item property) in `templates/product.json`,
  shown only for products tagged `personalized`.
- `tools/products.json` + `tools/seed-products.mjs`: 5 mockup products × 3 palettes, placeholder prices
  ($34/$69/$89/$24/$18), images uploaded via staged uploads (no public GitHub URLs), upsert by handle,
  published to Online Store. GraphQL in `tools/graphql/` validated against Admin API 2026-07.

## Next steps

1. Done: `personalized` tag added (catalog + live products).
2. Owner reviews the `dev` preview; iterate on design from their screenshots. Nothing has been visually
   verified yet — only validator-checked.
3. Header/footer navigation and pages (About, FAQ, Contact) via Admin API.
4. Later: theme-check in GitHub Actions, upstream Horizon merge workflow, `main` branch for the live theme.

## Known issues

- Validator flags `sections/header.liquid` lines 90/94 (duplicate static block id `header-menu`) — upstream
  Horizon, leave it.
- All images are candidates (`publication_ready: false`); fine for the mockup, not approved for launch.
