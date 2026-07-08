import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { Subscriber } from '../models/Subscriber.js';

// Isti slugovi kao na frontu (data-service) i u server.js
const VALID_SERVICES = ['konsultacije', 'izrada-reklama', 'creative-partner'];

// Limit po IP + usluzi: 5 upita / 24h
export const ipServiceLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    keyGenerator: (req) => {
        const ipKey = ipKeyGenerator(req.ip); // korektno rukuje IPv4 i IPv6
        const service = req.body?.service;
        const validService = VALID_SERVICES.includes(service) ? service : 'unknown';
        return `${ipKey}:${validService}`;
    },
    message: { message: 'Dostigli ste limit za ovu uslugu, pokušajte za 24h.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Ukupni limit po IP: 15 upita / 24h (sve usluge zajedno)
export const ipTotalLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 15,
    keyGenerator: (req) => ipKeyGenerator(req.ip),
    message: { message: 'Dostigli ste ukupni limit, pokušajte za 24h.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// "Već prijavljen" nije rate-limit nego konflikt -> 409
export async function emailLimiter(req, res, next) {
    const email = req.body?.email?.toLowerCase().trim();
    const service = req.body?.service;

    if (!email || !service) return next();

    try {
        const exists = await Subscriber.exists({ email, service });
        if (exists) {
            return res.status(409).json({
                message: 'Ovaj email je već prijavljen za ovu uslugu.'
            });
        }
        next();
    } catch (err) {
        console.error('emailLimiter DB error:', err);
        next(); // fail-open: DB greška ne obara legitiman zahtev
    }
}