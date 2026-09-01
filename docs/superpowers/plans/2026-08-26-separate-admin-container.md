# Separate Admin Container Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the subscriber admin page into its own container at `admin.isidoraverisugc.devbox.zone` and remove all admin behavior and credentials from the public API container.

**Architecture:** Reuse the existing `api/` build context for two runtime commands. The public API continues to run `src/index.mjs`; a new admin service runs `src/admin-index.mjs`, connects directly to the private MySQL service, and exposes only its page and health endpoints.

**Tech Stack:** Node.js 24, Express 5, MySQL 8.4, Docker Compose, Coolify

**Spec:** `docs/superpowers/specs/2026-08-26-separate-admin-container-design.md`

## Global Constraints

- Keep the website at `https://isidoraverisugc.devbox.zone`.
- Serve the separate admin container at `https://admin.isidoraverisugc.devbox.zone`.
- Remove the admin route and admin credentials from the public API.
- Keep the subscriber interface read-only and protected by rate-limited Basic Auth.
- Do not expose MySQL publicly.
- Remove all automated test files, test scripts, and test-only dependencies; do not add replacement tests.
- Verify with syntax checks, Compose validation, image builds, and local smoke checks.

---

## File Structure

- Create `api/src/admin-config.mjs`: load only the admin runtime's port, proxy, and authentication settings.
- Create `api/src/admin-app.mjs`: construct the admin-only Express application.
- Create `api/src/admin-index.mjs`: connect the admin application to MySQL and manage server shutdown.
- Modify `api/src/admin.mjs`: retain the existing authentication and HTML-rendering implementation unchanged.
- Modify `api/src/middlewares/limiters.mjs`: expose an admin-only limiter factory separately from the API limiter group.
- Modify `api/src/app.mjs`: remove admin imports, arguments, route, and credentials from the public API application.
- Modify `api/src/config.mjs`: stop requiring or returning admin configuration for the public API.
- Modify `api/src/index.mjs`: stop passing admin values into the public API.
- Modify `docker-compose.yml`: add the hardened production admin service and remove admin variables from the API service.
- Modify `docker-compose.dev.yml`: expose the admin service locally on port `3001`.
- Modify `api/package.json`: remove the automated test script.
- Delete `api/test/app.test.mjs` and `api/test/legacy-subscriber.test.mjs`: remove the complete automated test suite as requested.
- Modify `README.md`: document the independent service, local URL, Coolify routing, credentials, and health endpoints.

---

### Task 1: Separate the Admin and API Application Runtimes

**Files:**
- Create: `api/src/admin-config.mjs`
- Create: `api/src/admin-app.mjs`
- Create: `api/src/admin-index.mjs`
- Modify: `api/src/middlewares/limiters.mjs`
- Modify: `api/src/app.mjs`
- Modify: `api/src/config.mjs`
- Modify: `api/src/index.mjs`

**Interfaces:**
- Consumes: `createPool(env)`, `SubscriberRepository`, `requireBasicAuth(username, password)`, and `createAdminHandler(repository)`.
- Produces: `loadAdminConfig(env) -> { port, trustProxy, adminUsername, adminPassword }`, `createAdminLimiter() -> Express middleware`, and `createAdminApp(options) -> Express application`.

- [ ] **Step 1: Split the admin limiter from the API limiter group**

In `api/src/middlewares/limiters.mjs`, keep `VALID_SERVICES` and the three subscription limiters in `createLimiters()`. Move the existing admin limiter options into this named export:

```js
export function createAdminLimiter() {
    return rateLimit({
        standardHeaders: true,
        legacyHeaders: false,
        windowMs: 15 * 60 * 1000,
        max: 10,
        keyGenerator: (request) => ipKeyGenerator(request.ip),
        skipSuccessfulRequests: true,
        message: 'Too many authentication attempts; try again later.',
    });
}
```

Remove `adminLimiter` from the object returned by `createLimiters()`.

- [ ] **Step 2: Add admin-only configuration**

Create `api/src/admin-config.mjs` with exact required-variable validation:

```js
function required(env, name) {
    const value = env[name]?.trim();
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export function loadAdminConfig(env = process.env) {
    return {
        port: Number.parseInt(env.PORT || '3000', 10),
        trustProxy: Number.parseInt(env.TRUST_PROXY || '1', 10),
        adminUsername: required(env, 'ADMIN_USERNAME'),
        adminPassword: required(env, 'ADMIN_PASSWORD'),
    };
}
```

- [ ] **Step 3: Add the admin-only Express application**

Create `api/src/admin-app.mjs`. It must disable `x-powered-by`, configure `trust proxy`, add the existing security headers, expose both health routes, and protect only `/`:

```js
import express from 'express';
import { createAdminHandler, requireBasicAuth } from './admin.mjs';
import { createAdminLimiter } from './middlewares/limiters.mjs';

export function createAdminApp({
    repository,
    adminUsername,
    adminPassword,
    trustProxy = 1,
}) {
    const app = express();

    app.disable('x-powered-by');
    app.set('trust proxy', trustProxy);
    app.use((_request, response, next) => {
        response.set({
            'Cache-Control': 'no-store',
            'Content-Security-Policy': "default-src 'none'; base-uri 'none'; frame-ancestors 'none'",
            'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
            'Referrer-Policy': 'no-referrer',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
        });
        next();
    });

    app.get('/health/live', (_request, response) => response.json({ status: 'ok' }));
    app.get('/health/ready', async (_request, response) => {
        try {
            await repository.healthCheck();
            response.json({ status: 'ok' });
        } catch {
            response.status(503).json({ status: 'unavailable' });
        }
    });
    app.get(
        '/',
        createAdminLimiter(),
        requireBasicAuth(adminUsername, adminPassword),
        createAdminHandler(repository),
    );
    app.use((_request, response) => response.status(404).json({ message: 'Not found' }));
    app.use((error, _request, response, _next) => {
        console.error('Unhandled admin request error:', error);
        response.status(500).json({ message: 'Internal server error' });
    });

    return app;
}
```

- [ ] **Step 4: Add the admin server entry point**

Create `api/src/admin-index.mjs` using the same shutdown behavior as the API, but without migrations, email, or Turnstile initialization:

```js
import 'dotenv/config';
import { createAdminApp } from './admin-app.mjs';
import { loadAdminConfig } from './admin-config.mjs';
import { createPool } from './db/pool.mjs';
import { SubscriberRepository } from './repositories/subscribers.mjs';

const config = loadAdminConfig();
const pool = createPool();
const repository = new SubscriberRepository(pool);
const app = createAdminApp({
    repository,
    adminUsername: config.adminUsername,
    adminPassword: config.adminPassword,
    trustProxy: config.trustProxy,
});

const server = app.listen(config.port, '0.0.0.0', () => {
    console.log(`Admin listening on port ${config.port}`);
});

async function shutdown(signal) {
    console.log(`Received ${signal}; shutting down`);
    server.close(async () => {
        await pool.end();
        process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
```

- [ ] **Step 5: Remove admin behavior from the public API**

In `api/src/app.mjs`:

- remove the import from `./admin.mjs`;
- remove `adminHost`, `adminUsername`, and `adminPassword` from `createApp()`;
- change limiter destructuring to `{ verificationLimiter, ipServiceLimiter, ipTotalLimiter }`;
- delete the host-gated admin middleware array and its `app.get('/', ...admin)` registration;
- retain the JSON service-status handler at `/`.

In `api/src/config.mjs`, remove `adminHost`, `adminUsername`, and `adminPassword` from the returned configuration. In `api/src/index.mjs`, remove those three arguments from the `createApp()` call.

- [ ] **Step 6: Run syntax and import checks**

Run:

```bash
find api/src api/scripts -name '*.mjs' -print0 | xargs -0 -n1 node --check
```

Expected: every command exits successfully with no syntax errors.

- [ ] **Step 7: Commit the runtime separation**

```bash
git add api/src
git commit -m "feat: separate admin runtime from public API"
```

---

### Task 2: Add the Dedicated Admin Container

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.dev.yml`

**Interfaces:**
- Consumes: `node ./src/admin-index.mjs`, internal MySQL port `3306`, and generated Compose variables `SERVICE_PASSWORD_64_MYSQL` and `SERVICE_PASSWORD_64_ADMIN`.
- Produces: production service `admin` on internal port `3000` and development endpoint `http://localhost:3001`.

- [ ] **Step 1: Remove admin credentials from the API service**

Delete these environment entries from the `api` service in `docker-compose.yml`:

```yaml
ADMIN_HOST: admin.isidoraverisugc.com
ADMIN_USERNAME: ${ADMIN_USERNAME:-isidora}
ADMIN_PASSWORD: ${SERVICE_PASSWORD_64_ADMIN}
```

- [ ] **Step 2: Add the hardened production admin service**

Add this sibling service between `api` and `mysql`:

```yaml
  admin:
    build:
      context: ./api
    command: ["node", "./src/admin-index.mjs"]
    restart: unless-stopped
    read_only: true
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    tmpfs:
      - /tmp:size=16m,mode=1777
    expose:
      - "3000"
    environment:
      PORT: "3000"
      TRUST_PROXY: "1"
      MYSQL_HOST: mysql
      MYSQL_PORT: "3306"
      MYSQL_DATABASE: isidora_veris
      MYSQL_USER: isidora
      MYSQL_PASSWORD: ${SERVICE_PASSWORD_64_MYSQL}
      ADMIN_USERNAME: ${ADMIN_USERNAME:-isidora}
      ADMIN_PASSWORD: ${SERVICE_PASSWORD_64_ADMIN}
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/health/ready').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 20s
```

- [ ] **Step 3: Add the local admin override**

Add this sibling service to `docker-compose.dev.yml`:

```yaml
  admin:
    ports:
      - "127.0.0.1:3001:3000"
    environment:
      TRUST_PROXY: "0"
      MYSQL_PASSWORD: local_dev_password
      ADMIN_USERNAME: admin
      ADMIN_PASSWORD: local_dev_admin_password
```

Remove the admin hostname, username, and password entries from the development `api` override.

- [ ] **Step 4: Validate both Compose models**

Run:

```bash
RESEND_API_KEY=verify TURNSTILE_SECRET_KEY=verify SERVICE_PASSWORD_64_MYSQL=verify SERVICE_PASSWORD_64_MYSQLROOT=verify-root SERVICE_PASSWORD_64_ADMIN=verify-admin docker compose -f docker-compose.yml config --quiet
RESEND_API_KEY=verify TURNSTILE_SECRET_KEY=verify SERVICE_PASSWORD_64_MYSQL=verify SERVICE_PASSWORD_64_MYSQLROOT=verify-root SERVICE_PASSWORD_64_ADMIN=verify-admin docker compose -f docker-compose.yml -f docker-compose.dev.yml config --quiet
```

Expected: both commands exit successfully with no interpolation or Compose schema errors.

- [ ] **Step 5: Build both Node service variants**

Run:

```bash
RESEND_API_KEY=verify TURNSTILE_SECRET_KEY=verify SERVICE_PASSWORD_64_MYSQL=verify SERVICE_PASSWORD_64_MYSQLROOT=verify-root SERVICE_PASSWORD_64_ADMIN=verify-admin docker compose -f docker-compose.yml build api admin
```

Expected: the API and admin image targets build successfully.

- [ ] **Step 6: Commit the container split**

```bash
git add docker-compose.yml docker-compose.dev.yml
git commit -m "feat: add dedicated admin container"
```

---

### Task 3: Remove the Automated Test Suite

**Files:**
- Modify: `api/package.json`
- Delete: `api/test/app.test.mjs`
- Delete: `api/test/legacy-subscriber.test.mjs`

**Interfaces:**
- Consumes: the project owner's explicit instruction to remove automated tests entirely.
- Produces: an API package with no test command, test files, or test-only dependencies.

- [ ] **Step 1: Remove the test command**

Delete this property from `api/package.json`:

```json
"test": "node --test",
```

Keep `nodemon`; it supports interactive development and is not a test-only dependency. No lockfile package removal is required because the tests use only Node built-ins.

- [ ] **Step 2: Delete all automated test files**

Delete:

```text
api/test/app.test.mjs
api/test/legacy-subscriber.test.mjs
```

Confirm there are no remaining test files or test-script references:

```bash
find . -path './.git' -prune -o -type f \( -path '*/test/*' -o -path '*/tests/*' -o -name '*.test.*' -o -name '*.spec.*' \) -print
RIPGREP_CONFIG_PATH= rg -n 'node --test|npm test|npm run test' . --glob '!docs/superpowers/**'
```

Expected: both commands print no project test files or test-script references.

- [ ] **Step 3: Confirm package metadata remains valid**

Run:

```bash
npm --prefix api pkg get scripts
npm --prefix api ci --ignore-scripts
```

Expected: package scripts contain no `test` key and locked dependencies install successfully.

- [ ] **Step 4: Commit test removal**

```bash
git add api/package.json api/test
git commit -m "chore: remove automated test suite"
```

---

### Task 4: Document and Smoke-Verify the Deployment

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: Compose services `website`, `api`, `admin`, and `mysql`.
- Produces: operator instructions for local access and Coolify domain assignment.

- [ ] **Step 1: Update repository and configuration documentation**

Update the opening service tree to describe the separate admin runtime. Document that `ADMIN_USERNAME` applies only to the admin container and that Coolify generates `SERVICE_PASSWORD_64_ADMIN`.

- [ ] **Step 2: Update local-development endpoints**

Document these exact endpoints and credentials:

```text
Website: http://localhost:8080
API: http://localhost:3000
Admin: http://localhost:3001
Admin credentials: admin / local_dev_admin_password
```

- [ ] **Step 3: Update Coolify routing**

Replace the old domain instructions with:

```text
website -> https://isidoraverisugc.devbox.zone
api     -> its existing API hostname when one is assigned
admin   -> https://admin.isidoraverisugc.devbox.zone:3000
```

State that `:3000` is the internal container port and is not typed by visitors. Remove references to `admin.isidoraverisugc.com` and describe the new admin health routes.

- [ ] **Step 4: Start the development stack for smoke verification**

Run:

```bash
RESEND_API_KEY=verify TURNSTILE_SECRET_KEY=verify docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build -d
docker compose -f docker-compose.yml -f docker-compose.dev.yml ps
```

Expected: `website`, `api`, `admin`, and `mysql` are running; health-enabled services become healthy.

- [ ] **Step 5: Check service separation and authentication**

Run:

```bash
curl --fail http://127.0.0.1:3000/health/live
curl --fail http://127.0.0.1:3000/
curl --fail http://127.0.0.1:3001/health/live
curl --fail http://127.0.0.1:3001/health/ready
curl --silent --output /dev/null --write-out '%{http_code}\n' http://127.0.0.1:3001/
curl --fail --user admin:local_dev_admin_password http://127.0.0.1:3001/
```

Expected:

- the API live endpoint returns `{"status":"ok"}`;
- the API root returns `{"service":"isidora-veris-api","status":"ok"}` rather than HTML;
- both admin health endpoints return `{"status":"ok"}`;
- the unauthenticated admin root prints `401`;
- the authenticated admin root returns the subscriber-table HTML.

- [ ] **Step 6: Stop the local stack without deleting data**

Run:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

Do not pass `--volumes`; the MySQL volume must remain intact.

- [ ] **Step 7: Perform the final repository checks**

Run:

```bash
find api/src api/scripts -name '*.mjs' -print0 | xargs -0 -n1 node --check
git diff --check
git status --short
```

Expected: syntax checks and `git diff --check` succeed; status lists only the intended README and plan changes after prior task commits.

- [ ] **Step 8: Commit documentation and the implementation plan**

```bash
git add README.md docs/superpowers/plans/2026-08-26-separate-admin-container.md
git commit -m "docs: explain separate admin deployment"
```

- [ ] **Step 9: Review commits and push the current branch**

Run:

```bash
git status --short
git log --oneline --decorate -5
git push origin feat/coolify-mysql-deployment
```

Expected: the working tree is clean and the remote branch advances to the final implementation commit.
