#!/usr/bin/env node
// Creates or updates the mockup products from tools/products.json in the Shopify store,
// uploading images from a local clone of serg8899i/iamjulia-content.
//
// Env: SHOPIFY_STORE (xxx.myshopify.com), SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
// Run: NODE_USE_ENV_PROXY=1 node tools/seed-products.mjs [--content ../iamjulia-content] [--dry-run]
//
// Idempotent: productSet upserts by handle, so re-running replaces each product's media and variants.

import { readFile, stat } from 'node:fs/promises';
import { openAsBlob } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

const API_VERSION = '2026-07';
const here = dirname(fileURLToPath(import.meta.url));

const { values: args } = parseArgs({
  options: {
    content: { type: 'string', default: resolve(here, '../../iamjulia-content') },
    'dry-run': { type: 'boolean', default: false },
  },
});

const gql = (name) => readFile(join(here, 'graphql', `${name}.graphql`), 'utf8');

async function getToken(store) {
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
  const body = await res.json();
  console.log(`Token scopes: ${body.scope}`);
  return body.access_token;
}

function client(store, token) {
  return async (query, variables = {}) => {
    const res = await fetch(`https://${store}/admin/api/${API_VERSION}/graphql.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ query, variables }),
    });
    const body = await res.json();
    if (!res.ok || body.errors) throw new Error(`GraphQL error: ${JSON.stringify(body.errors ?? body)}`);
    return body.data;
  };
}

function checkUserErrors(payload, what) {
  if (payload.userErrors?.length) throw new Error(`${what}: ${JSON.stringify(payload.userErrors)}`);
}

// Upload local files via staged uploads; returns resourceUrl per path.
async function uploadImages(api, paths) {
  const files = await Promise.all(paths.map(async (p) => ({ path: p, size: (await stat(p)).size })));
  const data = await api(await gql('staged-uploads'), {
    input: files.map((f) => ({
      resource: 'IMAGE',
      filename: basename(f.path),
      mimeType: 'image/png',
      fileSize: String(f.size),
      httpMethod: 'POST',
    })),
  });
  checkUserErrors(data.stagedUploadsCreate, 'stagedUploadsCreate');

  const urls = new Map();
  for (const [i, target] of data.stagedUploadsCreate.stagedTargets.entries()) {
    const form = new FormData();
    for (const { name, value } of target.parameters) form.append(name, value);
    form.append('file', await openAsBlob(files[i].path, { type: 'image/png' }), basename(files[i].path));
    const res = await fetch(target.url, { method: 'POST', body: form });
    if (!res.ok) throw new Error(`Upload failed for ${files[i].path}: ${res.status} ${await res.text()}`);
    urls.set(files[i].path, target.resourceUrl);
    console.log(`  uploaded ${files[i].path}`);
  }
  return urls;
}

const catalog = JSON.parse(await readFile(join(here, 'products.json'), 'utf8'));
const manifest = JSON.parse(await readFile(join(args.content, 'manifest.json'), 'utf8'));
const heroById = new Map(manifest.heroes.map((h) => [h.id, h]));

// Resolve images per product: one entry per (palette, hero kind), primary version from the manifest.
const plan = catalog.products.map((product) => {
  const images = [];
  for (const [palette, label] of Object.entries(catalog.palettes)) {
    const name = catalog.sample_names[palette];
    for (const kind of product.heroes) {
      const id = `${name.toLowerCase()}-${kind}`;
      const hero = heroById.get(id);
      if (!hero) throw new Error(`Hero ${id} not found in manifest`);
      images.push({
        palette: label,
        path: join(args.content, hero.primary),
        alt: `${product.title} — ${label} palette, sample name ${name}`,
      });
    }
  }
  return { product, images };
});

if (args['dry-run']) {
  for (const { product, images } of plan) {
    console.log(`${product.handle} ($${product.price})`);
    for (const img of images) console.log(`  [${img.palette}] ${img.path}`);
  }
  process.exit(0);
}

for (const key of ['SHOPIFY_STORE', 'SHOPIFY_CLIENT_ID', 'SHOPIFY_CLIENT_SECRET']) {
  if (!process.env[key]) throw new Error(`Missing env ${key}`);
}
const store = process.env.SHOPIFY_STORE;
const api = client(store, await getToken(store));

const publications = (await api(await gql('publications'))).publications.nodes;
const onlineStore = publications.find(
  (p) => p.name === 'Online Store' || /(^|for )Online Store$/.test(p.catalog?.title ?? ''),
);
if (!onlineStore) console.warn('Online Store publication not found; products will not be published.');

const productSetQuery = await gql('product-set');
const publishQuery = await gql('publish');

for (const { product, images } of plan) {
  console.log(`\n${product.handle}`);
  const urls = await uploadImages(api, images.map((i) => i.path));
  const files = images.map((img) => ({
    originalSource: urls.get(img.path),
    alt: img.alt,
    contentType: 'IMAGE',
    filename: basename(img.path),
  }));
  const paletteNames = Object.values(catalog.palettes);

  const data = await api(productSetQuery, {
    identifier: { handle: product.handle },
    input: {
      title: product.title,
      handle: product.handle,
      descriptionHtml: product.description_html,
      vendor: catalog.vendor,
      productType: product.product_type,
      tags: ['mockup', `content-${catalog.content_commit.slice(0, 7)}`, ...(product.tags ?? [])],
      status: 'ACTIVE',
      productOptions: [{ name: 'Palette', position: 1, values: paletteNames.map((name) => ({ name })) }],
      files,
      variants: paletteNames.map((palette) => {
        const first = files[images.findIndex((img) => img.palette === palette)];
        return {
          optionValues: [{ optionName: 'Palette', name: palette }],
          price: product.price,
          sku: `${product.handle}-${palette.toLowerCase()}`,
          inventoryPolicy: 'CONTINUE',
          inventoryItem: { tracked: false },
          file: { originalSource: first.originalSource, contentType: 'IMAGE' },
        };
      }),
    },
  });
  checkUserErrors(data.productSet, `productSet ${product.handle}`);
  const { id, media } = data.productSet.product;
  console.log(`  saved ${id} (${media.nodes.length} media)`);

  if (onlineStore) {
    const pub = await api(publishQuery, { id, input: [{ publicationId: onlineStore.id }] });
    checkUserErrors(pub.publishablePublish, `publish ${product.handle}`);
    console.log('  published to Online Store');
  }
}
