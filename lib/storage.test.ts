import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  getHistory,
  saveToHistory,
  deleteHistoryRecord,
  clearHistory,
  getHistoryRecord,
} from './storage';
import type { EvaluationInput, EvaluationResult } from './types';

// Helper to generate valid evaluation input
// Must generate non-whitespace strings to pass Zod validation
const evaluationInputArbitrary = (): fc.Arbitrary<EvaluationInput> => {
  return fc.record({
    directions: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    essayContext: fc.string({ minLength: 1, maxLength: 2000 }).filter(s => s.trim().length > 0),
    studentSentence: fc.string({ minLength: 1, maxLength: 1000 }).filter(s => s.trim().length > 0),
  });
};

// Helper to generate valid evaluation result
const evaluationResultArbitrary = (): fc.Arbitrary<EvaluationResult> => {
  return fc.record({
    score: fc.constantFrom('S', 'A', 'B', 'C') as fc.Arbitrary<'S' | 'A' | 'B' | 'C'>,
    isSemanticallyCorrect: fc.boolean(),
    analysis: fc.string({ minLength: 1, maxLength: 1000 }),
    polishedVersion: fc.string({ minLength: 0, maxLength: 1000 }),
    radarScores: fc.option(
      fc.record({
        vocabulary: fc.integer({ min: 0, max: 100 }),
        grammar: fc.integer({ min: 0, max: 100 }),
        coherence: fc.integer({ min: 0, max: 100 }),
        structure: fc.integer({ min: 0, max: 100 }),
      }),
      { nil: undefined }
    ),
    timestamp: fc.integer({ min: 0 }),
  });
};

describe('localStorage Storage Management', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    clearHistory();
  });

  describe('Property-Based Tests', () => {
    // Feature: nnu-smartwrite, Property 12: 历史记录自动保存
    // Validates: Requirements 5.1, 5.2
    it('should automatically save complete evaluation to history', () => {
      fc.assert(
        fc.property(
          evaluationInputArbitrary(),
          evaluationResultArbitrary(),
          (input, result) => {
            // Clear history before test
            clearHistory();

            // Save the evaluation
            const success = saveToHistory(input, result);
            expect(success).toBe(true);

            // Retrieve history
            const history = getHistory();
            
            // Verify the record was saved
            expect(history.records.length).toBe(1);
            
            // Verify all input fields are saved (note: storage trims strings via Zod validation)
            expect(history.records[0].input.directions).toBe(input.directions.trim());
            expect(history.records[0].input.essayContext).toBe(input.essayContext.trim());
            expect(history.records[0].input.studentSentence).toBe(input.studentSentence.trim());
            
            // Verify all result fields are saved
            expect(history.records[0].result.score).toBe(result.score);
            expect(history.records[0].result.isSemanticallyCorrect).toBe(result.isSemanticallyCorrect);
            expect(history.records[0].result.analysis).toBe(result.analysis);
            expect(history.records[0].result.polishedVersion).toBe(result.polishedVersion);
            expect(history.records[0].result.timestamp).toBe(result.timestamp);
            
            // Verify radarScores if present
            if (result.radarScores) {
              expect(history.records[0].result.radarScores).toBeDefined();
              expect(history.records[0].result.radarScores?.vocabulary).toBe(result.radarScores.vocabulary);
              expect(history.records[0].result.radarScores?.grammar).toBe(result.radarScores.grammar);
              expect(history.records[0].result.radarScores?.coherence).toBe(result.radarScores.coherence);
              expect(history.records[0].result.radarScores?.structure).toBe(result.radarScores.structure);
            }
            
            // Verify record has required metadata
            expect(history.records[0].id).toBeDefined();
            expect(typeof history.records[0].id).toBe('string');
            expect(history.records[0].createdAt).toBeDefined();
            expect(typeof history.records[0].createdAt).toBe('number');
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: nnu-smartwrite, Property 13: 历史记录容量限制
    // Validates: Requirements 5.3
    it('should maintain maximum 10 history records', () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.tuple(evaluationInputArbitrary(), evaluationResultArbitrary()),
            { minLength: 11, maxLength: 20 }
          ),
          (records) => {
            // Clear history before test
            clearHistory();

            // Add all records
            for (const [input, result] of records) {
              saveToHistory(input, result);
            }

            // Get history and verify it has at most 10 records
            const history = getHistory();
            expect(history.records.length).toBeLessThanOrEqual(10);

            // Verify the records are the most recent ones (first 10)
            // Since we add to the beginning, the first record added should be gone if we added more than 10
            if (records.length > 10) {
              expect(history.records.length).toBe(10);
            } else {
              expect(history.records.length).toBe(records.length);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('saveToHistory', () => {
      it('should save a history record successfully', () => {
        const input: EvaluationInput = {
          directions: 'Translate the sentence',
          essayContext: 'This is a test context',
          studentSentence: 'This is my answer',
        };

        const result: EvaluationResult = {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Good job!',
          polishedVersion: 'This is an improved answer',
          timestamp: Date.now(),
        };

        const success = saveToHistory(input, result);
        expect(success).toBe(true);

        const history = getHistory();
        expect(history.records.length).toBe(1);
        expect(history.records[0].input).toEqual(input);
        expect(history.records[0].result).toEqual(result);
      });

      it('should delete oldest record when exceeding 10 records', () => {
        // Add 11 records
        for (let i = 0; i < 11; i++) {
          const input: EvaluationInput = {
            directions: `Direction ${i}`,
            essayContext: `Context ${i}`,
            studentSentence: `Sentence ${i}`,
          };

          const result: EvaluationResult = {
            score: 'A',
            isSemanticallyCorrect: true,
            analysis: `Analysis ${i}`,
            polishedVersion: `Polished ${i}`,
            timestamp: Date.now() + i,
          };

          saveToHistory(input, result);
        }

        const history = getHistory();
        expect(history.records.length).toBe(10);

        // The first record (index 0) should be the most recent (Direction 10)
        expect(history.records[0].input.directions).toBe('Direction 10');

        // The last record (index 9) should be Direction 1 (Direction 0 was removed)
        expect(history.records[9].input.directions).toBe('Direction 1');
      });

      it('should add new records to the beginning of the array', () => {
        const input1: EvaluationInput = {
          directions: 'First',
          essayContext: 'Context 1',
          studentSentence: 'Sentence 1',
        };

        const result1: EvaluationResult = {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Analysis 1',
          polishedVersion: 'Polished 1',
          timestamp: Date.now(),
        };

        saveToHistory(input1, result1);

        const input2: EvaluationInput = {
          directions: 'Second',
          essayContext: 'Context 2',
          studentSentence: 'Sentence 2',
        };

        const result2: EvaluationResult = {
          score: 'B',
          isSemanticallyCorrect: false,
          analysis: 'Analysis 2',
          polishedVersion: 'Polished 2',
          timestamp: Date.now(),
        };

        saveToHistory(input2, result2);

        const history = getHistory();
        expect(history.records.length).toBe(2);
        expect(history.records[0].input.directions).toBe('Second');
        expect(history.records[1].input.directions).toBe('First');
      });
    });

    describe('getHistory', () => {
      it('should return empty history when localStorage is empty', () => {
        const history = getHistory();
        expect(history.records).toEqual([]);
        expect(history.version).toBe('1.0');
      });

      it('should handle corrupted data gracefully', () => {
        // Manually set corrupted data
        localStorage.setItem('nnu-smartwrite-history', 'invalid json');

        const history = getHistory();
        expect(history.records).toEqual([]);
        expect(history.version).toBe('1.0');

        // Verify corrupted data was cleared
        const stored = localStorage.getItem('nnu-smartwrite-history');
        expect(stored).toBeNull();
      });

      it('should handle version mismatch gracefully', () => {
        // Manually set data with wrong version
        const wrongVersionData = {
          records: [],
          version: '0.5',
        };
        localStorage.setItem('nnu-smartwrite-history', JSON.stringify(wrongVersionData));

        const history = getHistory();
        expect(history.records).toEqual([]);
        expect(history.version).toBe('1.0');

        // Verify old version data was cleared
        const stored = localStorage.getItem('nnu-smartwrite-history');
        expect(stored).toBeNull();
      });

      it('should handle invalid record format gracefully', () => {
        // Manually set data with invalid record format
        const invalidData = {
          records: [
            {
              id: 'not-a-uuid',
              input: { directions: 'test' }, // missing required fields
              result: { score: 'X' }, // invalid score
              createdAt: 'not-a-number',
            },
          ],
          version: '1.0',
        };
        localStorage.setItem('nnu-smartwrite-history', JSON.stringify(invalidData));

        const history = getHistory();
        expect(history.records).toEqual([]);
        expect(history.version).toBe('1.0');
      });
    });

    describe('deleteHistoryRecord', () => {
      it('should delete a specific record by ID', () => {
        // Add two records
        const input1: EvaluationInput = {
          directions: 'First',
          essayContext: 'Context 1',
          studentSentence: 'Sentence 1',
        };

        const result1: EvaluationResult = {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Analysis 1',
          polishedVersion: 'Polished 1',
          timestamp: Date.now(),
        };

        saveToHistory(input1, result1);

        const input2: EvaluationInput = {
          directions: 'Second',
          essayContext: 'Context 2',
          studentSentence: 'Sentence 2',
        };

        const result2: EvaluationResult = {
          score: 'B',
          isSemanticallyCorrect: false,
          analysis: 'Analysis 2',
          polishedVersion: 'Polished 2',
          timestamp: Date.now(),
        };

        saveToHistory(input2, result2);

        const history = getHistory();
        const firstRecordId = history.records[0].id;

        // Delete the first record
        const success = deleteHistoryRecord(firstRecordId);
        expect(success).toBe(true);

        const updatedHistory = getHistory();
        expect(updatedHistory.records.length).toBe(1);
        expect(updatedHistory.records[0].input.directions).toBe('First');
      });

      it('should return false when trying to delete non-existent record', () => {
        const success = deleteHistoryRecord('non-existent-id');
        expect(success).toBe(false);
      });
    });

    describe('clearHistory', () => {
      it('should clear all history records', () => {
        // Add some records
        for (let i = 0; i < 3; i++) {
          const input: EvaluationInput = {
            directions: `Direction ${i}`,
            essayContext: `Context ${i}`,
            studentSentence: `Sentence ${i}`,
          };

          const result: EvaluationResult = {
            score: 'A',
            isSemanticallyCorrect: true,
            analysis: `Analysis ${i}`,
            polishedVersion: `Polished ${i}`,
            timestamp: Date.now(),
          };

          saveToHistory(input, result);
        }

        // Verify records exist
        let history = getHistory();
        expect(history.records.length).toBe(3);

        // Clear history
        const success = clearHistory();
        expect(success).toBe(true);

        // Verify history is empty
        history = getHistory();
        expect(history.records.length).toBe(0);
      });
    });

    describe('getHistoryRecord', () => {
      it('should retrieve a specific record by ID', () => {
        const input: EvaluationInput = {
          directions: 'Test',
          essayContext: 'Context',
          studentSentence: 'Sentence',
        };

        const result: EvaluationResult = {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Analysis',
          polishedVersion: 'Polished',
          timestamp: Date.now(),
        };

        saveToHistory(input, result);

        const history = getHistory();
        const recordId = history.records[0].id;

        const record = getHistoryRecord(recordId);
        expect(record).not.toBeNull();
        expect(record?.input).toEqual(input);
        expect(record?.result).toEqual(result);
      });

      it('should return null for non-existent record', () => {
        const record = getHistoryRecord('non-existent-id');
        expect(record).toBeNull();
      });
    });
  });
});
