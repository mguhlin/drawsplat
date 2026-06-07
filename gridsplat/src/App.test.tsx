import { describe, expect, it } from 'vitest';
import { App } from './App';
import { renderToStaticMarkup } from 'react-dom/server';

describe('App', () => {
  it('renders the GridSplat heading', () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain('GridSplat™');
  });
});
