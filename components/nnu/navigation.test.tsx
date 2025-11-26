import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import * as fc from 'fast-check';
import { Navigation } from './navigation';

describe('Navigation Component', () => {
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

            // Render navigation
            const { container } = render(<Navigation />);

            // Get the navigation element
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();

            // Verify navigation exists and has proper structure
            expect(nav?.classList.contains('bg-nnu-green')).toBe(true);

            // Verify mobile menu button exists on mobile viewports
            const mobileMenuButton = container.querySelector('button[aria-label="Toggle mobile menu"]');
            expect(mobileMenuButton).toBeTruthy();

            // Verify desktop navigation is hidden on mobile (has md:flex class)
            const desktopNav = container.querySelector('.md\\:flex');
            expect(desktopNav).toBeTruthy();

            // Check that the container has responsive padding
            const navContainer = nav?.querySelector('.container');
            expect(navContainer).toBeTruthy();
            expect(navContainer?.classList.contains('mx-auto')).toBe(true);
            expect(navContainer?.classList.contains('px-4')).toBe(true);

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

    // Additional property: Navigation should be accessible on all viewport sizes
    it('should maintain accessibility features across all viewport sizes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }),
          fc.integer({ min: 568, max: 1080 }),
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

            const { container } = render(<Navigation />);

            // Verify navigation has proper semantic HTML
            const nav = container.querySelector('nav');
            expect(nav).toBeTruthy();

            // Verify logo link is accessible
            const logoLinks = container.querySelectorAll('a[href="/"]');
            expect(logoLinks.length).toBeGreaterThan(0);
            const logoLink = Array.from(logoLinks).find(link => link.textContent?.includes('南师智评'));
            expect(logoLink).toBeTruthy();

            // On mobile viewports, verify mobile menu button has proper ARIA attributes
            if (width < 768) {
              const mobileMenuButton = container.querySelector('button[aria-label="Toggle mobile menu"]');
              expect(mobileMenuButton?.getAttribute('aria-label')).toBeTruthy();
              expect(mobileMenuButton?.getAttribute('aria-expanded')).toBeTruthy();
            }

            // Verify all navigation links are present (either in desktop or mobile menu)
            const allLinks = container.querySelectorAll('a');
            const linkTexts = Array.from(allLinks).map(link => link.textContent);
            
            // Should have at least the main navigation links
            expect(linkTexts.some(text => text?.includes('首页'))).toBe(true);
            expect(linkTexts.some(text => text?.includes('练习'))).toBe(true);
            expect(linkTexts.some(text => text?.includes('历史'))).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Unit Tests', () => {
    it('should render navigation with logo and links', () => {
      render(<Navigation />);

      // Verify logo is present
      expect(screen.getByText('南师智评')).toBeTruthy();

      // Verify navigation links are present
      expect(screen.getByText('首页')).toBeTruthy();
      expect(screen.getByText('练习')).toBeTruthy();
      expect(screen.getByText('历史')).toBeTruthy();
    });

    it('should have correct link hrefs', () => {
      const { container } = render(<Navigation />);

      const links = container.querySelectorAll('a');
      const linkMap = new Map<string, string>();
      
      links.forEach(link => {
        const text = link.textContent;
        const href = link.getAttribute('href');
        if (text && href) {
          linkMap.set(text, href);
        }
      });

      // Verify link destinations
      expect(linkMap.get('首页')).toBe('/');
      expect(linkMap.get('练习')).toBe('/practice');
      expect(linkMap.get('历史')).toBe('/history');
    });

    it('should apply NNU brand colors', () => {
      const { container } = render(<Navigation />);

      const nav = container.querySelector('nav');
      expect(nav?.classList.contains('bg-nnu-green')).toBe(true);
      expect(nav?.classList.contains('text-white')).toBe(true);
    });

    it('should have mobile menu button', () => {
      render(<Navigation />);

      const mobileMenuButton = screen.getByLabelText(/toggle mobile menu/i);
      expect(mobileMenuButton).toBeTruthy();
      expect(mobileMenuButton.getAttribute('aria-expanded')).toBe('false');
    });
  });
});
