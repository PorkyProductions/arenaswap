import { useRef } from 'react';
import { useLudicrousCanvas } from './ludicrousCanvasLoop';
import {
	makeStars,
	makeFlyingLogo,
	paintFlatTartan,
	paintLogoStream,
	paintStarfield,
	type FlyingLogo,
} from './ludicrousPainters';
import { ludicrousTunnelSett } from './ludicrousTartanSetts';
import type { LudicrousVariantProps } from './ludicrousVariantProps';

const numStars = 200;

/* This variant is the view from the ship being overtaken, which is the only place in the film the
   plaid is ever named. So it shows what that ship sees: Spaceball One's stern — three circular
   engine bells over its bumper placard — blooming to white-blue and receding, and then a plaid band
   crossing the top of the windshield as the wake passes over. The ship does not stretch; nothing in
   the film stretches, and an elongating hull is a Star Wars memory rather than this one. */
const bumperText = 'WE BRAKE FOR NOBODY';

const paintStern = (ctx: CanvasRenderingContext2D, w: number, h: number, speed: number, frame: number): void => {
	const recede = Math.min(1, Math.pow(Math.max(0, speed - 0.5) / 13, 0.85));
	const scale = 1 - recede * 0.82;
	const cx = w / 2;
	const cy = h * 0.44 - recede * h * 0.05;
	const hullW = w * 0.78 * scale;
	const hullH = w * 0.34 * scale;
	const bloom = Math.min(1, Math.pow(Math.max(0, speed - 1) / 12, 1.3));

	ctx.save();

	ctx.beginPath();
	ctx.moveTo(cx - hullW / 2, cy - hullH / 2);
	ctx.lineTo(cx + hullW / 2, cy - hullH / 2);
	ctx.lineTo(cx + hullW / 2.35, cy + hullH / 2);
	ctx.lineTo(cx - hullW / 2.35, cy + hullH / 2);
	ctx.closePath();
	const hull = ctx.createLinearGradient(0, cy - hullH / 2, 0, cy + hullH / 2);
	hull.addColorStop(0, '#6f757b');
	hull.addColorStop(0.45, '#43484d');
	hull.addColorStop(1, '#1d2023');
	ctx.fillStyle = hull;
	ctx.fill();
	ctx.strokeStyle = 'rgba(0,0,0,0.6)';
	ctx.lineWidth = 1;
	ctx.stroke();

	const bellR = hullH * 0.3;
	for (let i = -1; i <= 1; i += 1) {
		const bx = cx + i * hullW * 0.27;
		const by = cy - hullH * 0.05;
		ctx.beginPath();
		ctx.arc(bx, by, bellR * 1.16, 0, Math.PI * 2);
		ctx.fillStyle = '#15181b';
		ctx.fill();

		const glow = ctx.createRadialGradient(bx, by, 0, bx, by, bellR * (1 + bloom * 2.6));
		glow.addColorStop(0, `rgba(255,255,255,${0.5 + bloom * 0.5})`);
		glow.addColorStop(0.3, `rgba(190,225,255,${0.35 + bloom * 0.6})`);
		glow.addColorStop(1, 'rgba(120,180,255,0)');
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(bx, by, bellR * (1 + bloom * 2.6), 0, Math.PI * 2);
		ctx.fill();
	}

	// The bumper placard, which is a real prop on the ship's stern and the reason this shot is funny.
	const plateW = hullW * 0.62;
	const plateH = Math.max(7, hullH * 0.2);
	const plateY = cy + hullH / 2 - plateH * 0.1;
	ctx.fillStyle = '#d8d3c4';
	ctx.fillRect(cx - plateW / 2, plateY, plateW, plateH);
	ctx.fillStyle = '#1a1a18';
	ctx.font = `700 ${Math.max(4, plateH * 0.56)}px 'DM Sans', sans-serif`;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	ctx.fillText(bumperText, cx, plateY + plateH / 2 + 0.5);

	if (bloom > 0.02) {
		const wash = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * (0.3 + bloom * 0.9));
		wash.addColorStop(0, `rgba(226,240,255,${bloom * 0.85})`);
		wash.addColorStop(1, 'rgba(160,200,255,0)');
		ctx.fillStyle = wash;
		ctx.fillRect(0, 0, w, h);
	}

	ctx.globalAlpha = 0.5;
	ctx.strokeStyle = `rgba(210,235,255,${bloom * 0.6})`;
	ctx.lineWidth = 1;
	ctx.beginPath();
	ctx.moveTo(cx - hullW, cy + Math.sin(frame * 0.3) * 0.5);
	ctx.lineTo(cx + hullW, cy);
	ctx.stroke();

	ctx.restore();
};

const ludicrousExteriorVariant = ({ phaseRef, speedRef, logosRef, logoImages, display, onSettled }: LudicrousVariantProps) => {
	const starsRef = useRef(makeStars(numStars));
	const logosStateRef = useRef<FlyingLogo[]>([]);
	const logoCursorRef = useRef(0);
	const bandRef = useRef(0);

	const canvasRef = useLudicrousCanvas((ctx, { w, h, speed, phase, frame }) => {
		const rect = { x: 0, y: 0, w, h };
		const wake = phase === 'ludicrous' || phase === 'plaid' || phase === 'panic';

		ctx.fillStyle = 'rgba(0,0,0,0.16)';
		ctx.fillRect(0, 0, w, h);
		// This ship never leaves light speed, so its own starlines stay achromatic while the plaid
		// belongs entirely to the wake crossing overhead.
		paintStarfield(ctx, starsRef.current, rect, { speed, phase: wake ? 'lightspeed' : phase, spread: 1.1 });

		if (wake) {
			bandRef.current += speed * 0.9;
			const bandH = h * 0.17;
			const bandY = h * 0.1 + Math.sin(frame * 0.011) * h * 0.035;
			paintFlatTartan(ctx, { x: 0, y: bandY, w, h: bandH }, ludicrousTunnelSett, 1.5, bandRef.current);
			ctx.fillStyle = 'rgba(255,255,255,0.5)';
			ctx.fillRect(0, bandY - 2, w, 2);
			ctx.fillRect(0, bandY + bandH, w, 2);
		} else {
			paintStern(ctx, w, h, speed, frame);
		}

		if (logosRef.current && frame % 3 === 0 && logoCursorRef.current < logoImages.length * 3) {
			logosStateRef.current.push(makeFlyingLogo(logoImages[logoCursorRef.current % logoImages.length]!, 1.25));
			logoCursorRef.current += 1;
		}
		if (logosStateRef.current.length > 0) {
			paintLogoStream(ctx, logosStateRef.current, rect, speed);
			logosStateRef.current = logosStateRef.current.filter(l => l.z > 0);
		}
	}, { phaseRef, speedRef, onSettled });

	return (
		<>
			<canvas ref={canvasRef} className='ls-canvas' />
			<div className={`ls-text ${display.cls}`}>{display.text}</div>
		</>
	);
};

export default ludicrousExteriorVariant;
