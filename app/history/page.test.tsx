import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import HistoryPage from './page';
import * as storage from '@/lib/storage';
import type { HistoryRecord, EvaluationInput, EvaluationResult } from '@/lib/types';

// Mock storage module
vi.mock('@/lib/storage', () => ({
  getHistory: vi.fn(),
  clearHistory: vi.fn(),
  deleteHistoryRecord: vi.fn(),
}));

// Mock window.confirm and window.alert
const mockConfirm = vi.fn();
const mockAlert = vi.fn();
global.confirm = mockConfirm;
global.alert = mockAlert;

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as any;

describe('HistoryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockConfirm.mockReturnValue(false);
  });

  // Feature: nnu-smartwrite, Property 14: 历史记录显示完整性
  describe('Property 14: 历史记录显示完整性', () => {
    it(
      'should display all saved history records from localStorage',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate an array of 1-10 history records
            fc.array(
              fc.record({
                id: fc.uuid(),
                input: fc.record({
                  // Generate non-whitespace strings by filtering
                  directions: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                  essayContext: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                  studentSentence: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                }),
                result: fc.record({
                  score: fc.constantFrom('S', 'A', 'B', 'C'),
                  isSemanticallyCorrect: fc.boolean(),
                  analysis: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                  polishedVersion: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                  timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
                }),
                createdAt: fc.integer({ min: 1000000000000, max: 9999999999999 }),
              }),
              { minLength: 1, maxLength: 10 }
            ),
            async (records) => {
              // Mock getHistory to return the generated records
              vi.mocked(storage.getHistory).mockReturnValue({
                records: records as HistoryRecord[],
                version: '1.0',
              });

              // Render the history page
              const { unmount } = render(<HistoryPage />);

              try {
                // Wait for loading to complete
                await waitFor(() => {
                  expect(screen.getAllByText(`共 ${records.length} 条记录`)[0]).toBeInTheDocument();
                });

                // Verify that all records are displayed
                // Each record should show its student sentence
                records.forEach((record) => {
                  // Check if the student sentence is in the document
                  // Use a function matcher to handle whitespace variations
                  const elements = screen.queryAllByText((content, element) => {
                    return content.trim() === record.input.studentSentence.trim();
                  });
                  expect(elements.length).toBeGreaterThan(0);
                });

                // Verify that each record has a "查看详情" button
                const viewButtons = screen.getAllByText('查看详情');
                expect(viewButtons.length).toBeGreaterThanOrEqual(records.length);
              } finally {
                // Clean up after each test
                unmount();
              }
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    ); // 30 second timeout for property test
  });

  // Unit test: Empty state
  it('should display empty state when no records exist', async () => {
    vi.mocked(storage.getHistory).mockReturnValue({
      records: [],
      version: '1.0',
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
      expect(screen.getByText('完成评估后，记录会自动保存在这里')).toBeInTheDocument();
    });
  });

  // Unit test: Clear all functionality
  it('should clear all records when clear button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    const mockRecords: HistoryRecord[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        input: {
          directions: 'Test directions',
          essayContext: 'Test context',
          studentSentence: 'Test sentence',
        },
        result: {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Test analysis',
          polishedVersion: 'Test polished',
          timestamp: Date.now(),
        },
        createdAt: Date.now(),
      },
    ];

    vi.mocked(storage.getHistory).mockReturnValue({
      records: mockRecords,
      version: '1.0',
    });
    vi.mocked(storage.clearHistory).mockReturnValue(true);
    mockConfirm.mockReturnValue(true);

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('清空所有记录')).toBeInTheDocument();
    });

    const clearButton = screen.getByText('清空所有记录');
    await user.click(clearButton);

    expect(mockConfirm).toHaveBeenCalledWith('确定要清空所有历史记录吗？此操作不可恢复。');
    expect(storage.clearHistory).toHaveBeenCalled();
  });

  // Unit test: Delete single record
  it('should delete a single record when delete button is clicked and confirmed', async () => {
    const user = userEvent.setup();
    const recordId = '123e4567-e89b-12d3-a456-426614174000';
    const mockRecords: HistoryRecord[] = [
      {
        id: recordId,
        input: {
          directions: 'Test directions',
          essayContext: 'Test context',
          studentSentence: 'Test sentence',
        },
        result: {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Test analysis',
          polishedVersion: 'Test polished',
          timestamp: Date.now(),
        },
        createdAt: Date.now(),
      },
    ];

    vi.mocked(storage.getHistory).mockReturnValue({
      records: mockRecords,
      version: '1.0',
    });
    vi.mocked(storage.deleteHistoryRecord).mockReturnValue(true);
    mockConfirm.mockReturnValue(true);

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('删除')).toBeInTheDocument();
    });

    const deleteButton = screen.getByText('删除');
    await user.click(deleteButton);

    expect(mockConfirm).toHaveBeenCalledWith('确定要删除这条记录吗？');
    expect(storage.deleteHistoryRecord).toHaveBeenCalledWith(recordId);
  });

  // Unit test: View record detail
  it('should display record detail when view button is clicked', async () => {
    const user = userEvent.setup();
    const mockRecords: HistoryRecord[] = [
      {
        id: '123e4567-e89b-12d3-a456-426614174000',
        input: {
          directions: 'Test directions',
          essayContext: 'Test context',
          studentSentence: 'Test sentence',
        },
        result: {
          score: 'A',
          isSemanticallyCorrect: true,
          analysis: 'Test analysis',
          polishedVersion: 'Test polished',
          timestamp: Date.now(),
        },
        createdAt: Date.now(),
      },
    ];

    vi.mocked(storage.getHistory).mockReturnValue({
      records: mockRecords,
      version: '1.0',
    });

    render(<HistoryPage />);

    await waitFor(() => {
      expect(screen.getByText('查看详情')).toBeInTheDocument();
    });

    const viewButton = screen.getByText('查看详情');
    await user.click(viewButton);

    // Check if detail modal is displayed
    await waitFor(() => {
      expect(screen.getByText('评估详情')).toBeInTheDocument();
      expect(screen.getByText('关闭')).toBeInTheDocument();
    });
  });

  // Feature: nnu-smartwrite, Property 15: 历史记录详情完整性
  describe('Property 15: 历史记录详情完整性', () => {
    it(
      'should display all original input fields and complete evaluation results when viewing a record',
      async () => {
        await fc.assert(
          fc.asyncProperty(
            // Generate a single history record
            fc.record({
              id: fc.uuid(),
              input: fc.record({
                directions: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                essayContext: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
                studentSentence: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
              }),
              result: fc.record({
                score: fc.constantFrom('S', 'A', 'B', 'C'),
                isSemanticallyCorrect: fc.boolean(),
                analysis: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                polishedVersion: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
                timestamp: fc.integer({ min: 1000000000000, max: 9999999999999 }),
              }),
              createdAt: fc.integer({ min: 1000000000000, max: 9999999999999 }),
            }),
            async (record) => {
              const user = userEvent.setup();

              // Mock getHistory to return the generated record
              vi.mocked(storage.getHistory).mockReturnValue({
                records: [record as HistoryRecord],
                version: '1.0',
              });

              // Render the history page
              const { unmount } = render(<HistoryPage />);

              try {
                // Wait for the page to load
                await waitFor(() => {
                  expect(screen.getByText('查看详情')).toBeInTheDocument();
                });

                // Click the view button
                const viewButton = screen.getByText('查看详情');
                await user.click(viewButton);

                // Wait for detail modal to appear
                await waitFor(() => {
                  expect(screen.getByText('评估详情')).toBeInTheDocument();
                });

                // Verify all input field labels are displayed
                expect(screen.getByText('题目要求')).toBeInTheDocument();
                expect(screen.getByText('文章语境')).toBeInTheDocument();
                expect(screen.getByText('你的答案')).toBeInTheDocument();

                // Verify all result field labels are displayed
                expect(screen.getByText('详细分析')).toBeInTheDocument();
                expect(screen.getByText('润色建议')).toBeInTheDocument();

                // Verify the input and result content is present (using queryAllByText to handle duplicates)
                // Normalize whitespace for comparison (replace multiple spaces with single space)
                const normalizeWhitespace = (str: string) => str.trim().replace(/\s+/g, ' ');
                
                const directionsElements = screen.queryAllByText((content) => 
                  normalizeWhitespace(content) === normalizeWhitespace(record.input.directions)
                );
                expect(directionsElements.length).toBeGreaterThan(0);

                const contextElements = screen.queryAllByText((content) => 
                  normalizeWhitespace(content) === normalizeWhitespace(record.input.essayContext)
                );
                expect(contextElements.length).toBeGreaterThan(0);

                const sentenceElements = screen.queryAllByText((content) => 
                  normalizeWhitespace(content) === normalizeWhitespace(record.input.studentSentence)
                );
                expect(sentenceElements.length).toBeGreaterThan(0);

                const analysisElements = screen.queryAllByText((content) => 
                  normalizeWhitespace(content) === normalizeWhitespace(record.result.analysis)
                );
                expect(analysisElements.length).toBeGreaterThan(0);

                const polishedElements = screen.queryAllByText((content) => 
                  normalizeWhitespace(content) === normalizeWhitespace(record.result.polishedVersion)
                );
                expect(polishedElements.length).toBeGreaterThan(0);

                // Verify score badge is displayed
                const scoreBadges = screen.getAllByText(record.result.score);
                expect(scoreBadges.length).toBeGreaterThan(0);

                // Verify semantic correctness indicator
                const correctnessText = record.result.isSemanticallyCorrect ? '✓ 语义正确' : '✗ 需要改进';
                expect(screen.getByText(correctnessText)).toBeInTheDocument();
              } finally {
                // Clean up
                unmount();
              }
            }
          ),
          { numRuns: 100 }
        );
      },
      30000
    ); // 30 second timeout for property test
  });
});
