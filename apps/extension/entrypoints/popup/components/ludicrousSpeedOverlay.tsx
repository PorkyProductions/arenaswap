import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { i18n } from '#i18n';
import { createPortal } from 'react-dom';
import { buildScript, type DisplayState, type Phase, type View } from './ludicrousScript';
import { preloadLogoImages } from './ludicrousLeagueLogos';
import { cockpitBrakeRect } from './ludicrousCockpit';
import LudicrousStage from './ludicrousStage';

/* PROPOSAL SCAFFOLDING — the transport keys and the playback rate below come out once the sequence
   is signed off. localStorage is used rather than the preference store so that nothing about this
   survives deleting the two helpers. */
const rateStorageKey = 'arenaswap.ludicrous.rate';

const readRate = (): number => {
	try {
		return window.localStorage.getItem(rateStorageKey) === '4' ? 4 : 1;
	} catch {
		return 1;
	}
};

const writeRate = (value: number): void => {
	try {
		window.localStorage.setItem(rateStorageKey, String(value));
	} catch {
		// Private-mode storage denial is not worth failing an easter egg over.
	}
};

export default ({ onClose }: { onClose: () => void }) => {
	const [rate, setRate] = useState(readRate);
	const rateRef = useRef(rate);
	useEffect(() => { rateRef.current = rate; }, [rate]);

	const script = useMemo(buildScript, []);
	const logoImages = useMemo(preloadLogoImages, []);

	const phaseRef = useRef<Phase>('prelaunch');
	const speedRef = useRef(0.08);
	const logosRef = useRef(false);

	const [view, setView] = useState<View>('cockpit');
	const [display, setDisplay] = useState<DisplayState>({ text: '', cls: 'dialogue prelaunch' });
	const [brakeState, setBrakeState] = useState<'hidden' | 'visible' | 'pressed'>('hidden');
	const [closing, setClosing] = useState(false);
	const [size, setSize] = useState<{ w: number; h: number } | null>(null);

	const beatIndexRef = useRef(0);
	const beatTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
	const manualTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
	const finishedRef = useRef(false);

	const finish = useCallback(() => {
		if (finishedRef.current) return;
		finishedRef.current = true;
		clearTimeout(beatTimerRef.current);
		phaseRef.current = 'stopping';
		speedRef.current = 0;
		logosRef.current = false;
		setView('rear');
		setDisplay({ text: i18n.t('ludicrousSpeed.stop'), cls: 'stop' });
		manualTimersRef.current.push(setTimeout(() => setClosing(true), 750));
	}, []);

	const runBeat = useCallback((index: number) => {
		const beat = script[index];
		if (!beat) return;

		if (beat.end) {
			setClosing(true);
			return;
		}
		if (beat.phase) phaseRef.current = beat.phase;
		if (beat.speed !== undefined) speedRef.current = beat.speed;
		if (beat.view) setView(beat.view);
		if (beat.display) setDisplay(beat.display);
		if (beat.brake) setBrakeState(beat.brake);
		logosRef.current = Boolean(beat.logos);

		beatIndexRef.current = index + 1;
		beatTimerRef.current = setTimeout(() => runBeat(index + 1), beat.ms / rateRef.current);
	}, [script]);

	useEffect(() => {
		runBeat(0);
		return () => clearTimeout(beatTimerRef.current);
	}, [runBeat]);

	// Stops a queued skip / emergency-brake timer setting state after unmount.
	useEffect(() => () => manualTimersRef.current.forEach(clearTimeout), []);

	useEffect(() => {
		if (!closing) return;
		const t = setTimeout(onClose, 450);
		return () => clearTimeout(t);
	}, [closing, onClose]);

	const jump = useCallback((toNextPhase: boolean) => {
		if (finishedRef.current) return;
		clearTimeout(beatTimerRef.current);
		let index = beatIndexRef.current;
		if (toNextPhase) {
			while (index < script.length && !script[index]!.phase && !script[index]!.end) index += 1;
		}
		runBeat(Math.min(index, script.length - 1));
	}, [runBeat, script]);

	const handleSkip = useCallback(() => finish(), [finish]);

	const handleEmergencyBrake = useCallback((e: React.MouseEvent) => {
		e.stopPropagation();
		if (brakeState === 'pressed' || finishedRef.current) return;
		setBrakeState('pressed');
		manualTimersRef.current.push(setTimeout(finish, 500));
	}, [brakeState, finish]);

	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleSkip();
			return;
		}
		if (e.key === 'ArrowRight') {
			e.preventDefault();
			jump(false);
			return;
		}
		if (e.key === 'ArrowDown' || e.key === 'n') {
			e.preventDefault();
			jump(true);
			return;
		}
		if (e.key === 'f') {
			e.preventDefault();
			setRate(prev => {
				const next = prev === 1 ? 4 : 1;
				writeRate(next);
				return next;
			});
		}
	}, [handleSkip, jump]);

	const handleMeasure = useCallback((w: number, h: number) => setSize({ w, h }), []);

	const overlayRef = useRef<HTMLDivElement>(null);
	useEffect(() => overlayRef.current?.focus(), []);

	// The brake is part of the console rather than a floating button, so it is placed onto the rect
	// the canvas drew its placard into instead of being guessed at in CSS.
	const brakeRect = size ? cockpitBrakeRect(size.w, size.h) : null;
	const brakeStyle = brakeRect
		? { left: `${brakeRect.x}px`, top: `${brakeRect.y}px`, width: `${brakeRect.w}px`, height: `${brakeRect.h}px` }
		: undefined;

	return createPortal(
		<div
			ref={overlayRef}
			role='button'
			className={`ls-overlay ls-view-${view}${closing ? ' closing' : ''}`}
			onClick={handleSkip}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			<LudicrousStage
				view={view}
				phaseRef={phaseRef}
				speedRef={speedRef}
				logosRef={logosRef}
				rateRef={rateRef}
				brakeArmed={brakeState !== 'hidden'}
				brakePulled={brakeState === 'pressed'}
				logoImages={logoImages}
				onMeasure={handleMeasure}
				onSettled={() => setClosing(true)}
			/>
			<div className={`ls-text ${display.cls}`}>{display.text}</div>
			{brakeState !== 'hidden' && view === 'cockpit' && brakeStyle && (
				<button
					className={`ls-emergency-brake${brakeState === 'pressed' ? ' pressed' : ''}`}
					style={brakeStyle}
					onClick={handleEmergencyBrake}
				>
					{i18n.t('ludicrousSpeed.emergencyBrake')}
				</button>
			)}
			<div className='ls-skip'>
				{i18n.t('ludicrousSpeed.skip')}
				<span className='ls-transport'>{rate === 4 ? ' · → next · n phase · f 4×' : ' · → next · n phase · f fast'}</span>
			</div>
		</div>,
		document.body,
	);
};
