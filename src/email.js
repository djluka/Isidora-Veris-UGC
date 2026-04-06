import { Resend } from 'resend';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_DETAILS = {
    'ugc': {
        naziv: 'Izrada videa',
        emailFolder: 'izrada_videa_cenovnik'
    },
    'kontent-strategija': {
        naziv: 'Kontent Strategija',
        emailFolder: 'kontent_strategija_cenovnik'
    },
    'konsultacije': {
        naziv: 'Konsultacije',
        emailFolder: 'konsultacije_cenovnik'
    }
};

export async function sendConfirmationEmail(email, service) {
    const serviceInfo = SERVICE_DETAILS[service];

    if (!serviceInfo) {
        console.error(`Nepoznata usluga: ${service}`);
        return;
    }

    const htmlPath = path.join(__dirname, '..', 'public', 'emails', serviceInfo.emailFolder, 'email.html');
    const html = fs.readFileSync(htmlPath, 'utf-8');

    await resend.emails.send({
        from: 'Isidora Veris <info@isidoraverisugc.com>',
        to: email,
        subject: `Hvala na upitu — ${serviceInfo.naziv}`,
        html
    });
}