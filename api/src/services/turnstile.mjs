const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export function createTurnstileVerifier(secret) {
    return async function verifyTurnstile(token, ip) {
        const response = await fetch(VERIFY_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ secret, response: token, remoteip: ip }),
            signal: AbortSignal.timeout(8_000),
        });

        if (!response.ok) throw new Error(`Turnstile returned HTTP ${response.status}`);
        const result = await response.json();
        return result.success === true;
    };
}
