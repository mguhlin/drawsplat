import { describe, expect, it } from 'vitest';
import { App } from './App';
import { I18nProvider } from './i18n/i18n';
import { renderToStaticMarkup } from 'react-dom/server';

describe('App', () => {
  it('renders the GridSplat™ heading', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <App />
      </I18nProvider>,
    );

    expect(markup).toContain('GridSplat™');
  });
});
