import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;
  const { pathname } = request.nextUrl;

  console.log('[Middleware] Path:', pathname, 'Token:', token ? 'exists' : 'missing');

  // 公开路径
  const publicPaths = ['/login', '/api/auth/login'];
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // 如果是公开路径，直接放行
  if (isPublicPath) {
    return NextResponse.next();
  }

  // 检查 Token
  if (!token) {
    console.log('[Middleware] No token, redirecting to login');
    // 使用 /login，Next.js 会自动加上 basePath
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const payload = await verifyToken(token);
  console.log('[Middleware] Token verification result:', payload ? 'valid' : 'invalid');
  
  if (!payload) {
    // Token 无效，清除并重定向到登录页
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('auth-token');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/accounts/:path*',
    '/api/composio/:path*',
    '/api/oauth/:path*',
    '/api/publish/:path*',
    '/api/settings/:path*',
    '/api/auth/logout',
    '/api/auth/me',
  ],
};
