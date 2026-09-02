import express from 'express';

export function createHealthRouter(repository) {
    const router = express.Router();

    router.get('/health/live', (_request, response) => response.json({ status: 'ok' }));

    router.get('/health/ready', async (_request, response) => {
        try {
            await repository.healthCheck();
            response.json({ status: 'ok' });
        } catch {
            response.status(503).json({ status: 'unavailable' });
        }
    });

    return router;
}
