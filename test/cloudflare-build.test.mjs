import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const projectRoot = path.resolve(import.meta.dirname, '..');
const distRoot = path.join(projectRoot, 'dist');
const maxFileBytes = 25 * 1024 * 1024;

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function localReferences(html) {
  const references = [];
  const attributePattern = /(?:src|href|poster)=["']([^"']+)["']/gi;
  for (const match of html.matchAll(attributePattern)) {
    const value = match[1].trim();
    if (!value || /^(?:https?:|mailto:|tel:|data:|javascript:|#)/i.test(value)) continue;
    references.push(value.split(/[?#]/)[0]);
  }
  return references;
}

test('сборка публикует только файлы сайта и сохраняет локальные ссылки', () => {
  execFileSync(process.execPath, ['scripts/build-cloudflare-pages.mjs'], {
    cwd: projectRoot,
    stdio: 'pipe',
  });

  assert.equal(existsSync(path.join(distRoot, 'index.html')), true);
  assert.equal(existsSync(path.join(distRoot, 'js/main.js')), true);
  assert.equal(existsSync(path.join(distRoot, 'services/polirovka-kuzova.html')), true);
  assert.equal(existsSync(path.join(distRoot, 'backend/src/app.js')), false);
  assert.equal(existsSync(path.join(distRoot, 'docs')), false);
  assert.equal(existsSync(path.join(distRoot, 'functions')), false);
  assert.equal(
    existsSync(path.join(distRoot, 'Отчет_о_соответствии_сайта_LS_Detailing_ТЗ.docx')),
    false
  );

  const files = walk(distRoot);
  for (const file of files) {
    assert.ok(
      statSync(file).size <= maxFileBytes,
      `${path.relative(distRoot, file)} превышает лимит Cloudflare Pages`
    );
  }

  const htmlFiles = files.filter((file) => file.endsWith('.html'));
  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, 'utf8');
    for (const reference of localReferences(html)) {
      const target = path.resolve(path.dirname(htmlFile), decodeURIComponent(reference));
      assert.ok(
        target.startsWith(distRoot + path.sep) || target === distRoot,
        `${path.relative(distRoot, htmlFile)} содержит путь за пределы сайта: ${reference}`
      );
      assert.ok(
        existsSync(target),
        `${path.relative(distRoot, htmlFile)} ссылается на отсутствующий файл: ${reference}`
      );
    }
  }
});
