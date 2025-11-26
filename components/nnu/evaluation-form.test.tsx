import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "@testing-library/jest-dom/vitest";
import * as fc from "fast-check";
import { EvaluationForm } from "./evaluation-form";
import type { EvaluationInput } from "@/lib/types";

// Clean up after each test to prevent DOM accumulation
afterEach(() => {
  cleanup();
});

describe("EvaluationForm", () => {
  describe("Property Tests", () => {
    /**
     * Feature: nnu-smartwrite, Property 1: 输入验证完整性
     * Validates: Requirements 1.2
     * 
     * 对于任何不完整的输入（任一字段为空或仅包含空白字符），
     * 系统应该阻止提交并显示相应的验证错误消息。
     */
    it("should reject any incomplete input", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            directions: fc.option(fc.string(), { nil: "" }),
            essayContext: fc.option(fc.string(), { nil: "" }),
            studentSentence: fc.option(fc.string(), { nil: "" }),
          }).filter((input) => {
            // 只测试至少有一个字段为空或仅包含空白字符的情况
            const hasEmptyField =
              !input.directions?.trim() ||
              !input.essayContext?.trim() ||
              !input.studentSentence?.trim();
            return hasEmptyField;
          }),
          async (incompleteInput) => {
            try {
              const onSubmit = vi.fn();
              const user = userEvent.setup();

              render(
                <EvaluationForm
                  initialData={incompleteInput}
                  onSubmit={onSubmit}
                  isLoading={false}
                />
              );

              // 尝试提交表单
              const submitButton = screen.getByRole("button", { name: /提交评估/i });
              await user.click(submitButton);

              // 等待验证完成
              await waitFor(() => {
                // 验证onSubmit没有被调用
                expect(onSubmit).not.toHaveBeenCalled();
              });

              // 验证至少有一个错误消息显示
              const errorMessages = screen.queryAllByRole("alert");
              expect(errorMessages.length).toBeGreaterThan(0);
            } finally {
              cleanup();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    /**
     * Feature: nnu-smartwrite, Property 2: 完整输入传递
     * Validates: Requirements 1.3
     * 
     * 对于任何完整的输入，系统应该将所有三个字段
     * （directions、essayContext、studentSentence）都发送到评估引擎。
     */
    it("should pass all three fields to evaluation engine for complete input", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            directions: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            essayContext: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            studentSentence: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async (completeInput) => {
            try {
              const onSubmit = vi.fn().mockResolvedValue(undefined);
              const user = userEvent.setup();

              render(
                <EvaluationForm
                  initialData={completeInput}
                  onSubmit={onSubmit}
                  isLoading={false}
                />
              );

              // 提交表单
              const submitButton = screen.getByRole("button", { name: /提交评估/i });
              await user.click(submitButton);

              // 等待提交完成
              await waitFor(() => {
                expect(onSubmit).toHaveBeenCalledTimes(1);
              });

              // 验证所有三个字段都被传递
              const submittedData = onSubmit.mock.calls[0][0] as EvaluationInput;
              expect(submittedData.directions).toBe(completeInput.directions);
              expect(submittedData.essayContext).toBe(completeInput.essayContext);
              expect(submittedData.studentSentence).toBe(completeInput.studentSentence);
            } finally {
              cleanup();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);

    /**
     * Feature: nnu-smartwrite, Property 3: 加载状态显示
     * Validates: Requirements 1.4
     * 
     * 对于任何正在处理的评估请求，系统应该在等待期间显示加载指示器。
     */
    it("should display loading indicator during evaluation", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            directions: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
            essayContext: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
            studentSentence: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
          }),
          async (input) => {
            try {
              // 测试加载状态为true时
              const { rerender } = render(
                <EvaluationForm
                  initialData={input}
                  onSubmit={vi.fn()}
                  isLoading={true}
                />
              );

              // 验证加载指示器存在
              const loadingButton = screen.getByRole("button", { name: /评估中/i });
              expect(loadingButton).toBeInTheDocument();
              expect(loadingButton).toBeDisabled();

              // 验证骨架屏存在 (通过aria-busy属性)
              const skeletons = document.querySelectorAll('[aria-busy="true"]');
              expect(skeletons.length).toBeGreaterThan(0);

              // 测试加载状态为false时
              rerender(
                <EvaluationForm
                  initialData={input}
                  onSubmit={vi.fn()}
                  isLoading={false}
                />
              );

              // 验证加载指示器不存在
              const submitButton = screen.getByRole("button", { name: /提交评估/i });
              expect(submitButton).toBeInTheDocument();
              expect(submitButton).not.toBeDisabled();

              // 验证骨架屏不存在
              const skeletonsAfter = document.querySelectorAll('[aria-busy="true"]');
              expect(skeletonsAfter.length).toBe(0);
            } finally {
              cleanup();
            }
          }
        ),
        { numRuns: 20 }
      );
    }, 30000);
  });

  describe("Unit Tests", () => {
    /**
     * 测试空字段提交被阻止
     * Requirements: 1.2
     */
    it("should prevent submission with empty fields", async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<EvaluationForm onSubmit={onSubmit} isLoading={false} />);

      // 尝试提交空表单
      const submitButton = screen.getByRole("button", { name: /提交评估/i });
      await user.click(submitButton);

      // 验证onSubmit没有被调用
      expect(onSubmit).not.toHaveBeenCalled();

      // 验证显示了三个错误消息
      await waitFor(() => {
        const errorMessages = screen.getAllByRole("alert");
        expect(errorMessages.length).toBe(3);
      });
    });

    /**
     * 测试验证错误消息正确显示
     * Requirements: 1.2
     */
    it("should display correct validation error messages", async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<EvaluationForm onSubmit={onSubmit} isLoading={false} />);

      // 提交空表单
      const submitButton = screen.getByRole("button", { name: /提交评估/i });
      await user.click(submitButton);

      // 验证显示了正确的错误消息
      await waitFor(() => {
        expect(screen.getByText(/题目要求不能为空/i)).toBeInTheDocument();
        expect(screen.getByText(/文章语境不能为空/i)).toBeInTheDocument();
        expect(screen.getByText(/学生答案不能为空/i)).toBeInTheDocument();
      });
    });

    /**
     * 测试有效输入允许提交
     * Requirements: 1.2
     */
    it("should allow submission with valid input", async () => {
      const onSubmit = vi.fn().mockResolvedValue(undefined);
      const user = userEvent.setup();

      render(<EvaluationForm onSubmit={onSubmit} isLoading={false} />);

      // 填写所有字段
      const directionsInput = screen.getByLabelText(/题目要求/i);
      const essayContextInput = screen.getByLabelText(/文章语境/i);
      const studentSentenceInput = screen.getByLabelText(/你的答案/i);

      await user.type(directionsInput, "Translate the sentence");
      await user.type(essayContextInput, "This is the essay context");
      await user.type(studentSentenceInput, "This is my answer");

      // 提交表单
      const submitButton = screen.getByRole("button", { name: /提交评估/i });
      await user.click(submitButton);

      // 验证onSubmit被调用
      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledTimes(1);
        expect(onSubmit).toHaveBeenCalledWith({
          directions: "Translate the sentence",
          essayContext: "This is the essay context",
          studentSentence: "This is my answer",
        });
      });

      // 验证没有错误消息
      const errorMessages = screen.queryAllByRole("alert");
      expect(errorMessages.length).toBe(0);
    });
  });
});
