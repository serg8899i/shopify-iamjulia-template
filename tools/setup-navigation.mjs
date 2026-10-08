#!/usr/bin/env node
// Creates the storefront collections (smart, by product type) and rewrites the main and footer menus.
// Idempotent: existing collections are reused by handle; menus are replaced with the lists below.
//
// Env: SHOPIFY_STORE, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
// Run: NODE_USE_ENV_PROXY=1 node tools/setup-navigation.mjs

const API_VERSION = '2026-07';
const store = process.env.SHOPIFY_STORE;

const COLLECTIONS = [
  {
    handle: 'party-sets',
    title: 'Party Sets',
    descriptionHtml: '<p>Personalized banners and coordinated decoration sets.</p>',
    ruleSet: {
      appliedDisjunctively: true,
      rules: [
        { column: 'TYPE', relation: 'EQUALS', condition: 'Party Decoration Sets' },
        { column: 'TYPE', relation: 'EQUALS', condition: 'Party Banners' },
      ],
    },
  },
  {
    handle: 'toppers',
    title: 'Toppers',
    descriptionHtml: '<p>Cake and cupcake toppers that match our party sets.</p>',
    ruleSet: {
      appliedDisjunctively: false,
      rules: [{ column: 'TYPE', relation: 'CONTAINS', condition: 'Topper' }],
    },
  },
];

async function getToken() {
  const res = await fetch(`https://${store}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Token request failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

const token = await getToken();
async function api(query, variables = {}) {
  const res = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
  });
  const body = await res.json();
  if (!res.ok || body.errors) throw new Error(`GraphQL error: ${JSON.stringify(body.errors ?? body)}`);
  return body.data;
}
function check(payload, what) {
  if (payload.userErrors?.length) throw new Error(`${what}: ${JSON.stringify(payload.userErrors)}`);
}

const { publications, menus, pages } = await api(`{
  publications(first: 20) { nodes { id name } }
  menus(first: 20) { nodes { id handle title items { title type url resourceId } } }
  pages(first: 50) { nodes { id handle } }
}`);
const onlineStore = publications.nodes.find((p) => p.name === 'Online Store');

const collectionIds = {};
for (const c of COLLECTIONS) {
  const found = await api(`query($q: String!) { collections(first: 1, query: $q) { nodes { id } } }`, {
    q: `handle:${c.handle}`,
  });
  let id = found.collections.nodes[0]?.id;
  if (!id) {
    const data = await api(
      // The `input` argument is deprecated in favour of `collection` + `sources`, but it still accepts
      // smart-collection rules (`ruleSet`) directly, which keeps this script simple.
      `mutation C($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { field message } }
      }`,
      { input: c },
    );
    check(data.collectionCreate, `collectionCreate ${c.handle}`);
    id = data.collectionCreate.collection.id;
    console.log(`created collection ${c.handle}`);
  } else {
    console.log(`collection ${c.handle} exists`);
  }
  collectionIds[c.handle] = id;
  if (onlineStore) {
    const pub = await api(
      `mutation P($id: ID!, $input: [PublicationInput!]!) {
        publishablePublish(id: $id, input: $input) { userErrors { field message } }
      }`,
      { id, input: [{ publicationId: onlineStore.id }] },
    );
    check(pub.publishablePublish, `publish ${c.handle}`);
  }
}

const page = (handle) => pages.nodes.find((p) => p.handle === handle);
const items = {
  shopAll: { title: 'Shop all', type: 'CATALOG', url: '/collections/all' },
  sets: { title: 'Party Sets', type: 'COLLECTION', resourceId: collectionIds['party-sets'] },
  toppers: { title: 'Toppers', type: 'COLLECTION', resourceId: collectionIds['toppers'] },
  contact: page('contact') && { title: 'Contact', type: 'PAGE', resourceId: page('contact').id },
  search: { title: 'Search', type: 'SEARCH', url: '/search' },
  privacy: page('data-sharing-opt-out') && {
    title: 'Your Privacy Choices',
    type: 'PAGE',
    resourceId: page('data-sharing-opt-out').id,
  },
};

const MENUS = {
  'main-menu': [items.shopAll, items.sets, items.toppers, items.contact],
  footer: [items.shopAll, items.sets, items.toppers, items.contact, items.search, items.privacy],
};

for (const [handle, list] of Object.entries(MENUS)) {
  const menu = menus.nodes.find((m) => m.handle === handle);
  if (!menu) {
    console.warn(`menu ${handle} not found, skipped`);
    continue;
  }
  const data = await api(
    `mutation M($id: ID!, $title: String!, $handle: String, $items: [MenuItemUpdateInput!]!) {
      menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { menu { id } userErrors { field message } }
    }`,
    { id: menu.id, title: menu.title, handle, items: list.filter(Boolean) },
  );
  check(data.menuUpdate, `menuUpdate ${handle}`);
  console.log(`updated menu ${handle}: ${list.filter(Boolean).map((i) => i.title).join(', ')}`);
}
