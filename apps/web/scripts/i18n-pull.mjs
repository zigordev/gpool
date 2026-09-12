import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import JSZip from 'jszip';

const apiUrl = process.env.TOLGEE_API_URL;
const apiKey = process.env.TOLGEE_API_KEY;
const projectId = process.env.TOLGEE_PROJECT_ID;

if (!apiUrl || !apiKey || !projectId) {
  console.error('Missing Tolgee env vars: TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY.');
  process.exit(1);
}

const exportUrl = new URL(`/v2/projects/${projectId}/export`, apiUrl);
exportUrl.searchParams.set('format', 'JSON');
exportUrl.searchParams.set('structure', 'KEYS');
exportUrl.searchParams.set('zip', 'true');

const response = await fetch(exportUrl.toString(), {
  headers: {
    'X-API-Key': apiKey,
  },
});

if (!response.ok) {
  const body = await response.text();
  console.error(`Tolgee export failed: ${response.status} ${response.statusText}`);
  console.error(body.slice(0, 500));
  process.exit(1);
}

const buffer = Buffer.from(await response.arrayBuffer());
const zip = await JSZip.loadAsync(buffer);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(scriptDir, '..', 'messages');
await mkdir(outDir, { recursive: true });

const writes = [];
zip.forEach((relativePath, file) => {
  if (!relativePath.endsWith('.json')) return;
  const filename = path.basename(relativePath);
  const locale = filename.replace(/\.json$/i, '');
  const dest = path.join(outDir, `${locale}.json`);
  const task = file.async('string').then((content) => {
    const parsed = JSON.parse(content);
    return writeFile(dest, JSON.stringify(parsed, null, 2) + '\n', 'utf8');
  });
  writes.push(task);
});

if (!writes.length) {
  console.error('Tolgee export zip contained no JSON files.');
  process.exit(1);
}

await Promise.all(writes);
console.log(`Updated translations in ${outDir}`);
