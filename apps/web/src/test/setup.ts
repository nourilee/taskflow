import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom does not implement modal dialogs. Real behaviour is confirmed in a browser.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};

// jsdom has no matchMedia. Tests change `system` to simulate the OS theme.
export const system = { dark: false, listeners: new Set<() => void>() };
window.matchMedia = (query: string) =>
  ({
    media: query,
    get matches() {
      return system.dark;
    },
    addEventListener: (_type: string, listener: () => void) => system.listeners.add(listener),
    removeEventListener: (_type: string, listener: () => void) => system.listeners.delete(listener),
  }) as unknown as MediaQueryList;

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  localStorage.clear();
  system.dark = false;
  delete document.documentElement.dataset.theme;
});
