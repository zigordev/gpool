import type { RumVocabulary } from './rum-metrics';
import { RUM_PAGES } from './rum-pages';

export const RUM_CUSTOM_INTERACTIONS = [
  'Pool Created',
  'User Invited',
  'Access Requested',
  'Invitation Accepted',
  'Invitation Accept Failed',
  'Access Request Accepted',
  'Access Request Accept Failed',
] as const;

export const RUM_VOCABULARY: RumVocabulary = {
  customInteractions: RUM_CUSTOM_INTERACTIONS,
  pages: RUM_PAGES,
};
