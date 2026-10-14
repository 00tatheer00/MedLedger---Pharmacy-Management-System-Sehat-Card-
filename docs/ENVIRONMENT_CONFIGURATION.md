# MedLedger — Environment Configuration Specification

**Facility:** DHQ Hospital Kohat  
**System:** Pharmacy & Hospital Claims Management System  
**Framework:** Next.js 16 (App Router) & Supabase PostgreSQL  
**Document Version:** 1.0.0

---

## 1. Scope & Principles

This specification defines the environment variable requirements, validation mechanisms, security constraints, and credential separation policies across all runtime tiers of MedLedger.

### Core Security Rules:

1. **Zero Credential Leakage:** No secret key (`SUPABASE_SERVICE_ROLE_KEY`, `AUTH_SECRET`) may be prefixed with `NEXT_PUBLIC_` or bundled into client-side JavaScript.
2. **Strict Environment Isolation:** Development, Staging, and Production must use physically separate database instances and encryption keys.
3. **Fail-Closed Runtime:** In Staging and Production tiers, missing database credentials will throw runtime exceptions rather than falling back to prototype mocking.
4. **Zero Secrets in Source Control:** `.env`, `.env.local`, and environment-specific secret files must be explicitly ignored by Git.

---

## 2. Environment Variables Matrix

| Variable Name                   | Required Tier | Exposure        | Type     | Description / Constraints                                                                    |
| :------------------------------ | :------------ | :-------------- | :------- | :------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_APP_ENV`           | All           | Client & Server | `enum`   | `'development' \| 'staging' \| 'production'`. Dictates UI banners and security guardrails.   |
| `NEXT_PUBLIC_APP_URL`           | All           | Client & Server | `url`    | Canonical base URL (`http://localhost:3000` or `https://staging.medledger.dhqkohat.gov.pk`). |
| `NEXT_PUBLIC_SUPABASE_URL`      | Staging, Prod | Client & Server | `url`    | Supabase project REST endpoint (`https://<project-ref>.supabase.co`).                        |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging, Prod | Client & Server | `jwt`    | Public anonymous key used by browser client. Enforces RLS on every transaction.              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Staging, Prod | **Server-Only** | `jwt`    | High-privilege administrative key. Strictly forbidden in browser bundles.                    |
| `AUTH_SECRET`                   | Staging, Prod | **Server-Only** | `string` | Cryptographically random string (min 32 bytes) for session signing.                          |
| `DATABASE_URL`                  | Staging, Prod | **Server-Only** | `string` | Optional direct PostgreSQL connection string for Supabase CLI migrations.                    |

---

## 3. Tier Configurations & Behavioral Separation

### 3.1. Local Development (`development`)

- **File:** `.env.local` (local only, untracked)
- **Supabase Backend:** Local Supabase Docker or in-memory prototype mode.
- **Auth Behavior:** Safe prototype staff session fallback (`src/core/auth/session.ts`) allows full local UI evaluation without cloud network roundtrips.
- **Data Safety:** Uses synthetic demo patients, catalogue medicines, and purchase orders from `src/lib/demo-data.ts`.

### 3.2. Automated Testing (`test`)

- **Executed In:** Vitest (`npm test`) and Playwright E2E (`npx playwright test`).
- **Supabase Backend:** Mocked via Vitest `vi.mock` for unit suites; dynamic local server for E2E.
- **Safety Guardrail:** Unit tests explicitly verify that `createServiceClient()` throws a fatal security exception if invoked inside browser/JSDOM runtime (`src/core/database/client.test.ts`).

### 3.3. Staging Tier (`staging`)

- **Hosting Target:** Cloud hosting (Vercel Preview / Node Container).
- **Supabase Backend:** Dedicated staging Supabase project (`medledger-staging`).
- **Auth Behavior:** Real Supabase Auth with genuine magic-link / email sessions. Prototype staff session fallback is **disabled**.
- **Data Set:** Sanitized clinical test data. Under no circumstances may production patient records be imported into staging.
- **Purpose:** Clinical user acceptance testing (UAT), QA smoke testing, and migration dry runs.

### 3.4. Production Tier (`production`)

- **Hosting Target:** DHQ Kohat high-availability production cloud / on-premise infrastructure.
- **Supabase Backend:** Dedicated production cluster (`medledger-prod`) with Multi-AZ redundancy and Point-In-Time Recovery.
- **Auth Behavior:** Real Supabase Auth with mandatory Multi-Factor Authentication (MFA) for pharmacy administrators and finance officers.
- **Audit Trails:** Immutable database logging active on all inserts, updates, deletes, and claim submissions.
- **Destructive Operations:** Database reset, truncations, or mock seed scripts will immediately terminate with an unrecoverable safety error if `NEXT_PUBLIC_APP_ENV === 'production'`.

---

## 4. Runtime Validation & Zod Schema

Environment configuration is parsed and validated upon application boot in `src/core/config/env.ts`:

```typescript
export const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url('NEXT_PUBLIC_SUPABASE_URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional().or(z.literal('')),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional().or(z.literal('')),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  AUTH_SECRET: z.string().optional().or(z.literal('')),
});
```

### Server vs Client Access Guard

- `createServiceClient` in `src/core/database/client.ts` verifies:
  ```typescript
  if (typeof window !== 'undefined') {
    throw new Error(
      'FATAL SECURITY VIOLATION: createServiceClient() cannot be called in client-side code',
    );
  }
  ```

This guarantees compile-time and runtime prevention of service-role leakage.

---

## 5. Secret Rotation & Hygiene Procedures

### 5.1. Generating Secure Secrets

For `AUTH_SECRET`:

```bash
# Generate high-entropy 256-bit base64 secret
openssl rand -base64 32
```

### 5.2. Rotating Supabase API Keys

1. In the Supabase Project Dashboard under **Project Settings > API**:
2. Click **Roll Key** for the Service Role Key or JWT Secret.
3. Immediately update the cloud host environment variable (`SUPABASE_SERVICE_ROLE_KEY`).
4. Trigger a zero-downtime redeployment of the web application.
5. Invalidate existing sessions if the JWT secret was regenerated.

### 5.3. Audit Verification

- Audit logs in `src/core/audit/audit-logger.ts` sanitize all input payloads and explicitly strip tokens, hashes, passwords, and authorization headers prior to database insertion.
