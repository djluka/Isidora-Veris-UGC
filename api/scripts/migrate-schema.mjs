import 'dotenv/config';
import { runMigrations } from '../src/db/migrations.mjs';
import { createPool } from '../src/db/pool.mjs';

const pool = createPool();
try {
    await runMigrations(pool);
    console.log('Database schema is up to date.');
} finally {
    await pool.end();
}
