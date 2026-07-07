import { Resend } from 'resend';
import { Subscriber } from './models/Subscriber.js';

const resend = new Resend(process.env.RESEND_API_KEY);

// Escape da email/usluga korisnika ne mogu da ubace HTML u tvoj inbox
const esc = (s) => String(s ?? '').replace(/[<>&"']/g, (c) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]
));

export async function posaljiNotifikaciju(noviKlijent) {
    // Šaljemo samo novog klijenta + ukupan broj, ne celu bazu na svaku prijavu
    const total = await Subscriber.estimatedDocumentCount();
    const datum = new Date(noviKlijent.createdAt).toLocaleDateString('sr-RS');

    try {
        const result = await resend.emails.send({
            from: 'noreply@isidoraverisugc.com',
            to: 'info@isidoraverisugc.com',
            subject: `🔔 Novi klijent: ${esc(noviKlijent.email)}`,
            html: `
                <h2 style="color:#333;">Novi klijent se prijavio!</h2>
                <p><b>Email:</b> ${esc(noviKlijent.email)}</p>
                <p><b>Usluga:</b> ${esc(noviKlijent.service)}</p>
                <p><b>Datum:</b> ${datum}</p>
                <hr/>
                <p style="color:#777;">Ukupno prijavljenih do sada: <b>${total}</b></p>
            `,
        });
        console.log('✅ Notifikacija poslata:', result?.data?.id ?? result);
    } catch (error) {
        console.error('❌ Greška pri slanju notifikacije:', error);
    }
}