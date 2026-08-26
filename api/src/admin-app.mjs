import express from 'express';
import { createAdminHandler, requireBasicAuth } from './admin.mjs';
import { createAdminLimiter } from './middlewares/limiters.mjs';

export function createAdminApp({
    repository,
    adminUsername,
    adminPassword,
    trustProxy = 1,
}) {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
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

    app.get('/health/live', (_request, response) => response.json({ status: 'ok' }));
    app.get('/health/ready', async (_request, response) => {
        try {
            await repository.healthCheck();
            response.json({ status: 'ok' });
        } catch {
            response.status(503).json({ status: 'unavailable' });
        }
    });
    app.get(
        '/',
        createAdminLimiter(),
        requireBasicAuth(adminUsername, adminPassword),
        createAdminHandler(repository),
    );
    app.use((_request, response) => response.status(404).json({ message: 'Not found' }));
    app.use((error, _request, response, _next) => {
        console.error('Unhandled admin request error:', error);
        response.status(500).json({ message: 'Internal server error' });
    });

    return app;
}
