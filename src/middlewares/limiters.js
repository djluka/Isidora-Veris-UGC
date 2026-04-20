import rateLimit from 'express-rate-limit';
import { Subscriber } from '../models/Subscriber.js';

const VALID_SERVICES = ['konsultacije', 'kontent-strategija', 'ugc'];

// Helper koji normalizuje IPv6 adrese da korisnici ne mogu da zaobiđu limit
function ipKeyGenerator(req) {
    const ip = req.ip || '';
    // Konvertuje IPv6-mapped IPv4 adrese (::ffff:1.2.3.4) u normalan IPv4 format
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

export const ipServiceLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
        const ip = ipKeyGenerator(req);
        const service = req.body.service;
        const validService = VALID_SERVICES.includes(service) ? service : 'unknown';
        return `${ip}:${validService}`;
    },
    message: { message: 'Dostigli ste limit za ovu uslugu, pokušajte za 24h.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export const ipTotalLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => ipKeyGenerator(req),
    message: { message: 'Dostigli ste ukupni limit, pokušajte za 24h.' },
    standardHeaders: true,
    legacyHeaders: false,
});

export async function emailLimiter(req, res, next) {
    const email = req.body.email?.toLowerCase().trim();
    const service = req.body.service;

    if (!email || !service) return next();

    try {
        const exists = await Subscriber.exists({ email, service });
        if (exists) {
            return res.status(429).json({
                message: 'Ovaj email je već prijavljen za ovu uslugu.'
            });
        }
        next();
    } catch (err) {
        console.error('emailLimiter DB error:', err);
        next();
    }
}