import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes and their required roles
const organizerRoutes = ['/organizer']
const adminRoutes = ['/admin', '/company']
const contestantRoutes = ['/contestant']
const sharedProtectedRoutes = ['/profile', '/settings']
const publicOnlyRoutes = ['/login', '/auth']
const publicContestantRoutes = ['/contestant/verify', '/contestant/register']

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl

    // Skip middleware for static files and API routes
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') // Static files
    ) {
        return NextResponse.next()
    }

    // Get token from cookies
    const token = request.cookies.get('token')?.value
    const userDataCookie = request.cookies.get('userData')?.value
    let userRole: string | undefined

    if (userDataCookie) {
        try {
            const userData = JSON.parse(userDataCookie)
            userRole = userData.role?.toLowerCase()
        } catch {
            // Invalid JSON, ignore
        }
    }

    // Check route types
    const isOrganizerRoute = organizerRoutes.some((route) => pathname.startsWith(route))
    const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
    const isContestantRoute = contestantRoutes.some((route) => pathname.startsWith(route))
    const isSharedRoute = sharedProtectedRoutes.some((route) => pathname.startsWith(route))
    const isPublicOnlyRoute = publicOnlyRoutes.some((route) => pathname.startsWith(route))
    const isPublicContestantRoute = publicContestantRoutes.some((route) => pathname.startsWith(route))
    const isSetPasswordRoute = pathname === '/auth/set-password'

    // Management routes (Shared between Organizer and Admin)
    const managementRoutes = ['/assessments', '/question-bank']
    const isManagementRoute = managementRoutes.some((route) => pathname.startsWith(route))

    // Redirect authenticated users away from login/register, EXCEPT for set-password
    if (token && isPublicOnlyRoute && !isSetPasswordRoute) {
        const redirectParam = request.nextUrl.searchParams.get('redirect')
        if (redirectParam) {
            return NextResponse.redirect(new URL(redirectParam, request.url))
        }
        let dashboardUrl = '/contestant'
        if (userRole === 'organizer') dashboardUrl = '/organizer'
        else if (userRole === 'admin' || userRole === 'company') dashboardUrl = '/admin/dashboard'

        return NextResponse.redirect(new URL(dashboardUrl, request.url))
    }

    // Check protected routes - require authentication
    // Exclude public contestant routes (verify, register) from protection
    const isProtectedRoute = (isOrganizerRoute || isAdminRoute || isContestantRoute || isSharedRoute || isManagementRoute) && !isPublicContestantRoute

    if (!token && isProtectedRoute) {
        // Skip magic-login and other auth subroutes from force redirect if they are handled separately, 
        // but here we allow them if they are in publicOnlyRoutes
        if (isPublicOnlyRoute) return NextResponse.next()

        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
    }

    // Role-based access control
    if (token && isOrganizerRoute && userRole !== 'organizer') {
        const target = (userRole === 'admin' || userRole === 'company') ? '/admin/dashboard' : '/contestant'
        return NextResponse.redirect(new URL(target, request.url))
    }

    if (token && isAdminRoute && userRole !== 'admin' && userRole !== 'company') {
        const target = userRole === 'organizer' ? '/organizer' : '/contestant'
        return NextResponse.redirect(new URL(target, request.url))
    }

    if (token && isContestantRoute && (userRole === 'organizer' || userRole === 'admin' || userRole === 'company')) {
        const target = userRole === 'organizer' ? '/organizer' : '/admin/dashboard' // Update to dash
        return NextResponse.redirect(new URL(target, request.url))
    }

    // Protect management routes from contestants
    if (token && isManagementRoute && userRole !== 'organizer' && userRole !== 'admin' && userRole !== 'company') {
        return NextResponse.redirect(new URL('/contestant', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)',
    ],
}
