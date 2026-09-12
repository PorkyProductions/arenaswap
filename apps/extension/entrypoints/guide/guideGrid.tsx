import { i18n } from '#i18n';
import { resolveLeagueLogoUrl } from '@arenaswap/core/constants';
import type { Game, LeagueLogoMap } from '@arenaswap/core/types';
import { resolveTeamColorPair } from '@arenaswap/ui/src/components/colorUtils';
import CrestDisc from '@arenaswap/ui/src/components/crestDisc';
import { leagueLabels } from '@arenaswap/ui/src/components/popupChrome';
import type { CSSProperties } from 'react';
import { formatGuideTime } from './guideFormat';
import type { guideBand, guideBar } from './guideHeat';
import { axisBounds, barHeight, groupByLeague, hourMarks, msToPx, rowHeight } from './guideLayout';

const formatTime = formatGuideTime;

// Lightened, unlike the game card's pair, because these sit on #0d1117 rather than on a white card.
// Half the league's primaries are navies that reach nothing like 3:1 against it, and the climb
// scales the channels rather than mixing toward white, so a blue stays a blue.
const railStyle = (game: Game): CSSProperties => {
	const [away, home] = resolveTeamColorPair(game.awayTeam, game.homeTeam, '#30363d', '#30363d', true);
	return { '--guide-away': away, '--guide-home': home } as CSSProperties;
};

const GuideBar = ({ bar, fromMs, onOpen }: { bar: guideBar; fromMs: number; onOpen: (gameId: string) => void }) => {
	const { game } = bar;
	const left = msToPx(bar.startMs, fromMs);
	const width = Math.max(msToPx(bar.endMs, fromMs) - left, 24);
	return (
		<button
			type='button'
			className='guide-bar'
			data-final={game.status === 'post' ? 'true' : undefined}
			style={{ left: `${left}px`, width: `${width}px`, height: `${barHeight}px`, ...railStyle(game) }}
			onClick={() => onOpen(game.id)}
			title={`${game.awayTeam.name} @ ${game.homeTeam.name} · ${formatTime(bar.startMs)}`}
		>
			{/* Pinned to the left edge of whatever part of the bar is on screen. A game that started
			    before the viewport is the ordinary case on a guide scrolled to now, and without this
			    those rows show the tail end of a bar with the matchup scrolled off — a row reading
			    'PHI' and nothing else. */}
			<span className='guide-bar-content'>
				<span className='guide-bar-time'>{formatTime(bar.startMs)}</span>
				<CrestDisc logo={game.awayTeam.logo} abbreviation={(game.awayTeam.abbreviation || '?').slice(0, 3)} discClassName='guide-crest-disc' crestClassName='guide-crest' fallback='blank' loading='lazy' />
				<span className='guide-bar-team'>{game.awayTeam.abbreviation}</span>
				<span className='guide-bar-at'>{i18n.t('guide.at')}</span>
				<CrestDisc logo={game.homeTeam.logo} abbreviation={(game.homeTeam.abbreviation || '?').slice(0, 3)} discClassName='guide-crest-disc' crestClassName='guide-crest' fallback='blank' loading='lazy' />
				<span className='guide-bar-team'>{game.homeTeam.abbreviation}</span>
				{bar.isFavorite && <i className='bi bi-star-fill guide-bar-star' aria-label={i18n.t('guide.favoriteGame')} />}
			</span>
		</button>
	);
};

const GuideGrid = ({
	bars,
	band,
	leagueLogos,
	now,
	onOpen,
}: {
	bars: guideBar[];
	band: guideBand | null;
	leagueLogos: LeagueLogoMap;
	// Null on any day but today, which has no present moment to mark.
	now: number | null;
	onOpen: (gameId: string) => void;
}) => {
	const bounds = axisBounds(bars);
	if (!bounds) return null;
	const { fromMs, toMs } = bounds;
	const width = msToPx(toMs, fromMs);
	const marks = hourMarks(fromMs, toMs);
	const groups = groupByLeague(bars);
	const nowLeft = now !== null && now >= fromMs && now <= toMs ? msToPx(now, fromMs) : null;

	return (
		<div className='guide-canvas' style={{ width: `${width}px` }}>
			<div className='guide-ruler'>
				{marks.map(mark => (
					<span key={mark} className='guide-ruler-mark' style={{ left: `${msToPx(mark, fromMs)}px` }}>
						{formatTime(mark)}
					</span>
				))}
			</div>

			<div className='guide-body'>
				{marks.map(mark => (
					<span key={mark} className='guide-gridline' style={{ left: `${msToPx(mark, fromMs)}px` }} />
				))}

				{band && (
					<div
						className='guide-band'
						style={{ left: `${msToPx(band.fromMs, fromMs)}px`, width: `${Math.max(msToPx(band.toMs, fromMs) - msToPx(band.fromMs, fromMs), 8)}px` }}
						aria-hidden='true'
					/>
				)}

				{nowLeft !== null && <div className='guide-now' style={{ left: `${nowLeft}px` }} aria-hidden='true' />}

				{groups.map(group => (
					<div key={group.league} className='guide-group'>
						<div className='guide-league'>
							<CrestDisc
								logo={resolveLeagueLogoUrl(group.league, leagueLogos[group.league])}
								abbreviation=''
								discClassName='guide-league-disc'
								crestClassName='guide-league-logo'
								fallback='blank'
								loading='lazy'
							/>
							<span className='guide-league-label'>{leagueLabels[group.league]}</span>
						</div>
						{group.bars.map(bar => (
							<div key={bar.game.id} className='guide-row' style={{ height: `${rowHeight}px` }}>
								<GuideBar bar={bar} fromMs={fromMs} onOpen={onOpen} />
							</div>
						))}
					</div>
				))}
			</div>
		</div>
	);
};

export default GuideGrid;
