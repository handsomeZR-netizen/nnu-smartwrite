import { beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Clear localStorage before each test
beforeEach(() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.clear();
  }
});
