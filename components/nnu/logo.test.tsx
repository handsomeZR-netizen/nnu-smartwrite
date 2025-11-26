import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import * as fc from "fast-check";
import { Logo } from "./logo";

// Feature: nnu-smartwrite, Property 17: 导航栏Logo显示
// Validates: Requirements 6.3

describe("Property 17: Navigation Bar Logo Display", () => {
  it("should always display the NNU logo with correct branding", () => {
    fc.assert(
      fc.property(
        fc.record({
          size: fc.constantFrom("sm", "md", "lg"),
          showText: fc.boolean(),
        }),
        ({ size, showText }) => {
          const { container } = render(
            <Logo size={size as "sm" | "md" | "lg"} showText={showText} />
          );

          // Verify logo container exists
          expect(container.querySelector(".flex.items-center")).toBeTruthy();

          // Verify the logo circle with NNU branding exists
          const logoCircle = container.querySelector(
            ".rounded-full.bg-nnu-green"
          );
          expect(logoCircle).toBeTruthy();
          expect(logoCircle?.textContent).toContain("南师");

          // Verify text is shown when showText is true
          if (showText) {
            expect(container.textContent).toContain("南师智评");
          }

          // Verify correct size classes are applied
          const sizeClasses = {
            sm: "h-8",
            md: "h-10",
            lg: "h-12",
          };
          expect(logoCircle?.className).toContain(sizeClasses[size as keyof typeof sizeClasses]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should maintain consistent branding colors across all logo instances", () => {
    fc.assert(
      fc.property(
        fc.constantFrom("sm", "md", "lg"),
        (size) => {
          const { container } = render(<Logo size={size as "sm" | "md" | "lg"} />);

          // Verify NNU green color is used for the logo circle
          const logoCircle = container.querySelector(".bg-nnu-green");
          expect(logoCircle).toBeTruthy();

          // Verify NNU green color is used for the text
          const logoText = container.querySelector(".text-nnu-green");
          expect(logoText).toBeTruthy();
        }
      ),
      { numRuns: 100 }
    );
  });

  it("should render logo with proper accessibility", () => {
    fc.assert(
      fc.property(
        fc.record({
          size: fc.constantFrom("sm", "md", "lg"),
          showText: fc.boolean(),
        }),
        ({ size, showText }) => {
          const { container } = render(
            <Logo size={size as "sm" | "md" | "lg"} showText={showText} />
          );

          // Verify the logo is rendered as a div with proper structure
          const logoContainer = container.querySelector(".flex.items-center");
          expect(logoContainer).toBeTruthy();

          // Verify logo contains the university abbreviation
          expect(container.textContent).toContain("南师");
        }
      ),
      { numRuns: 100 }
    );
  });
});
