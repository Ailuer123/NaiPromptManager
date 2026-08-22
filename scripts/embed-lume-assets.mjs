import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsDir = path.join(root, 'prototypes', 'design-assets');
const htmlPath = path.join(root, 'prototypes', 'lume-prototype.public.html');
const outRoot = path.join(root, 'prototypes', 'lume-prototype.html');
const outPublic = path.join(root, 'prototypes', 'lume-prototype.standalone.html');

let html = fs.readFileSync(htmlPath, 'utf8');

const files = fs
  .readdirSync(assetsDir)
  .filter((f) => /\.(jpe?g|png|webp|gif)$/i.test(f))
  .sort();

const map = {};
for (const f of files) {
  const buf = fs.readFileSync(path.join(assetsDir, f));
  const lower = f.toLowerCase();
  const mime = lower.endsWith('.png')
    ? 'image/png'
    : lower.endsWith('.webp')
      ? 'image/webp'
      : lower.endsWith('.gif')
        ? 'image/gif'
        : 'image/jpeg';
  map[f] = `data:${mime};base64,${buf.toString('base64')}`;
}

const totalChars = Object.values(map).reduce((a, b) => a + b.length, 0);
console.log(`assets: ${files.length}, base64 chars: ${totalChars}`);

// Static <img src="design-assets/..."> -> data-asset + empty src (hydrated later)
html = html.replace(
  /src="design-assets\/([^"]+)"/g,
  'data-asset="$1" src=""'
);
html = html.replace(
  /src='design-assets\/([^']+)'/g,
  "data-asset='$1' src=''"
);

// JS string paths -> asset('filename')
html = html.replace(/['"]design-assets\/([^'"]+)['"]/g, (_, name) => {
  return `asset('${name}')`;
});

const inject = `
    /* Embedded design assets — single-file shareable prototype */
    const ASSETS = ${JSON.stringify(map)};
    function asset(name) {
      const key = String(name || '').replace(/^.*[/\\\\]/, '');
      return ASSETS[key] || '';
    }
    function hydrateAssets(root) {
      (root || document).querySelectorAll('[data-asset]').forEach((el) => {
        const src = asset(el.getAttribute('data-asset'));
        if (src) el.setAttribute('src', src);
      });
    }
`;

const marker = '<script>\n    /* Design Read:';
const altMarker = '<script>\n    /* Design Read';
let insertAt = html.indexOf(marker);
if (insertAt < 0) insertAt = html.indexOf(altMarker);
if (insertAt < 0) {
  // fallback: last <script>
  insertAt = html.lastIndexOf('<script>');
  if (insertAt < 0) throw new Error('No <script> block found');
  insertAt += '<script>'.length;
  html = html.slice(0, insertAt) + '\n' + inject + '\n' + html.slice(insertAt);
} else {
  insertAt += '<script>'.length;
  html = html.slice(0, insertAt) + '\n' + inject + '\n' + html.slice(insertAt);
}

// Ensure hydrate runs after initial static paint + after dynamic renders that may keep data-asset
if (!html.includes('hydrateAssets();')) {
  html = html.replace(
    'renderHistory();',
    `renderHistory();
    hydrateAssets();`
  );
}

// Also hydrate after re-renders that rebuild DOM with full data-URI src from asset() — no need.
// But if any template still uses data-asset, wrap render helpers:

html = html.replace(
  'root.innerHTML = list.map((c, i) => `',
  'root.innerHTML = list.map((c, i) => `'
);

// Title
html = html.replace(
  '<title>Lume · NAI Prompt Manager 移动端样板</title>',
  '<title>Lume · NAI Prompt Manager 移动端样板（单文件）</title>'
);

// Stage note: self-contained
html = html.replace(
  'LUME PROTOTYPE · 390×844 手机框预览 · 可直接点击切换',
  'LUME PROTOTYPE · 单文件自包含 · 可直接发给别人打开'
);

// System fonts only for fully offline open (optional: keep Google Fonts with fallback)
// Replace Google font link with system stack note in CSS body already has fallbacks.
// Keep Google Fonts — if offline, DM Sans falls back to Noto/system. User asked for images.

const remaining = (html.match(/design-assets/g) || []).length;
if (remaining > 0) {
  console.warn('warning: remaining design-assets refs:', remaining);
  const samples = [...html.matchAll(/.{0,40}design-assets.{0,40}/g)].slice(0, 5);
  samples.forEach((m) => console.warn('  ...', m[0]));
}

fs.writeFileSync(outRoot, html, 'utf8');
fs.writeFileSync(outPublic, html, 'utf8');

const size = fs.statSync(outRoot).size;
console.log(`written: ${outRoot}`);
console.log(`written: ${outPublic}`);
console.log(`size: ${(size / 1024 / 1024).toFixed(2)} MB`);
console.log(`remaining design-assets refs: ${remaining}`);
console.log(`asset() calls: ${(html.match(/asset\(/g) || []).length}`);
console.log(`data-asset attrs: ${(html.match(/data-asset=/g) || []).length}`);
