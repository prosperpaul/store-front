import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * Refreshes the seller's auth token so sessions don't expire mid-use, and
 * keeps /dashboard behind a login. Requests with no auth cookie at all --
 * every public storefront visit -- short-circuit before touching Supabase.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const path = request.nextUrl.pathname
  const hasAuthCookie = request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'))

  // Buyers are never logged in, so a storefront visit carries no auth cookie.
  // Skipping the token check keeps a Supabase round trip off the critical
  // path for the people on the slowest connections.
  if (!hasAuthCookie) {
    if (path.startsWith('/dashboard')) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
    return response
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: getUser() must be called for the token refresh to happen.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Not logged in and trying to reach the dashboard -> send to login.
  if (!user && path.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Already logged in and sitting on login/signup -> send to dashboard.
  if (user && (path === '/login' || path === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    // Everything except static files and images.
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
