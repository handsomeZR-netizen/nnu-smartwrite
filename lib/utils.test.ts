import { describe, it, expect } from 'vitest';
import {
  validateInput,
  validateInputWithZod,
  sanitizeInput,
  sanitizeEvaluationInput,
  isInputComplete,
  formatValidationErrors,
  generateId,
  formatTimestamp,
  truncateText,
  getScoreColor,
  getScoreLabel,
} from './utils';
import type { EvaluationInput, ValidationError } from './types';

describe('Utility Functions', () => {
  describe('validateInput', () => {
    it('should return no errors for valid input', () => {
      const input: EvaluationInput = {
        directions: 'Translate the sentence',
        essayContext: 'This is about education',
        studentSentence: 'Adult education is important',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return error for empty directions', () => {
      const input = {
        directions: '',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('directions');
      expect(errors[0].message).toContain('题目要求');
    });

    it('should return error for empty essayContext', () => {
      const input = {
        directions: 'Directions',
        essayContext: '',
        studentSentence: 'Sentence',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('essayContext');
    });

    it('should return error for empty studentSentence', () => {
      const input = {
        directions: 'Directions',
        essayContext: 'Context',
        studentSentence: '',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].field).toBe('studentSentence');
    });

    it('should return multiple errors for multiple empty fields', () => {
      const input = {
        directions: '',
        essayContext: '',
        studentSentence: '',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(3);
    });

    it('should return error for directions exceeding max length', () => {
      const input = {
        directions: 'a'.repeat(501),
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      const errors = validateInput(input);
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toContain('500');
    });
  });

  describe('validateInputWithZod', () => {
    it('should return success for valid input', () => {
      const input = {
        directions: 'Translate',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      const result = validateInputWithZod(input);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it('should return errors for invalid input', () => {
      const input = {
        directions: '',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      const result = validateInputWithZod(input);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    it('should replace multiple spaces with single space', () => {
      expect(sanitizeInput('hello    world')).toBe('hello world');
    });

    it('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    it('should limit length to prevent extremely long inputs', () => {
      const longText = 'a'.repeat(20000);
      const result = sanitizeInput(longText);
      expect(result.length).toBeLessThanOrEqual(10000);
    });
  });

  describe('sanitizeEvaluationInput', () => {
    it('should sanitize all fields', () => {
      const input: EvaluationInput = {
        directions: '  Translate  ',
        essayContext: '  Context  ',
        studentSentence: '  Sentence  ',
      };

      const result = sanitizeEvaluationInput(input);
      expect(result.directions).toBe('Translate');
      expect(result.essayContext).toBe('Context');
      expect(result.studentSentence).toBe('Sentence');
    });
  });

  describe('isInputComplete', () => {
    it('should return true for complete input', () => {
      const input: EvaluationInput = {
        directions: 'Translate',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      expect(isInputComplete(input)).toBe(true);
    });

    it('should return false for incomplete input', () => {
      const input = {
        directions: 'Translate',
        essayContext: '',
        studentSentence: 'Sentence',
      };

      expect(isInputComplete(input)).toBe(false);
    });

    it('should return false for whitespace-only fields', () => {
      const input = {
        directions: '   ',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      expect(isInputComplete(input)).toBe(false);
    });
  });

  describe('formatValidationErrors', () => {
    it('should return empty string for no errors', () => {
      expect(formatValidationErrors([])).toBe('');
    });

    it('should return single message for one error', () => {
      const errors: ValidationError[] = [
        { field: 'directions', message: 'Required' },
      ];

      expect(formatValidationErrors(errors)).toBe('Required');
    });

    it('should format multiple errors with bullets', () => {
      const errors: ValidationError[] = [
        { field: 'directions', message: 'Error 1' },
        { field: 'essayContext', message: 'Error 2' },
      ];

      const result = formatValidationErrors(errors);
      expect(result).toContain('• Error 1');
      expect(result).toContain('• Error 2');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^\d+-[a-z0-9]+$/);
    });
  });

  describe('formatTimestamp', () => {
    it('should format timestamp to readable string', () => {
      const timestamp = new Date('2024-01-15T10:30:00').getTime();
      const formatted = formatTimestamp(timestamp);

      expect(formatted).toContain('2024');
      expect(formatted).toContain('01');
      expect(formatted).toContain('15');
    });
  });

  describe('truncateText', () => {
    it('should not truncate short text', () => {
      expect(truncateText('hello', 10)).toBe('hello');
    });

    it('should truncate long text with ellipsis', () => {
      const result = truncateText('hello world', 8);
      expect(result).toBe('hello...');
      expect(result.length).toBe(8);
    });
  });

  describe('getScoreColor', () => {
    it('should return correct color for S grade', () => {
      expect(getScoreColor('S')).toContain('yellow');
    });

    it('should return correct color for A grade', () => {
      expect(getScoreColor('A')).toContain('green');
    });

    it('should return correct color for B grade', () => {
      expect(getScoreColor('B')).toContain('blue');
    });

    it('should return correct color for C grade', () => {
      expect(getScoreColor('C')).toContain('gray');
    });

    it('should return default color for unknown grade', () => {
      expect(getScoreColor('X')).toContain('gray-300');
    });
  });

  describe('getScoreLabel', () => {
    it('should return correct label for each grade', () => {
      expect(getScoreLabel('S')).toBe('优秀');
      expect(getScoreLabel('A')).toBe('良好');
      expect(getScoreLabel('B')).toBe('中等');
      expect(getScoreLabel('C')).toBe('需改进');
      expect(getScoreLabel('X')).toBe('未知');
    });
  });
});
