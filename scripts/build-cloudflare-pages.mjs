import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDirectory, '..');
const distRoot = path.join(projectRoot, 'dist');
const maxFileBytes = 25 * 1024 * 1024;
const publicDirectories = ['articles', 'services', 'css', 'js', 'img', 'images'];
const publicRootNames = new Set(['robots.txt', 'sitemap.xml', 'IMG_3686.MOV']);
const publicRootExtensions = new Set(['.html', '.jpg', '.jpeg', '.png', '.webp']);

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

await rm(distRoot, { recursive: true, force: true });
await mkdir(distRoot, { recursive: true });
await copyRootFiles();

for (const directory of publicDirectories) {
  await cp(path.join(projectRoot, directory), path.join(distRoot, directory), {
    recursive: true,
  });
}

const publishedFiles = await listFiles(distRoot);
for (const file of publishedFiles) {
  const fileStat = await stat(file);
  if (fileStat.size > maxFileBytes) {
    throw new Error(
      `${path.relative(distRoot, file)} превышает лимит Cloudflare Pages 25 MiB`
    );
  }
}

console.log(`Подготовлено файлов для публикации: ${publishedFiles.length}`);
