import { recordMessageSource } from '@/observability/app-metrics';
import { withSpan } from '@/observability/spans';

import type { Locale } from './config';
import { DEFAULT_LOCALE } from './config';
import { loadLocalMessages } from './local';
import { loadRemoteMessages } from './remote';
import type { MessageValue, Messages } from './translator';

import type { Span } from '@opentelemetry/api';

function isMessageObject(value: MessageValue | undefined): value is Messages {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function mergeMessages(base: Messages, override: Messages): Messages {
  const merged: Messages = { ...base };

  for (const [key, value] of Object.entries(override)) {
    const current = merged[key];
    if (isMessageObject(current) && isMessageObject(value)) {
      merged[key] = mergeMessages(current, value);
    } else {
      merged[key] = value;
    }
  }

  return merged;
}

export async function loadMessages(locale: Locale) {
  return withSpan('i18n.load_messages', (span) => resolveMessages(locale, span), {
    'gpool.i18n.locale': locale,
  });
}

async function resolveMessages(locale: Locale, span: Span): Promise<Messages> {
  const local = await loadLocalMessages(locale);
  const remote = await loadRemoteMessages(locale);
  if (local && remote) {
    span.setAttribute('gpool.i18n.source', 'merged');
    recordMessageSource('merged');
    return mergeMessages(local, remote);
  }
  if (remote) {
    span.setAttribute('gpool.i18n.source', 'remote');
    recordMessageSource('remote');
    return remote;
  }
  if (local) {
    span.setAttribute('gpool.i18n.source', 'local');
    recordMessageSource('local');
    return local;
  }

  // Fall back to the default locale when translations for the requested locale
  // are not yet available (e.g. 'en' while only 'es' files exist).
  if (locale !== DEFAULT_LOCALE) {
    span.setAttribute('gpool.i18n.source', 'default_locale');
    recordMessageSource('default_locale');
    return resolveMessages(DEFAULT_LOCALE, span);
  }

  throw new Error(
    `Translations not available for locale "${locale}". ` +
      'Provide local message files or configure Tolgee (TOLGEE_API_URL, TOLGEE_PROJECT_ID, TOLGEE_API_KEY).'
  );
}
