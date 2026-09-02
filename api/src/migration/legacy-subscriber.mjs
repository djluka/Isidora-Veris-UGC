import { isValidService } from '../domain/services.mjs';
import { isValidEmail, normalizeEmail } from '../domain/subscriber.mjs';

export function normalizeLegacySubscriber(document) {
    const email = normalizeEmail(document.email);
    const service = typeof document.service === 'string' ? document.service.trim() : '';
    const createdAt = new Date(document.createdAt ?? document._id?.getTimestamp?.() ?? Date.now());
    const updatedAt = new Date(document.updatedAt ?? createdAt);

    if (!isValidEmail(email)) {
        return { valid: false, reason: 'invalid_email' };
    }
    if (!isValidService(service)) {
        return { valid: false, reason: 'invalid_service' };
    }
    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
        return { valid: false, reason: 'invalid_timestamp' };
    }

    return { valid: true, value: { email, service, createdAt, updatedAt } };
}
