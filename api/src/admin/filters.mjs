import { isValidService } from '../domain/services.mjs';
import { MAX_EMAIL_LENGTH } from '../domain/subscriber.mjs';

export const PAGE_SIZE = 50;

const MAX_PAGE = 1_000_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const asDate = (value) =>
    (typeof value === 'string' && DATE_PATTERN.test(value) ? value : '');

/**
 * Normalizes untrusted query or form input into the filter shape the
 * repository understands. Anything unrecognized becomes an empty string,
 * which the repository treats as "no filter".
 */
export function parseFilters(input = {}) {
    return {
        service: isValidService(input.service) ? input.service : '',
        email: typeof input.email === 'string'
            ? input.email.trim().slice(0, MAX_EMAIL_LENGTH)
            : '',
        from: asDate(input.from),
        to: asDate(input.to),
    };
}

export function parsePage(value) {
    const parsed = Number.parseInt(value ?? '1', 10);
    return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, MAX_PAGE) : 1;
}

/** Builds the querystring that carries filter state across links and redirects. */
export function buildQuery(filters, overrides = {}) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries({ ...filters, ...overrides })) {
        if (value !== '' && value !== undefined && value !== null) {
            params.set(key, String(value));
        }
    }
    const query = params.toString();
    return query ? `?${query}` : '';
}

/**
 * Accepts the `id` field of a delete form -- a single string or an array --
 * and returns de-duplicated positive integers, capped so a forged request
 * cannot ask to delete an unbounded set.
 */
export function parseIds(value, max = PAGE_SIZE) {
    const ids = [];
    for (const item of [].concat(value ?? [])) {
        const id = Number.parseInt(item, 10);
        if (Number.isSafeInteger(id) && id > 0 && !ids.includes(id)) ids.push(id);
        if (ids.length >= max) break;
    }
    return ids;
}
