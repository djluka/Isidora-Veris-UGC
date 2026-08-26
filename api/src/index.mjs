import 'dotenv/config';
import { createApp } from './app.mjs';
import { loadConfig } from './config.mjs';
import { runMigrations } from './db/migrations.mjs';
import { createPool } from './db/pool.mjs';
import { SubscriberRepository } from './repositories/subscribers.mjs';
import { createEmailService } from './services/email.mjs';
import { createTurnstileVerifier } from './services/turnstile.mjs';

const config = loadConfig();
const pool = createPool();

await runMigrations(pool);
const repository = new SubscriberRepository(pool);
const emailService = createEmailService({
    apiKey: config.resendApiKey,
    from: config.emailFrom,
    notificationEmail: config.notificationEmail,
    repository,
});
const app = createApp({
    repository,
    emailService,
    verifyTurnstile: createTurnstileVerifier(config.turnstileSecret),
    allowedOrigins: config.allowedOrigins,
    adminHost: config.adminHost,
    adminUsername: config.adminUsername,
    adminPassword: config.adminPassword,
    trustProxy: config.trustProxy,
});

const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`API listening on port ${config.port}`);
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
