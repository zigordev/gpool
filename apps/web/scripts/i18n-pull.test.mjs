import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { applyExport, exportUrl, pullTranslations } from './i18n-pull.mjs';

const TOLGEE_EXPORT_PARAMETERS = new Set([
  'languages',
  'format',
  'structureDelimiter',
  'filterKeyId',
  'filterKeyIdNot',
  'filterTag',
  'filterTagIn',
  'filterTagNotIn',
  'filterKeyPrefix',
  'filterState',
  'filterNamespace',
  'zip',
  'messageFormat',
  'fileStructureTemplate',
  'supportArrays',
  'escapeHtml',
]);

async function zipOf(files) {
  const zip = new JSZip();
  for (const [name, contents] of Object.entries(files)) {
    zip.file(name, JSON.stringify(contents));
  }
  return JSZip.loadAsync(await zip.generateAsync({ type: 'nodebuffer' }));
}

describe('i18n pull', () => {
  let outDir;

  beforeEach(async () => {
    outDir = await mkdtemp(path.join(tmpdir(), 'gpool-i18n-'));
  });

  afterEach(async () => {
    await rm(outDir, { recursive: true, force: true });
  });

  const read = async (locale) =>
    JSON.parse(await readFile(path.join(outDir, `${locale}.json`), 'utf8'));

  it('merges the export over committed copy instead of replacing it', async () => {
    await writeFile(
      path.join(outDir, 'es.json'),
      JSON.stringify({ nav: { home: 'Inicio', pools: 'Quinielas' }, login: { title: 'Entrar' } }),
      'utf8'
    );

    await applyExport(await zipOf({ 'es.json': { nav: { home: 'Portada' } } }), outDir);

    expect(await read('es')).toEqual({
      login: { title: 'Entrar' },
      nav: { home: 'Portada', pools: 'Quinielas' },
    });
  });

  it('takes the export as it is when nothing is committed yet', async () => {
    await applyExport(await zipOf({ 'en.json': { nav: { home: 'Home' } } }), outDir);

    expect(await read('en')).toEqual({ nav: { home: 'Home' } });
  });

  it('writes a region subtag onto the file the app reads', async () => {
    await applyExport(await zipOf({ 'es-ES.json': { nav: { home: 'Portada' } } }), outDir);

    expect(await read('es')).toEqual({ nav: { home: 'Portada' } });
  });

  it('skips locales the app does not support, and names them', async () => {
    const result = await applyExport(
      await zipOf({
        'en.json': { nav: { home: 'Home' } },
        'fr.json': { nav: { home: 'Accueil' } },
      }),
      outDir
    );

    expect(result.skipped).toEqual(['fr.json']);
    await expect(read('fr')).rejects.toThrow();
  });

  it('names every supported locale Tolgee exported nothing for', async () => {
    const result = await applyExport(
      await zipOf({ 'es.json': { nav: { home: 'Portada' } } }),
      outDir
    );

    expect(result.missing).toEqual(['en']);
  });

  it('sorts keys on write, so a pull with no new copy is an empty diff', async () => {
    await applyExport(
      await zipOf({ 'en.json': { nav: { pools: 'Pools', home: 'Home' }, common: { ok: 'OK' } } }),
      outDir
    );

    expect(await readFile(path.join(outDir, 'en.json'), 'utf8')).toBe(
      `${JSON.stringify({ common: { ok: 'OK' }, nav: { home: 'Home', pools: 'Pools' } }, null, 2)}\n`
    );
  });

  it('writes nothing when a committed file cannot be parsed', async () => {
    const conflicted = '<<<<<<< HEAD\n{}\n';
    await writeFile(path.join(outDir, 'es.json'), conflicted, 'utf8');

    await expect(
      applyExport(
        await zipOf({
          'en.json': { nav: { home: 'Home' } },
          'es.json': { nav: { home: 'Portada' } },
        }),
        outDir
      )
    ).rejects.toThrow(/is not valid JSON/);

    expect(await readFile(path.join(outDir, 'es.json'), 'utf8')).toBe(conflicted);
    await expect(read('en')).rejects.toThrow();
  });

  it('refuses an export that carries no JSON at all', async () => {
    const zip = new JSZip();
    zip.file('README.txt', 'nothing here');

    await expect(
      applyExport(await JSZip.loadAsync(await zip.generateAsync({ type: 'nodebuffer' })), outDir)
    ).rejects.toThrow(/no JSON files/);
  });

  it('sends only parameters the Tolgee export endpoint defines', () => {
    const url = exportUrl('http://tolgee.invalid', '2');

    expect(url.pathname).toBe('/v2/projects/2/export');
    expect(
      [...url.searchParams.keys()].filter((key) => !TOLGEE_EXPORT_PARAMETERS.has(key))
    ).toEqual([]);
  });

  it('asks for the same nested, array-aware shape the runtime loader reads', () => {
    const url = exportUrl('http://tolgee.invalid', '2');

    expect(url.searchParams.get('format')).toBe('JSON');
    expect(url.searchParams.get('structureDelimiter')).toBe('.');
    expect(url.searchParams.get('supportArrays')).toBe('true');
  });

  it('merges list entries in place when the export has the same number of them', async () => {
    await writeFile(
      path.join(outDir, 'es.json'),
      JSON.stringify({ home: { bullets: ['Uno', 'Dos', 'Tres'] } }),
      'utf8'
    );

    const result = await applyExport(
      await zipOf({ 'es.json': { home: { bullets: ['Primero', 'Dos', 'Tercero'] } } }),
      outDir
    );

    expect(await read('es')).toEqual({ home: { bullets: ['Primero', 'Dos', 'Tercero'] } });
    expect(result.keptLists).toEqual([]);
  });

  it('keeps the committed list when the export is short, and names it', async () => {
    await writeFile(
      path.join(outDir, 'es.json'),
      JSON.stringify({ home: { bullets: ['Uno', 'Dos', 'Tres'] } }),
      'utf8'
    );

    const result = await applyExport(
      await zipOf({ 'es.json': { home: { bullets: ['Primero'] } } }),
      outDir
    );

    expect(await read('es')).toEqual({ home: { bullets: ['Uno', 'Dos', 'Tres'] } });
    expect(result.keptLists).toEqual(['home.bullets (3 committed, 1 exported)']);
  });

  it('refuses a flat export and writes nothing', async () => {
    const committed = JSON.stringify({ nav: { home: 'Inicio' } });
    await writeFile(path.join(outDir, 'es.json'), committed, 'utf8');

    await expect(
      applyExport(await zipOf({ 'es.json': { 'nav.home': 'Portada' } }), outDir)
    ).rejects.toThrow(/dotted keys/);

    expect(await readFile(path.join(outDir, 'es.json'), 'utf8')).toBe(committed);
  });

  it('refuses an export that kept Tolgee bracket keys instead of arrays', async () => {
    await expect(
      applyExport(await zipOf({ 'en.json': { 'home[0]': 'First' } }), outDir)
    ).rejects.toThrow(/dotted keys/);
  });

  it('stops before fetching when Tolgee is not configured', async () => {
    await expect(pullTranslations({ env: {}, outDir })).rejects.toThrow(/Missing Tolgee env vars/);
  });
});
