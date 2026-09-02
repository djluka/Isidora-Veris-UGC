import { intEnv, requiredEnv } from '../lib/env.mjs';

export function loadAdminConfig(env = process.env) {
    return {
        port: intEnv(env, 'PORT', 3000),
        trustProxy: intEnv(env, 'TRUST_PROXY', 1),
        adminUsername: requiredEnv(env, 'ADMIN_USERNAME'),
        adminPassword: requiredEnv(env, 'ADMIN_PASSWORD'),
    };
}
