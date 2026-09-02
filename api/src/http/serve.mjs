/**
 * Starts an Express app and wires graceful shutdown: stop accepting
 * connections, drain the database pool, then exit. A hung close is capped
 * at 10s so the container orchestrator is never left waiting.
 */
export function startServer({ app, port, pool, label }) {
    const server = app.listen(port, '0.0.0.0', () => {
        console.log(`${label} listening on port ${port}`);
    });

    async function shutdown(signal) {
        console.log(`Received ${signal}; shutting down`);
        server.close(async () => {
            await pool.end();
            process.exit(0);
        });
        setTimeout(() => process.exit(1), 10_000).unref();
    }

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    return server;
}
