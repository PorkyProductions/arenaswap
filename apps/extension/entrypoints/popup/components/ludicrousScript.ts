import { i18n } from '#i18n';

export type Phase =
	| 'prelaunch'
	| 'cruising'
	| 'lightspeed'
	| 'ridiculous'
	| 'ludicrous'
	| 'plaid'
	| 'panic'
	| 'stopping';

export interface DisplayState {
	text: string;
	cls: string;
}

export interface Beat {
	ms: number;
	phase?: Phase;
	speed?: number;
	display?: DisplayState;
	brake?: 'visible' | 'pressed';
	logos?: boolean;
	end?: boolean;
}

const line = (text: string, ms: number, cls: string): Beat => ({
	ms,
	display: { text, cls },
});

export const buildScript = (): Beat[] => [
	line(i18n.t('ludicrousSpeed.intro.l1'), 1500, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l2'), 1500, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l3'), 1200, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l4'), 1600, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l5'), 1200, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l6'), 1200, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l7'), 1500, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.intro.l8'), 1500, 'dialogue prelaunch'),

	line(i18n.t('ludicrousSpeed.prelaunch.l1'), 1500, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l2'), 1100, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l3'), 1600, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l4'), 1300, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l5'), 1300, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l6'), 1300, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l7'), 1300, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l8'), 1200, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l9'), 1400, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l10'), 1500, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l11'), 1100, 'dialogue prelaunch'),
	line(i18n.t('ludicrousSpeed.prelaunch.l12'), 900, 'dialogue prelaunch'),

	{ ms: 1600, display: { text: i18n.t('ludicrousSpeed.announce'), cls: 'announce' } },
	{ ms: 1300, phase: 'cruising', speed: 5.5, display: { text: i18n.t('ludicrousSpeed.go'), cls: 'go' } },
	{ ms: 1400, display: { text: '', cls: 'stars-only' } },

	line(i18n.t('ludicrousSpeed.gforce.l1'), 1200, 'dialogue postlaunch'),
	{ ms: 1600, speed: 6.5, display: { text: i18n.t('ludicrousSpeed.gforce.l2'), cls: 'dialogue postlaunch' } },

	{ ms: 2000, phase: 'lightspeed', speed: 7.5, display: { text: i18n.t('ludicrousSpeed.signs.light'), cls: 'speedsign lightspeed' } },
	{ ms: 2000, phase: 'ridiculous', speed: 9.5, display: { text: i18n.t('ludicrousSpeed.signs.ridiculous'), cls: 'speedsign ridiculous' } },
	{ ms: 2200, phase: 'ludicrous', speed: 12.5, display: { text: i18n.t('ludicrousSpeed.signs.ludicrous'), cls: 'speedsign ludicrous' } },

	{ ms: 1500, phase: 'plaid', speed: 14, display: { text: i18n.t('ludicrousSpeed.signs.plaid'), cls: 'plaid-rect' } },
	{ ms: 1600, logos: true, display: { text: '', cls: 'stars-only' } },

	{ ms: 1400, phase: 'panic', speed: 10, brake: 'visible', logos: true, display: { text: i18n.t('ludicrousSpeed.panic.l1'), cls: 'dialogue panic' } },
	line(i18n.t('ludicrousSpeed.panic.l2'), 1400, 'dialogue panic'),
	line(i18n.t('ludicrousSpeed.panic.l3'), 1400, 'dialogue panic'),
	line(i18n.t('ludicrousSpeed.panic.l4'), 1400, 'dialogue panic'),

	{ ms: 700, brake: 'pressed' },
	{ ms: 1800, phase: 'stopping', speed: 0, display: { text: i18n.t('ludicrousSpeed.stop'), cls: 'stop' } },
	{ ms: 0, end: true },
];
