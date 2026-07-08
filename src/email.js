import { Resend } from 'resend';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resend = new Resend(process.env.RESEND_API_KEY);

// KLJUČEVI = slugovi iz baze (isti kao VALID_SERVICES), ne prikazna imena
const SERVICE_DETAILS = {
    'konsultacije':     { naziv: 'Konsultacije',     emailFolder: 'konsultacije-cenovnik' },
    'izrada-reklama':   { naziv: 'Izrada Reklama',   emailFolder: 'izrada-videa-cenovnik' },
    'creative-partner': { naziv: 'Creative Partner',  emailFolder: 'creative-partner-cenovnik' },
};

// Keš template-a: čitaju se sa diska jednom, ne na svaki zahtev
const templateCache = new Map();

async function loadTemplate(folder) {
    if (templateCache.has(folder)) return templateCache.get(folder);

    const htmlPath = path.join(__dirname, '..', 'public', 'emails', folder, 'email.html');
    const html = await fs.readFile(htmlPath, 'utf-8');

    templateCache.set(folder, html);
    return html;
}

export async function sendConfirmationEmail(email, service) {
    const serviceInfo = SERVICE_DETAILS[service];
    if (!serviceInfo) {
        console.error(`Nepoznata usluga: ${service}`);
        return;
    }

    const html = await loadTemplate(serviceInfo.emailFolder);

    await resend.emails.send({
        from: 'Isidora Veris <info@isidoraverisugc.com>',
        to: email,
        subject: `Hvala na upitu — ${serviceInfo.naziv}`,
        html,
    });
}