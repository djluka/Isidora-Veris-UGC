import 'dotenv/config';
import { createAdminApp } from './admin-app.mjs';
import { loadAdminConfig } from './admin-config.mjs';
import { createPool } from './db/pool.mjs';
import { SubscriberRepository } from './repositories/subscribers.mjs';

const config = loadAdminConfig();
const pool = createPool();
const repository = new SubscriberRepository(pool);
const app = createAdminApp({
    repository,
    adminUsername: config.adminUsername,
    adminPassword: config.adminPassword,
    trustProxy: config.trustProxy,
});

const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`Admin listening on port ${config.port}`);
});

async function shutdown(signal) {
    console.log(`Received ${signal}; shutting down`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
