// Uvozimo rateLimit funkciju iz express-rate-limit biblioteke
import rateLimit from 'express-rate-limit';
// Uvozimo Subscriber model da možemo da pristupimo MongoDB kolekciji
import { Subscriber } from '../models/Subscriber.js';

// Lista validnih servisa - koristimo je da ne pravimo ključeve sa random stringovima
const VALID_SERVICES = ['konsultacije', 'kontent-strategija', 'ugc'];

export const ipServiceLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // Vremenski prozor: 24h u milisekundama (24 * 60min * 60sec * 1000ms)
    max: 5, // Maksimalan broj zahteva u tom prozoru
    keyGenerator: (req) => {
        const ip = req.ip; // Uzimamo IP adresu korisnika iz requesta (radi jer smo stavili trust proxy u index.mjs)
        const service = req.body.service; // Uzimamo servis koji je korisnik poslao u body-u
        const validService = VALID_SERVICES.includes(service) ? service : 'unknown'; // Ako servis nije validan, koristimo 'unknown' da ne bi neko manipulisao ključevima
        return `${ip}:${validService}`; // Pravimo jedinstveni ključ npr. "192.168.1.1:ugc" - svaki IP ima odvojen brojač po servisu
    },
    message: { message: 'Dostigli ste limit za ovu uslugu, pokušajte za 24h.' }, // Poruka koja se vraća korisniku kada dostigne limit
    standardHeaders: true, // Dodaje RateLimit-* hedere u response (koliko ti je ostalo zahteva itd.)
    legacyHeaders: false, // Isključuje stare X-RateLimit-* hedere, koristimo samo moderne
});

export const ipTotalLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // Isti vremenski prozor od 24h
    max: 15, // Ukupno 15 zahteva po IP-u bez obzira na servis (3 servisa * 5 = 15)
    keyGenerator: (req) => req.ip, // Ključ je samo IP - nema servisa, ovo gleda ukupan broj
    message: { message: 'Dostigli ste ukupni limit, pokušajte za 24h.' },
    standardHeaders: true,
    legacyHeaders: false,
});

// async jer radimo DB upit koji čekamo
export async function emailLimiter(req, res, next) {
    const email = req.body.email?.toLowerCase().trim(); // Uzimamo email, pretvaramo u lowercase i uklanjamo razmake. ?. znači da neće puknuti ako je body prazan
    const service = req.body.service; // Uzimamo servis iz body-a

    if (!email || !service) return next(); // Ako nema emaila ili servisa, puštamo dalje - validacija se radi u index.mjs

    try {
        const exists = await Subscriber.exists({ email, service }); // Pitamo MongoDB da li postoji dokument sa tim email+service parom. Brže od findOne() jer vraća samo {_id} ili null
        if (exists) {
            return res.status(429).json({ // 429 = Too Many Requests, standardni HTTP status za rate limiting
                message: 'Ovaj email je već prijavljen za ovu uslugu.'
            });
        }
        next(); // Nema duplikata, puštamo zahtev dalje ka subscribe handleru
    } catch (err) {
        console.error('emailLimiter DB error:', err); // Logujemo grešku da vidimo u konzoli šta je pošlo po zlu
        next(); // Ako DB pukne, ne blokiramo korisnika - puštamo dalje, bolje nego da app prestane da radi
    }
}