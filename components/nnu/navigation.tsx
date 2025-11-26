"use client";

import * as React from "react";
import Link from "next/link";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { Menu, X, History, BookOpen, Home, Settings } from "lucide-react";

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {}

export const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, ...props }, ref) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
      <nav
        ref={ref}
        className={cn(
          "glass-nav text-white shadow-lg fixed top-0 left-0 right-0 z-50",
          className
        )}
        role="navigation"
        aria-label="主导航"
        {...props}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-3 focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-offset-2 focus:ring-offset-nnu-green rounded transition-transform hover:scale-[1.02]"
            aria-label="返回首页"
          >
            <div className="p-1.5 bg-white/15 rounded-full backdrop-blur-sm">
              <Logo
                size="md"
                showText={false}
                className="text-white [&>div]:bg-white [&>div]:text-nnu-green"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-white font-bold text-lg tracking-wide leading-none mb-0.5">
                NNU SmartWrite
              </h1>
              <span className="text-white/70 text-xs">南师英语智评平台</span>
            </div>
          </Link>

          {/* 校训展示 - 使用衬线体 */}
          <div className="hidden lg:flex flex-col items-center">
            <span className="font-motto text-nnu-gold text-lg tracking-[0.25em] font-medium">
              正德厚生 · 笃学敏行
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1" role="menubar">
            <Link
              href="/"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
            >
              <Home className="w-4 h-4" />
              首页
            </Link>
            <Link
              href="/practice"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
            >
              <BookOpen className="w-4 h-4" />
              练习
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
            >
              <History className="w-4 h-4" />
              历史
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
              aria-label="系统设置"
            >
              <Settings className="w-4 h-4" />
              设置
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-3 min-h-[44px] min-w-[44px] hover:bg-white/10 rounded-lg transition-colors touch-manipulation flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-nnu-gold"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "关闭菜单" : "打开菜单"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            id="mobile-menu"
            className="md:hidden border-t border-white/10 pb-4 bg-nnu-green/95 backdrop-blur-md"
            role="menu"
            aria-label="移动端导航菜单"
          >
            <Link
              href="/"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <Home className="w-5 h-5" />
              首页
            </Link>
            <Link
              href="/practice"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <BookOpen className="w-5 h-5" />
              练习
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <History className="w-5 h-5" />
              历史
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <Settings className="w-5 h-5" />
              设置
            </Link>
          </div>
        )}
      </nav>
    );
  }
);

Navigation.displayName = "Navigation";
