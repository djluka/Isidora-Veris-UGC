const migrations = [
    {
        version: '001_create_subscribers',
        sql: `
            CREATE TABLE IF NOT EXISTS subscribers (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
                email VARCHAR(320) NOT NULL,
                service ENUM('konsultacije', 'izrada-reklama', 'creative-partner') NOT NULL,
                created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
                PRIMARY KEY (id),
                UNIQUE KEY subscribers_email_service_unique (email, service),
                KEY subscribers_created_at_index (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `,
    },
];

export async function runMigrations(pool) {
    const connection = await pool.getConnection();
    let hasLock = false;

    try {
        const [[lock]] = await connection.query(
            "SELECT GET_LOCK('isidora_veris_schema_migrations', 30) AS acquired",
        );
        hasLock = lock.acquired === 1;
        if (!hasLock) throw new Error('Could not acquire the schema migration lock');

        await connection.query(`
            CREATE TABLE IF NOT EXISTS schema_migrations (
                version VARCHAR(191) NOT NULL,
                applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
                PRIMARY KEY (version)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        `);

        const [rows] = await connection.query('SELECT version FROM schema_migrations');
        const applied = new Set(rows.map(({ version }) => version));

        for (const migration of migrations) {
            if (applied.has(migration.version)) continue;

            await connection.beginTransaction();
            try {
                await connection.query(migration.sql);
                await connection.query(
                    'INSERT INTO schema_migrations (version) VALUES (?)',
                    [migration.version],
                );
                await connection.commit();
                console.log(`Applied database migration: ${migration.version}`);
            } catch (error) {
                await connection.rollback();
                throw error;
            }
        }
    } finally {
        if (hasLock) await connection.query("SELECT RELEASE_LOCK('isidora_veris_schema_migrations')");
        connection.release();
    }
}
