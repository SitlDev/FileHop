export const config = {
  matcher: ['/admin/:path*', '/api/auth/:path*'],
};

export async function middleware(request: Request) {
  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Allow auth API routes
    if (pathname.startsWith('/api/auth')) {
      return new Response(null, {
        headers: { 'x-middleware-next': '1' },
      });
    }

    const isLoginPage = pathname === '/admin/login' || pathname === '/admin/login.html';
    
    // Parse cookies manually since we're not using NextRequest
    const cookieHeader = request.headers.get('cookie') || '';
    const cookies = Object.fromEntries(cookieHeader.split('; ').map(c => c.split('=')));
    const sessionToken = cookies['yc_session'];
    
    let authenticated = false;

    if (sessionToken && sessionToken.includes('.')) {
      try {
        const [payloadB64, signature] = sessionToken.split('.');
        if (payloadB64 && signature) {
          // Handle URL-safe base64
          const normalizedPayload = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
          const payloadStr = atob(normalizedPayload);
          const payload = JSON.parse(payloadStr);

          if (payload.exp > Date.now()) {
            const AUTH_SECRET = 'your-fallback-secret-change-me'; // Note: process.env.AUTH_SECRET should be used if available
            const encoder = new TextEncoder();
            const key = await crypto.subtle.importKey(
              'raw',
              encoder.encode(AUTH_SECRET),
              { name: 'HMAC', hash: 'SHA-256' },
              false,
              ['verify']
            );
            
            const normalizedSignature = signature.replace(/-/g, '+').replace(/_/g, '/');
            const sigBinary = atob(normalizedSignature);
            const sigBuffer = new Uint8Array(sigBinary.length);
            for (let i = 0; i < sigBinary.length; i++) {
              sigBuffer[i] = sigBinary.charCodeAt(i);
            }
            
            authenticated = await crypto.subtle.verify('HMAC', key, sigBuffer, encoder.encode(payloadStr));
          }
        }
      } catch (e) {
        console.error('Middleware Auth Detail Error:', e);
      }
    }

    if (!authenticated && !isLoginPage) {
      const loginUrl = new URL('/admin/login.html', request.url);
      loginUrl.searchParams.set('redirectTo', pathname);
      return Response.redirect(loginUrl, 307);
    }

    if (authenticated && isLoginPage) {
      const dashUrl = new URL('/admin/dashboard.html', request.url);
      return Response.redirect(dashUrl, 307);
    }

    // Standard way to "continue" in Vercel Middleware without Next.js
    return new Response(null, {
      headers: { 'x-middleware-next': '1' },
    });
  } catch (fatalError) {
    console.error('Fatal Middleware Error:', fatalError);
    return new Response(null, {
      headers: { 'x-middleware-next': '1' },
    });
  }
}
