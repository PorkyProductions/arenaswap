import type { Sett } from './ludicrousPainters';

/* Transcribed from the two frames of the film that carry the full-screen plaid (caps 1028-1029 of
   the cap-that.com archive), measured twice independently and agreeing to within noise.

   It is not a clan tartan and in particular not Royal Stewart: Cinefex #31 (Aug 1987, p.15) has
   Apogee's Clint Colver naming the reference as "the weaving plaid pattern featured in the
   Burlington TV commercials". The field is black rather than red, there is no green in it at all,
   and gold rather than red is the dominant colour. Two red guards and two gold guards of equal
   width sit in a wide black ground carrying indigo and white hairlines.

   Widths are the measured run-lengths reduced to the colour-bar width as the unit. */
export const ludicrousTunnelSett: Sett = {
	ground: '#020102',
	stripes: [
		{ color: '#8f0006', w: 1 },
		{ color: '#020102', w: 0.6 },
		{ color: '#7d0008', w: 1 },
		{ color: '#020102', w: 0.6 },
		{ color: '#b76708', w: 1 },
		{ color: '#020102', w: 0.6 },
		{ color: '#f39f0b', w: 1 },
		{ color: '#020102', w: 2.6 },
		{ color: '#20005a', w: 0.35 },
		{ color: '#020102', w: 0.5 },
		{ color: '#f0f0f0', w: 0.18 },
		{ color: '#020102', w: 0.5 },
		{ color: '#20005a', w: 0.35 },
		{ color: '#020102', w: 2.6 },
	],
	weftAlpha: 0.5,
};
