import { SERVICES } from '../domain/services.mjs';
import { escapeHtml } from '../lib/escape-html.mjs';
import { buildQuery } from './filters.mjs';

const STYLES = `
:root{font-family:system-ui,sans-serif;color:#2d241f;background:#f7f2ed}body{margin:0;padding:2rem}
main{max-width:1100px;margin:auto}h1{margin-bottom:.25rem}.summary{color:#6d625b;margin-top:0}
table{width:100%;border-collapse:collapse;background:#fff;box-shadow:0 2px 16px #392a2014}
th,td{text-align:left;padding:.8rem;border-bottom:1px solid #e8dfd8}th{background:#3a2a18;color:#fff}
tr:last-child td{border:0}.pagination{display:flex;justify-content:space-between;margin-top:1rem}
a{color:#6c4630}
.filters{display:flex;flex-wrap:wrap;gap:.75rem;align-items:flex-end;margin:1rem 0}
.filters label{display:flex;flex-direction:column;font-size:.8rem;color:#6d625b;gap:.25rem}
.filters input,.filters select{font:inherit;padding:.45rem;border:1px solid #d9cec5;border-radius:.35rem;background:#fff}
.actions{display:flex;gap:.75rem;align-items:center}
button{font:inherit;padding:.5rem 1rem;border:0;border-radius:.35rem;background:#3a2a18;color:#fff;cursor:pointer}
button.danger{background:#8c2f1d}button:disabled{opacity:.5;cursor:default}
.toolbar{display:flex;justify-content:space-between;align-items:center;gap:1rem;margin:1rem 0 .5rem}
.flash{background:#e6efe4;border:1px solid #b9d2b2;padding:.6rem .8rem;border-radius:.35rem;margin:1rem 0}
.warn{background:#fbeceb;border:1px solid #e5bdb7;padding:.75rem 1rem;border-radius:.35rem;margin:1rem 0}
.select-col{width:2.5rem}
@media(max-width:650px){body{padding:1rem}th,td{padding:.55rem;font-size:.85rem}}
`;

const formatDate = (value) => new Date(value).toLocaleString('sr-RS');

function layout(title, body) {
    return `<!doctype html>
<html lang="sr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title>
    <style>${STYLES}</style>
</head>
<body><main>${body}</main></body></html>`;
}

const attribute = (value) => escapeHtml(value ?? '');

/** Filter state has to survive a POST round trip, so it rides along as hidden fields. */
function hiddenState(filters, page) {
    return Object.entries({ ...filters, page })
        .filter(([, value]) => value !== '' && value !== undefined && value !== null)
        .map(([name, value]) =>
            `<input type="hidden" name="${attribute(name)}" value="${attribute(value)}">`)
        .join('');
}

function serviceOptions(selected) {
    const options = Object.entries(SERVICES).map(([slug, { name }]) =>
        `<option value="${attribute(slug)}"${slug === selected ? ' selected' : ''}>${escapeHtml(name)}</option>`);
    return `<option value="">Sve usluge</option>${options.join('')}`;
}

function filterForm(filters) {
    return `<form class="filters" method="get" action="/">
        <label>Usluga<select name="service">${serviceOptions(filters.service)}</select></label>
        <label>Email sadrži<input type="search" name="email" value="${attribute(filters.email)}" placeholder="deo adrese"></label>
        <label>Od<input type="date" name="from" value="${attribute(filters.from)}"></label>
        <label>Do<input type="date" name="to" value="${attribute(filters.to)}"></label>
        <div class="actions"><button type="submit">Filtriraj</button><a href="/">Poništi</a></div>
    </form>`;
}

const subscriberCells = (subscriber) => `
        <td>${escapeHtml(subscriber.email)}</td>
        <td>${escapeHtml(SERVICES[subscriber.service]?.name ?? subscriber.service)}</td>
        <td>${escapeHtml(formatDate(subscriber.createdAt))}</td>`;

/** List row: the id travels as a checkbox the operator ticks. */
const selectableRow = (subscriber) => `<tr>
        <td class="select-col"><input type="checkbox" name="id" value="${attribute(subscriber.id)}" aria-label="Izaberi ${attribute(subscriber.email)}"></td>
        ${subscriberCells(subscriber)}
    </tr>`;

const confirmRow = (subscriber) => `<tr>${subscriberCells(subscriber)}</tr>`;

/**
 * The chosen ids ride as hidden inputs placed before the table -- a hidden
 * input is not valid inside <tr>, and browsers would hoist it out anyway.
 */
const idInput = (subscriber) =>
    `<input type="hidden" name="id" value="${attribute(subscriber.id)}">`;

export function renderList({ rows, total, page, pages, filters, deleted }) {
    const listQuery = (targetPage) => escapeHtml(buildQuery(filters, { page: targetPage }));
    const previous = page > 1
        ? `<a href="/${listQuery(page - 1)}">← Prethodna</a>`
        : '<span></span>';
    const next = page < pages
        ? `<a href="/${listQuery(page + 1)}">Sledeća →</a>`
        : '<span></span>';

    const body = rows.map(selectableRow).join('');
    const flash = deleted > 0
        ? `<p class="flash">Obrisano zapisa: ${escapeHtml(deleted)}.</p>`
        : '';

    return layout('Prijavljeni korisnici', `
    <h1>Prijavljeni korisnici</h1>
    <p class="summary">Ukupno: ${escapeHtml(total)} · Strana ${escapeHtml(page)} od ${escapeHtml(pages)}</p>
    ${flash}
    ${filterForm(filters)}
    <div class="toolbar">
        <a href="/export.csv${escapeHtml(buildQuery(filters))}">⬇ Preuzmi CSV</a>
    </div>
    <form method="post" action="/subscribers/confirm-delete">
        ${hiddenState(filters, page)}
        <table>
            <thead><tr><th class="select-col"></th><th>Email</th><th>Usluga</th><th>Datum</th></tr></thead>
            <tbody>${body || '<tr><td colspan="4">Nema rezultata za izabrane filtere.</td></tr>'}</tbody>
        </table>
        <div class="toolbar">
            <button type="submit" class="danger"${rows.length ? '' : ' disabled'}>Obriši izabrane</button>
        </div>
    </form>
    <nav class="pagination">${previous}${next}</nav>`);
}

export function renderConfirmDelete({ rows, filters, page }) {
    const body = rows.map(confirmRow).join('');
    const backLink = `/${escapeHtml(buildQuery(filters, { page }))}`;

    return layout('Potvrda brisanja', `
    <h1>Potvrda brisanja</h1>
    <p class="warn">
        Brisanje je trajno i ne može se poništiti kroz ovaj panel.
        Jedini način oporavka je noćna rezervna kopija baze.
    </p>
    <p class="summary">Biće obrisano zapisa: ${escapeHtml(rows.length)}.</p>
    <form method="post" action="/subscribers/delete">
        ${hiddenState(filters, page)}
        ${rows.map(idInput).join('')}
        <table>
            <thead><tr><th>Email</th><th>Usluga</th><th>Datum</th></tr></thead>
            <tbody>${body}</tbody>
        </table>
        <div class="toolbar">
            <button type="submit" class="danger">Trajno obriši</button>
            <a href="${backLink}">Odustani</a>
        </div>
    </form>`);
}

export function renderMessage(title, message, filters, page) {
    return layout(title, `
    <h1>${escapeHtml(title)}</h1>
    <p class="warn">${escapeHtml(message)}</p>
    <p><a href="/${escapeHtml(buildQuery(filters, { page }))}">← Nazad na listu</a></p>`);
}
