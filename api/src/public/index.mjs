import 'dotenv/config';
import { runMigrations } from '../db/migrations.mjs';
import { createPool } from '../db/pool.mjs';
import { startServer } from '../http/serve.mjs';
import { SubscriberRepository } from '../repositories/subscribers.mjs';
import { createEmailService } from '../services/email.mjs';
import { createSubscriptionService } from '../services/subscriptions.mjs';
import { createTurnstileVerifier } from '../services/turnstile.mjs';
import { createApp } from './app.mjs';
import { loadConfig } from './config.mjs';

const config = loadConfig();
const pool = createPool();

await runMigrations(pool);

const repository = new SubscriberRepository(pool);
const emailService = createEmailService({
    apiKey: config.resendApiKey,
    from: config.emailFrom,
    notificationEmail: config.notificationEmail,
});
const subscriptionService = createSubscriptionService({ repository, emailService });

const app = createApp({
    repository,
    subscriptionService,
    verifyTurnstile: createTurnstileVerifier(config.turnstileSecret),
    allowedOrigins: config.allowedOrigins,
    trustProxy: config.trustProxy,
});

startServer({ app, port: config.port, pool, label: 'API' });
