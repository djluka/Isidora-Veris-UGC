# Separate Admin Container Design

## Goal

Move the subscriber administration page out of the public API process and into an independently deployable container. Keep the public website at `https://isidoraverisugc.devbox.zone` and serve the admin page at `https://admin.isidoraverisugc.devbox.zone`.

The existing `admin.isidoraverisugc.com` endpoint is not usable because that hostname has no working DNS route to the deployment.

## Architecture

The production Compose stack will contain four services:

- `website`: the existing static Nginx site.
- `api`: the public subscription API, with all admin routes and configuration removed.
- `admin`: a separate Node.js process built from the existing `api/` image context and started with a dedicated admin entry point.
- `mysql`: the existing private MySQL database shared by the API and admin services.

The admin process will reuse the existing subscriber repository and HTML rendering modules. It will not initialize Turnstile, Resend, subscription endpoints, or schema migrations. Migrations remain the API startup responsibility, and Compose will start the admin service only after MySQL is healthy.

## Admin Interface

The admin service exposes only:

- `GET /`: a Basic Auth protected, read-only subscriber table sorted newest-first and paginated at 50 records per page.
- `GET /health/live`: confirms that the Node process is responding.
- `GET /health/ready`: confirms that MySQL is reachable.

Unknown routes return `404`. Invalid credentials return `401`. Database failures return `500` for the page and `503` for readiness.

The current HTML interface and pagination behavior remain unchanged except that pagination links continue within the dedicated admin origin.

## Security Boundary

Only the admin container receives `ADMIN_USERNAME` and `ADMIN_PASSWORD`. The public API no longer loads or receives these values and no longer contains a route capable of rendering subscriber data.

The admin service applies:

- authentication-attempt rate limiting;
- timing-safe Basic Auth comparison;
- `Cache-Control: no-store`;
- a restrictive Content Security Policy;
- HSTS, anti-framing, MIME-sniffing, permissions, and referrer headers;
- a read-only container filesystem, dropped Linux capabilities, and `no-new-privileges`.

No application-level hostname check is required because Coolify assigns only `admin.isidoraverisugc.devbox.zone` to the dedicated container.

## Deployment

The `admin` Compose component exposes internal port `3000` and is assigned `https://admin.isidoraverisugc.devbox.zone:3000` in Coolify. The `website` component retains `https://isidoraverisugc.devbox.zone`.

Coolify continues generating the admin password with `SERVICE_PASSWORD_64_ADMIN`. The API and admin containers use the same private MySQL application account. MySQL remains unexposed publicly.

Development Compose will map the admin container to `127.0.0.1:3001`, while the API remains on `127.0.0.1:3000` and the website on `127.0.0.1:8080`.

## Verification and Test Removal

Per the project owner's direction, all automated test files, test scripts, and test-only dependencies will be removed from the codebase, and no new automated tests will be added.

Implementation verification will consist of:

- Node syntax checks for executable modules;
- production and development Compose configuration validation;
- Docker image builds for the API and admin service;
- local smoke checks for API status, admin authentication, admin readiness, and hostname/port separation.

## Documentation

The README will document the independent admin service, its local URL, the new Coolify hostname assignment, credentials, health endpoints, and the absence of admin behavior from the public API.
