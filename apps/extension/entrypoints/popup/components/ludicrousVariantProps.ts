import type { MutableRefObject } from 'react';
import type { DisplayState, Phase } from './ludicrousScript';

export interface LudicrousVariantProps {
	phaseRef: MutableRefObject<Phase>;
	speedRef: MutableRefObject<number>;
	logosRef: MutableRefObject<boolean>;
	logoImages: HTMLImageElement[];
	display: DisplayState;
	onSettled: () => void;
}
