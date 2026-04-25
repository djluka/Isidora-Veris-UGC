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

app.set('trust proxy', 1);
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const VALID_SERVICES = ['konsultacije', 'kontent-strategija', 'ugc'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/subscribe', ipTotalLimiter, ipServiceLimiter, emailLimiter, async (req, res) => {
    const { email, service, turnstileToken } = req.body;

    if (!email || typeof email !== 'string' || !emailRegex.test(email.trim())) {
        return res.status(400).json({ message: 'Invalid email address' });
    }

    if (!service || !VALID_SERVICES.includes(service)) {
        return res.status(400).json({
            message: `Invalid service. Must be one of: ${VALID_SERVICES.join(', ')}`
        });
    }

    if (!turnstileToken) {
        return res.status(403).json({ message: 'Bot detekcija nije prošla. Pokušajte ponovo.' });
    }

    try {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                secret: process.env.TURNSTILE_SECRET_KEY,
                response: turnstileToken,
                remoteip: req.ip
            })
        });
        const verifyData = await verifyRes.json();

        if (!verifyData.success) {
            return res.status(403).json({ message: 'Bot detekcija nije prošla. Pokušajte ponovo.' });
        }
    } catch (err) {
        console.error('Turnstile verifikacija greška:', err);
        return res.status(500).json({ message: 'Greška pri verifikaciji, pokušajte ponovo.' });
    }

    try {
        const noviKlijent = await Subscriber.create({ email, service });
        await sendConfirmationEmail(email, service);
        await posaljiNotifikaciju(noviKlijent);
        res.status(200).json({ message: 'OK' });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ message: 'Već ste prijavljeni za ovu uslugu.' });
        }
        console.error('DB insert error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

async function connectDB() {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
}

connectDB()
    .then(() => app.listen(PORT, () => console.log(`Server is running on port ${PORT}`)))
    .catch(err => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });