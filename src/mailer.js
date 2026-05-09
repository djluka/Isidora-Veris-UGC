import { Resend } from 'resend';
import { Subscriber } from './models/Subscriber.js';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function posaljiNotifikaciju(noviKlijent) {
    const sviKlijenti = await Subscriber.find().sort({ createdAt: -1 });

    const redovi = sviKlijenti.map(k => `
        <tr>
            <td style="padding:8px;border:1px solid #ddd;">${k.email}</td>
            <td style="padding:8px;border:1px solid #ddd;">${k.service}</td>
            <td style="padding:8px;border:1px solid #ddd;">${new Date(k.createdAt).toLocaleDateString('sr-RS')}</td>
        </tr>
    `).join('');

    try {
        const result = await resend.emails.send({
            from: 'noreply@isidoraverisugc.com',
            to: 'info@isidoraverisugc.com',
            subject: `🔔 Novi klijent: ${noviKlijent.email}`,
            html: `
                <h2 style="color:#333;">Novi klijent se prijavio!</h2>
                <p><b>Email:</b> ${noviKlijent.email}</p>
                <p><b>Usluga:</b> ${noviKlijent.service}</p>
                <p><b>Datum:</b> ${new Date(noviKlijent.createdAt).toLocaleDateString('sr-RS')}</p>
                <hr/>
                <h3>Svi klijenti (ukupno: ${sviKlijenti.length})</h3>
                <table style="border-collapse:collapse;width:100%;font-family:sans-serif;">
                    <tr style="background:#f5f5f5;">
                        <th style="padding:8px;border:1px solid #ddd;">Email</th>
                        <th style="padding:8px;border:1px solid #ddd;">Usluga</th>
                        <th style="padding:8px;border:1px solid #ddd;">Datum</th>
                    </tr>
                    ${redovi}
                </table>
            `
        });

        console.log('✅ Mejl uspešno poslat:', result);
    } catch (error) {
        console.error('❌ Greška pri slanju mejla:', error);
    }
}