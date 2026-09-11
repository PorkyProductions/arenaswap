import { i18n } from '#i18n';
import type { Game, Team } from '@arenaswap/core/types';
import Crest from '@arenaswap/ui/src/components/crest';
import { formatCompactCountdown, useStartCountdown } from './startCountdown';

// Blank rather than lettered: the abbreviation is already the next element along. It still holds
// its box, because collapsing an 18px item drags the centred matchup off the card's axis.
const BarCrest = ({ team }: { team: Team }) => (
	<Crest logo={team.logo} abbreviation={team.abbreviation} className='gd-bar-logo' fallback='blank' />
);

interface barSlotProps {
	game: Game;
	statusText: string;
	compact: boolean;
}

// A delay description wins the slot outright: a postponed game has something to say that a time
// until a start nobody is holding to does not. Otherwise the slot is the period and clock once a
// game is under way and the countdown before it, which is why the two share one element.
//
// Own component so a countdown tick re-renders this span and leaves the hero, the breakdown and
// the four ECharts canvases untouched, the way startCountdownDisplay does for the hero.
const BarSlot = ({ game, statusText, compact }: barSlotProps) => {
	const parts = useStartCountdown(game.status === 'pre' ? game.startTime : undefined);
	const text = statusText || formatCompactCountdown(parts, i18n.t);

	if (!text) return null;
	return (
		<span className={`gd-bar-status${compact ? ' is-visible' : ''}`} aria-hidden={!compact}>
			{text}
		</span>
	);
};

interface detailStickyBarProps {
	game: Game;
	statusText: string;
	compact: boolean;
	onBack: () => void;
}

// The matchup is absolutely centred and the status pinned separately to the right. In one
// centred group a longer status string drags the score off the card's axis, and it drifts
// again every time the period changes.
const detailStickyBar = ({ game, statusText, compact, onBack }: detailStickyBarProps) => {
	// Before a start both scores are 0 and stay 0, so the abbreviations are doing the bar's whole
	// job on their own and the figures are noise. The rule between them stays either way: it is
	// what makes the pair read as one matchup rather than two adjacent teams.
	const showScores = game.status !== 'pre';

	return (
		<div className='game-detail-header'>
			<button type='button' className='btn btn-sm game-detail-back-button' onClick={onBack}>
				<i className='bi bi-arrow-left' aria-hidden='true' />
				<span>{i18n.t('detail.back')}</span>
			</button>
			<div className={`gd-bar-compact${compact ? ' is-visible' : ''}`} aria-hidden={!compact}>
				<BarCrest team={game.awayTeam} />
				<span className='gd-bar-abbrev'>{game.awayTeam.abbreviation}</span>
				{showScores && <span className='gd-bar-score'>{game.awayTeam.score}</span>}
				<span className='gd-bar-sep' aria-hidden='true' />
				{showScores && <span className='gd-bar-score'>{game.homeTeam.score}</span>}
				<span className='gd-bar-abbrev'>{game.homeTeam.abbreviation}</span>
				<BarCrest team={game.homeTeam} />
			</div>
			<BarSlot game={game} statusText={statusText} compact={compact} />
		</div>
	);
};

export default detailStickyBar;
