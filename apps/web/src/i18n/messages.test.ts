import { beforeEach, describe, expect, it, vi } from 'vitest';

import { registry } from '@/observability/metrics.registry';

import { loadLocalMessages } from './local';
import { loadMessages } from './messages';
import { loadRemoteMessages } from './remote';

vi.mock('./local', () => ({ loadLocalMessages: vi.fn() }));
vi.mock('./remote', () => ({ loadRemoteMessages: vi.fn() }));

const local = vi.mocked(loadLocalMessages);
const remote = vi.mocked(loadRemoteMessages);

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

  it('throws when not even the default locale has copy', async () => {
    local.mockResolvedValue(null);
    remote.mockResolvedValue(null);

    await expect(loadMessages('es')).rejects.toThrow(/Translations not available/);
  });
});
