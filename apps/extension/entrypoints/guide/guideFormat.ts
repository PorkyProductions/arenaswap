import { i18n } from '#i18n';
import type { guideBand } from './guideHeat';

export const formatGuideTime = (ms: number): string => (
	new Date(ms).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
);

// Assembled from the parts that are actually present rather than written inline with separators
// between them: an empty piece would otherwise leave an orphan '·' on the line.
export const bandLabel = (band: guideBand): string => [
	i18n.t('guide.bestWindow'),
	`${formatGuideTime(band.fromMs)}–${formatGuideTime(band.toMs)}`,
	i18n.t('guide.bandGames', band.gameCount),
	band.favoriteCount > 0 ? i18n.t('guide.bandFavorites', band.favoriteCount) : '',
].filter(Boolean).join(' · ');
