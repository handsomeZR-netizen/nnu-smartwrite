import { describe, it, expect } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Footer } from './footer';

describe('Footer Component', () => {
  describe('Property-Based Tests', () => {
    // Feature: nnu-smartwrite, Property 18: 移动端响应式布局
    // Validates: Requirements 7.1, 7.4
    it('should display responsive layout without horizontal scroll on mobile viewports', () => {
      fc.assert(
        fc.property(
          // Generate mobile viewport widths (< 768px)
          fc.integer({ min: 320, max: 767 }),
          fc.integer({ min: 568, max: 1024 }),
          (width, height) => {
            // Clean up previous renders
            cleanup();
            
            // Set viewport size
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: width,
            });
            Object.defineProperty(window, 'innerHeight', {
              writable: true,
              configurable: true,
              value: height,
            });

            // Render footer
            const { container } = render(<Footer />);

            // Get the footer element
            const footer = container.querySelector('footer');
            expect(footer).toBeTruthy();

            // Verify footer has proper styling
            expect(footer?.classList.contains('bg-nnu-green')).toBe(true);
            expect(footer?.classList.contains('text-white')).toBe(true);

            // Check that the container has responsive padding
            const footerContainer = footer?.querySelector('.container');
            expect(footerContainer).toBeTruthy();
            expect(footerContainer?.classList.contains('mx-auto')).toBe(true);
            expect(footerContainer?.classList.contains('px-4')).toBe(true);

            // Verify no elements have fixed widths that would cause horizontal scroll
            const allElements = container.querySelectorAll('*');
            allElements.forEach((element) => {
              const computedStyle = window.getComputedStyle(element);
              const width = computedStyle.width;
              
              // Elements should not have fixed widths larger than viewport
              if (width && width !== 'auto' && !width.includes('%')) {
                const widthValue = Number.parseFloat(width);
                if (!Number.isNaN(widthValue)) {
                  expect(widthValue).toBeLessThanOrEqual(window.innerWidth);
                }
              }
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    // Property: Footer content should be responsive across all viewport sizes
    it('should adapt layout from mobile to desktop viewports', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }),
          (width) => {
            // Clean up previous renders
            cleanup();
            
            // Set viewport size
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: width,
            });

            const { container } = render(<Footer />);

            // Verify footer exists
            const footer = container.querySelector('footer');
            expect(footer).toBeTruthy();

            // Verify motto is present
            const mottoText = container.querySelector('.font-serif');
            expect(mottoText?.textContent).toContain('正德厚生，笃学敏行');

            // Verify copyright text is present
            const copyrightText = Array.from(container.querySelectorAll('p')).find(p => 
              p.textContent?.includes('南京师范大学')
            );
            expect(copyrightText).toBeTruthy();

            // Verify NNU-SmartWrite branding is present
            const brandingText = Array.from(container.querySelectorAll('p')).find(p => 
              p.textContent?.includes('NNU-SmartWrite')
            );
            expect(brandingText).toBeTruthy();

            // Verify responsive flex layout classes
            const flexContainer = container.querySelector('.flex.flex-col.md\\:flex-row');
            expect(flexContainer).toBeTruthy();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should render footer with copyright information', () => {
      render(<Footer />);

      // Verify copyright text
      expect(screen.getByText(/南京师范大学/)).toBeTruthy();
      expect(screen.getByText(/Nanjing Normal University/)).toBeTruthy();
      expect(screen.getByText(/NNU-SmartWrite/)).toBeTruthy();
    });

    it('should display university motto', () => {
      render(<Footer />);

      expect(screen.getByText('正德厚生，笃学敏行')).toBeTruthy();
    });

    it('should have footer links', () => {
      const { container } = render(<Footer />);

      const links = container.querySelectorAll('a');
      expect(links.length).toBeGreaterThan(0);

      // Verify link texts
      const linkTexts = Array.from(links).map(link => link.textContent);
      expect(linkTexts.some(text => text?.includes('学校官网'))).toBe(true);
      expect(linkTexts.some(text => text?.includes('关于我们'))).toBe(true);
      expect(linkTexts.some(text => text?.includes('帮助中心'))).toBe(true);
    });

    it('should apply NNU brand colors', () => {
      const { container } = render(<Footer />);

      const footer = container.querySelector('footer');
      expect(footer?.classList.contains('bg-nnu-green')).toBe(true);
      expect(footer?.classList.contains('text-white')).toBe(true);
    });

    it('should display current year in copyright', () => {
      render(<Footer />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeTruthy();
    });

    it('should have external link with proper attributes', () => {
      const { container } = render(<Footer />);

      const externalLink = container.querySelector('a[href="https://www.njnu.edu.cn"]');
      expect(externalLink).toBeTruthy();
      expect(externalLink?.getAttribute('target')).toBe('_blank');
      expect(externalLink?.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });
});
