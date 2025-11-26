/**
 * Performance optimization utilities
 * 
 * Provides debounce, throttle, and caching utilities
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last time it was invoked
 * 
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function - ensures function is called at most once per specified time period
 * 
 * @param func - The function to throttle
 * @param limit - The number of milliseconds to wait between calls
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * Cache interface for localStorage caching
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Get cached data from localStorage with expiration
 * 
 * @param key - The cache key
 * @param maxAge - Maximum age in milliseconds (default: 24 hours)
 * @returns Cached data or null if expired/not found
 */
export function getCachedData<T>(key: string, maxAge: number = 24 * 60 * 60 * 1000): T | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }

    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const entry: CacheEntry<T> = JSON.parse(cached);
    
    // Check if cache is expired
    if (Date.now() - entry.timestamp > maxAge) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch (error) {
    console.error('Failed to get cached data:', error);
    return null;
  }
}

/**
 * Set cached data in localStorage with timestamp
 * 
 * @param key - The cache key
 * @param data - The data to cache
 * @returns boolean indicating success
 */
export function setCachedData<T>(key: string, data: T): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(entry));
    return true;
  } catch (error) {
    console.error('Failed to set cached data:', error);
    return false;
  }
}

/**
 * Clear cached data from localStorage
 * 
 * @param key - The cache key
 * @returns boolean indicating success
 */
export function clearCachedData(key: string): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }

    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Failed to clear cached data:', error);
    return false;
  }
}
