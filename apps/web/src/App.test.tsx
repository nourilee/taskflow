import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('identifies the app as TaskFlow', () => {
    render(<App />);

    const heading = screen.getByRole('heading', { level: 1, name: 'TaskFlow' });
    expect(heading.getAttribute('data-testid')).toBe('app-title');
  });
});
