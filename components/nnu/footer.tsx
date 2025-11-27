import * as React from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { ExternalLink, HelpCircle, Info, Mail, Github } from "lucide-react";

export interface FooterProps extends React.HTMLAttributes<HTMLElement> {}

export const Footer = React.forwardRef<HTMLElement, FooterProps>(
  ({ className, ...props }, ref) => {
    const currentYear = new Date().getFullYear();

    return (
      <footer
        ref={ref}
        className={cn(
          "hero-gradient noise-texture text-white py-12 relative overflow-hidden",
          className
        )}
        {...props}
      >
        {/* 背景装饰 */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-nnu-jade/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-[80px]" />
        <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-nnu-gold/10 rounded-full -translate-x-1/2 translate-y-1/2 blur-[60px]" />

        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Logo */}
          <div className="flex justify-center mb-5">
            <div className="p-2 bg-white/10 rounded-full backdrop-blur-sm">
              <Logo
                size="md"
                showText={false}
                className="text-white [&>div]:bg-white [&>div]:text-nnu-green"
              />
            </div>
          </div>

          {/* Motto - 使用衬线体 */}
          <p className="font-motto text-nnu-gold tracking-[0.2em] text-base mb-6">
            正德厚生 · 笃学敏行
          </p>

          {/* Links */}
          <div className="flex gap-8 justify-center text-sm mb-6 flex-wrap">
            <a
              href="https://www.njnu.edu.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 hover:text-nnu-gold transition-all duration-200 py-2 px-3 min-h-[44px] touch-manipulation rounded-lg hover:bg-white/10"
            >
              <ExternalLink className="w-4 h-4" />
              学校官网
            </a>
            <a
              href="#"
              className="flex items-center gap-2 hover:text-nnu-gold transition-all duration-200 py-2 px-3 min-h-[44px] touch-manipulation rounded-lg hover:bg-white/10"
            >
              <Info className="w-4 h-4" />
              关于我们
            </a>
            <a
              href="#"
              className="flex items-center gap-2 hover:text-nnu-gold transition-all duration-200 py-2 px-3 min-h-[44px] touch-manipulation rounded-lg hover:bg-white/10"
            >
              <HelpCircle className="w-4 h-4" />
              帮助中心
            </a>
          </div>

          {/* Social Links */}
          <div className="flex gap-4 justify-center mb-6">
            <a
              href="mailto:1516924835@qq.com"
              className="footer-social-link group"
              aria-label="发送邮件"
            >
              <Mail className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </a>
            <a
              href="https://github.com/handsomeZR-netizen/nnu-smartwrite"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-social-link group"
              aria-label="访问 GitHub 仓库"
            >
              <Github className="w-5 h-5 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            </a>
          </div>

          {/* Divider */}
          <div className="w-24 h-px bg-white/20 mx-auto mb-6" />

          {/* Copyright */}
          <p className="text-xs text-white/50 mb-2">
            &copy; {currentYear} 南京师范大学 SmartWrite 项目团队
          </p>
          <p className="text-xs text-white/40">
            版权所有 · 保留所有权利
          </p>
        </div>
      </footer>
    );
  }
);

Footer.displayName = "Footer";
