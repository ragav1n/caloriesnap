import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20;
const ipMap = new Map<string, { count: number; expires: number }>();

export async function proxy(request: NextRequest) {
    const ip = (request as any).ip || request.headers.get('x-forwarded-for') || '127.0.0.1';

    // Simple in-memory rate limiting
    const now = Date.now();
    const record = ipMap.get(ip);

    if (record) {
        if (now > record.expires) {
            ipMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
        } else {
            if (record.count >= MAX_REQUESTS) {
                return new NextResponse('Too Many Requests', { status: 429 });
            }
            record.count++;
        }
    } else {
        ipMap.set(ip, { count: 1, expires: now + RATE_LIMIT_WINDOW });
    }

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
                        response.cookies.set(name, value, options)
                    })
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const safePathnames = ['/login', '/register', '/auth/callback']
    const isSafePath = safePathnames.some(path => request.nextUrl.pathname.startsWith(path))

    // If user is NOT logged in and trying to access a protected route (dashboard)
    // Redirect to login
    if (!user && !isSafePath && request.nextUrl.pathname !== '/') {
        // Actually dashboard is '/' so we need to protect '/'
        // But maybe we want a landing page? 
        // Current app has Dashboard at '/'
        // So if !user and path is '/', redirect to login
    }

    if (!user && request.nextUrl.pathname === '/') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user IS logged in and is on login/register, redirect to dashboard
    if (user && isSafePath) {
        return NextResponse.redirect(new URL('/', request.url))
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * Feel free to modify this pattern to include more paths.
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
