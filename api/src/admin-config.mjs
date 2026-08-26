function required(env, name) {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function loadAdminConfig(env = process.env) {
    return {
        port: Number.parseInt(env.PORT || '3000', 10),
        trustProxy: Number.parseInt(env.TRUST_PROXY || '1', 10),
        adminUsername: required(env, 'ADMIN_USERNAME'),
        adminPassword: required(env, 'ADMIN_PASSWORD'),
    };
}
