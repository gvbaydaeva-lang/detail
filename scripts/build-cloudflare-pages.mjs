import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const distRoot = path.join(projectRoot, 'dist');
const maxFileBytes = 25 * 1024 * 1024;
const publicDirectories = ['articles', 'services', 'css', 'js', 'img', 'images'];
const publicRootNames = new Set(['robots.txt', 'sitemap.xml', 'IMG_3686.MOV']);
const publicRootExtensions = new Set(['.html', '.jpg', '.jpeg', '.png', '.webp']);
const assetOrigin = 'https://ls-detailing.pages.dev';

async function copyRootFiles() {
  const entries = await readdir(projectRoot, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const extension = path.extname(entry.name).toLowerCase();
    if (!publicRootNames.has(entry.name) && !publicRootExtensions.has(extension)) continue;
    await cp(path.join(projectRoot, entry.name), path.join(distRoot, entry.name));
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? listFiles(fullPath) : [fullPath];
  }));
  return nested.flat();
}

function isExternalReference(reference) {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(reference);
}

function assetUrl(htmlFile, reference) {
  if (!reference || isExternalReference(reference)) return reference;
  const htmlPath = path.relative(distRoot, htmlFile).split(path.sep).join('/');
  return new URL(reference, `${assetOrigin}/${htmlPath}`).href;
}

function rewriteSrcset(htmlFile, value) {
  return value
    .split(',')
    .map((candidate) => {
      const match = candidate.trim().match(/^(.*?)(\s+\d+(?:\.\d+)?[wx])?$/);
      if (!match) return candidate;
      return `${assetUrl(htmlFile, match[1])}${match[2] ?? ''}`;
    })
    .join(', ');
}

async function rewriteHtmlAssets(htmlFile) {
  let html = await readFile(htmlFile, 'utf8');

  html = html.replace(
    /\b(src|poster|data-lightbox-src|srcset)=(["'])([^"']*)\2/gi,
    (match, attribute, quote, reference) => {
      const rewritten = attribute.toLowerCase() === 'srcset'
        ? rewriteSrcset(htmlFile, reference)
        : assetUrl(htmlFile, reference);
      return `${attribute}=${quote}${rewritten}${quote}`;
    }
  );

  html = html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel=["'][^"']*stylesheet/i.test(tag)) return tag;
    return tag.replace(
      /\bhref=(["'])([^"']*)\1/i,
      (match, quote, reference) => `href=${quote}${assetUrl(htmlFile, reference)}${quote}`
    );
  });

  await writeFile(htmlFile, html);
}

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await copyRootFiles();

for (const directory of publicDirectories) {
  await cp(path.join(projectRoot, directory), path.join(distRoot, directory), {
    recursive: true,
  });
}

const publishedFiles = await listFiles(distRoot);
await Promise.all(
  publishedFiles
    .filter((file) => file.endsWith('.html'))
    .map((file) => rewriteHtmlAssets(file))
);

for (const file of publishedFiles) {
  const fileStat = await stat(file);
  if (fileStat.size > maxFileBytes) {
    throw new Error(
      `${path.relative(distRoot, file)} превышает лимит Cloudflare Pages 25 MiB`
    );
  }
}

console.log(`Подготовлено файлов для публикации: ${publishedFiles.length}`);
