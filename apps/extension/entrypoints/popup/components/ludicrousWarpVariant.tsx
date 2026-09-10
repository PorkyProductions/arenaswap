import { useRef } from 'react';
import { useLudicrousCanvas } from './ludicrousCanvasLoop';
import {
	makeStars,
	makeFlyingLogo,
	paintLogoStream,
	paintStarfield,
	paintTartanTunnel,
	type FlyingLogo,
} from './ludicrousPainters';
import { ludicrousTunnelSett } from './ludicrousTartanSetts';
import type { LudicrousVariantProps } from './ludicrousVariantProps';

const numStars = 230;

// The vanishing point drifts rather than sitting locked at centre, which is how it reads across the
// film's cuts. A slow continuous drift is our reading of that, not something the film literally does.
const tunnelAt = (frame: number, travel: number) => ({
	travel,
	vanishX: 0.5 + Math.sin(frame * 0.0061) * 0.11,
	vanishY: 0.5 + Math.cos(frame * 0.0043) * 0.09,
	repeatsAround: 11,
	depthScale: 0.085,
});

const ludicrousWarpVariant = ({ phaseRef, speedRef, logosRef, logoImages, display, onSettled }: LudicrousVariantProps) => {
	const starsRef = useRef(makeStars(numStars));
	const logosStateRef = useRef<FlyingLogo[]>([]);
	const logoCursorRef = useRef(0);
	const travelRef = useRef(0);

	const canvasRef = useLudicrousCanvas((ctx, { w, h, speed, phase, frame }) => {
		const rect = { x: 0, y: 0, w, h };
		const plaid = phase === 'ludicrous' || phase === 'plaid' || phase === 'panic';
		if (plaid) travelRef.current += speed * 0.0075;

		if (plaid) {
			paintTartanTunnel(ctx, rect, ludicrousTunnelSett, tunnelAt(frame, travelRef.current));
		} else {
			ctx.fillStyle = phase === 'prelaunch' ? 'rgba(0,0,0,0.16)' : 'rgba(0,0,0,0.11)';
			ctx.fillRect(0, 0, w, h);
			paintStarfield(ctx, starsRef.current, rect, { speed, phase });
		}

		if (logosRef.current && frame % 5 === 0 && logoCursorRef.current < logoImages.length * 2) {
			const img = logoImages[logoCursorRef.current % logoImages.length]!;
			logosStateRef.current.push(makeFlyingLogo(img, 1.05));
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

export default ludicrousWarpVariant;
