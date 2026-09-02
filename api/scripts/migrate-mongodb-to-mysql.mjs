import 'dotenv/config';
import { MongoClient } from 'mongodb';
import { runMigrations } from '../src/db/migrations.mjs';
import { createPool } from '../src/db/pool.mjs';
import { normalizeLegacySubscriber } from '../src/migration/legacy-subscriber.mjs';

const mode = process.argv.includes('--apply') ? 'apply'
    : process.argv.includes('--dry-run') ? 'dry-run'
        : null;

if (!mode || (process.argv.includes('--apply') && process.argv.includes('--dry-run'))) {
    console.error('Usage: npm run migrate:mongodb -- --dry-run|--apply');
    process.exit(2);
}

const uri = process.env.LEGACY_MONGODB_URI?.trim();
if (!uri) {
    console.error('LEGACY_MONGODB_URI is required.');
    process.exit(2);
}

const mongo = new MongoClient(uri, { appName: 'isidora-veris-migration' });
let pool;
const summary = {
    mode,
    scanned: 0,
    valid: 0,
    inserted: 0,
    skipped: 0,
    rejected: 0,
    rejectedReasons: {},
    byService: {},
};
const seen = new Set();
const buffers = new Map();
const batchSize = 250;

function serviceStats(service) {
    if (!summary.byService[service]) {
        summary.byService[service] = { valid: 0, inserted: 0, skipped: 0 };
    }
    return summary.byService[service];
}

async function flush(service) {
    const records = buffers.get(service) || [];
    if (records.length === 0 || mode === 'dry-run') return;

    const placeholders = records.map(() => '(?, ?, ?, ?)').join(', ');
    const values = records.flatMap(({ email, service: itemService, createdAt, updatedAt }) =>
        [email, itemService, createdAt, updatedAt]);
    const [result] = await pool.query(
        `INSERT IGNORE INTO subscribers (email, service, created_at, updated_at) VALUES ${placeholders}`,
        values,
    );
    const inserted = result.affectedRows;
    const skipped = records.length - inserted;
    summary.inserted += inserted;
    summary.skipped += skipped;
    serviceStats(service).inserted += inserted;
    serviceStats(service).skipped += skipped;
    buffers.set(service, []);
}

try {
    await mongo.connect();
    if (mode === 'apply') {
        pool = createPool();
        await runMigrations(pool);
    }

    const cursor = mongo.db().collection('subscribers')
        .find({}, { projection: { email: 1, service: 1, createdAt: 1, updatedAt: 1 } })
        .sort({ _id: 1 })
        .batchSize(batchSize);

    for await (const document of cursor) {
        summary.scanned += 1;
        const normalized = normalizeLegacySubscriber(document);
        if (!normalized.valid) {
            summary.rejected += 1;
            summary.rejectedReasons[normalized.reason] =
                (summary.rejectedReasons[normalized.reason] || 0) + 1;
            continue;
        }

        const record = normalized.value;
        const stats = serviceStats(record.service);
        const key = `${record.email}\u0000${record.service}`;
        if (seen.has(key)) {
            summary.skipped += 1;
            stats.skipped += 1;
            continue;
        }
        seen.add(key);
        summary.valid += 1;
        stats.valid += 1;

        if (mode === 'dry-run') continue;
        const buffer = buffers.get(record.service) || [];
        buffer.push(record);
        buffers.set(record.service, buffer);
        if (buffer.length >= batchSize) await flush(record.service);
    }

    if (mode === 'dry-run') {
        summary.inserted = summary.valid;
        for (const stats of Object.values(summary.byService)) stats.inserted = stats.valid;
    } else {
        for (const service of buffers.keys()) await flush(service);
    }

    console.log(JSON.stringify(summary, null, 2));
    if (summary.rejected > 0) process.exitCode = 1;
} finally {
    await mongo.close();
    if (pool) await pool.end();
}
