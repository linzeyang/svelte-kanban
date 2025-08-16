import { page } from '@vitest/browser/context';
import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-svelte';
import Page from './+page.svelte';

describe('/+page.svelte', () => {
	it('should render main heading', async () => {
		render(Page);

		const heading = page.getByRole('heading', { name: 'AI-Native Kanban' });
		await expect.element(heading).toBeInTheDocument();
	});
});
