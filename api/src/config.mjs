const DEFAULT_ORIGINS = [
    'https://isidoraverisugc.com',
    'https://www.isidoraverisugc.com',
];

function required(env, name) {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function loadConfig(env = process.env) {
    const allowedOrigins = (env.ALLOWED_ORIGINS || DEFAULT_ORIGINS.join(','))
        .split(',')
        .map((origin) => origin.trim().replace(/\/$/, ''))
        .filter(Boolean);

    return {
        port: Number.parseInt(env.PORT || '3000', 10),
        trustProxy: Number.parseInt(env.TRUST_PROXY || '1', 10),
        allowedOrigins,
        turnstileSecret: required(env, 'TURNSTILE_SECRET_KEY'),
        resendApiKey: required(env, 'RESEND_API_KEY'),
        emailFrom: env.EMAIL_FROM || 'Isidora Veris <info@isidoraverisugc.com>',
        notificationEmail: env.NOTIFICATION_EMAIL || 'info@isidoraverisugc.com',
    };
}
