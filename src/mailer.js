import { Resend } from 'resend';
import { Subscriber } from './models/Subscriber.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape da email/usluga korisnika ne mogu da ubace HTML u tvoj inbox
const esc = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]
));

function napraviRedTabele(klijent, istaknut) {
    const datum = new Date(klijent.createdAt).toLocaleDateString('sr-RS');
    const bg = istaknut ? 'background:#fff8e1;' : '';
    return `
        <tr style="${bg}">
            <td style="padding:8px;border:1px solid #ddd;">${esc(klijent.email)}</td>
            <td style="padding:8px;border:1px solid #ddd;">${esc(klijent.service)}</td>
            <td style="padding:8px;border:1px solid #ddd;">${datum}</td>
        </tr>`;
}

export async function posaljiNotifikaciju(noviKlijent) {
    // Povlačimo kompletnu bazu, najnoviji prvi
    const svi = await Subscriber.find().sort({ createdAt: -1 }).lean();

    const redovi = svi
        .map((k) => napraviRedTabele(k, String(k._id) === String(noviKlijent._id)))
        .join('');

    try {
        const result = await resend.emails.send({
            from: 'noreply@isidoraverisugc.com',
            to: 'info@isidoraverisugc.com',
            subject: `🔔 Novi klijent: ${esc(noviKlijent.email)}`,
            html: `
                <h2 style="color:#333;">Novi klijent se prijavio!</h2>
                <p><b>Email:</b> ${esc(noviKlijent.email)}</p>
                <p><b>Usluga:</b> ${esc(noviKlijent.service)}</p>
                <hr/>
                <p style="color:#777;">Ukupno prijavljenih do sada: <b>${svi.length}</b></p>
                <table style="border-collapse:collapse;width:100%;font-family:sans-serif;font-size:14px;">
                    <thead>
                        <tr style="background:#333;color:#fff;">
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Email</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Usluga</th>
                            <th style="padding:8px;border:1px solid #ddd;text-align:left;">Datum</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${redovi}
                    </tbody>
                </table>
            `,
        });
        console.log('✅ Notifikacija poslata:', result?.data?.id ?? result);
    } catch (error) {
        console.error('❌ Greška pri slanju notifikacije:', error);
    }
}