import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom does not implement modal dialogs. Real behaviour is confirmed in a browser.
HTMLDialogElement.prototype.showModal = function showModal() {
  this.open = true;
};
HTMLDialogElement.prototype.close = function close() {
  this.open = false;
};

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
