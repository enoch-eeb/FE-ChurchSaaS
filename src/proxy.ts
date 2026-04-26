import { NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'id'],
  defaultLocale: 'id',
  localePrefix: 'always'
});

export default function proxy(req: NextRequest) {
  const token = req.cookies.get('coma_token')?.value;
  const { pathname } = req.nextUrl;

  if (pathname.includes('/managements') && !token) {
    const locale = pathname.split('/')[1] || 'id';
    return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));
  }

  if (pathname.includes('/auth') && token) {
    const locale = pathname.split('/')[1] || 'id';
    return NextResponse.redirect(new URL(`/${locale}/managements/member-managements`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'
  ]
};