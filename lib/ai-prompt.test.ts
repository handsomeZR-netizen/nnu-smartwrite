import { describe, it, expect } from 'vitest';
import { EVALUATION_SYSTEM_PROMPT, createEvaluationPrompt, createEvaluationPromptWithRadar } from './ai-prompt';
import type { EvaluationInput } from './types';

describe('AI Prompt Templates', () => {
  describe('EVALUATION_SYSTEM_PROMPT', () => {
    it('should contain key evaluation rules', () => {
      expect(EVALUATION_SYSTEM_PROMPT).toContain('Accept Synonyms and Logical Equivalents');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('Evaluate Semantic Correctness');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('Provide Constructive Feedback');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('Grading Scale');
    });

    it('should specify JSON output format', () => {
      expect(EVALUATION_SYSTEM_PROMPT).toContain('valid JSON only');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('score');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('is_semantically_correct');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('analysis');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('polished_version');
    });

    it('should mention synonym examples', () => {
      expect(EVALUATION_SYSTEM_PROMPT).toContain('social responsibility');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('social obligation');
      expect(EVALUATION_SYSTEM_PROMPT).toContain('adult education');
    });
  });

  describe('createEvaluationPrompt', () => {
    it('should format input into evaluation prompt', () => {
      const input: EvaluationInput = {
        directions: 'Translate the sentence',
        essayContext: 'This is about education',
        studentSentence: 'Adult education is important',
      };

      const prompt = createEvaluationPrompt(input);

      expect(prompt).toContain('**Directions:** Translate the sentence');
      expect(prompt).toContain('**Essay Context:**');
      expect(prompt).toContain('This is about education');
      expect(prompt).toContain('**Student\'s Sentence:**');
      expect(prompt).toContain('Adult education is important');
    });

    it('should include evaluation instruction', () => {
      const input: EvaluationInput = {
        directions: 'Test',
        essayContext: 'Test context',
        studentSentence: 'Test sentence',
      };

      const prompt = createEvaluationPrompt(input);

      expect(prompt).toContain('Please evaluate the student\'s sentence');
    });
  });

  describe('createEvaluationPromptWithRadar', () => {
    it('should include radar chart requirements', () => {
      const input: EvaluationInput = {
        directions: 'Write an essay',
        essayContext: 'About social responsibility',
        studentSentence: 'Social obligation is important',
      };

      const prompt = createEvaluationPromptWithRadar(input);

      expect(prompt).toContain('radar chart scores');
      expect(prompt).toContain('vocabulary');
      expect(prompt).toContain('grammar');
      expect(prompt).toContain('coherence');
      expect(prompt).toContain('structure');
      expect(prompt).toContain('radar_scores');
    });

    it('should include all standard prompt elements', () => {
      const input: EvaluationInput = {
        directions: 'Write',
        essayContext: 'Context',
        studentSentence: 'Sentence',
      };

      const prompt = createEvaluationPromptWithRadar(input);

      expect(prompt).toContain('**Directions:**');
      expect(prompt).toContain('**Essay Context:**');
      expect(prompt).toContain('**Student\'s Sentence:**');
    });
  });
});
