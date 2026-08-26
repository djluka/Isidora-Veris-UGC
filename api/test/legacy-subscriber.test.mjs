import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLegacySubscriber } from '../src/migration/legacy-subscriber.mjs';

test('normalizes a valid Mongo subscriber while preserving timestamps', () => {
    const createdAt = new Date('2024-01-02T03:04:05.000Z');
    const updatedAt = new Date('2024-02-03T04:05:06.000Z');
    const result = normalizeLegacySubscriber({
        email: ' USER@Example.COM ', service: 'konsultacije', createdAt, updatedAt,
    });
    assert.equal(result.valid, true);
    assert.equal(result.value.email, 'user@example.com');
    assert.equal(result.value.createdAt.getTime(), createdAt.getTime());
    assert.equal(result.value.updatedAt.getTime(), updatedAt.getTime());
});

test('rejects invalid emails, services, and timestamps', () => {
    assert.equal(normalizeLegacySubscriber({
        email: 'bad', service: 'konsultacije', createdAt: new Date(),
    }).reason, 'invalid_email');
    assert.equal(normalizeLegacySubscriber({
        email: 'a@example.com', service: 'other', createdAt: new Date(),
    }).reason, 'invalid_service');
    assert.equal(normalizeLegacySubscriber({
        email: 'a@example.com', service: 'konsultacije', createdAt: 'not-a-date',
    }).reason, 'invalid_timestamp');
});
