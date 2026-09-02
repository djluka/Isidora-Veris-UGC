import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resend } from 'resend';
import { SERVICES } from '../domain/services.mjs';
import { escapeHtml } from '../lib/escape-html.mjs';

const templatesDirectory = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../../templates',
);

const templateCache = new Map();

async function loadTemplate(folder) {
    if (!templateCache.has(folder)) {
        const filename = path.join(templatesDirectory, folder, 'email.html');
        templateCache.set(folder, await fs.readFile(filename, 'utf8'));
    }
    return templateCache.get(folder);
}

/**
 * Sends mail and nothing else -- it owns no database access. Callers pass in
 * whatever figures the message needs.
 */
export function createEmailService({ apiKey, from, notificationEmail }) {
    const resend = new Resend(apiKey);

    return {
        async sendConfirmation(email, service) {
            const details = SERVICES[service];
            if (!details) throw new Error(`Unknown service: ${service}`);

            await resend.emails.send({
                from,
                to: email,
                subject: `Hvala na upitu — ${details.name}`,
                html: await loadTemplate(details.template),
            });
        },

        async sendOwnerNotification(subscriber, total) {
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
