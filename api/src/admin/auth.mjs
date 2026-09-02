import crypto from 'node:crypto';

/**
 * Compares digests rather than raw values so the comparison is both
 * constant-time and independent of input length.
 */
function safeEqual(actual, expected) {
    const actualHash = crypto.createHash('sha256').update(actual).digest();
    const expectedHash = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(actualHash, expectedHash);
}

export function requireBasicAuth(username, secret) {
    return (request, response, next) => {
        const [scheme, encoded] = (request.get('authorization') || '').split(' ');
        let suppliedUsername = '';
        let suppliedSecret = '';

        if (scheme === 'Basic' && encoded) {
            const decoded = Buffer.from(encoded, 'base64').toString('utf8');
            const separator = decoded.indexOf(':');
            if (separator >= 0) {
                suppliedUsername = decoded.slice(0, separator);
                suppliedSecret = decoded.slice(separator + 1);
            }
        }

        // Both comparisons always run, so a wrong username costs the same as a wrong secret.
        const usernameMatches = safeEqual(suppliedUsername, username);
        const secretMatches = safeEqual(suppliedSecret, secret);
        if (!usernameMatches || !secretMatches) {
            response.set('WWW-Authenticate', 'Basic realm="Isidora Veris Admin", charset="UTF-8"');
            return response.status(401).send('Authentication required');
        }
        next();
    };
}

/**
 * Stateless CSRF defence for the mutating routes. Browsers resend Basic Auth
 * credentials automatically, so a cross-site form POST would otherwise be
 * honoured. Modern browsers always send Sec-Fetch-Site; anything that sends
 * neither that nor a matching Origin is rejected.
 */
export function requireSameOrigin(request, response, next) {
    const deny = () => response.status(403).send('Cross-site request blocked.');
    const site = request.get('sec-fetch-site');

    if (site) return site === 'same-origin' ? next() : deny();

    const origin = request.get('origin');
    if (!origin) return deny();

    try {
        return new URL(origin).host === request.get('host') ? next() : deny();
    } catch {
        return deny();
    }
}
