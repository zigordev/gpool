import { notFound } from 'next/navigation';
import { PreviewGallery } from './PreviewGallery';

/**
 * Design-system preview — the shared primitives rendered beside gpool's own,
 * in gpool's real theme, with no auth and no API.
 *
 * Rendered side by side deliberately: gpool's UI kit is richer than the
 * design system's in places (illustrated empty states, collapsible sections),
 * so "which of these should converge" is a question to answer by looking,
 * not by assuming the shared one always wins.
 */
export default function DevPreviewPage() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <PreviewGallery />;
}
