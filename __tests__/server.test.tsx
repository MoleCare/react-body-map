/**
 * @jest-environment node
 */
import { renderToString } from 'react-dom/server';
import { BodyMap } from '../src';

it('renders on the server without touching the DOM', () => {
  expect(typeof window).toBe('undefined');
  const html = renderToString(
    <BodyMap counts={{ chest: 2 }} selected="neck" onSelect={() => undefined} />
  );
  expect(html).toContain('aria-label="Chest, 2 recorded"');
  expect(html).toContain('data-region="neck"');
});
