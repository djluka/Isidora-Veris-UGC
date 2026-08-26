import crypto from 'node:crypto';

const PAGE_SIZE = 50;

const escapeHtml = (value) => String(value ?? '').replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;',
}[character]));

function safeEqual(actual, expected) {
    const actualHash = crypto.createHash('sha256').update(actual).digest();
    const expectedHash = crypto.createHash('sha256').update(expected).digest();
    return crypto.timingSafeEqual(actualHash, expectedHash);
}

export function requireBasicAuth(username, password) {
    return (request, response, next) => {
        const [scheme, encoded] = (request.get('authorization') || '').split(' ');
        let suppliedUsername = '';
        let suppliedPassword = '';

        if (scheme === 'Basic' && encoded) {
            const decoded = Buffer.from(encoded, 'base64').toString('utf8');
            const separator = decoded.indexOf(':');
            if (separator >= 0) {
                suppliedUsername = decoded.slice(0, separator);
                suppliedPassword = decoded.slice(separator + 1);
            }
        }

        const usernameMatches = safeEqual(suppliedUsername, username);
        const passwordMatches = safeEqual(suppliedPassword, password);
        if (!usernameMatches || !passwordMatches) {
            response.set('WWW-Authenticate', 'Basic realm="Isidora Veris Admin", charset="UTF-8"');
            return response.status(401).send('Authentication required');
        }
        next();
    };
}

export function createAdminHandler(repository) {
    return async (request, response, next) => {
        try {
            const requestedPage = Number.parseInt(request.query.page || '1', 10);
            const page = Number.isFinite(requestedPage) && requestedPage > 0
                ? Math.min(requestedPage, 1_000_000)
                : 1;
            const { rows, total } = await repository.list({
                limit: PAGE_SIZE,
                offset: (page - 1) * PAGE_SIZE,
            });
            const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
            const bodyRows = rows.map((subscriber) => `
                <tr>
                    <td>${escapeHtml(subscriber.email)}</td>
                    <td>${escapeHtml(subscriber.service)}</td>
                    <td>${escapeHtml(new Date(subscriber.createdAt).toLocaleString('sr-RS'))}</td>
                </tr>`).join('');
            const previous = page > 1 ? `<a href="/?page=${page - 1}">← Prethodna</a>` : '<span></span>';
            const nextPage = page < pages ? `<a href="/?page=${page + 1}">Sledeća →</a>` : '<span></span>';

            response.set({
                'Cache-Control': 'no-store',
                'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'",
            });
            response.type('html').send(`<!doctype html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Prijavljeni korisnici</title>
    <style>
        :root{font-family:system-ui,sans-serif;color:#2d241f;background:#f7f2ed}body{margin:0;padding:2rem}
        main{max-width:1100px;margin:auto}h1{margin-bottom:.25rem}.summary{color:#6d625b;margin-top:0}
        table{width:100%;border-collapse:collapse;background:#fff;box-shadow:0 2px 16px #392a2014}
        th,td{text-align:left;padding:.8rem;border-bottom:1px solid #e8dfd8}th{background:#3a2a18;color:#fff}
        tr:last-child td{border:0}.pagination{display:flex;justify-content:space-between;margin-top:1rem}
        a{color:#6c4630}@media(max-width:650px){body{padding:1rem}th,td{padding:.55rem;font-size:.85rem}}
    </style>
</head>
<body><main>
    <h1>Prijavljeni korisnici</h1>
    <p class="summary">Ukupno: ${total} · Strana ${page} od ${pages}</p>
    <table><thead><tr><th>Email</th><th>Usluga</th><th>Datum</th></tr></thead>
    <tbody>${bodyRows || '<tr><td colspan="3">Još nema prijava.</td></tr>'}</tbody></table>
    <nav class="pagination">${previous}${nextPage}</nav>
</main></body></html>`);
        } catch (error) {
            next(error);
        }
    };
}
