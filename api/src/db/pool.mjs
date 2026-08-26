import mysql from 'mysql2/promise';

export function createPool(env = process.env) {
    if (!env.MYSQL_PASSWORD) {
        throw new Error('Missing required environment variable: MYSQL_PASSWORD');
    }
    return mysql.createPool({
        host: env.MYSQL_HOST || 'mysql',
        port: Number.parseInt(env.MYSQL_PORT || '3306', 10),
        user: env.MYSQL_USER || 'isidora',
        password: env.MYSQL_PASSWORD,
        database: env.MYSQL_DATABASE || 'isidora_veris',
        waitForConnections: true,
        connectionLimit: Number.parseInt(env.MYSQL_CONNECTION_LIMIT || '10', 10),
        queueLimit: 0,
        timezone: 'Z',
        charset: 'utf8mb4',
    });
}
