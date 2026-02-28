import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const SERVICE_DETAILS = {
    'ugc': {
        naziv: 'UGC Kreiranje Sadržaja',
        opis: 'Kreiramo autentičan korisnički sadržaj koji povećava poverenje i prodaju.'
    },
    'kontent-strategija': {
        naziv: 'Kontent Strategija',
        opis: 'Razvijamo strategiju sadržaja prilagođenu vašem brendu i ciljevima.'
    },
    'konsultacije': {
        naziv: 'Konsultacije',
        opis: 'Individualne konsultacije za unapređenje vašeg digitalnog prisustva.'
    }
};

export async function sendConfirmationEmail(email, service) {
    const serviceInfo = SERVICE_DETAILS[service];

    await resend.emails.send({
        from: 'Isidora Veris <onboarding@resend.dev>',
        to: email,
        subject: `Hvala na upitu — ${serviceInfo.naziv}`,
        html: `
            <h2>Zdravo!</h2>
            <p>Hvala što ste poslali upit za <strong>${serviceInfo.naziv}</strong>.</p>
            <p>${serviceInfo.opis}</p>
            <p>Javićemo vam se u najkraćem mogućem roku.</p>
            <br/>
            <p>Srdačno,</p>
            <p><strong>Isidora Veris</strong></p>
        `
    });
}