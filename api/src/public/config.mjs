import { intEnv, requiredEnv } from '../lib/env.mjs';

const DEFAULT_ORIGINS = [
    'https://isidoraverisugc.com',
    'https://www.isidoraverisugc.com',
];

export function loadConfig(env = process.env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);

    return {
        port: intEnv(env, 'PORT', 3000),
        trustProxy: intEnv(env, 'TRUST_PROXY', 1),
        allowedOrigins,
        turnstileSecret: requiredEnv(env, 'TURNSTILE_SECRET_KEY'),
        resendApiKey: requiredEnv(env, 'RESEND_API_KEY'),
        emailFrom: env.EMAIL_FROM || 'Isidora Veris <info@isidoraverisugc.com>',
        notificationEmail: env.NOTIFICATION_EMAIL || 'info@isidoraverisugc.com',
    };
}
