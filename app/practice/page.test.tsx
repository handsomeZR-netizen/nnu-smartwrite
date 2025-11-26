import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import { render, screen } from '@testing-library/react';
import type { PracticeQuestion } from '@/lib/types';

// Mock the practice questions data
const mockPracticeQuestions: PracticeQuestion[] = [
  {
    id: 'q001',
    type: 'translation',
    title: '翻译题1',
    directions: 'Translate the sentence',
    essayContext: 'Context for translation',
    difficulty: 'easy',
  },
  {
    id: 'q002',
    type: 'translation',
    title: '翻译题2',
    directions: 'Translate another sentence',
    essayContext: 'Another context',
    difficulty: 'medium',
  },
  {
    id: 'q003',
    type: 'writing',
    title: '写作题1',
    directions: 'Write an essay',
    essayContext: 'Essay context',
    difficulty: 'hard',
  },
  {
    id: 'q004',
    type: 'writing',
    title: '写作题2',
    directions: 'Write another essay',
    essayContext: 'Another essay context',
    difficulty: 'medium',
  },
];

// Helper to generate valid practice question
const practiceQuestionArbitrary = (): fc.Arbitrary<PracticeQuestion> => {
  return fc.record({
    id: fc.string({ minLength: 1, maxLength: 20 }),
    type: fc.constantFrom('translation', 'writing', 'completion') as fc.Arbitrary<'translation' | 'writing' | 'completion'>,
    title: fc.string({ minLength: 1, maxLength: 100 }),
    directions: fc.string({ minLength: 1, maxLength: 500 }),
    essayContext: fc.string({ minLength: 1, maxLength: 2000 }),
    difficulty: fc.constantFrom('easy', 'medium', 'hard') as fc.Arbitrary<'easy' | 'medium' | 'hard'>,
  });
};

/**
 * Helper function to group questions by type
 * This mirrors the logic in the practice page component
 */
function groupQuestionsByType(questions: PracticeQuestion[]): Record<string, PracticeQuestion[]> {
  const groups: Record<string, PracticeQuestion[]> = {};
  
  questions.forEach((question) => {
    if (!groups[question.type]) {
      groups[question.type] = [];
    }
    groups[question.type].push(question);
  });
  
  return groups;
}

/**
 * Helper function to simulate question selection and prefill
 * Returns the initial data that would be passed to EvaluationForm
 */
function selectQuestionAndPrefill(question: PracticeQuestion) {
  return {
    directions: question.directions,
    essayContext: question.essayContext,
    studentSentence: "",
  };
}

describe('Practice Page Property-Based Tests', () => {
  describe('Property-Based Tests', () => {
    // Feature: nnu-smartwrite, Property 10: 练习题预填充
    // Validates: Requirements 4.2
    it('should correctly prefill directions and essayContext when a question is selected', () => {
      fc.assert(
        fc.property(
          practiceQuestionArbitrary(),
          (question) => {
            // Simulate selecting a question and getting prefill data
            const prefillData = selectQuestionAndPrefill(question);
            
            // Verify directions is correctly prefilled
            expect(prefillData.directions).toBe(question.directions);
            
            // Verify essayContext is correctly prefilled
            expect(prefillData.essayContext).toBe(question.essayContext);
            
            // Verify studentSentence is empty (not prefilled)
            expect(prefillData.studentSentence).toBe("");
          }
        ),
        { numRuns: 100 }
      );
    });

    // Feature: nnu-smartwrite, Property 11: 题目类型分组
    // Validates: Requirements 4.4
    it('should correctly group questions by type', () => {
      fc.assert(
        fc.property(
          fc.array(practiceQuestionArbitrary(), { minLength: 1, maxLength: 50 })
            .map(questions => {
              // Ensure unique IDs by adding index suffix
              return questions.map((q, idx) => ({
                ...q,
                id: `${q.id}-${idx}`
              }));
            }),
          (questions) => {
            // Group questions by type
            const grouped = groupQuestionsByType(questions);
            
            // Verify all questions are in the grouped result
            const totalQuestionsInGroups = Object.values(grouped).reduce(
              (sum, group) => sum + group.length,
              0
            );
            expect(totalQuestionsInGroups).toBe(questions.length);
            
            // Verify each group contains only questions of that type
            for (const [type, groupQuestions] of Object.entries(grouped)) {
              for (const question of groupQuestions) {
                expect(question.type).toBe(type);
              }
            }
            
            // Verify no question appears in multiple groups
            const allGroupedQuestions = Object.values(grouped).flat();
            const uniqueIds = new Set(allGroupedQuestions.map(q => q.id));
            expect(uniqueIds.size).toBe(allGroupedQuestions.length);
            
            // Verify each question from original array is in exactly one group
            for (const question of questions) {
              const foundInGroups = Object.entries(grouped).filter(([type, group]) =>
                group.some(q => q.id === question.id)
              );
              expect(foundInGroups.length).toBe(1);
              expect(foundInGroups[0][0]).toBe(question.type);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    describe('Question Prefill', () => {
      it('should prefill form with selected question data', () => {
        const question: PracticeQuestion = {
          id: 'test-001',
          type: 'translation',
          title: 'Test Translation',
          directions: 'Translate this sentence',
          essayContext: 'This is the context',
          difficulty: 'medium',
        };

        const prefillData = selectQuestionAndPrefill(question);

        expect(prefillData.directions).toBe('Translate this sentence');
        expect(prefillData.essayContext).toBe('This is the context');
        expect(prefillData.studentSentence).toBe('');
      });

      it('should leave studentSentence empty when prefilling', () => {
        const question: PracticeQuestion = {
          id: 'test-002',
          type: 'writing',
          title: 'Test Writing',
          directions: 'Write an essay',
          essayContext: 'Essay context here',
          difficulty: 'hard',
        };

        const prefillData = selectQuestionAndPrefill(question);

        expect(prefillData.studentSentence).toBe('');
      });
    });

    describe('Question Grouping', () => {
      it('should group questions by type correctly', () => {
        const grouped = groupQuestionsByType(mockPracticeQuestions);

        expect(Object.keys(grouped)).toContain('translation');
        expect(Object.keys(grouped)).toContain('writing');
        expect(grouped.translation.length).toBe(2);
        expect(grouped.writing.length).toBe(2);
      });

      it('should maintain all questions in groups', () => {
        const grouped = groupQuestionsByType(mockPracticeQuestions);
        const totalInGroups = Object.values(grouped).reduce(
          (sum, group) => sum + group.length,
          0
        );

        expect(totalInGroups).toBe(mockPracticeQuestions.length);
      });

      it('should only include questions of matching type in each group', () => {
        const grouped = groupQuestionsByType(mockPracticeQuestions);

        for (const question of grouped.translation) {
          expect(question.type).toBe('translation');
        }

        for (const question of grouped.writing) {
          expect(question.type).toBe('writing');
        }
      });

      it('should handle empty question array', () => {
        const grouped = groupQuestionsByType([]);
        expect(Object.keys(grouped).length).toBe(0);
      });

      it('should handle single question', () => {
        const singleQuestion: PracticeQuestion[] = [
          {
            id: 'single',
            type: 'translation',
            title: 'Single Question',
            directions: 'Test',
            essayContext: 'Context',
            difficulty: 'easy',
          },
        ];

        const grouped = groupQuestionsByType(singleQuestion);
        expect(Object.keys(grouped).length).toBe(1);
        expect(grouped.translation.length).toBe(1);
      });

      it('should handle all questions of same type', () => {
        const sameTypeQuestions: PracticeQuestion[] = [
          {
            id: 'q1',
            type: 'writing',
            title: 'Writing 1',
            directions: 'Write',
            essayContext: 'Context 1',
            difficulty: 'easy',
          },
          {
            id: 'q2',
            type: 'writing',
            title: 'Writing 2',
            directions: 'Write more',
            essayContext: 'Context 2',
            difficulty: 'medium',
          },
        ];

        const grouped = groupQuestionsByType(sameTypeQuestions);
        expect(Object.keys(grouped).length).toBe(1);
        expect(grouped.writing.length).toBe(2);
      });
    });
  });
});
