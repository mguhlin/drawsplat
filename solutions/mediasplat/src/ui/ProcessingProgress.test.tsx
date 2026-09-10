import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { elapsedLabel, estimateLabel, ProcessingProgress } from './ProcessingProgress';
afterEach(() => { cleanup(); vi.useRealTimers(); });
it('formats elapsed and estimated durations into hours and minutes', () => {
  expect(elapsedLabel(3661)).toBe('1:01:01');
  expect(estimateLabel(5401)).toBe('1 hr 31 min');
});
it('uses reported progress for estimates, marks stale updates, and reserves 100% for completion', () => {
  vi.useFakeTimers();
  const { rerender } = render(<ProcessingProgress busy progress={0} status="Preparing" estimate/>);
  act(() => vi.advanceTimersByTime(10000));
  rerender(<ProcessingProgress busy progress={.25} status="Burning" estimate/>);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '25');
  expect(screen.getByText('About 1 min remaining')).toBeVisible();
  expect(screen.getByText('Estimated total: 1 min')).toBeVisible();
  act(() => vi.advanceTimersByTime(16000));
  expect(screen.getByText('Waiting for the next encoding update…')).toBeVisible();
  expect(screen.queryByText(/About .* remaining/)).toBeNull();
  rerender(<ProcessingProgress busy progress={1} status="Finishing" estimate/>);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '99');
  rerender(<ProcessingProgress busy={false} progress={1} status="Ready" estimate/>);
  expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
});
