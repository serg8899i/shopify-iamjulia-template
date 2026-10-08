#!/usr/bin/env node
// Uploads local PNG/JPEG images to Shopify Files and prints the shopify://shop_images/<name> reference
// that theme image_picker settings use.
//
// Env: SHOPIFY_STORE, SHOPIFY_CLIENT_ID, SHOPIFY_CLIENT_SECRET
// Run: NODE_USE_ENV_PROXY=1 node tools/upload-files.mjs brand/iamjulia-logo.png [more files...]

import { readFile, stat } from 'node:fs/promises';
import { openAsBlob } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_VERSION = '2026-07';
const here = dirname(fileURLToPath(import.meta.url));
const store = process.env.SHOPIFY_STORE;
const paths = process.argv.slice(2);
if (!paths.length) throw new Error('Pass one or more image paths');

const gql = (name) => readFile(join(here, 'graphql', `${name}.graphql`), 'utf8');
const mimeOf = (p) => ({ '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' })[extname(p).toLowerCase()];

const tokenRes = await fetch(`https://${store}/admin/oauth/access_token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: process.env.SHOPIFY_CLIENT_ID,
    client_secret: process.env.SHOPIFY_CLIENT_SECRET,
  }),
});
if (!tokenRes.ok) throw new Error(`Token request failed: ${tokenRes.status} ${await tokenRes.text()}`);
const token = (await tokenRes.json()).access_token;

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

const files = await Promise.all(paths.map(async (p) => ({ path: p, size: (await stat(p)).size, mime: mimeOf(p) })));
for (const f of files) if (!f.mime) throw new Error(`Unsupported file type: ${f.path}`);

const staged = await api(await gql('staged-uploads'), {
  input: files.map((f) => ({
    resource: 'IMAGE',
    filename: basename(f.path),
    mimeType: f.mime,
    fileSize: String(f.size),
    httpMethod: 'POST',
  })),
});
check(staged.stagedUploadsCreate, 'stagedUploadsCreate');

const inputs = [];
for (const [i, target] of staged.stagedUploadsCreate.stagedTargets.entries()) {
  const form = new FormData();
  for (const { name, value } of target.parameters) form.append(name, value);
  form.append('file', await openAsBlob(files[i].path, { type: files[i].mime }), basename(files[i].path));
  const res = await fetch(target.url, { method: 'POST', body: form });
  if (!res.ok) throw new Error(`Upload failed for ${files[i].path}: ${res.status} ${await res.text()}`);
  inputs.push({ originalSource: target.resourceUrl, contentType: 'IMAGE', filename: basename(files[i].path), alt: 'iamjulia' });
}

const created = await api(await gql('file-create'), { files: inputs });
check(created.fileCreate, 'fileCreate');

const statusQuery = await gql('file-status');
for (const [i, file] of created.fileCreate.files.entries()) {
  let node;
  for (let attempt = 0; attempt < 20; attempt++) {
    node = (await api(statusQuery, { id: file.id })).node;
    if (node?.fileStatus === 'READY' || node?.fileStatus === 'FAILED') break;
    await new Promise((r) => setTimeout(r, 1500));
  }
  if (node?.fileStatus !== 'READY') throw new Error(`File ${files[i].path} not ready: ${node?.fileStatus}`);
  const name = decodeURIComponent(new URL(node.image.url).pathname.split('/').pop());
  console.log(`${files[i].path} -> shopify://shop_images/${name}`);
}
