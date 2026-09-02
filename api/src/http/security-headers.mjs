const BASE_HEADERS = {
    'Cache-Control': 'no-store',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Referrer-Policy': 'no-referrer',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
};

/** JSON-only runtime: nothing may be loaded, framed, or used as a base URI. */
export const API_CSP = "default-src 'none'; base-uri 'none'; frame-ancestors 'none'";

/** Server-rendered HTML with inline styles and same-origin delete forms. */
export const ADMIN_CSP = "default-src 'none'; style-src 'unsafe-inline'; "
    + "base-uri 'none'; frame-ancestors 'none'; form-action 'self'";

export function securityHeaders(contentSecurityPolicy) {
    const headers = { ...BASE_HEADERS, 'Content-Security-Policy': contentSecurityPolicy };
    return (_request, response, next) => {
        response.set(headers);
        next();
    };
}
