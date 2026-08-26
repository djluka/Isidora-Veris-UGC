import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const VALID_SERVICES = ['konsultacije', 'izrada-reklama', 'creative-partner'];

export function createAdminLimiter() {
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        windowMs: 15 * 60 * 1000,
        max: 10,
        keyGenerator: (request) => ipKeyGenerator(request.ip),
        skipSuccessfulRequests: true,
        message: 'Too many authentication attempts; try again later.',
    });
}

export function createLimiters() {
    const common = { standardHeaders: true, legacyHeaders: false };

    return {
        verificationLimiter: rateLimit({
            ...common,
            windowMs: 10 * 60 * 1000,
            max: 30,
            keyGenerator: (request) => ipKeyGenerator(request.ip),
            message: { message: 'Previše pokušaja, pokušajte ponovo kasnije.' },
        }),
        ipServiceLimiter: rateLimit({
            ...common,
            windowMs: 24 * 60 * 60 * 1000,
            max: 5,
            keyGenerator: (request) => {
                const service = VALID_SERVICES.includes(request.body?.service)
                    ? request.body.service
                    : 'unknown';
                return `${ipKeyGenerator(request.ip)}:${service}`;
            },
            message: { message: 'Dostigli ste limit za ovu uslugu, pokušajte za 24h.' },
        }),
        ipTotalLimiter: rateLimit({
            ...common,
            windowMs: 24 * 60 * 60 * 1000,
            max: 15,
            keyGenerator: (request) => ipKeyGenerator(request.ip),
            message: { message: 'Dostigli ste ukupni limit, pokušajte za 24h.' },
        }),
    };
}
