import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import JSZip from 'jszip';

export const SUPPORTED_LOCALES = new Set(['en', 'es']);

export class PullError extends Error {
  constructor(message) {
    super(message);
    this.name = 'PullError';
  }
}

export function normaliseLocale(tag) {
  return tag.trim().toLowerCase().split(/[-_]/)[0];
}

export function mergeMessages(local, remote) {
  if (Array.isArray(remote) || typeof remote !== 'object' || remote === null) return remote;
  if (Array.isArray(local) || typeof local !== 'object' || local === null) return remote;
  const merged = { ...local };
  for (const [key, value] of Object.entries(remote)) {
    merged[key] = key in local ? mergeMessages(local[key], value) : value;
  }
  return merged;
}

export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, sortKeys(value[key])])
    );
  }
  return value;
}

export function exportUrl(apiUrl, projectId) {
  const url = new URL(`/v2/projects/${projectId}/export`, apiUrl);
  url.searchParams.set('format', 'JSON');
  url.searchParams.set('structure', 'KEYS');
  url.searchParams.set('zip', 'true');
  url.searchParams.set('supportArrays', 'true');
  return url;
}

export function defaultOutDir() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(scriptDir, '..', 'messages');
}

async function readLocal(dest) {
  let raw;
  try {
    raw = await readFile(dest, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new PullError(
      `${path.relative(process.cwd(), dest)} is not valid JSON (${error.message}). ` +
        'Fix it, usually by resolving a merge conflict, and pull again. Nothing was written.'
    );
  }
}

export async function applyExport(zip, outDir) {
  await mkdir(outDir, { recursive: true });

  const skipped = [];
  const entries = [];
  zip.forEach((relativePath, file) => {
    if (!relativePath.endsWith('.json')) return;
    const filename = path.basename(relativePath);
    const locale = normaliseLocale(filename.replace(/\.json$/i, ''));
    if (!SUPPORTED_LOCALES.has(locale)) {
      skipped.push(filename);
      return;
    }
    entries.push({ file, dest: path.join(outDir, `${locale}.json`) });
  });

  if (!entries.length) throw new PullError('Tolgee export zip contained no JSON files.');

  const results = [];
  for (const { file, dest } of entries) {
    const remote = JSON.parse(await file.async('string'));
    const local = await readLocal(dest);
    results.push({ dest, messages: local ? mergeMessages(local, remote) : remote });
  }

  await Promise.all(
    results.map(({ dest, messages }) =>
      writeFile(dest, JSON.stringify(sortKeys(messages), null, 2) + '\n', 'utf8')
    )
  );

  const missing = [...SUPPORTED_LOCALES].filter(
    (locale) => !zip.file(new RegExp(`(^|/)${locale}(-[A-Za-z]+)?\\.json$`, 'i')).length
  );

  return { outDir, written: results.map(({ dest }) => dest), skipped, missing };
}

export async function pullTranslations({
  env = process.env,
  outDir = defaultOutDir(),
  fetchImpl = fetch,
} = {}) {
  const apiUrl = env.TOLGEE_API_URL;
  const apiKey = env.TOLGEE_API_KEY;
  const projectId = env.TOLGEE_PROJECT_ID;

  if (!apiUrl || !apiKey || !projectId) {
    throw new PullError(
      'Missing Tolgee env vars: TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY.'
    );
  }

  const response = await fetchImpl(exportUrl(apiUrl, projectId).toString(), {
    headers: { 'X-API-Key': apiKey },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new PullError(
      `Tolgee export failed: ${response.status} ${response.statusText}\n${body.slice(0, 500)}`
    );
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return applyExport(await JSZip.loadAsync(buffer), outDir);
}

export async function main() {
  try {
    const { outDir, skipped, missing } = await pullTranslations();
    console.log(`Updated translations in ${outDir}`);
    if (skipped.length) {
      console.warn(`Skipped unsupported locales from Tolgee: ${skipped.join(', ')}`);
    }
    if (missing.length) {
      console.warn(
        `Tolgee has no export for: ${missing.join(', ')} — add the language to the project, ` +
          'or those locales will fall back to whatever is committed.'
      );
    }
    return 0;
  } catch (error) {
    console.error(error instanceof PullError ? error.message : error);
    return 1;
  }
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  process.exitCode = await main();
}
