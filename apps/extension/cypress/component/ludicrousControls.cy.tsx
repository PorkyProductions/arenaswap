import LudicrousSpeedOverlay from '../../entrypoints/popup/components/ludicrousSpeedOverlay';

const mountVariant = (index: number, onClose: () => void) => {
	cy.window().then(win => win.localStorage.setItem('arenaswap.ludicrous.variant', String((index + 1) % 3)));
	cy.mount(<LudicrousSpeedOverlay onClose={onClose} />);
};

const variants = [
	{ name: 'bridge', index: 1 },
	{ name: 'exterior', index: 2 },
	{ name: 'warp', index: 3 },
];

describe('ludicrous speed controls', () => {
	variants.forEach(({ name, index }) => {
		it(`${name}: click closes the overlay`, () => {
			cy.viewport(320, 560);
			const onClose = cy.stub().as('onClose');
			mountVariant(index, onClose);
			cy.get('.ls-overlay').click('topLeft');
			cy.get('@onClose').should('have.been.called');
		});

		it(`${name}: the emergency brake closes the overlay`, () => {
			cy.viewport(320, 560);
			const onClose = cy.stub().as('onClose');
			mountVariant(index, onClose);
			// Six phase jumps land on panic, which is where the brake is armed.
			for (let i = 0; i < 6; i += 1) cy.get('.ls-overlay').trigger('keydown', { key: 'n' });
			cy.get('.ls-emergency-brake').should('be.visible').click();
			cy.get('@onClose', { timeout: 6000 }).should('have.been.called');
		});

		it(`${name}: nothing paints or fires after unmount`, () => {
			cy.viewport(320, 560);
			mountVariant(index, () => {});
			cy.get('.ls-overlay').should('exist');

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

	it('the variant cycles on every launch and wraps', () => {
		cy.viewport(320, 560);
		cy.window().then(win => win.localStorage.removeItem('arenaswap.ludicrous.variant'));
		const seen: string[] = [];
		for (let i = 0; i < 4; i += 1) {
			cy.mount(<LudicrousSpeedOverlay onClose={() => {}} />);
			cy.get('.ls-variant-badge').invoke('text').then(text => seen.push(text.trim()));
		}
		cy.then(() => {
			expect(seen[0]).to.contain('VARIANT 1 OF 3');
			expect(seen[1]).to.contain('VARIANT 2 OF 3');
			expect(seen[2]).to.contain('VARIANT 3 OF 3');
			expect(seen[3]).to.contain('VARIANT 1 OF 3');
		});
	});
});
