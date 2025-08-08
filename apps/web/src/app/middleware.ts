import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server'

// --- Route Definitions ---
const protectedRoutes = [
  '/profile/edit',
  '/project/create', // Corrected path
   // Base dashboard
  // Specific dashboard sections - use :path* for broader matching if needed
  '/tasks',
  '/projects', // Matches /projects and /projects/
  '/projects/:projectId', // Matches project detail
  '/projects/:projectId/workspace', // Matches workspace base
  '/projects/:projectId/workspace/:subpath*', // Matches workspace subpaths (chat, kanban, etc.)
  '/notifications',
  '/connections',
  '/settings',
  '/chat', // Matches /chat and /chat/
  '/chat/:chatId', // Matches specific chat IDs
  // Add other protected routes as needed
  '/onboarding', // Example: If onboarding is protected after first login
]

const authRoutes = ['/login', '/register'] // Routes for logged-out users

// --- Helper Functions ---

// Checks if a pathname matches any protected route pattern
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => {
    const routeSegments = route.split('/').filter(Boolean);
    const pathSegments = pathname.split('/').filter(Boolean);


    if (routeSegments.length > pathSegments.length && !route.endsWith('*')) {
      // Route is longer than path, cannot match unless wildcard at end
      return false;
    }

    for (let i = 0; i < routeSegments.length; i++) {
      const routeSegment = routeSegments[i];
      const pathSegment = pathSegments[i];

      if (routeSegment.startsWith(':')) {
        // Parameterized segment (e.g., :projectId)
        if (routeSegment.endsWith('*')) {
           // Wildcard parameter (e.g., :subpath*), matches rest of path
           return true;
        }
        // Simple parameter, matches any single segment value
        continue;
      } else if (routeSegment !== pathSegment) {
        // Static segments don't match
        return false;
      }
    }
    
    // If we reached here, all defined route segments match
    // Check if route is exactly matched or if it's a base path match (e.g.,  matches /settings)
    return pathSegments.length >= routeSegments.length || route === pathname; 
  });
}


// --- Middleware Logic ---
export async function middleware(request: NextRequest) {
    const cookieStore = await cookies()
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
   {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )

  // Refresh session if expired - IMPORTANT!
  const { data: { user } } = await supabase.auth.getUser()

  const path = request.nextUrl.pathname

  // Auth route handling
  const isAuthRoute = authRoutes.some(route => path.startsWith(route));
  if (user && isAuthRoute) {
     // Redirect logged-in users away from auth pages
    return NextResponse.redirect(new URL('/profile/edit', request.url)) // Redirect to dashboard or '/'
  } 

  // Check if user is onboarded
  if (user) {
    const isOnboarded = user.user_metadata?.isOnboarded === true;
    
    if (!isOnboarded && path !== '/onboarding') {
      // If not onboarded and trying to access any page other than onboarding, redirect to onboarding
      return NextResponse.redirect(new URL('/onboarding', request.url))
    } else if (isOnboarded && path === '/onboarding') {
      // If onboarded and trying to access onboarding page, redirect to dashboard
      return NextResponse.redirect(new URL('/profile/edit', request.url))
    }
  }

  // Protected route handling
  if (!user && isProtectedRoute(path)) {
    // Redirect unauthenticated users trying to access protected routes
    return NextResponse.redirect(new URL('/login', request.url))
  }

  

  // Onboarding check (example - uncomment and implement if needed)
  /*
  if (user && path !== '/onboarding' && !path.startsWith('/api')) { // Avoid checking for API routes
    const isOnboarded = await checkUserOnboardingStatus(user.id);
    if (!isOnboarded) {
      return NextResponse.redirect(new URL('/onboarding', request.url));
    }
  }
  */

  // All checks passed, continue with the response
  return response
}

// --- Config ---
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes) - Exclude API routes from middleware session handling if not needed
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}