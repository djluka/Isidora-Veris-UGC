import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';

const templatesDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../templates',
);

const SERVICE_DETAILS = {
    konsultacije: { name: 'Konsultacije', template: 'konsultacije-cenovnik' },
    'izrada-reklama': { name: 'Izrada Reklama', template: 'izrada-videa-cenovnik' },
    'creative-partner': { name: 'Creative Partner', template: 'creative-partner-cenovnik' },
};

const templateCache = new Map();
const escapeHtml = (value) => String(value ?? '').replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[character]));

async function loadTemplate(folder) {
    if (!templateCache.has(folder)) {
        const filename = path.join(templatesDirectory, folder, 'email.html');
        templateCache.set(folder, await fs.readFile(filename, 'utf8'));
    }
    return templateCache.get(folder);
}

export function createEmailService({ apiKey, from, notificationEmail, repository }) {
    const resend = new Resend(apiKey);

    return {
        async sendConfirmation(email, service) {
            const details = SERVICE_DETAILS[service];
            if (!details) throw new Error(`Unknown service: ${service}`);

            await resend.emails.send({
                from,
                to: email,
                subject: `Hvala na upitu — ${details.name}`,
                html: await loadTemplate(details.template),
            });
        },

        async sendOwnerNotification(subscriber) {
            const total = await repository.count();
            await resend.emails.send({
                from,
                to: notificationEmail,
                subject: `🔔 Novi klijent: ${subscriber.email}`,
                html: `
                    <h2 style="color:#333">Novi klijent se prijavio!</h2>
                    <p><b>Email:</b> ${escapeHtml(subscriber.email)}</p>
                    <p><b>Usluga:</b> ${escapeHtml(subscriber.service)}</p>
                    <p><b>Datum:</b> ${new Date(subscriber.createdAt).toLocaleDateString('sr-RS')}</p>
                    <hr>
                    <p style="color:#777">Ukupno prijavljenih: <b>${total}</b></p>
                `,
            });
        },
    };
}
