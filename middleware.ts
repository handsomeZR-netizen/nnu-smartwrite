import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware
 * 
 * 为所有响应添加安全HTTP头
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 安全HTTP头配置
  const securityHeaders = {
    // 防止点击劫持攻击
    'X-Frame-Options': 'DENY',
    
    // 防止MIME类型嗅探
    'X-Content-Type-Options': 'nosniff',
    
    // XSS保护（虽然现代浏览器默认启用）
    'X-XSS-Protection': '1; mode=block',
    
    // Referrer策略
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // 内容安全策略（CSP）
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js需要unsafe-eval和unsafe-inline
      "style-src 'self' 'unsafe-inline'", // Tailwind需要unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' https://api.deepseek.com",
      "frame-ancestors 'none'",
    ].join('; '),
    
    // 权限策略
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // 禁用FLoC
    ].join(', '),
  };

  // 应用所有安全头
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// 配置middleware应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了：
     * - _next/static (静态文件)
     * - _next/image (图片优化文件)
     * - favicon.ico (网站图标)
     * - public文件夹中的文件
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
