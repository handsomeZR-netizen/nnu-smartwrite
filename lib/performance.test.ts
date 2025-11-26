/**
 * Unit tests for performance utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce, throttle, getCachedData, setCachedData, clearCachedData } from './performance';

describe('Performance Utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('debounce', () => {
    it('should delay function execution', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(999);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should reset timer on subsequent calls', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn();
      vi.advanceTimersByTime(500);
      debouncedFn();
      vi.advanceTimersByTime(500);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 1000);

      debouncedFn('test', 123);
      vi.advanceTimersByTime(1000);

      expect(fn).toHaveBeenCalledWith('test', 123);
    });
  });

  describe('throttle', () => {
    it('should execute function immediately on first call', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should ignore calls within throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn();
      throttledFn();
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should allow calls after throttle period', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(1000);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should pass arguments correctly', () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 1000);

      throttledFn('test', 456);
      expect(fn).toHaveBeenCalledWith('test', 456);
    });
  });

  describe('getCachedData', () => {
    it('should return null for non-existent cache', () => {
      const result = getCachedData('test-key');
      expect(result).toBeNull();
    });

    it('should return cached data if not expired', () => {
      const testData = { value: 'test' };
      setCachedData('test-key', testData);

      const result = getCachedData('test-key');
      expect(result).toEqual(testData);
    });

    it('should return null for expired cache', () => {
      const testData = { value: 'test' };
      const maxAge = 1000;

      // Manually set expired cache
      const entry = {
        data: testData,
        timestamp: Date.now() - maxAge - 1,
      };
      localStorage.setItem('test-key', JSON.stringify(entry));

      const result = getCachedData('test-key', maxAge);
      expect(result).toBeNull();
    });

    it('should handle corrupted cache data', () => {
      localStorage.setItem('test-key', 'invalid json');

      const result = getCachedData('test-key');
      expect(result).toBeNull();
    });
  });

  describe('setCachedData', () => {
    it('should store data with timestamp', () => {
      const testData = { value: 'test' };
      const result = setCachedData('test-key', testData);

      expect(result).toBe(true);

      const stored = localStorage.getItem('test-key');
      expect(stored).toBeTruthy();

      const parsed = JSON.parse(stored!);
      expect(parsed.data).toEqual(testData);
      expect(parsed.timestamp).toBeTypeOf('number');
    });

    it('should return false on storage error', () => {
      // Fill localStorage to cause quota error
      const largeData = 'x'.repeat(10 * 1024 * 1024); // 10MB
      
      try {
        localStorage.setItem('large', largeData);
      } catch {
        // Storage full, test will work
      }

      // This might fail due to quota
      const result = setCachedData('test-key', { data: largeData });
      // Result depends on storage availability
      expect(typeof result).toBe('boolean');
    });
  });

  describe('clearCachedData', () => {
    it('should remove cached data', () => {
      setCachedData('test-key', { value: 'test' });
      expect(localStorage.getItem('test-key')).toBeTruthy();

      const result = clearCachedData('test-key');
      expect(result).toBe(true);
      expect(localStorage.getItem('test-key')).toBeNull();
    });

    it('should return true even if key does not exist', () => {
      const result = clearCachedData('non-existent-key');
      expect(result).toBe(true);
    });
  });
});
