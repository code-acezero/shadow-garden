import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
          })
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Check Auth Session
  const { data: { user } } = await supabase.auth.getUser()

  // DEFINITION OF PATHS
  const isAuthPage = request.nextUrl.pathname === '/'; // The Landing Page
  // const isDashboardPage = request.nextUrl.pathname.startsWith('/home');

  // 1. If User is Logged In -> Kick them off the Landing Page (Send to Home)
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/home', request.url));
  }

  // 2. Optional: Protect Dashboard
  /* if (request.nextUrl.pathname.startsWith('/home') && !user) {
    return NextResponse.redirect(new URL('/', request.url))
  } */

  return response
}

export const config = {
  matcher: ['/', '/home/:path*'],
};