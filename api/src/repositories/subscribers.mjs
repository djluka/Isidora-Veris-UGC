import { isValidService } from '../domain/services.mjs';

export class DuplicateSubscriberError extends Error {
    constructor() {
        super('Subscriber already exists');
        this.name = 'DuplicateSubscriberError';
    }
}

const COLUMNS = 'id, email, service, created_at AS createdAt, updated_at AS updatedAt';
const ORDER = 'ORDER BY created_at DESC, id DESC';

/** Escapes the LIKE metacharacters so a search term is matched literally. */
const escapeLike = (value) => value.replace(/[\\%_]/g, (character) => `\\${character}`);

/**
 * Translates admin filters into a parameterized WHERE clause. Every consumer
 * (list, count, export) goes through here so the three can never disagree
 * about what a given filter means.
 */
function buildFilter(filters = {}) {
    const clauses = [];
    const params = [];

    if (isValidService(filters.service)) {
        clauses.push('service = ?');
        params.push(filters.service);
    }
    if (filters.email) {
        // A leading wildcard cannot use an index; acceptable at this table size.
        clauses.push('email LIKE ?');
        params.push(`%${escapeLike(filters.email)}%`);
    }
    if (filters.from) {
        clauses.push('created_at >= ?');
        params.push(filters.from);
    }
    if (filters.to) {
        // Exclusive upper bound one day later, so `to` itself is included in full.
        clauses.push('created_at < DATE_ADD(?, INTERVAL 1 DAY)');
        params.push(filters.to);
    }

    return { where: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '', params };
}

export class SubscriberRepository {
    constructor(pool) {
        this.pool = pool;
    }

    async healthCheck() {
        await this.pool.query('SELECT 1');
    }

    async create(email, service) {
        try {
            const [result] = await this.pool.execute(
                'INSERT INTO subscribers (email, service) VALUES (?, ?)',
                [email, service],
            );
            const [rows] = await this.pool.execute(
                `SELECT ${COLUMNS} FROM subscribers WHERE id = ?`,
                [result.insertId],
            );
            return rows[0];
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') throw new DuplicateSubscriberError();
            throw error;
        }
    }

    async count(filters) {
        const { where, params } = buildFilter(filters);
        const [[row]] = await this.pool.execute(
            `SELECT COUNT(*) AS total FROM subscribers ${where}`,
            params,
        );
        return Number(row.total);
    }

    async list({ filters, limit, offset }) {
        const { where, params } = buildFilter(filters);
        const [[countRow]] = await this.pool.execute(
            `SELECT COUNT(*) AS total FROM subscribers ${where}`,
            params,
        );
        const [rows] = await this.pool.execute(
            `SELECT ${COLUMNS} FROM subscribers ${where} ${ORDER} LIMIT ? OFFSET ?`,
            [...params, limit, offset],
        );
        return { rows, total: Number(countRow.total) };
    }

    async findByIds(ids) {
        if (ids.length === 0) return [];
        // Placeholder count comes from the array length; ids are always bound.
        const placeholders = ids.map(() => '?').join(', ');
        const [rows] = await this.pool.execute(
            `SELECT ${COLUMNS} FROM subscribers WHERE id IN (${placeholders}) ${ORDER}`,
            ids,
        );
        return rows;
    }

    async removeMany(ids) {
        if (ids.length === 0) return 0;
        const placeholders = ids.map(() => '?').join(', ');
        const [result] = await this.pool.execute(
            `DELETE FROM subscribers WHERE id IN (${placeholders})`,
            ids,
        );
        return result.affectedRows;
    }
}
