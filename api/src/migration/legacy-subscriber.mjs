import { VALID_SERVICES } from '../middlewares/limiters.mjs';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeLegacySubscriber(document) {
    const email = typeof document.email === 'string' ? document.email.trim().toLowerCase() : '';
    const service = typeof document.service === 'string' ? document.service.trim() : '';
    const createdAt = new Date(document.createdAt ?? document._id?.getTimestamp?.() ?? Date.now());
    const updatedAt = new Date(document.updatedAt ?? createdAt);

    if (!email || email.length > 320 || !emailPattern.test(email)) {
        return { valid: false, reason: 'invalid_email' };
    }
    if (!VALID_SERVICES.includes(service)) {
        return { valid: false, reason: 'invalid_service' };
    }
    if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
        return { valid: false, reason: 'invalid_timestamp' };
    }

    return { valid: true, value: { email, service, createdAt, updatedAt } };
}
