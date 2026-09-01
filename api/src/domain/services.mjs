/**
 * Single source of truth for the services a visitor can subscribe to.
 * Adding a service means one entry here plus a database migration widening
 * the `service` ENUM -- nothing else in the codebase enumerates them.
 */
export const SERVICES = {
    konsultacije: { name: 'Konsultacije', template: 'konsultacije-cenovnik' },
    'izrada-reklama': { name: 'Izrada Reklama', template: 'izrada-videa-cenovnik' },
    'creative-partner': { name: 'Creative Partner', template: 'creative-partner-cenovnik' },
};

export const VALID_SERVICES = Object.keys(SERVICES);

export function isValidService(service) {
    return typeof service === 'string' && Object.hasOwn(SERVICES, service);
}

export function serviceName(service) {
    return SERVICES[service]?.name ?? service;
}
