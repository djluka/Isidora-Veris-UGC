import 'dotenv/config';
import { createPool } from '../db/pool.mjs';
import { startServer } from '../http/serve.mjs';
import { SubscriberRepository } from '../repositories/subscribers.mjs';
import { createAdminApp } from './app.mjs';
import { loadAdminConfig } from './config.mjs';

const config = loadAdminConfig();
const pool = createPool();

const app = createAdminApp({
    repository: new SubscriberRepository(pool),
    adminUsername: config.adminUsername,
    adminSecret: config.adminPassword,
    trustProxy: config.trustProxy,
});

startServer({ app, port: config.port, pool, label: 'Admin' });
