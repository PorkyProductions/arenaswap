import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import { useLudicrousCanvas } from './ludicrousCanvasLoop';
import { makeStars } from './ludicrousPainters';
import { isTunnelPhase, paintSpace, type World } from './ludicrousSpace';
import { cockpitWindowRect, paintCockpitConsole, paintCockpitMullions, traceCockpitWindow } from './ludicrousCockpit';
import { paintStern } from './ludicrousRear';
import type { Phase, View } from './ludicrousScript';

const numStars = 210;

// How many frames the plaid takes to resolve out of the starfield at 1x playback. Driven off the
// transport rate rather than wall time so fast-forwarding does not strand it half-built.
const entryFrames = 78;

interface StageProps {
	view: View;
	phaseRef: MutableRefObject<Phase>;
	speedRef: MutableRefObject<number>;
	logosRef: MutableRefObject<boolean>;
	rateRef: MutableRefObject<number>;
	brakeArmed: boolean;
	brakePulled: boolean;
	logoImages: HTMLImageElement[];
	onMeasure: (w: number, h: number) => void;
	onSettled: () => void;
}

const ludicrousStage = ({
	view,
	phaseRef,
	speedRef,
	logosRef,
	rateRef,
	brakeArmed,
	brakePulled,
	logoImages,
	onMeasure,
	onSettled,
}: StageProps) => {
	const worldRef = useRef<World>({
		stars: makeStars(numStars),
		logos: [],
		logoCursor: 0,
		travel: 0,
		entry: 0,
	});

	const lastViewRef = useRef<View | null>(null);

	const canvasRef = useLudicrousCanvas((ctx, { w, h, speed, phase, frame }) => {
		const world = worldRef.current;

		/* A cut is a cut. Only the cockpit fills the whole frame each pass — the other two lay a
		   translucent veil down for star trails — so without an explicit clear the console ghosts
		   through the next shot for a second. The previous frame's projected positions have to go
		   with it, or the first frame after the cut draws every star and every logo as a streak
		   running from where it was in the old framing to where it is in the new one. */
		if (lastViewRef.current !== view) {
			lastViewRef.current = view;
			ctx.fillStyle = '#000';
			ctx.fillRect(0, 0, w, h);
			for (const star of world.stars) {
				star.px = null;
				star.py = null;
			}
			for (const logo of world.logos) {
				logo.sx = null;
				logo.sy = null;
			}
		}

		if (phase === 'plaidentry') {
			world.entry = Math.min(1, world.entry + rateRef.current / entryFrames);
		} else if (phase === 'plaid' || phase === 'panic') {
			world.entry = 1;
		} else {
			world.entry = 0;
		}
		if (isTunnelPhase(phase)) world.travel += speed * 0.0075;

		const spaceFrame = { speed, phase, frame, logosOn: logosRef.current, logoImages };

		if (view === 'cockpit') {
			const win = cockpitWindowRect(w, h);
			ctx.fillStyle = '#0a0b0c';
			ctx.fillRect(0, 0, w, h);

			ctx.save();
			traceCockpitWindow(ctx, win);
			ctx.clip();
			if (!isTunnelPhase(phase)) {
				ctx.fillStyle = '#000';
				ctx.fillRect(win.x, win.y, win.w, win.h);
			}
			paintSpace(ctx, win, world, spaceFrame, { spread: 0.95, widthScale: 0.7 });
			ctx.restore();

			paintCockpitMullions(ctx, win);
			paintCockpitConsole(ctx, w, h, phase, frame, brakeArmed, brakePulled);
			return;
		}

		const full = { x: 0, y: 0, w, h };
		if (view === 'rear') {
			paintSpace(ctx, full, world, spaceFrame, { spread: 1.1 });
			paintStern(ctx, w, h, speed, frame);
			return;
		}

		paintSpace(ctx, full, world, spaceFrame);
	}, { phaseRef, speedRef, onSettled });

	useEffect(() => {
		const canvas = canvasRef.current;
		if (canvas) onMeasure(canvas.clientWidth, canvas.clientHeight);
	}, [canvasRef, onMeasure]);

	return <canvas ref={canvasRef} className='ls-canvas' />;
};

export default ludicrousStage;
