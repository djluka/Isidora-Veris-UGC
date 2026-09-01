import { CSV_BOM, toCsvRow } from './csv.mjs';
import { PAGE_SIZE, buildQuery, parseFilters, parseIds, parsePage } from './filters.mjs';
import { renderConfirmDelete, renderList, renderMessage } from './views.mjs';

const EXPORT_CHUNK = 500;
const CSV_HEADER = ['id', 'email', 'service', 'created_at', 'updated_at'];

const iso = (value) => new Date(value).toISOString();

/** Reads the filter/page state a form carried through a POST round trip. */
const stateOf = (source) => ({
    filters: parseFilters(source),
    page: parsePage(source.page),
});

export function createAdminRoutes(repository) {
    return {
        async list(request, response, next) {
            try {
                const { filters, page } = stateOf(request.query);
                const { rows, total } = await repository.list({
                    filters,
                    limit: PAGE_SIZE,
                    offset: (page - 1) * PAGE_SIZE,
                });
                const deleted = Number.parseInt(request.query.deleted ?? '', 10);

                response.type('html').send(renderList({
                    rows,
                    total,
                    page,
                    pages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
                    filters,
                    deleted: Number.isFinite(deleted) && deleted > 0 ? deleted : 0,
                }));
            } catch (error) {
                next(error);
            }
        },

        async confirmDelete(request, response, next) {
            try {
                const { filters, page } = stateOf(request.body ?? {});
                const ids = parseIds(request.body?.id);

                if (ids.length === 0) {
                    return response.status(400).type('html').send(renderMessage(
                        'Ništa nije izabrano',
                        'Izaberite bar jedan zapis za brisanje.',
                        filters,
                        page,
                    ));
                }

                const rows = await repository.findByIds(ids);
                if (rows.length === 0) {
                    return response.status(404).type('html').send(renderMessage(
                        'Zapisi nisu pronađeni',
                        'Izabrani zapisi više ne postoje.',
                        filters,
                        page,
                    ));
                }

                response.type('html').send(renderConfirmDelete({ rows, filters, page }));
            } catch (error) {
                next(error);
            }
        },

        async remove(request, response, next) {
            try {
                const { filters, page } = stateOf(request.body ?? {});
                const ids = parseIds(request.body?.id);

                if (ids.length === 0) {
                    return response.status(400).type('html').send(renderMessage(
                        'Ništa nije izabrano',
                        'Izaberite bar jedan zapis za brisanje.',
                        filters,
                        page,
                    ));
                }

                const deleted = await repository.removeMany(ids);
                response.redirect(303, `/${buildQuery(filters, { page, deleted })}`);
            } catch (error) {
                next(error);
            }
        },

        async exportCsv(request, response, next) {
            const filters = parseFilters(request.query);
            const filename = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;

            try {
                response.type('text/csv; charset=utf-8');
                response.set('Content-Disposition', `attachment; filename="${filename}"`);
                response.write(CSV_BOM);
                response.write(toCsvRow(CSV_HEADER));

                // Read in bounded pages: the container has a read-only filesystem
                // and a 16 MB tmpfs, so the whole table must never be held at once.
                for (let offset = 0; ; offset += EXPORT_CHUNK) {
                    const { rows } = await repository.list({
                        filters,
                        limit: EXPORT_CHUNK,
                        offset,
                    });
                    for (const row of rows) {
                        response.write(toCsvRow([
                            row.id,
                            row.email,
                            row.service,
                            iso(row.createdAt),
                            iso(row.updatedAt),
                        ]));
                    }
                    if (rows.length < EXPORT_CHUNK) break;
                }

                response.end();
            } catch (error) {
                // The header block is already on the wire, so there is no status
                // code left to change -- drop the connection and let the log tell.
                if (response.headersSent) {
                    console.error('CSV export failed mid-stream:', error);
                    return response.destroy();
                }
                next(error);
            }
        },
    };
}
