import express from 'express';
import { createAdminHandler, requireBasicAuth } from './admin.mjs';
import { createLimiters, VALID_SERVICES } from './middlewares/limiters.mjs';
import { DuplicateSubscriberError } from './repositories/subscribers.mjs';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function createApp({
    repository,
    verifyTurnstile,
    emailService,
    allowedOrigins,
    adminHost,
    adminUsername,
    adminPassword,
    trustProxy = 1,
}) {
    const app = express();
    const allowedOriginSet = new Set(allowedOrigins);
    const { verificationLimiter, ipServiceLimiter, ipTotalLimiter, adminLimiter } = createLimiters();

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
    app.use(express.json({ limit: '10kb' }));

    app.use((_request, response, next) => {
        response.set({
            'Cache-Control': 'no-store',
            'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Referrer-Policy': 'no-referrer',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
        });
        next();
    });

    app.use((request, response, next) => {
        const origin = request.get('origin')?.replace(/\/$/, '');
        if (origin && allowedOriginSet.has(origin)) {
            response.set('Access-Control-Allow-Origin', origin);
            response.set('Vary', 'Origin');
            response.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
            response.set('Access-Control-Allow-Headers', 'Content-Type');
        }
        if (origin && !allowedOriginSet.has(origin) && request.path.startsWith('/api/')) {
            return response.status(403).json({ message: 'Origin nije dozvoljen.' });
        }
        if (request.method === 'OPTIONS') return response.sendStatus(204);
        next();
    });

    app.get('/health/live', (_request, response) => response.json({ status: 'ok' }));
    app.get('/health/ready', async (_request, response) => {
        try {
            await repository.healthCheck();
            response.json({ status: 'ok' });
        } catch {
            response.status(503).json({ status: 'unavailable' });
        }
    });

    function validateRequest(request, response, next) {
        const email = typeof request.body?.email === 'string'
            ? request.body.email.trim().toLowerCase()
            : '';
        const { service, turnstileToken } = request.body ?? {};

        if (!email || email.length > 320 || !emailPattern.test(email)) {
            return response.status(400).json({ message: 'Neispravna email adresa.' });
        }
        if (!VALID_SERVICES.includes(service)) {
            return response.status(400).json({
                message: `Neispravna usluga. Dozvoljene: ${VALID_SERVICES.join(', ')}`,
            });
        }
        if (typeof turnstileToken !== 'string' || !turnstileToken) {
            return response.status(403).json({
                message: 'Bot detekcija nije prošla. Pokušajte ponovo.',
            });
        }

        request.body.email = email;
        next();
    }

    async function verifyRequest(request, response, next) {
        try {
            const { turnstileToken } = request.body;
            if (!await verifyTurnstile(turnstileToken, request.ip)) {
                return response.status(403).json({
                    message: 'Bot detekcija nije prošla. Pokušajte ponovo.',
                });
            }
        } catch (error) {
            console.error('Turnstile verification error:', error);
            return response.status(503).json({
                message: 'Greška pri verifikaciji, pokušajte ponovo.',
            });
        }

        next();
    }

    app.post(
        '/api/subscribe',
        validateRequest,
        verificationLimiter,
        verifyRequest,
        ipTotalLimiter,
        ipServiceLimiter,
        async (request, response) => {
            const { email, service } = request.body;
            try {
                if (await repository.exists(email, service)) {
                    return response.status(409).json({
                        message: 'Ovaj email je već prijavljen za ovu uslugu.',
                    });
                }

                const subscriber = await repository.create(email, service);
                response.status(200).json({ message: 'OK' });

                emailService.sendConfirmation(email, service).catch((error) =>
                    console.error('Confirmation email error:', error));
                emailService.sendOwnerNotification(subscriber).catch((error) =>
                    console.error('Owner notification error:', error));
            } catch (error) {
                if (error instanceof DuplicateSubscriberError) {
                    return response.status(409).json({
                        message: 'Već ste prijavljeni za ovu uslugu.',
                    });
                }
                console.error('Subscription insert error:', error);
                response.status(500).json({ message: 'Internal server error' });
            }
        },
    );

    const admin = [
        (request, response, next) => {
            if (request.hostname.toLowerCase() !== adminHost.toLowerCase()) return next('route');
            next();
        },
        adminLimiter,
        requireBasicAuth(adminUsername, adminPassword),
        createAdminHandler(repository),
    ];
    app.get('/', ...admin);
    app.get('/', (_request, response) => response.json({
        service: 'isidora-veris-api',
        status: 'ok',
    }));

    app.use((_request, response) => response.status(404).json({ message: 'Not found' }));
    app.use((error, _request, response, _next) => {
        console.error('Unhandled request error:', error);
        if (error?.type === 'entity.parse.failed') {
            return response.status(400).json({ message: 'Neispravan JSON.' });
        }
        response.status(500).json({ message: 'Internal server error' });
    });

    return app;
}
