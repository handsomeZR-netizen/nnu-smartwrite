import type { HistoryRecord, HistoryStorage, EvaluationInput, EvaluationResult } from './types';
import { HistoryStorageSchema, HistoryRecordSchema } from './types';

/**
 * localStorage key for history records
 */
const STORAGE_KEY = 'nnu-smartwrite-history';

/**
 * Current storage version
 */
const STORAGE_VERSION = '1.0';

/**
 * Maximum number of history records to keep
 */
const MAX_RECORDS = 10;

/**
 * Generate a simple UUID v4
 * @returns A UUID string
 */
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/**
 * Get all history records from localStorage
 * @returns HistoryStorage object with records array
 */
export const getHistory = (): HistoryStorage => {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return { records: [], version: STORAGE_VERSION };
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      return { records: [], version: STORAGE_VERSION };
    }

    // Parse stored data
    const parsed = JSON.parse(stored);
    
    // Validate data format
    const validated = HistoryStorageSchema.safeParse(parsed);
    
    if (!validated.success) {
      console.error('Invalid history data format:', validated.error);
      // Clear corrupted data
      localStorage.removeItem(STORAGE_KEY);
      return { records: [], version: STORAGE_VERSION };
    }

    // Check version compatibility
    if (validated.data.version !== STORAGE_VERSION) {
      console.warn(`Version mismatch: ${validated.data.version} vs ${STORAGE_VERSION}. Clearing history.`);
      localStorage.removeItem(STORAGE_KEY);
      return { records: [], version: STORAGE_VERSION };
    }

    return validated.data;
  } catch (error) {
    console.error('Failed to get history from localStorage:', error);
    // Clear corrupted data on any error (including JSON parse errors)
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (clearError) {
      console.error('Failed to clear corrupted data:', clearError);
    }
    // Graceful degradation: return empty history
    return { records: [], version: STORAGE_VERSION };
  }
};

/**
 * Save a new history record to localStorage
 * Automatically maintains the 10-record limit by removing oldest records
 * @param input - The evaluation input
 * @param result - The evaluation result
 * @returns boolean indicating success
 */
export const saveToHistory = (input: EvaluationInput, result: EvaluationResult): boolean => {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return false;
    }

    const history = getHistory();
    
    // Create new record
    const newRecord: HistoryRecord = {
      id: generateUUID(),
      input,
      result,
      createdAt: Date.now(),
    };

    // Validate new record
    const validated = HistoryRecordSchema.safeParse(newRecord);
    if (!validated.success) {
      console.error('Invalid record data:', validated.error);
      return false;
    }

    // Add new record to the beginning (most recent first)
    history.records.unshift(validated.data);

    // Maintain maximum of 10 records (remove oldest if exceeds)
    if (history.records.length > MAX_RECORDS) {
      history.records = history.records.slice(0, MAX_RECORDS);
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return true;
  } catch (error) {
    console.error('Failed to save history to localStorage:', error);
    // Don't block user flow even if save fails
    return false;
  }
};

/**
 * Delete a specific history record by ID
 * @param id - The record ID to delete
 * @returns boolean indicating success
 */
export const deleteHistoryRecord = (id: string): boolean => {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return false;
    }

    const history = getHistory();
    
    // Filter out the record with matching ID
    const filteredRecords = history.records.filter(record => record.id !== id);
    
    // Check if any record was actually removed
    if (filteredRecords.length === history.records.length) {
      console.warn(`Record with ID ${id} not found`);
      return false;
    }

    history.records = filteredRecords;
    
    // Save updated history
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    
    return true;
  } catch (error) {
    console.error('Failed to delete history record:', error);
    return false;
  }
};

/**
 * Clear all history records from localStorage
 * @returns boolean indicating success
 */
export const clearHistory = (): boolean => {
  try {
    // Check if localStorage is available
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available');
      return false;
    }

    localStorage.removeItem(STORAGE_KEY);
    return true;
  } catch (error) {
    console.error('Failed to clear history:', error);
    return false;
  }
};

/**
 * Get a specific history record by ID
 * @param id - The record ID to retrieve
 * @returns HistoryRecord or null if not found
 */
export const getHistoryRecord = (id: string): HistoryRecord | null => {
  try {
    const history = getHistory();
    const record = history.records.find(r => r.id === id);
    return record || null;
  } catch (error) {
    console.error('Failed to get history record:', error);
    return null;
  }
};
