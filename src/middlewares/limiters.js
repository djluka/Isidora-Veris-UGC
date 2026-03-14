import rateLimit from 'express-rate-limit';
import { Subscriber } from '../models/Subscriber.js';

const EMAIL_MAX_SUBMISSIONS = 5;

//  Rate limit po IP - max 5 zahteva na 24h
export const ipLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000,
    max: 5,
    message: { message: 'Dostigli ste limit, pokusajte kasnije.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// Rate limit po emailu - proverava MongoDB
export async function emailLimiter(req, res, next) {
    const email = req.body.email?.toLowerCase().trim();

    if (!email) return next();

    const count = await Subscriber.countDocuments({ email });

    if (count >= EMAIL_MAX_SUBMISSIONS) {
        return res.status(429).json({
            message: 'Ovaj email je već prijavljen .'
        });
    }

    next();
}