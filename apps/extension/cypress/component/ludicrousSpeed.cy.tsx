import LudicrousSpeedOverlay from '../../entrypoints/popup/components/ludicrousSpeedOverlay';
import { cockpitBrakeRect, cockpitWindowRect } from '../../entrypoints/popup/components/ludicrousCockpit';

const popupW = 320;
const popupH = 560;

const mountOverlay = (onClose: () => void = () => {}) => {
	cy.viewport(popupW, popupH);
	cy.mount(<LudicrousSpeedOverlay onClose={onClose} />);
	cy.get('.ls-overlay').should('exist');
};

const nextPhase = () => cy.get('.ls-overlay').trigger('keydown', { key: 'n' });

// The order the script cuts between cameras, one entry per phase beat.
const phaseViews = ['rear', 'full', 'full', 'full', 'full', 'full', 'cockpit', 'rear'];

const checkText = () => {
		cy.get('.ls-overlay').then($overlay => {
			const canvas = $overlay.find('.ls-canvas')[0]!;
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			const win = cockpitWindowRect(w, h);
			const view = [...$overlay[0]!.classList].find(c => c.startsWith('ls-view-'))!;
			const el = $overlay.find('.ls-text')[0]!;
			const label = `${view} "${(el.textContent ?? '').slice(0, 24)}"`;
			if (!el.textContent?.trim()) return;
			const r = el.getBoundingClientRect();
			expect(r.left, `${label} left`).to.be.at.least(0);
			expect(r.right, `${label} right`).to.be.at.most(w);
			expect(r.top, `${label} top`).to.be.at.least(0);
			expect(r.bottom, `${label} bottom`).to.be.at.most(h);
			if (view === 'ls-view-cockpit') {
				expect(r.top, `${label} clears the glass`).to.be.at.least(win.y + win.h);
			}
		});
	};

describe('ludicrous speed overlay', () => {
	it('closes when the backdrop is clicked', () => {
		const onClose = cy.stub().as('onClose');
		mountOverlay(onClose);
		cy.get('.ls-overlay').click('topLeft');
		cy.get('@onClose').should('have.been.called');
	});

	it('cuts between the three cameras in the order the sequence calls for', () => {
		mountOverlay();
		cy.get('.ls-overlay').should('have.class', 'ls-view-cockpit');
		phaseViews.forEach(view => {
			nextPhase();
			cy.get('.ls-overlay').should('have.class', `ls-view-${view}`);
		});
	});

	it('the emergency brake is part of the cockpit console and stops the ship', () => {
		const onClose = cy.stub().as('onClose');
		mountOverlay(onClose);
		// Seven phase jumps land on the panic beat, which is where the brake is armed.
		for (let i = 0; i < 7; i += 1) nextPhase();
		cy.get('.ls-overlay').should('have.class', 'ls-view-cockpit');

		// Measured off the canvas rather than assumed: the runner's viewport is not exactly the
		// popup's, and the assertion that matters is that the button lands on the placard the canvas
		// drew, at whatever size it drew it. Retrying rather than one-shot, because the button has an
		// entry animation and its first frame is 5px low.
		cy.get('.ls-canvas').then($c => {
			const canvas = $c[0]!;
			const expected = cockpitBrakeRect(canvas.clientWidth, canvas.clientHeight);
			cy.get('.ls-emergency-brake').should($b => {
				const r = $b[0]!.getBoundingClientRect();
				expect(r.left, 'brake left').to.be.closeTo(expected.x, 1);
				expect(r.top, 'brake top').to.be.closeTo(expected.y, 1);
				expect(r.width, 'brake width').to.be.closeTo(expected.w, 1);
				expect(r.height, 'brake height').to.be.closeTo(expected.h, 1);
				expect(r.bottom, 'brake sits inside the popup').to.be.at.most(canvas.clientHeight);
			});
		});
		cy.get('.ls-emergency-brake').click();
		cy.get('@onClose', { timeout: 6000 }).should('have.been.called');
	});

	it('never lets a text beat overflow the popup or land on the cockpit glass', () => {
		mountOverlay();



		checkText();
		// Every beat, not only the phase beats: the alignment fault this covers was per line.
		for (let i = 0; i < 34; i += 1) {
			cy.get('.ls-overlay').trigger('keydown', { key: 'ArrowRight' });
			checkText();
		}
	});

	it('holds the PLAID sign back until the plaid has arrived', () => {
		mountOverlay();
		// Five jumps reach the entry transition, which carries no text at all.
		for (let i = 0; i < 5; i += 1) nextPhase();
		cy.get('.ls-text').should('not.contain.text', 'PLAID');
		nextPhase();
		cy.get('.ls-text.plaid-rect').should('contain.text', 'PLAID');
	});

	it('nothing paints or fires after unmount', () => {
		mountOverlay();
		cy.window().then(win => {
			const pending = new Set<number>();
			const raf = win.requestAnimationFrame.bind(win);
			const caf = win.cancelAnimationFrame.bind(win);
			cy.stub(win, 'requestAnimationFrame').callsFake((cb: FrameRequestCallback) => {
				let id = 0;
				id = raf(t => {
					pending.delete(id);
					cb(t);
				});
				pending.add(id);
				return id;
			});
			cy.stub(win, 'cancelAnimationFrame').callsFake((id: number) => {
				pending.delete(id);
				caf(id);
			});

			cy.wait(400);
			cy.then(() => {
				cy.mount(<div data-testid='after' />);
			});
			cy.get('[data-testid=after]').should('exist');
			cy.get('.ls-overlay').should('not.exist');
			// Nothing is still queued: the last frame the loop asked for was cancelled on unmount.
			cy.wait(200).then(() => expect([...pending]).to.have.length(0));
		});
	});
});
