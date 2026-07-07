import express from 'express';
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { Subscriber } from './models/Subscriber.js';
import { sendConfirmationEmail } from './email.js';
import { ipServiceLimiter, ipTotalLimiter, emailLimiter } from './middlewares/limiters.js';
import fetch from 'node-fetch';
import { posaljiNotifikaciju } from './mailer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Render stavlja tačno jedan load balancer ispred aplikacije -> 1.
// NE menjaj u `true` (spoofabilno + express-rate-limit diže upozorenje).
app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const VALID_SERVICES = ['konsultacije', 'izrada-reklama', 'creative-partner'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function verifyTurnstile(token, ip) {
    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: process.env.TURNSTILE_SECRET_KEY,
            response: token,
            remoteip: ip,
        }),
    });
    const data = await verifyRes.json();
    return data.success === true;
}

// 1) Validacija + Turnstile PRE rate-limitera i DB upita
async function validateAndVerify(req, res, next) {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const { service, turnstileToken } = req.body ?? {};

    if (!email || !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Neispravna email adresa.' });
    }
    if (!service || !VALID_SERVICES.includes(service)) {
        return res.status(400).json({
            message: `Neispravna usluga. Dozvoljene: ${VALID_SERVICES.join(', ')}`,
        });
    }
    if (!turnstileToken) {
        return res.status(403).json({ message: 'Bot detekcija nije prošla. Pokušajte ponovo.' });
    }

    try {
        const ok = await verifyTurnstile(turnstileToken, req.ip);
        if (!ok) {
            return res.status(403).json({ message: 'Bot detekcija nije prošla. Pokušajte ponovo.' });
        }
    } catch (err) {
        console.error('Turnstile verifikacija greška:', err);
        return res.status(500).json({ message: 'Greška pri verifikaciji, pokušajte ponovo.' });
    }

    // normalizovan email vraćamo u body da ga limiteri i handler koriste
    req.body.email = email;
    next();
}

// 2) Rate-limiteri i "već prijavljen" tek posle uspešne Turnstile provere
app.post(
    '/api/subscribe',
    validateAndVerify,
    ipTotalLimiter,
    ipServiceLimiter,
    emailLimiter,
    async (req, res) => {
        const { email, service } = req.body;

        try {
            const noviKlijent = await Subscriber.create({ email, service });

            // Odgovori odmah — slanje mejlova ne sme da obori upis ako Resend zezne
            res.status(200).json({ message: 'OK' });

            sendConfirmationEmail(email, service).catch((e) =>
                console.error('sendConfirmationEmail greška:', e));
            posaljiNotifikaciju(noviKlijent).catch((e) =>
                console.error('posaljiNotifikaciju greška:', e));
        } catch (err) {
            if (err.code === 11000) {
                return res.status(409).json({ message: 'Već ste prijavljeni za ovu uslugu.' });
            }
            console.error('DB insert error:', err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
);

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
}

connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)))
    .catch((err) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });