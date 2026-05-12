import type { Locale } from './config';
import { DEFAULT_LOCALE } from './config';
import { loadLocalMessages } from './local';
import { loadRemoteMessages } from './remote';

export async function loadMessages(locale: Locale) {
  const remote = await loadRemoteMessages(locale);
  if (remote) return remote;

  const local = await loadLocalMessages(locale);
  if (local) return local;

  // Fall back to the default locale when translations for the requested locale
  // are not yet available (e.g. 'en' while only 'es' files exist).
  if (locale !== DEFAULT_LOCALE) return loadMessages(DEFAULT_LOCALE);

  throw new Error(
    `Translations not available for locale "${locale}". ` +
      'Provide local message files or configure Tolgee (TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY).',
  );
}
