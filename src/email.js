import { Resend } from 'resend';
import fs from 'fs/promises'; // Menjamo 'fs' u 'fs/promises' da dobijemo async verziju
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

    // Jedina prava promena - readFileSync -> await fs.readFile
    let html = await fs.readFile(htmlPath, 'utf-8');

    const eurPricingBlock = `
<div style="margin-top:24px;padding:18px 20px;background:#f4ebdf;border-radius:12px;font-family:Georgia,'Times New Roman',serif;color:#57432a;font-size:15px;line-height:1.55;border:1px solid rgba(87,67,42,0.15);">
  <p style="margin:0 0 10px;font-weight:700;">Cene u evrima (sažetak)</p>
  <ul style="margin:0;padding-left:1.2em;">
    <li>Konsultacije — jednokratno: <strong>130 €</strong> · mesečno (2×): <strong>155 €</strong> / mes.</li>
    <li>UGC video: 1× <strong>190 €</strong> · 3× <strong>500 €</strong> · 5× <strong>750 €</strong></li>
    <li>Branding video: 1× <strong>150 €</strong> · 3× <strong>400 €</strong> · 5× <strong>600 €</strong></li>
    <li>Kontent strategija: 9 objava <strong>770 €</strong> · 12 objava <strong>900 €</strong></li>
  </ul>
  <p style="margin:14px 0 0;font-size:13px;color:#7b6b61;">Tačan obim, rokovi i način plaćanja potvrđujem u odgovoru na upit. Za RSD koristimo srednji kurs NBS.</p>
</div>`;

    if (html.includes('</body>')) {
        html = html.replace('</body>', `${eurPricingBlock}</body>`);
    } else {
        html += eurPricingBlock;
    }

    await resend.emails.send({
        from: 'Isidora Veris <info@isidoraverisugc.com>',
        to: email,
        subject: `Hvala na upitu — ${serviceInfo.naziv}`,
        html
    });
}