import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { i18n } from '#i18n';
import { buildScript, type DisplayState, type Phase } from './ludicrousScript';
import { preloadLogoImages } from './ludicrousLeagueLogos';
import LudicrousBridgeVariant from './ludicrousBridgeVariant';
import LudicrousExteriorVariant from './ludicrousExteriorVariant';
import LudicrousWarpVariant from './ludicrousWarpVariant';
import type { LudicrousVariantProps } from './ludicrousVariantProps';

/* PROPOSAL SCAFFOLDING — the variant cycler, the on-screen badge and the transport keys below all
   come out once a direction is picked. localStorage is used rather than the preference store so
   that nothing about this survives deleting these three files. */
const variants: { id: string; name: string; Component: (props: LudicrousVariantProps) => ReactElement }[] = [
	{ id: 'bridge', name: 'BRIDGE', Component: LudicrousBridgeVariant },
	{ id: 'exterior', name: 'EXTERIOR', Component: LudicrousExteriorVariant },
	{ id: 'warp', name: 'IN THE WARP', Component: LudicrousWarpVariant },
];

const variantStorageKey = 'arenaswap.ludicrous.variant';
const rateStorageKey = 'arenaswap.ludicrous.rate';

const readNumber = (key: string, fallback: number): number => {
	try {
		const raw = window.localStorage.getItem(key);
		const parsed = raw === null ? NaN : Number(raw);
		return Number.isFinite(parsed) ? parsed : fallback;
	} catch {
		return fallback;
	}
};

const writeNumber = (key: string, value: number): void => {
	try {
		window.localStorage.setItem(key, String(value));
	} catch {
		// Private-mode storage denial is not worth failing an easter egg over.
	}
};

const takeNextVariantIndex = (): number => {
	const next = (readNumber(variantStorageKey, -1) + 1) % variants.length;
	writeNumber(variantStorageKey, next);
	return next;
};

export default ({ onClose }: { onClose: () => void }) => {
	const [variantIndex] = useState(takeNextVariantIndex);
	const variant = variants[variantIndex]!;

	const [rate, setRate] = useState(() => (readNumber(rateStorageKey, 1) === 4 ? 4 : 1));
	const rateRef = useRef(rate);
	rateRef.current = rate;

	const script = useMemo(buildScript, []);
	const logoImages = useMemo(preloadLogoImages, []);

	const phaseRef = useRef<Phase>('prelaunch');
	const speedRef = useRef(0.08);
	const logosRef = useRef(false);

	const [display, setDisplay] = useState<DisplayState>({ text: '', cls: 'dialogue prelaunch' });
	const [brakeState, setBrakeState] = useState<'hidden' | 'visible' | 'pressed'>('hidden');
	const [closing, setClosing] = useState(false);

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
				writeNumber(rateStorageKey, next);
				return next;
			});
		}
	}, [handleSkip, jump]);

	const overlayRef = useRef<HTMLDivElement>(null);
	useEffect(() => overlayRef.current?.focus(), []);

	const Variant = variant.Component;

	return createPortal(
		<div
			ref={overlayRef}
			role='button'
			className={`ls-overlay ls-variant-${variant.id}${closing ? ' closing' : ''}`}
			onClick={handleSkip}
			onKeyDown={handleKeyDown}
			tabIndex={0}
		>
			<Variant
				phaseRef={phaseRef}
				speedRef={speedRef}
				logosRef={logosRef}
				logoImages={logoImages}
				display={display}
				onSettled={() => setClosing(true)}
			/>
			{brakeState !== 'hidden' && (
				<button
					className={`ls-emergency-brake${brakeState === 'pressed' ? ' pressed' : ''}`}
					onClick={handleEmergencyBrake}
				>
					{i18n.t('ludicrousSpeed.emergencyBrake')}
				</button>
			)}
			<div className='ls-variant-badge'>
				{`VARIANT ${variantIndex + 1} OF ${variants.length} — ${variant.name}`}
			</div>
			<div className='ls-skip'>
				{i18n.t('ludicrousSpeed.skip')}
				<span className='ls-transport'>{rate === 4 ? ' · → next · n phase · f 4×' : ' · → next · n phase · f fast'}</span>
			</div>
		</div>,
		document.body,
	);
};
