# Isidora Veriš UGC

This repository contains two applications deployed together as one Docker Compose service:

```text
website/                 Static HTML/CSS/JavaScript site, served by Nginx
api/                     Node.js subscription API and email templates
docker-compose.yml       Production/Coolify stack
docker-compose.dev.yml   Local port mappings and development credentials
```

The production stack also runs a private MySQL 8.4 database. Only the website and API receive public domains; MySQL has no host port in production.

## How the subscription flow works

The forms in `website/scripts/services.js` collect an email and service. The browser obtains a Cloudflare Turnstile token and sends this JSON to `https://api.isidoraverisugc.com/api/subscribe`:

```json
{
  "email": "person@example.com",
  "service": "konsultacije",
  "turnstileToken": "browser-generated-token"
}
```

The API validates the request, verifies Turnstile, applies rate limits, and inserts the subscription into MySQL. It then asks Resend to send the visitor's service information and a short notification to the site owner. Email failure is logged but does not undo a successful database insert.

Allowed service values are `konsultacije`, `izrada-reklama`, and `creative-partner`. A unique database constraint on `(email, service)` prevents the same email subscribing twice to the same service.

## Database tables

- `subscribers`: `id`, `email`, `service`, `created_at`, and `updated_at`. The admin page reads this table newest-first.
- `schema_migrations`: records the versioned schema changes already applied.

Schema migrations run automatically before the API starts. They can also be run explicitly from `api/` with `npm run db:migrate`.

## Configuration

Never commit real credentials. The following values belong in Coolify's environment-variable UI:

| Variable | Required | Purpose |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | Sends confirmations and owner notifications |
| `TURNSTILE_SECRET_KEY` | yes | Server-side bot-token verification |
| `ADMIN_USERNAME` | optional | Basic Auth username; defaults to `isidora` |
| `EMAIL_FROM` | optional | Verified Resend sender |
| `NOTIFICATION_EMAIL` | optional | Destination for new-subscription alerts |
| `LEGACY_MONGODB_URI` | migration only | Temporary read-only MongoDB source connection |

Coolify generates and persists the MySQL root password, MySQL application password, and admin password through the Compose `SERVICE_PASSWORD_64_*` variables. Do not manually expose MySQL port 3306.

The Turnstile site key in `website/index.html` is public by design. Its secret key and the Resend key must exist only in Coolify. Nodemailer/Gmail SMTP is not used.

Any credentials previously posted in chat or committed elsewhere must be revoked before deployment. Use a new Resend key, a rotated Turnstile secret, and a temporary read-only MongoDB migration user.

## Local development

Requirements: Docker with Compose v2. To run the complete production-shaped stack locally:

```sh
cp .env.example .env
# Replace the Resend and Turnstile placeholders in .env.
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Open:

- Website: `http://localhost:8080`
- API status: `http://localhost:3000`
- API readiness: `http://localhost:3000/health/ready`
- Admin: `http://localhost:3000` using `admin` / `local_dev_admin_password`
- MySQL: `127.0.0.1:3306` for local tools only

The website automatically uses `http://localhost:3000` when loaded from localhost; every other hostname uses the production API subdomain.

For API-only development, provide the variables above plus the `MYSQL_*` connection variables, then run:

```sh
cd api
npm ci
npm run start:dev
```

There is no compilation step. The API image installs locked production dependencies and runs `node ./src/index.mjs`; the website image copies static files into Nginx.

## One-time MongoDB to MySQL migration

Create a temporary Atlas user with read-only access to the legacy `isidora-veris` database and allow the Coolify server's IP. Put its URI in `LEGACY_MONGODB_URI` directly in Coolify—never in Git or chat.

Run these commands from the API container terminal:

```sh
npm run migrate:mongodb -- --dry-run
npm run migrate:mongodb -- --apply
```

The dry run reads MongoDB, validates and normalizes records, detects duplicates in the source, and prints a JSON summary without connecting to or changing MySQL. The apply command creates the current MySQL schema if necessary and imports in batches with `INSERT IGNORE`, so it is safe to rerun. It preserves `createdAt`/`updatedAt`, never modifies MongoDB, and never sends email.

After applying, compare the migration summary with the admin record count. Investigate rejected records, rerun if needed, then remove `LEGACY_MONGODB_URI`, revoke the temporary Atlas user, and remove its network access rule.

## Coolify deployment

1. Create one Git-based Docker Compose Service pointing at `/docker-compose.yml` in the repository root.
2. Set the replacement `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY`; optionally change the email and admin username variables. Coolify generates the `SERVICE_PASSWORD_64_*` values.
3. Assign `https://isidoraverisugc.com,https://www.isidoraverisugc.com` to the `website` component.
4. Assign `https://api.isidoraverisugc.com:3000,https://admin.isidoraverisugc.com:3000` to the `api` component. `:3000` tells Coolify the internal container port; visitors still use normal HTTPS without a port in the browser.
5. Point direct-DNS A/AAAA records for the apex, `www`, `api`, and `admin` names to the Coolify server. Keep proxying disabled at any external DNS/CDN provider so `TRUST_PROXY=1` remains correct.
6. Deploy and confirm all three component health checks pass. Test a real form submission, both emails, API readiness, and admin authentication.

The database data lives in the named `mysql_data` volume and survives container replacement. A volume is not a backup.

### Backups

Coolify recognizes the Compose MySQL component from its image and `MYSQL_ROOT_PASSWORD` / `MYSQL_DATABASE` variables. In the MySQL component's **Backups** page:

1. Add a schedule with cron `0 3 * * *`. Ensure the Coolify server/instance timezone is `Europe/Belgrade`.
2. Keep local backups enabled and set local retention to 7 backups.
3. Add and validate an S3-compatible storage destination, enable it for this schedule, and set S3 retention to 30 days.
4. Run **Backup Now**, confirm a non-empty local dump and successful S3 upload, then restore a copy into a disposable MySQL database and verify the subscriber count.

S3 setup requires an endpoint, bucket, region, access key, and secret key. These are Coolify settings, not repository variables.

## API operations

- `GET /health/live` confirms the Node process is responding.
- `GET /health/ready` confirms MySQL is reachable.
- `POST /api/subscribe` creates a subscription.
- The root of `admin.isidoraverisugc.com` serves a read-only, Basic Auth protected table with 50 records per page.
- The root of `api.isidoraverisugc.com` returns a small service-status JSON response.

Rate limits are kept in API process memory and reset when the API container restarts. They are appropriate for a single API replica, which is the intended deployment topology.

## Security notes

- Turnstile verification is required and fails closed; a short pre-verification IP limit protects the external verification call from abuse.
- Subscription limits apply per IP and per IP/service, while the database unique key handles concurrent duplicate requests safely.
- CORS permits only the production website origins, request bodies are limited to 10 KB, and SQL queries are parameterized.
- The admin hostname is exact-match gated, uses timing-safe Basic Auth checks, has a failed-authentication rate limit, escapes database content, and sends a restrictive Content Security Policy.
- The API emits anti-framing, MIME-sniffing, permissions, referrer, HSTS, and no-cache headers. Its container runs as an unprivileged user with a read-only filesystem, no Linux capabilities, and no-new-privileges.
- Production MySQL is reachable only over the private Compose network and the API uses a non-root database account.
- Unknown website URLs return the branded `404.html` page with a real HTTP 404 response.
