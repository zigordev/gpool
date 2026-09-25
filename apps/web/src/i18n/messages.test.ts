import { beforeEach, describe, expect, it, vi } from 'vitest';

import { writeLogRecord } from '@/observability/json-logger';
import { registry } from '@/observability/metrics.registry';

import { loadLocalMessages } from './local';
import { loadMessages } from './messages';
import { loadRemoteMessages } from './remote';

vi.mock('./local', () => ({ loadLocalMessages: vi.fn() }));
vi.mock('./remote', () => ({ loadRemoteMessages: vi.fn() }));
vi.mock('@/observability/json-logger', () => ({ writeLogRecord: vi.fn() }));

const local = vi.mocked(loadLocalMessages);
const remote = vi.mocked(loadRemoteMessages);
const logged = vi.mocked(writeLogRecord);

async function loadsFrom(source: string): Promise<number> {
  const text = await registry.metrics();
  const found = new RegExp(`^gpool_i18n_messages_total\\{source="${source}"\\} (\\d+)`, 'm').exec(
    text
  );
  return found ? Number(found[1]) : 0;
}

describe('loadMessages', () => {
  beforeEach(() => {
    local.mockReset();
    remote.mockReset();
    logged.mockReset();
  });

  it('counts a merged load when Tolgee and the committed files both answer', async () => {
    local.mockResolvedValue({ nav: { home: 'Inicio', pools: 'Quinielas' } });
    remote.mockResolvedValue({ nav: { home: 'Portada' } });
    const before = await loadsFrom('merged');

    await expect(loadMessages('es')).resolves.toEqual({
      nav: { home: 'Portada', pools: 'Quinielas' },
    });
    expect(await loadsFrom('merged')).toBe(before + 1);
  });

  it('counts a remote load when nothing is committed', async () => {
    local.mockResolvedValue(null);
    remote.mockResolvedValue({ nav: { home: 'Portada' } });
    const before = await loadsFrom('remote');

    await loadMessages('es');

    expect(await loadsFrom('remote')).toBe(before + 1);
  });

  it('counts a local load when Tolgee has nothing, which is the fallback nobody could see', async () => {
    local.mockResolvedValue({ nav: { home: 'Inicio' } });
    remote.mockResolvedValue(null);
    const before = await loadsFrom('local');

    await loadMessages('es');

    expect(await loadsFrom('local')).toBe(before + 1);
  });

  it('counts a default-locale fallback when the requested locale has no copy at all', async () => {
    local.mockImplementation(async (locale) =>
      locale === 'es' ? { nav: { home: 'Inicio' } } : null
    );
    remote.mockResolvedValue(null);
    const before = await loadsFrom('default_locale');

    await expect(loadMessages('en')).resolves.toEqual({ nav: { home: 'Inicio' } });
    expect(await loadsFrom('default_locale')).toBe(before + 1);
  });

  it('merges a list entry by entry rather than replacing the whole list', async () => {
    local.mockResolvedValue({ home: { bullets: ['Uno', 'Dos', 'Tres'] } });
    remote.mockResolvedValue({ home: { bullets: ['Primero', 'Dos', 'Tercero'] } });

    await expect(loadMessages('es')).resolves.toEqual({
      home: { bullets: ['Primero', 'Dos', 'Tercero'] },
    });
  });

  it('keeps the committed list when Tolgee returns fewer entries, and warns once', async () => {
    local.mockResolvedValue({ pricing: { perks: ['Uno', 'Dos', 'Tres'] } });
    remote.mockResolvedValue({ pricing: { perks: ['Primero'] } });

    await expect(loadMessages('es')).resolves.toEqual({
      pricing: { perks: ['Uno', 'Dos', 'Tres'] },
    });
    expect(logged).toHaveBeenCalledWith('warn', {
      event: 'i18n.list_length_mismatch',
      key: 'pricing.perks',
      committed: 3,
      remote: 1,
    });

    logged.mockClear();
    await loadMessages('es');
    expect(logged).not.toHaveBeenCalled();
  });

  it('keeps the committed list when Tolgee returns more entries, and warns once', async () => {
    local.mockResolvedValue({ faq: { steps: ['Uno', 'Dos'] } });
    remote.mockResolvedValue({ faq: { steps: ['Primero', 'Segundo', 'Tercero'] } });

    await expect(loadMessages('es')).resolves.toEqual({
      faq: { steps: ['Uno', 'Dos'] },
    });
    expect(logged).toHaveBeenCalledWith('warn', {
      event: 'i18n.list_length_mismatch',
      key: 'faq.steps',
      committed: 2,
      remote: 3,
    });

    logged.mockClear();
    await loadMessages('es');
    expect(logged).not.toHaveBeenCalled();
  });

  it('keeps the fields of a list entry the export did not carry', async () => {
    local.mockResolvedValue({ plans: { rows: [{ name: 'Free', note: 'Hasta tres quinielas' }] } });
    remote.mockResolvedValue({ plans: { rows: [{ name: 'Gratis' }] } });

    await expect(loadMessages('es')).resolves.toEqual({
      plans: { rows: [{ name: 'Gratis', note: 'Hasta tres quinielas' }] },
    });
  });

  it('takes the remote list when nothing is committed under that key', async () => {
    local.mockResolvedValue({ nav: { home: 'Inicio' } });
    remote.mockResolvedValue({ faq: { steps: ['Uno', 'Dos'] } });

    await expect(loadMessages('es')).resolves.toEqual({
      nav: { home: 'Inicio' },
      faq: { steps: ['Uno', 'Dos'] },
    });
  });

  it('throws when not even the default locale has copy', async () => {
    local.mockResolvedValue(null);
    remote.mockResolvedValue(null);

    await expect(loadMessages('es')).rejects.toThrow(/Translations not available/);
  });
});
