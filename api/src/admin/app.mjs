import express from 'express';
import { errorHandler, notFound } from '../http/errors.mjs';
import { createHealthRouter } from '../http/health.mjs';
import { ADMIN_CSP, securityHeaders } from '../http/security-headers.mjs';
import { createAdminLimiter } from '../middlewares/limiters.mjs';
import { requireBasicAuth, requireSameOrigin } from './auth.mjs';
import { createAdminRoutes } from './routes.mjs';

export function createAdminApp({
    repository,
    adminUsername,
    adminSecret,
    trustProxy = 1,
}) {
    const app = express();
    const routes = createAdminRoutes(repository);
    const authenticate = requireBasicAuth(adminUsername, adminSecret);

    // One shared limiter; it skips successful responses, so it only ever
    // counts failed authentication attempts.
    const limiter = createAdminLimiter();

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
    app.use(securityHeaders(ADMIN_CSP));
    app.use(express.urlencoded({ extended: false, limit: '10kb' }));
    app.use(createHealthRouter(repository));

    app.get('/', limiter, authenticate, routes.list);
    app.get('/export.csv', limiter, authenticate, routes.exportCsv);
    app.post('/subscribers/confirm-delete', limiter, authenticate, requireSameOrigin, routes.confirmDelete);
    app.post('/subscribers/delete', limiter, authenticate, requireSameOrigin, routes.remove);

    app.use(notFound);
    app.use(errorHandler('Unhandled admin request error', 'Neispravan zahtev.'));

    return app;
}
