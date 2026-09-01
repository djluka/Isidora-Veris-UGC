export function requiredEnv(env, name) {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function intEnv(env, name, fallback) {
    const parsed = Number.parseInt(env[name] ?? '', 10);
    return Number.isFinite(parsed) ? parsed : fallback;
}
