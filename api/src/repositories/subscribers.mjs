export class DuplicateSubscriberError extends Error {
    constructor() {
        super('Subscriber already exists');
        this.name = 'DuplicateSubscriberError';
    }
}

export class SubscriberRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async healthCheck() {
        await this.pool.query('SELECT 1');
    }

    async exists(email, service) {
        const [rows] = await this.pool.execute(
            'SELECT 1 FROM subscribers WHERE email = ? AND service = ? LIMIT 1',
            [email, service],
        );
        return rows.length > 0;
    }

    async create(email, service) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO subscribers (email, service) VALUES (?, ?)',
                [email, service],
            );
            const [rows] = await this.pool.execute(
                `SELECT id, email, service, created_at AS createdAt, updated_at AS updatedAt
                 FROM subscribers WHERE id = ?`,
                [result.insertId],
            );
            return rows[0];
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new DuplicateSubscriberError();
            throw error;
        }
    }

    async count() {
        const [[row]] = await this.pool.query('SELECT COUNT(*) AS total FROM subscribers');
        return Number(row.total);
    }

    async list({ limit, offset }) {
        const [[countRow]] = await this.pool.query('SELECT COUNT(*) AS total FROM subscribers');
        const [rows] = await this.pool.execute(
            `SELECT id, email, service, created_at AS createdAt, updated_at AS updatedAt
             FROM subscribers
             ORDER BY created_at DESC, id DESC
             LIMIT ? OFFSET ?`,
            [limit, offset],
        );
        return { rows, total: Number(countRow.total) };
    }
}
