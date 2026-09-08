import GameDetailView from '../../entrypoints/popup/components/gameDetailView';
import BoxScore from '../../entrypoints/popup/components/boxScore';
import { parseBoxScore } from '../../entrypoints/popup/components/boxScoreParse';
import type { Game } from '@arenaswap/core/types';
import de from '../../locales/de.json';
import en from '../../locales/en.json';
import es from '../../locales/es.json';
import fil from '../../locales/fil.json';
import fr from '../../locales/fr.json';
// Not `it` — that would shadow Mocha's global it() and break every test in this file.
import itLocale from '../../locales/it.json';
import ja from '../../locales/ja.json';
import ko from '../../locales/ko.json';
import ptBR from '../../locales/pt_BR.json';
import ptPT from '../../locales/pt_PT.json';
import zhCN from '../../locales/zh_CN.json';
import zhTW from '../../locales/zh_TW.json';

const locales = { de, en, es, fil, fr, it: itLocale, ja, ko, pt_BR: ptBR, pt_PT: ptPT, zh_CN: zhCN, zh_TW: zhTW };

// A 1x1 transparent PNG, so the crests are deterministic and need no network. Transparent on
// purpose: an opaque one would paint over a placeholder that failed to hide.
const crestPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

// The ids are the demo-mode ones on purpose: `useSummaryData` short-circuits anything starting
// `mock-` to `mockBoxScorePayloads`, so these mount the real parser over the real fixtures with no
// network at all. Team ids have to match the fixture's, since that is what resolves the two sides.
const games: Record<string, Game> = {
	baseball: {
		id: 'mock-4', league: 'mlb', sportType: 'baseball', status: 'in',
		period: 8, clockSeconds: 0, topOfInning: true,
		venueName: 'Citizens Bank Park',
		homeTeam: { id: '22', name: 'Philadelphia Phillies', abbreviation: 'PHI', score: 3, color: '#E81828', logo: crestPixel },
		awayTeam: { id: '21', name: 'New York Mets', abbreviation: 'NYM', score: 2, color: '#002D72', logo: crestPixel },
	},
	basketball: {
		id: 'mock-2', league: 'nba', sportType: 'basketball', status: 'in',
		period: 3, clockSeconds: 284,
		venueName: 'Xfinity Mobile Arena',
		homeTeam: { id: '20', name: 'Philadelphia 76ers', abbreviation: 'PHI', score: 68, color: '#006BB6', logo: crestPixel },
		awayTeam: { id: '4', name: 'Chicago Bulls', abbreviation: 'CHI', score: 65, color: '#CE1141', logo: crestPixel },
	},
	football: {
		id: 'mock-5', league: 'nfl', sportType: 'football', status: 'in',
		period: 4, clockSeconds: 480,
		venueName: 'Lincoln Financial Field',
		homeTeam: { id: '21', name: 'Philadelphia Eagles', abbreviation: 'PHI', score: 17, color: '#004C54', logo: crestPixel },
		awayTeam: { id: '6', name: 'Dallas Cowboys', abbreviation: 'DAL', score: 14, color: '#041E42', logo: crestPixel },
	},
	hockey: {
		id: 'mock-3', league: 'nhl', sportType: 'hockey', status: 'in',
		period: 3, clockSeconds: 412,
		venueName: 'Xfinity Mobile Arena',
		homeTeam: { id: '15', name: 'Philadelphia Flyers', abbreviation: 'PHI', score: 2, color: '#F74902', logo: crestPixel },
		awayTeam: { id: '16', name: 'Pittsburgh Penguins', abbreviation: 'PIT', score: 1, color: '#FCB514', logo: crestPixel },
	},
	soccer: {
		id: 'mock-9', league: 'mls', sportType: 'soccer', status: 'in',
		period: 2, clockSeconds: 742,
		venueName: 'Subaru Park',
		homeTeam: { id: '183', name: 'Philadelphia Union', abbreviation: 'PHI', score: 2, color: '#071B2C', logo: crestPixel },
		awayTeam: { id: '190', name: 'New York Red Bulls', abbreviation: 'NYR', score: 1, color: '#ED1E36', logo: crestPixel },
	},
};

const preGame: Game = {
	...games.basketball,
	id: 'mock-2-pre',
	status: 'pre',
	period: 0,
	startTime: new Date(Date.now() + 3 * 3600_000).toISOString(),
};

const mount = (game: Game) => {
	cy.mount(
		<GameDetailView
			game={game}
			excitementResult={undefined}
			scoreHistory={[]}
			powerScoreHistory={[]}
			proTipsEnabled={false}
			gameBoosts={{}}
			bettingPrefs={{ bettingEnabled: false }}
			weatherPrefs={{ temperatureUnit: 'F' }}
			decorationPrefs={{ holidayDecorationsEnabled: false, holidaySnowEnabled: false, holidayLightsEnabled: false, holidayLeavesEnabled: false }}
			favoriteTeamIds={new Set<string>()}
			openTabs={[] as never}
			registry={[]}
			onToggleFavoriteTeam={() => {}}
			onRegistryChange={() => {}}
			formatTabLabel={() => ''}
			onSetGameBoost={() => {}}
			onBack={() => {}}
		/>,
	);
};

// The ink a cell inherits when no team colour reaches it. Asserting a computed colour is merely
// readable, or merely not the raw team colour, passes with the whole feature removed — so every
// colour assertion below is pinned to its own expected value and checked against this default.
const inheritedCardInk = 'rgb(17, 24, 39)';

// Contrast of a computed `rgb(...)` colour against the light .gd-setup card, #f8fafc, whose
// luminance is 0.9536.
const srgbChannel = (value: number): number => {
	const c = value / 255;
	return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

const contrastOnCard = (rgb: string): number => {
	const [red, green, blue] = rgb.match(/\d+/g)!.map(Number);
	const luminance = 0.2126 * srgbChannel(red!) + 0.7152 * srgbChannel(green!) + 0.0722 * srgbChannel(blue!);
	return (0.9536 + 0.05) / (luminance + 0.05);
};

// Every table cell that carries a number, so a clipping check never has to name them one by one.
const cells = () => cy.get('.gd-box-table td, .gd-box-table th');

describe('box score', () => {
	beforeEach(() => {
		cy.viewport(320, 560);
	});

	it('renders nothing on a pre-game screen', () => {
		mount(preGame);
		// The pre-game screen itself rendered — this is not an empty mount asserting nothing.
		cy.get('.gd-pregame-setup, .gd-setup').should('exist');
		cy.get('.gd-box').should('not.exist');
	});

	describe('line score', () => {
		it('gives baseball an R-H-E line and leaves the unplayed half-inning blank', () => {
			mount(games.baseball);
			cy.get('.gd-box-line-table thead th, .gd-box-line-table thead td').then($th => {
				const labels = [...$th].map(el => el.textContent?.trim());
				expect(labels).to.deep.equal(['', '1', '2', '3', '4', '5', '6', '7', '8', 'R', 'H', 'E']);
			});
			cy.get('.gd-box-line-table tbody tr').eq(0).find('td').then($td => {
				expect([...$td].map(el => el.textContent?.trim())).to.deep.equal(
					['0', '1', '0', '0', '0', '1', '0', '0', '2', '7', '1'],
				);
			});
			// The bottom of the eighth has not been played, so it is empty rather than a 0.
			cy.get('.gd-box-line-table tbody tr').eq(1).find('td').then($td => {
				expect([...$td].map(el => el.textContent?.trim())).to.deep.equal(
					['1', '0', '0', '2', '0', '0', '0', '', '3', '7', '1'],
				);
			});
		});

		it('gives a clock sport one total column and no hits or errors', () => {
			mount(games.football);
			cy.get('.gd-box-line-table thead th, .gd-box-line-table thead td').then($th => {
				expect([...$th].map(el => el.textContent?.trim())).to.deep.equal(['', '1', '2', '3', '4', 'T']);
			});
		});

		it('names the period unit each sport actually uses', () => {
			const expected: [keyof typeof games, string][] = [
				['baseball', en.box.byInning],
				['basketball', en.box.byQuarter],
				['hockey', en.box.byPeriod],
				['soccer', en.box.byHalf],
			];
			for (const [sport, heading] of expected) {
				mount(games[sport]);
				cy.get('.gd-box-line .gd-box-subheading').should('have.text', heading);
			}
		});

		// Mounted directly rather than through the demo fixtures, because the widest line score
		// this has to survive is a full nine innings plus R-H-E and then extra innings past it.
		const mountInnings = (count: number) => {
			const innings = Array.from({ length: count }, () => ({ displayValue: '1', hits: 2, errors: 0 }));
			const payload = { header: { competitions: [{ competitors: [
				{ homeAway: 'away', team: { id: '21', abbreviation: 'NYM' }, score: String(count), linescores: innings },
				{ homeAway: 'home', team: { id: '22', abbreviation: 'PHI' }, score: String(count), linescores: innings },
			] }] } };
			cy.mount(
				<BoxScore
					game={games.baseball}
					boxScore={parseBoxScore(payload, '22', '21', 'PHI', 'NYM')}
				/>,
			);
		};

		it('fits a full nine innings plus R-H-E inside the card without scrolling', () => {
			mountInnings(9);
			cy.get('.gd-box-line-table thead th, .gd-box-line-table thead td').should('have.length', 13);
			// Measured with the crests in the team column, which is what they cost the innings.
			cy.get('.gd-box-line-crest').should('have.length', 2);
			cy.get('.gd-box-line .table-responsive').then($wrap => {
				const el = $wrap[0];
				expect(el.scrollWidth, 'twelve numeric columns fit in the card')
					.to.be.at.most(el.clientWidth);
			});
			cy.get('.gd-box-line-table td, .gd-box-line-table th').each($cell => {
				expect($cell[0].scrollWidth, 'no inning is squeezed narrower than its own digits')
					.to.be.at.most($cell[0].clientWidth + 1);
			});
		});

		it('scrolls extra innings sideways rather than crushing the ones that fit', () => {
			mountInnings(13);
			cy.get('.gd-box-line .table-responsive').then($wrap => {
				const el = $wrap[0];
				expect(el.scrollWidth, 'the table is wider than the card').to.be.greaterThan(el.clientWidth);
				// It scrolls inside the card rather than widening the popup.
				expect(el.getBoundingClientRect().right).to.be.at.most(320);
			});
		});
	});

	describe('player tables', () => {
		it('opens on the away team and switches to the home team', () => {
			mount(games.basketball);
			cy.get('.gd-box-tabs .nav-link').should('have.length', 2);
			cy.get('.gd-box-tabs .nav-link.active').should('contain.text', 'CHI');
			cy.get('.gd-box-name').should('contain.text', 'C. White');

			cy.get('.gd-box-tabs .nav-link').eq(1).click();
			cy.get('.gd-box-tabs .nav-link.active').should('contain.text', 'PHI');
			cy.get('.gd-box-name').should('contain.text', 'T. Maxey');
		});

		it('gives basketball one table with the condensed column order', () => {
			mount(games.basketball);
			cy.get('.gd-box-players .gd-box-subheading').should('have.length', 1).and('have.text', en.box.players);
			cy.get('.gd-box-players thead th, .gd-box-players thead td').then($th => {
				expect([...$th].map(el => el.textContent?.trim())).to.deep.equal(
					['', 'MIN', 'PTS', 'REB', 'AST', 'FG', '3PT'],
				);
			});
		});

		it('sorts basketball starters, then bench, then did-not-play', () => {
			mount(games.basketball);
			cy.get('.gd-box-players tbody .gd-box-name .gd-box-player').then($names => {
				const order = [...$names].map(el => el.textContent?.trim());
				expect(order.slice(0, 5)).to.deep.equal(['C. White', 'N. Vucevic', 'J. Giddey', 'P. Williams', 'M. Buzelis']);
				expect(order[order.length - 1]).to.equal('Z. Collins');
			});
			// DNP says DNP rather than a row of zeros, and never ESPN's English reason.
			cy.get('.gd-box-dnp').should('have.text', en.box.didNotPlay);
			cy.contains("COACH'S DECISION").should('not.exist');
		});

		it('puts the batting order in order and indents the substitute', () => {
			mount(games.baseball);
			cy.get('.gd-box-players tbody .gd-box-name').first().should('contain.text', 'F. Lindor');
			cy.get('.gd-box-name-sub').should('contain.text', 'T. Nimmo');
			cy.get('.gd-box-name-sub').then($sub => {
				const indent = Number.parseFloat(getComputedStyle($sub[0]).paddingLeft);
				expect(indent, 'a substitute sits under the slot it took over').to.be.greaterThan(6);
			});
		});

		it('gives baseball a totals row and football none', () => {
			mount(games.baseball);
			cy.get('.gd-box-players tfoot th').first().should('have.text', en.box.totals);
			mount(games.football);
			cy.get('.gd-box-players tfoot').should('not.exist');
		});

		it('splits hockey by position group and drops the empty skaters category', () => {
			mount(games.hockey);
			cy.get('.gd-box-players .gd-box-subheading').then($h => {
				expect([...$h].map(el => el.textContent?.trim())).to.deep.equal(
					[en.box.forwards, en.box.defensemen, en.box.goaltending],
				);
			});
		});

		it('drops the goalie who never took the ice', () => {
			mount(games.hockey);
			cy.get('.gd-box-players').should('contain.text', 'T. Jarry');
			// The backup arrives all zeros and would show a .000 save percentage.
			cy.get('.gd-box-players').should('not.contain.text', 'J. Blomqvist');
			cy.get('.gd-box-players').should('not.contain.text', '.000');
		});

		it('orders hockey skaters by points, not by ESPN array order', () => {
			mount(games.hockey);
			cy.get('.gd-box-tabs .nav-link').eq(1).click();
			cy.get('.gd-box-players tbody .gd-box-player').then($names => {
				// Konecny 1G 1A leads Michkov 1G 0A, who leads Couturier 0G 1A.
				expect([...$names].map(el => el.textContent?.trim()).slice(0, 3))
					.to.deep.equal(['T. Konecny', 'M. Michkov', 'S. Couturier']);
			});
		});

		it('caps a long football category and expands it on request', () => {
			mount(games.football);
			cy.contains('.gd-box-subheading', en.box.defensive)
				.next('table').as('defense');
			cy.get('@defense').find('tbody tr').should('have.length', 6);
			cy.get('.gd-box-more').should('have.text', en.box.showAll.replace('{count}', '8')).click();
			cy.get('@defense').find('tbody tr').should('have.length', 8);
			cy.get('.gd-box-more').should('have.text', en.box.showFewer);
		});

		it('keeps a college column set that the NFL sends and college does not', () => {
			// The NFL fixture carries SACKS under passing and TGTS under receiving; a category is
			// selected by ESPN's own keys, so a league sending neither simply has fewer columns.
			mount(games.football);
			cy.contains('.gd-box-subheading', en.box.passing).next('table').find('thead th, thead td')
				.then($th => expect([...$th].map(el => el.textContent?.trim()))
					.to.deep.equal(['', 'C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS']));
		});

		it('renders no player tables for soccer, which sends none', () => {
			mount(games.soccer);
			cy.get('.gd-box').should('exist');
			cy.get('.gd-box-players').should('not.exist');
			cy.get('.gd-box-tabs').should('not.exist');
		});
	});

	describe('team comparison', () => {
		it('puts the away value, the label and the home value in one row', () => {
			mount(games.soccer);
			cy.get('.gd-box-compare thead th, .gd-box-compare thead td').then($th => {
				expect([...$th].map(el => el.textContent?.trim())).to.deep.equal(['NYR', '', 'PHI']);
			});
			cy.contains('.gd-box-compare-label', en.box.possession).parent().find('td')
				.then($td => expect([...$td].map(el => el.textContent?.trim())).to.deep.equal(['53.2', '46.8']));
		});

		it('appends the penalty rows only because this match had one', () => {
			mount(games.soccer);
			cy.get('.gd-box-compare-label').then($labels => {
				const text = [...$labels].map(el => el.textContent?.trim());
				expect(text).to.include(en.box.penaltyGoals);
				// Derived from the two rows above it, and 100% off a single shot.
				expect(text).to.not.include('On Target %');
			});
		});

		it('reads nothing from the nested tree baseball sends', () => {
			mount(games.baseball);
			cy.get('.gd-box-compare').should('not.exist');
			// The R-H-E on the line score is already the team line.
			cy.get('.gd-box-line-table').should('exist');
		});
	});

	describe('layout', () => {
		it('never pushes a cell past the popup edge, in any sport', () => {
			for (const sport of Object.keys(games) as (keyof typeof games)[]) {
				mount(games[sport]);
				cells().each($cell => {
					expect($cell[0].getBoundingClientRect().right, `${sport} cell within 320px`)
						.to.be.at.most(320);
				});
			}
		});

		it('keeps the table on the light card rather than the dark popup default', () => {
			mount(games.basketball);
			// $table-bg defaults to var(--as-body-bg), which is #0d1117 on this theme.
			cy.get('.gd-box-table tbody td').first().then($td => {
				const style = getComputedStyle($td[0]);
				expect(style.color).to.equal('rgb(17, 24, 39)');
				expect(style.backgroundColor).to.equal('rgba(0, 0, 0, 0)');
			});
			// The 2px group separator is `currentcolor` by default, a black bar across the card.
			cy.get('.gd-box-table tbody').first().then($tbody => {
				expect(getComputedStyle($tbody[0]).borderTopColor).to.equal('rgb(209, 213, 219)');
			});
		});

		it('keeps the selected tab on the card colour, not the dark body default', () => {
			mount(games.basketball);
			cy.get('.gd-box-tabs .nav-link.active').then($tab => {
				const style = getComputedStyle($tab[0]);
				expect(style.backgroundColor).to.equal('rgb(248, 250, 252)');
				expect(style.color).to.equal('rgb(17, 24, 39)');
			});
			// $nav-link-color is the orange link colour, which reaches only 3.0:1 here.
			cy.get('.gd-box-tabs .nav-link').not('.active').then($tab => {
				expect(getComputedStyle($tab[0]).color).to.equal('rgb(75, 85, 99)');
			});
		});

		it('truncates a long name instead of a stat', () => {
			mount(games.football);
			cy.contains('.gd-box-subheading', en.box.defensive).next('table')
				.find('tbody tr').first().as('row');
			cy.get('@row').find('.gd-box-name').then($name => {
				expect(getComputedStyle($name[0]).textOverflow).to.equal('ellipsis');
			});
			cy.get('@row').find('td').each($td => {
				expect($td[0].scrollWidth, 'a stat is never clipped').to.be.at.most($td[0].clientWidth + 1);
			});
		});
	});

	describe('team identity', () => {
		it('puts each team\'s crest beside its abbreviation on the line score', () => {
			mount(games.baseball);
			cy.get('.gd-box-line-table tbody tr').should('have.length', 2);
			cy.get('.gd-box-line-crest').should('have.length', 2);
			cy.get('.gd-box-line-table tbody tr').eq(0).find('.gd-box-line-abbr').should('have.text', 'NYM');
			cy.get('.gd-box-line-table tbody tr').eq(1).find('.gd-box-line-abbr').should('have.text', 'PHI');
			// The crest sits to the left of the abbreviation, the way the leader rows read.
			cy.get('.gd-box-line-table tbody tr').eq(0).then($row => {
				const crest = $row.find('.gd-box-line-crest')[0].getBoundingClientRect();
				const abbr = $row.find('.gd-box-line-abbr')[0].getBoundingClientRect();
				expect(crest.right).to.be.at.most(abbr.left + 1);
			});
		});

		it('washes each row in its own team\'s colour, fading out before the totals', () => {
			mount(games.baseball);
			cy.get('.gd-box-line-table tbody tr').eq(0).then($row => {
				// The away row takes the Mets navy at the 28 alpha the matchup card uses.
				expect(getComputedStyle($row[0]).backgroundImage)
					.to.contain('rgba(0, 45, 114, 0.157)');
			});
			cy.get('.gd-box-line-table tbody tr').eq(1).then($row => {
				expect(getComputedStyle($row[0]).backgroundImage)
					.to.contain('rgba(232, 24, 40, 0.157)');
			});
		});

		it('leaves a colour that already reads well as the team\'s own', () => {
			mount(games.baseball);
			// #002D72 is 12.4:1 on this card, so clamping it would only muddy it.
			cy.get('.gd-box-line-table tbody tr').eq(0).find('.gd-box-line-abbr')
				.should('have.css', 'color', 'rgb(0, 45, 114)');
		});

		it('darkens a gold abbreviation until it is actually readable', () => {
			mount(games.hockey);
			// Pittsburgh's #FCB514 reaches 1.71:1 untouched — the case an eyeball lets through. Pinned
			// to the exact clamped value rather than to "readable", which the inherited ink also is.
			cy.get('.gd-box-line-table tbody tr').eq(0).find('.gd-box-line-abbr').then($abbr => {
				const color = getComputedStyle($abbr[0]).color;
				expect(color, 'the raw gold is gone').to.not.equal('rgb(252, 181, 20)');
				expect(color, 'and a team colour did arrive, rather than nothing').to.not.equal(inheritedCardInk);
				expect(color, 'clamped to a dark bronze').to.equal('rgb(138, 99, 11)');
				expect(contrastOnCard(color)).to.be.at.least(4.5);
			});
			// The other side is the Flyers' orange, 3.40:1 raw, so it moves too.
			cy.get('.gd-box-line-table tbody tr').eq(1).find('.gd-box-line-abbr')
				.should('have.css', 'color', 'rgb(182, 54, 2)');
		});

		it('clears 4.5:1 for every team abbreviation in every sport', () => {
			for (const sport of Object.keys(games) as (keyof typeof games)[]) {
				mount(games[sport]);
				cy.get('.gd-box-line-abbr, .gd-box-compare-team').each($el => {
					const color = getComputedStyle($el[0]).color;
					// The floor is only worth asserting once a colour is known to have arrived: the
					// inherited ink clears 4.5:1 on its own.
					expect(color, `${sport} ${$el.text()} carries a team colour`).to.not.equal(inheritedCardInk);
					expect(contrastOnCard(color), `${sport} ${$el.text()}`).to.be.at.least(4.5);
				});
			}
		});

		it('colours the team stats column heads to match the line score', () => {
			mount(games.hockey);
			cy.get('.gd-box-compare-team').should('have.length', 2);
			cy.get('.gd-box-line-table tbody tr').eq(0).find('.gd-box-line-abbr').then($abbr => {
				const lineColor = getComputedStyle($abbr[0]).color;
				// Both being the inherited ink would satisfy "they match" while proving nothing.
				expect(lineColor).to.not.equal(inheritedCardInk);
				cy.get('.gd-box-compare-team').eq(0)
					.should('have.css', 'color', lineColor)
					.and('have.text', 'PIT');
			});
		});

	});

	describe('localization', () => {
		const headingKeys = ['heading', 'byInning', 'teamStats', 'batting', 'pitching', 'totals'] as const;

		it('fits every locale\'s section headings on one line', () => {
			mount(games.baseball);
			for (const [code, bundle] of Object.entries(locales)) {
				for (const key of headingKeys) {
					const value = (bundle as typeof en).box[key];
					cy.get('.gd-setup-heading').first().then($el => {
						const el = $el[0];
						const original = el.textContent;
						el.textContent = value;
						const height = el.getBoundingClientRect().height;
						const lineHeight = Number.parseFloat(getComputedStyle(el).lineHeight);
						expect(height, `${code}.box.${key} on one line`).to.be.at.most(lineHeight * 1.6);
						el.textContent = original;
					});
				}
			}
		});

		// Measured as whole rows rather than one label at a time. Substituting a single locale's
		// label into a column the browser sized for English measures it against a box it will never
		// render in — the columns share the row's width, and the name column is what gives way.
		const columnSets: [keyof typeof games, number, readonly (keyof typeof en.box)[]][] = [
			['baseball', 0, ['hitsAtBats', 'runs', 'rbi', 'homeRuns', 'walks', 'strikeouts']],
			['baseball', 1, ['inningsPitched', 'hits', 'runs', 'earnedRuns', 'walks', 'strikeouts']],
			['basketball', 0, ['minutes', 'points', 'rebounds', 'assists', 'fieldGoals', 'threePointers']],
			['hockey', 0, ['goals', 'hockeyAssists', 'plusMinus', 'shots', 'penaltyMinutes', 'timeOnIce']],
			['hockey', 2, ['goalsAgainst', 'shotsAgainst', 'saves', 'savePct', 'timeOnIce']],
		];

		for (const [sport, tableIndex, keys] of columnSets) {
			it(`fits every locale's ${sport} columns without overflowing table ${tableIndex}`, () => {
				mount(games[sport]);
				cy.get('.gd-box-players table').eq(tableIndex).then($table => {
					const table = $table[0];
					const heads = [...table.querySelectorAll('thead th')] as HTMLElement[];
					expect(heads, 'the column set matches what this table renders').to.have.length(keys.length);
					const nameCell = table.querySelector('tbody .gd-box-name') as HTMLElement;
					const originals = heads.map(head => head.textContent);

					for (const [code, bundle] of Object.entries(locales)) {
						heads.forEach((head, index) => {
							head.textContent = ((bundle as typeof en).box as Record<string, string>)[keys[index]];
						});
						expect(table.scrollWidth, `${code} ${sport} columns fit the card`)
							.to.be.at.most(table.clientWidth);
						// Chinese spells these columns out — 安打-打数 against H-AB — which takes the
						// room out of the name column rather than out of the card. It still has to
						// hold a name: "M. Pettersson" runs about 75px.
						expect(nameCell.getBoundingClientRect().width, `${code} ${sport} name column still readable`)
							.to.be.greaterThan(80);
					}

					heads.forEach((head, index) => { head.textContent = originals[index]; });
				});
			});
		}
	});
});
