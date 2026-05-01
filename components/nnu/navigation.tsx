"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import {
  List,
  X,
  ClockCounterClockwise,
  BookOpen,
  House,
  GearSix,
  User,
  SignIn,
  SignOut,
  UserPlus,
  GraduationCap,
} from "@phosphor-icons/react";
import { useAuth } from "@/lib/use-auth";
import { logoutUser } from "@/lib/auth";

export interface NavigationProps extends React.HTMLAttributes<HTMLElement> {}

export const Navigation = React.forwardRef<HTMLElement, NavigationProps>(
  ({ className, ...props }, ref) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);
    const userMenuRef = React.useRef<HTMLDivElement | null>(null);
    const router = useRouter();
    const { user, isReady } = useAuth();

    React.useEffect(() => {
      if (!isUserMenuOpen) return;
      const onDocClick = (e: MouseEvent) => {
        if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
          setIsUserMenuOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      return () => document.removeEventListener("mousedown", onDocClick);
    }, [isUserMenuOpen]);

    const initial = user?.displayName?.[0]?.toUpperCase() || "我";

    const handleLogout = () => {
      logoutUser();
      setIsUserMenuOpen(false);
      setIsMobileMenuOpen(false);
      router.push("/");
    };

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
              <House className="w-4 h-4" />
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
              href="/njnu"
              className="relative flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
              aria-label="南师专属（新功能）"
            >
              <GraduationCap className="w-4 h-4" />
              南师专属
              <span
                className="w-1.5 h-1.5 rounded-full bg-nnu-jade shadow-[0_0_0_3px_rgba(93,176,144,0.35)] animate-pulse"
                aria-hidden
              />
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
            >
              <ClockCounterClockwise className="w-4 h-4" />
              历史
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-4 py-2"
              role="menuitem"
              aria-label="系统设置"
            >
              <GearSix className="w-4 h-4" />
              设置
            </Link>

            {/* Auth area */}
            <div className="ml-2 pl-2 border-l border-white/15">
              {isReady && user ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((v) => !v)}
                    className="flex items-center gap-2 hover:bg-white/10 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-3 py-2"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    <span className="w-8 h-8 rounded-full bg-nnu-gold text-nnu-green flex items-center justify-center font-bold text-sm">
                      {initial}
                    </span>
                    <span className="text-sm max-w-[100px] truncate">
                      {user.displayName}
                    </span>
                  </button>
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 mt-2 w-44 bg-white text-gray-700 rounded-lg shadow-lg ring-1 ring-black/5 overflow-hidden z-50"
                    >
                      <Link
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-nnu-paper"
                        onClick={() => setIsUserMenuOpen(false)}
                        role="menuitem"
                      >
                        <User className="w-4 h-4" />
                        个人中心
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-nnu-paper text-left"
                        role="menuitem"
                      >
                        <SignOut className="w-4 h-4" />
                        退出登录
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 hover:bg-white/10 hover:text-nnu-gold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-nnu-gold rounded-lg px-3 py-2 text-sm"
                  >
                    <SignIn className="w-4 h-4" />
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-1.5 bg-nnu-gold text-nnu-green hover:bg-nnu-gold/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white rounded-lg px-3 py-2 text-sm font-semibold"
                  >
                    <UserPlus className="w-4 h-4" />
                    注册
                  </Link>
                </div>
              )}
            </div>
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
              <List className="w-6 h-6" />
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
              <House className="w-5 h-5" />
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
              href="/njnu"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
              aria-label="南师专属（新功能）"
            >
              <GraduationCap className="w-5 h-5" />
              <span className="flex items-center gap-2">
                南师专属
                <span
                  className="w-1.5 h-1.5 rounded-full bg-nnu-jade shadow-[0_0_0_3px_rgba(93,176,144,0.35)] animate-pulse"
                  aria-hidden
                />
              </span>
            </Link>
            <Link
              href="/history"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <ClockCounterClockwise className="w-5 h-5" />
              历史
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-nnu-gold focus:ring-inset"
              onClick={() => setIsMobileMenuOpen(false)}
              role="menuitem"
            >
              <GearSix className="w-5 h-5" />
              设置
            </Link>

            <div className="border-t border-white/10 mt-2 pt-2">
              {isReady && user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <span className="w-7 h-7 rounded-full bg-nnu-gold text-nnu-green flex items-center justify-center font-bold text-xs">
                      {initial}
                    </span>
                    <span className="truncate">{user.displayName} · 个人中心</span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors text-left"
                    role="menuitem"
                  >
                    <SignOut className="w-5 h-5" />
                    退出登录
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <SignIn className="w-5 h-5" />
                    登录
                  </Link>
                  <Link
                    href="/register"
                    className="flex items-center gap-3 py-3 px-4 min-h-[44px] hover:bg-white/10 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                    role="menuitem"
                  >
                    <UserPlus className="w-5 h-5" />
                    注册
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    );
  }
);

Navigation.displayName = "Navigation";
