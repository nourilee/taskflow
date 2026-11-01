import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import html from '../../index.html?raw';
import { system } from '../test/setup';
import { ThemeSwitcher } from './ThemeSwitcher';

const appliedTheme = () => document.documentElement.dataset.theme;

function runStartupScript() {
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)?.[1] ?? '';
  new Function(script)();
}

describe('ThemeSwitcher', () => {
  it('defaults to System and follows the operating system', () => {
    system.dark = true;
    render(<ThemeSwitcher />);

    expect(screen.getByRole('radio', { name: 'System' })).toHaveProperty('checked', true);
    expect(appliedTheme()).toBe('dark');
  });

  it('reacts when the operating system theme changes in System mode', () => {
    render(<ThemeSwitcher />);
    expect(appliedTheme()).toBe('light');

    act(() => {
      system.dark = true;
      system.listeners.forEach((listener) => listener());
    });

    expect(appliedTheme()).toBe('dark');
  });

  it('applies and stores an explicit choice over the operating system', async () => {
    system.dark = true;
    render(<ThemeSwitcher />);

    await userEvent.click(screen.getByTestId('theme-option-light'));

    expect(appliedTheme()).toBe('light');
    expect(localStorage.getItem('taskflow.theme')).toBe('light');
  });

  it('restores the stored choice in a later session', () => {
    localStorage.setItem('taskflow.theme', 'dark');
    render(<ThemeSwitcher />);

    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveProperty('checked', true);
    expect(appliedTheme()).toBe('dark');
  });

  it('can be operated with the keyboard', async () => {
    localStorage.setItem('taskflow.theme', 'light');
    render(<ThemeSwitcher />);

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByTestId('theme-option-light'));
    await userEvent.keyboard('{ArrowRight}');

    expect(appliedTheme()).toBe('dark');
  });
});

describe('startup script in index.html', () => {
  it.each([
    ['dark', false, 'dark'],
    ['light', true, 'light'],
    [null, true, 'dark'],
    ['unknown', false, 'light'],
  ])('with stored %s and system dark %s applies %s', (stored, systemDark, expected) => {
    if (stored) {
      localStorage.setItem('taskflow.theme', stored);
    }
    system.dark = systemDark;

    runStartupScript();

    expect(appliedTheme()).toBe(expected);
  });
});
