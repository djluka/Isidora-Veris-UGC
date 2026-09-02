const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Matches the VARCHAR(320) column width in the subscribers table. */
export const MAX_EMAIL_LENGTH = 320;

export function normalizeEmail(value) {
    return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

export function isValidEmail(email) {
    return Boolean(email) && email.length <= MAX_EMAIL_LENGTH && EMAIL_PATTERN.test(email);
}
