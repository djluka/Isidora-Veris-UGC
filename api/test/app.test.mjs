import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createApp } from '../src/app.mjs';

const servers = [];
afterEach(async () => {
    await Promise.all(servers.splice(0).map((server) =>
        new Promise((resolve) => server.close(resolve))));
});

class FakeRepository {
    constructor(rows = []) { this.rows = rows; }
    async healthCheck() {}
    async exists(email, service) {
        return this.rows.some((row) => row.email === email && row.service === service);
    }
    async create(email, service) {
        const row = { id: this.rows.length + 1, email, service,
            createdAt: new Date('2026-01-01T12:00:00Z'),
            updatedAt: new Date('2026-01-01T12:00:00Z') };
        this.rows.push(row);
        return row;
    }
    async count() { return this.rows.length; }
    async list({ limit, offset }) {
        return { rows: this.rows.slice(offset, offset + limit), total: this.rows.length };
    }
}

async function startApp(overrides = {}) {
    const repository = overrides.repository || new FakeRepository();
    const app = createApp({
        repository,
        verifyTurnstile: overrides.verifyTurnstile || (async () => true),
        emailService: {
            sendConfirmation: async () => {},
            sendOwnerNotification: async () => {},
        },
        allowedOrigins: ['https://www.isidoraverisugc.com'],
        adminHost: overrides.adminHost || 'admin.isidoraverisugc.com',
        adminUsername: 'admin',
        adminPassword: 'secret',
        trustProxy: 0,
    });
    const server = app.listen(0, '127.0.0.1');
    servers.push(server);
    await new Promise((resolve) => server.once('listening', resolve));
    return { repository, url: `http://127.0.0.1:${server.address().port}` };
}

test('stores a normalized valid subscription', async () => {
    const { repository, url } = await startApp();
    const response = await fetch(`${url}/api/subscribe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://www.isidoraverisugc.com' },
        body: JSON.stringify({ email: ' Person@Example.com ', service: 'konsultacije', turnstileToken: 'valid' }),
    });
    assert.equal(response.status, 200);
    assert.equal(repository.rows[0].email, 'person@example.com');
    assert.equal(response.headers.get('access-control-allow-origin'), 'https://www.isidoraverisugc.com');
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.match(response.headers.get('content-security-policy'), /default-src 'none'/);
});

test('rejects invalid input and failed Turnstile verification', async () => {
    const { url } = await startApp({ verifyTurnstile: async () => false });
    const invalidEmail = await fetch(`${url}/api/subscribe`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'bad', service: 'konsultacije', turnstileToken: 'x' }),
    });
    assert.equal(invalidEmail.status, 400);
    const bot = await fetch(`${url}/api/subscribe`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'person@example.com', service: 'konsultacije', turnstileToken: 'x' }),
    });
    assert.equal(bot.status, 403);
});

test('rejects duplicate subscriptions and disallowed origins', async () => {
    const existing = { id: 1, email: 'person@example.com', service: 'konsultacije', createdAt: new Date() };
    const { url } = await startApp({ repository: new FakeRepository([existing]) });
    const duplicate = await fetch(`${url}/api/subscribe`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: existing.email, service: existing.service, turnstileToken: 'x' }),
    });
    assert.equal(duplicate.status, 409);
    const forbidden = await fetch(`${url}/api/subscribe`, {
        method: 'POST', headers: { 'content-type': 'application/json', origin: 'https://example.net' },
        body: JSON.stringify({ email: 'new@example.com', service: 'konsultacije', turnstileToken: 'x' }),
    });
    assert.equal(forbidden.status, 403);
});

test('admin root is host-gated and protected with Basic Auth', async () => {
    const row = { id: 1, email: 'person@example.com', service: 'creative-partner',
        createdAt: new Date('2026-01-01T12:00:00Z') };
    const { url } = await startApp({ repository: new FakeRepository([row]), adminHost: '127.0.0.1' });
    const unauthorized = await fetch(`${url}/`);
    assert.equal(unauthorized.status, 401);
    assert.match(unauthorized.headers.get('www-authenticate'), /^Basic/);
    const authorized = await fetch(`${url}/`, {
        headers: { authorization: `Basic ${Buffer.from('admin:secret').toString('base64')}` },
    });
    assert.equal(authorized.status, 200);
    assert.match(await authorized.text(), /person@example\.com/);
});

test('readiness reports repository availability', async () => {
    const { url } = await startApp();
    assert.equal((await fetch(`${url}/health/live`)).status, 200);
    assert.equal((await fetch(`${url}/health/ready`)).status, 200);
});
