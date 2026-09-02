const REPLACEMENTS = {
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
};

export const escapeHtml = (value) =>
    String(value ?? '').replace(/[<>&"']/g, (character) => REPLACEMENTS[character]);
