const NEEDS_QUOTING = /[",\r\n]/;

/**
 * Spreadsheets treat a leading =, +, -, @, tab or CR as the start of a
 * formula. Prefixing with an apostrophe keeps the value inert.
 */
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

/** Excel needs a BOM to read a UTF-8 file as UTF-8. */
export const CSV_BOM = '\uFEFF';

export function escapeCsvField(value) {
    let field = String(value ?? '');
    if (FORMULA_PREFIX.test(field)) field = `'${field}`;
    if (NEEDS_QUOTING.test(field)) field = `"${field.replace(/"/g, '""')}"`;
    return field;
}

export function toCsvRow(values) {
    return `${values.map(escapeCsvField).join(',')}\r\n`;
}
