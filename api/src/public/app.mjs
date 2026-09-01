import express from 'express';
import { isValidService, VALID_SERVICES } from '../domain/services.mjs';
import { isValidEmail, normalizeEmail } from '../domain/subscriber.mjs';
import { errorHandler, notFound } from '../http/errors.mjs';
import { createHealthRouter } from '../http/health.mjs';
import { API_CSP, securityHeaders } from '../http/security-headers.mjs';
import { createLimiters } from '../middlewares/limiters.mjs';

const BOT_MESSAGE = 'Bot detekcija nije prošla. Pokušajte ponovo.';

/** Single-use CORS gate: only the configured website origins may call /api/*. */
function createCors(allowedOrigins) {
    const allowed = new Set(allowedOrigins);

    return (request, response, next) => {
        const origin = request.get('origin')?.replace(/\/$/, '');
        if (origin && allowed.has(origin)) {
            response.set('Access-Control-Allow-Origin', origin);
            response.set('Vary', 'Origin');
            response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.set('Access-Control-Allow-Headers', 'Content-Type');
        }
        if (origin && !allowed.has(origin) && request.path.startsWith('/api/')) {
            return response.status(403).json({ message: 'Origin nije dozvoljen.' });
        }
        if (request.method === 'OPTIONS') return response.sendStatus(204);
        next();
    };
}

function validateRequest(request, response, next) {
    const email = normalizeEmail(request.body?.email);
    const { service, turnstileToken } = request.body ?? {};

    if (!isValidEmail(email)) {
        return response.status(400).json({ message: 'Neispravna email adresa.' });
    }
    if (!isValidService(service)) {
        return response.status(400).json({
            message: `Neispravna usluga. Dozvoljene: ${VALID_SERVICES.join(', ')}`,
        });
    }
    if (typeof turnstileToken !== 'string' || !turnstileToken) {
        return response.status(403).json({ message: BOT_MESSAGE });
    }

    request.body.email = email;
    next();
}

function createVerifyRequest(verifyTurnstile) {
    return async (request, response, next) => {
        try {
            if (!await verifyTurnstile(request.body.turnstileToken, request.ip)) {
                return response.status(403).json({ message: BOT_MESSAGE });
            }
        } catch (error) {
            console.error('Turnstile verification error:', error);
            return response.status(503).json({
                message: 'Greška pri verifikaciji, pokušajte ponovo.',
            });
        }
        next();
    };
}

export function createApp({
    repository,
    subscriptionService,
    verifyTurnstile,
    allowedOrigins,
    trustProxy = 1,
}) {
    const app = express();
    const { verificationLimiter, ipServiceLimiter, ipTotalLimiter } = createLimiters();

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
    app.use(express.json({ limit: '10kb' }));
    app.use(securityHeaders(API_CSP));
    app.use(createCors(allowedOrigins));
    app.use(createHealthRouter(repository));

    app.post(
        '/api/subscribe',
        validateRequest,
        verificationLimiter,
        createVerifyRequest(verifyTurnstile),
        ipTotalLimiter,
        ipServiceLimiter,
        async (request, response, next) => {
            const { email, service } = request.body;
            try {
                const result = await subscriptionService.subscribe({ email, service });
                if (result.status === 'duplicate') {
                    return response.status(409).json({
                        message: 'Već ste prijavljeni za ovu uslugu.',
                    });
                }
                response.status(200).json({ message: 'OK' });
            } catch (error) {
                next(error);
            }
        },
    );

    app.get('/', (_request, response) => response.json({
        service: 'isidora-veris-api',
        status: 'ok',
    }));

    app.use(notFound);
    app.use(errorHandler('Unhandled request error', 'Neispravan JSON.'));

    return app;
}
