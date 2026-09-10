import type { Phase } from './ludicrousScript';

export interface Star {
	x: number;
	y: number;
	z: number;
	px: number | null;
	py: number | null;
}

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

export const makeStar = (): Star => ({
	x: (Math.random() - 0.5) * 1.5,
	y: (Math.random() - 0.5) * 1.5,
	z: Math.random() * 0.8 + 0.15,
	px: null,
	py: null,
});

export const resetStar = (s: Star): void => {
	s.x = (Math.random() - 0.5) * 1.5;
	s.y = (Math.random() - 0.5) * 1.5;
	s.z = 0.88 + Math.random() * 0.12;
	s.px = null;
	s.py = null;
};

export const makeStars = (n: number): Star[] => Array.from({ length: n }, makeStar);

// Measured off the film: light speed is an achromatic white/blue-white radial field, and ridiculous
// speed is the same field turned full-spectrum. Neither has any grid in it — that arrives only with
// the tartan tunnel at ludicrous speed.
const starTint: Record<Phase, [number, number, number]> = {
	prelaunch: [0.78, 0.86, 1],
	cruising: [0.94, 0.96, 1],
	lightspeed: [0.94, 0.94, 1],
	ridiculous: [1, 1, 1],
	ludicrous: [1, 0.72, 0.3],
	plaid: [1, 1, 1],
	panic: [1, 0.6, 0.3],
	stopping: [1, 0.96, 0.9],
};

// Ridiculous speed reads blue-heavy in the frames, with red, cyan, green, gold and magenta through it.
const ridiculousSpectrum: [number, number, number][] = [
	[0.36, 0.52, 1],
	[0.36, 0.52, 1],
	[1, 0.28, 0.3],
	[0.32, 0.95, 0.95],
	[0.4, 0.95, 0.45],
	[1, 0.82, 0.24],
	[1, 0.36, 0.9],
];

const starColor = (z: number, phase: Phase, index: number): string => {
	const bri = 220 + (1 - z) * 80;
	const f = 0.38 + (1 - z) * 0.62;
	const [r, g, b] = phase === 'ridiculous'
		? ridiculousSpectrum[index % ridiculousSpectrum.length]!
		: starTint[phase];
	return `rgb(${Math.round(bri * r * f)},${Math.round(bri * g * f)},${Math.round(bri * b * f)})`;
};

export interface StarfieldOptions {
	speed: number;
	phase: Phase;
	spread?: number;
	widthScale?: number;
	alpha?: number;
}

export const paintStarfield = (
	ctx: CanvasRenderingContext2D,
	stars: Star[],
	rect: Rect,
	opts: StarfieldOptions,
): void => {
	const { speed, phase } = opts;
	const spread = opts.spread ?? 0.8;
	const widthScale = opts.widthScale ?? 1;
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const hx = rect.w / 2;
	const hy = rect.h / 2;

	ctx.save();
	if (opts.alpha !== undefined) ctx.globalAlpha = opts.alpha;
	ctx.lineCap = 'round';
	// At light speed the film's starlines are dashed rather than continuous, and the centre of the
	// field stays dark — the flare only arrives with the plaid. Both are deliberate departures from
	// the Star Wars look this sequence is otherwise quoting.
	if (phase === 'lightspeed') ctx.setLineDash([5, 4]);

	stars.forEach((star, index) => {
		const ppx = star.px;
		const ppy = star.py;

		star.z -= speed * 0.007;
		if (star.z <= 0.01) {
			resetStar(star);
			return;
		}

		const sx = cx + (star.x / star.z) * hx * spread;
		const sy = cy + (star.y / star.z) * hy * spread;

		if (sx < rect.x - 40 || sx > rect.x + rect.w + 40 || sy < rect.y - 40 || sy > rect.y + rect.h + 40) {
			resetStar(star);
			return;
		}

		if (ppx !== null && ppy !== null) {
			ctx.beginPath();
			ctx.moveTo(ppx, ppy);
			ctx.lineTo(sx, sy);
			ctx.strokeStyle = starColor(star.z, phase, index);
			ctx.lineWidth = Math.max(1.4, ((1 - star.z) * 9 + speed * 0.22) * widthScale);
			ctx.stroke();
		}

		star.px = sx;
		star.py = sy;
	});
	ctx.restore();
};


/* ── Tartan tunnel ───────────────────────────────────────────────────────────
   The film's plaid is not a flat tartan plane: it is a square tunnel in one-point perspective, four
   walls each carrying the sett, converging on a flared vanishing point. That splits the weave into
   two families on screen — the cross-corridor threads project as nested squares around the
   vanishing point, and the along-corridor threads as wedges radiating out of it. Drawing the wedges
   solid and the rings over them at partial alpha is what reads as woven rather than as a grid. */

export interface SettStripe {
	color: string;
	w: number;
}

export interface Sett {
	ground: string;
	stripes: SettStripe[];
	weftAlpha: number;
}

const settWidth = (sett: Sett): number => sett.stripes.reduce((sum, s) => sum + s.w, 0);

// Walks the perimeter of a square of half-size `s` centred on the vanishing point. `q` runs 0..4,
// one unit per wall, and the walls are wound so the parameter is continuous across the corners.
const squarePoint = (cx: number, cy: number, s: number, q: number): [number, number] => {
	const wall = ((q % 4) + 4) % 4;
	const u = (wall % 1) * 2 - 1;
	if (wall < 1) return [cx + u * s, cy - s];
	if (wall < 2) return [cx + s, cy + u * s];
	if (wall < 3) return [cx - u * s, cy + s];
	return [cx - s, cy - u * s];
};

export interface TunnelOptions {
	travel: number;
	vanishX: number;
	vanishY: number;
	repeatsAround: number;
	// The sett's widths are thread counts, not distances. This is how far apart the cross-corridor
	// threads sit in depth, and it is what decides how dense the rings look rather than how wide.
	depthScale: number;
}

export const paintTartanTunnel = (
	ctx: CanvasRenderingContext2D,
	rect: Rect,
	sett: Sett,
	{ travel, vanishX, vanishY, repeatsAround, depthScale }: TunnelOptions,
): void => {
	const cx = rect.x + vanishX * rect.w;
	const cy = rect.y + vanishY * rect.h;
	const reach = Math.hypot(rect.w, rect.h) * 1.4;
	const period = settWidth(sett);

	ctx.save();
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.w, rect.h);
	ctx.clip();

	ctx.fillStyle = sett.ground;
	ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

	// Along-corridor threads: wedges from the vanishing point out past the frame corners.
	const dq = 4 / (repeatsAround * period);
	let q = 0;
	for (let r = 0; r < repeatsAround; r += 1) {
		for (const stripe of sett.stripes) {
			const span = stripe.w * dq;
			if (stripe.color !== sett.ground) {
				const [x1, y1] = squarePoint(cx, cy, reach, q);
				const [x2, y2] = squarePoint(cx, cy, reach, q + span);
				ctx.beginPath();
				ctx.moveTo(cx, cy);
				ctx.lineTo(x1, y1);
				ctx.lineTo(x2, y2);
				ctx.closePath();
				ctx.fillStyle = stripe.color;
				ctx.fill();
			}
			q += span;
		}
	}

	// Cross-corridor threads: nested squares, spaced by the sett in corridor depth and projected so
	// the band nearest the camera is both widest and thickest. Far to near, so near bands win.
	const focal = rect.w * 0.5;
	const near = 0.3;
	const far = 26;
	const depthPeriod = period * depthScale;
	ctx.globalAlpha = sett.weftAlpha;
	const firstRepeat = Math.floor((travel + near) / depthPeriod);
	const bands: { depth: number; w: number; color: string }[] = [];
	for (let r = firstRepeat; r < firstRepeat + Math.ceil(far / depthPeriod) + 2; r += 1) {
		let pos = r * depthPeriod;
		for (const stripe of sett.stripes) {
			const w = stripe.w * depthScale;
			if (stripe.color !== sett.ground) bands.push({ depth: pos - travel, w, color: stripe.color });
			pos += w;
		}
	}
	bands.sort((a, b) => b.depth - a.depth);
	for (const band of bands) {
		if (band.depth < near || band.depth > far) continue;
		const outer = focal / band.depth;
		const inner = focal / (band.depth + band.w);
		const half = (outer + inner) / 2;
		const thickness = outer - inner;
		if (thickness < 0.28 || half > reach) continue;
		ctx.strokeStyle = band.color;
		ctx.lineWidth = thickness;
		ctx.strokeRect(cx - half, cy - half, half * 2, half * 2);
	}
	ctx.globalAlpha = 1;

	// The flare that sits at the vanishing point in every frame of the sequence.
	const flare = ctx.createRadialGradient(cx, cy, 0, cx, cy, rect.w * 0.2);
	flare.addColorStop(0, 'rgba(255,252,232,0.95)');
	flare.addColorStop(0.22, 'rgba(255,226,140,0.55)');
	flare.addColorStop(1, 'rgba(255,190,60,0)');
	ctx.fillStyle = flare;
	ctx.fillRect(cx - rect.w * 0.2, cy - rect.w * 0.2, rect.w * 0.4, rect.w * 0.4);

	ctx.strokeStyle = 'rgba(255,248,214,0.7)';
	ctx.lineWidth = 1.4;
	for (let i = 0; i < 4; i += 1) {
		const a = (Math.PI / 2) * i + Math.PI / 4;
		const len = rect.w * (0.1 + 0.05 * Math.sin(travel * 3 + i));
		ctx.beginPath();
		ctx.moveTo(cx - Math.cos(a) * len, cy - Math.sin(a) * len);
		ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
		ctx.stroke();
	}

	ctx.restore();
};

// Seen from a ship being overtaken, the plaid crosses the windshield as a flat band rather than as a
// tunnel, so that presentation needs the weave drawn head-on.
export const paintFlatTartan = (
	ctx: CanvasRenderingContext2D,
	rect: Rect,
	sett: Sett,
	scale: number,
	offset: number,
): void => {
	const period = settWidth(sett) * scale;
	if (period < 2) return;

	ctx.save();
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.w, rect.h);
	ctx.clip();
	ctx.fillStyle = sett.ground;
	ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

	const wrap = (v: number): number => ((v % period) + period) % period;
	for (let x = rect.x - wrap(offset) - period; x < rect.x + rect.w; x += period) {
		let cursor = x;
		for (const stripe of sett.stripes) {
			ctx.fillStyle = stripe.color;
			ctx.fillRect(cursor, rect.y, stripe.w * scale + 0.5, rect.h);
			cursor += stripe.w * scale;
		}
	}
	ctx.globalAlpha = sett.weftAlpha;
	for (let y = rect.y - wrap(offset * 0.6) - period; y < rect.y + rect.h; y += period) {
		let cursor = y;
		for (const stripe of sett.stripes) {
			ctx.fillStyle = stripe.color;
			ctx.fillRect(rect.x, cursor, rect.w, stripe.w * scale + 0.5);
			cursor += stripe.w * scale;
		}
	}
	ctx.restore();
};


/* ── League logo flyby ───────────────────────────────────────────────────────
   The joke is that ArenaSwap outran every league it tracks, so the marks have to
   be gone before they are legible: they are perspective-projected from behind the
   camera plane and smeared along their own velocity vector. */

export interface FlyingLogo {
	img: HTMLImageElement;
	x: number;
	y: number;
	z: number;
	spin: number;
	spinRate: number;
	sx: number | null;
	sy: number | null;
}

export const makeFlyingLogo = (img: HTMLImageElement, z: number): FlyingLogo => {
	const angle = Math.random() * Math.PI * 2;
	const radius = 0.22 + Math.random() * 0.5;
	return {
		img,
		x: Math.cos(angle) * radius,
		y: Math.sin(angle) * radius,
		z,
		spin: Math.random() * Math.PI * 2,
		spinRate: (Math.random() - 0.5) * 0.34,
		sx: null,
		sy: null,
	};
};

export const paintLogoStream = (
	ctx: CanvasRenderingContext2D,
	logos: FlyingLogo[],
	rect: Rect,
	speed: number,
): void => {
	const cx = rect.x + rect.w / 2;
	const cy = rect.y + rect.h / 2;
	const hx = rect.w / 2;
	const hy = rect.h / 2;

	ctx.save();
	ctx.beginPath();
	ctx.rect(rect.x, rect.y, rect.w, rect.h);
	ctx.clip();

	for (const logo of logos) {
		if (logo.z <= 0) continue;
		const prevX = logo.sx;
		const prevY = logo.sy;

		logo.z -= speed * 0.013;
		logo.spin += logo.spinRate;
		if (logo.z <= 0.05) {
			logo.z = 0;
			continue;
		}

		const sx = cx + (logo.x / logo.z) * hx;
		const sy = cy + (logo.y / logo.z) * hy;
		const size = Math.min(rect.w * 0.95, 0.062 * rect.w / logo.z);
		logo.sx = sx;
		logo.sy = sy;

		if (!logo.img.complete || logo.img.naturalWidth === 0) continue;

		const ghosts = prevX === null || prevY === null ? 1 : 6;
		const dx = prevX === null ? 0 : (prevX - sx) / ghosts;
		const dy = prevY === null ? 0 : (prevY - sy) / ghosts;

		for (let g = 0; g < ghosts; g += 1) {
			const fade = (1 - g / ghosts) * 0.4;
			ctx.save();
			ctx.globalAlpha = fade * Math.min(1, logo.z * 3.2);
			ctx.translate(sx + dx * g, sy + dy * g);
			ctx.rotate(logo.spin);
			ctx.drawImage(logo.img, -size / 2, -size / 2, size, size);
			ctx.restore();
		}
	}

	ctx.restore();
};
