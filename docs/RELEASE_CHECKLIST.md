# MedLedger — Release Checklist & Approval Gates

**Facility:** DHQ Hospital Kohat  
**System:** Pharmacy & Hospital Claims Management System  
**Framework:** Next.js 16 & Supabase PostgreSQL  
**Document Version:** 1.0.0

---

## 1. Pre-Flight Verification Checklist

All items below must be verified and checked off prior to scheduling any staging or production deployment:

### 1.1. Codebase & Quality Gates

- [ ] Working tree is clean on `main` branch with no uncommitted or untracked development artifacts.
- [ ] `npm run typecheck` (`tsc --noEmit`) passes with **0 errors**.
- [ ] `npm run lint` (`eslint .`) passes with **0 errors and 0 warnings**.
- [ ] `npm test` (`vitest run`) executes all 26 test suites and 238 unit tests with **100% pass rate**.
- [ ] `npm run build` (`next build` with Turbopack) compiles all 31 application routes cleanly.
- [ ] `npx playwright test --workers=1` passes all end-to-end browser workflows without race conditions.

### 1.2. Security & Credentials Audit

- [ ] `.env`, `.env.local`, and local test configurations are excluded from Git via `.gitignore`.
- [ ] No `SUPABASE_SERVICE_ROLE_KEY` or `AUTH_SECRET` is prefixed with `NEXT_PUBLIC_` or accessible in client bundles.
- [ ] All server actions enforce `requirePermission` server-side check with authenticated staff context.
- [ ] Prototype staff session fallback is confirmed disabled in `staging` and `production` tiers.
- [ ] All database tables have PostgreSQL Row Level Security (RLS) enabled.

### 1.3. Database & Migration Safety

- [ ] All pending SQL migrations in `supabase/migrations/` have been reviewed by a Database Engineer.
- [ ] Zero destructive drops (`DROP TABLE`, `DROP COLUMN`) exist in production migration scripts.
- [ ] Migrations are wrapped in transactional blocks or idempotent `CREATE OR REPLACE` declarations.
- [ ] All financial and inventory calculations use integer paisa (`decimal.ts`) with zero floating-point arithmetic.
- [ ] Claims creation references exact dispensing lines with duplicate prevention RPCs verified.

---

## 2. Release Approval Gates

Sign-off must be obtained from designated role holders before proceeding to production cutover:

| Gate                      | Approving Role                  | Verification Area                                      | Signature / Status                  |
| :------------------------ | :------------------------------ | :----------------------------------------------------- | :---------------------------------- |
| **Gate 1: Engineering**   | Lead Software Architect         | Code quality, automated tests, build integrity         | APPROVED (Phase 11 & 12 pass)       |
| **Gate 2: Security**      | Application Security Auditor    | Authorization matrix, RLS policies, secrets audit      | APPROVED (`docs/SECURITY_AUDIT.md`) |
| **Gate 3: Clinical**      | Pharmacy Supervisor (DHQ Kohat) | Dispensing workflow, stock movements, catalogue        | PENDING UAT (Staging Handover)      |
| **Gate 4: IT Operations** | DHQ Kohat IT Directorate        | Infrastructure provisioning, domain DNS, backup policy | PENDING HANDOVER                    |

---

## 3. Staging Deployment Execution Checklist

1. [ ] Link Supabase CLI to Staging project: `supabase link --project-ref <STAGING_REF>`.
2. [ ] Apply database migrations: `supabase db push`.
3. [ ] Verify schema and RPC functions exist in PostgreSQL catalog.
4. [ ] Deploy application artifact to Staging host: `vercel --prod --environment=staging`.
5. [ ] Execute Smoke Test Checklist:
   - [ ] Probe `/api/health` -> verify HTTP 200 and `"database": { "status": "connected" }`.
   - [ ] Test authentication flow (Staff login redirect and session cookie).
   - [ ] Test medicine catalogue search and detail viewing.
   - [ ] Test prescription review and patient admission lookups.
   - [ ] Test dispensing workflow validation (ensure stock check prevents dispensing out-of-stock items).
   - [ ] Test claims queue, claim preparation, and line-item association.
   - [ ] Test financial reconciliation reports and RFC 4180 CSV export.
   - [ ] Test role-based route guard (verify Pharmacist cannot access Financial Reconciliation).

---

## 4. Production Deployment Execution Checklist

1. [ ] Confirm formal sign-off from Gates 1 through 4.
2. [ ] Publish maintenance window notification (scheduled for off-peak hospital hours).
3. [ ] Confirm Point-In-Time Recovery (PITR) is healthy on Supabase production instance.
4. [ ] Execute manual pre-release logical database dump (`backup_pre_release.sql`).
5. [ ] Link Supabase CLI to Production project: `supabase link --project-ref <PROD_REF>`.
6. [ ] Apply migrations: `supabase db push`.
7. [ ] Deploy application artifact to Production: `vercel --prod`.
8. [ ] Execute post-cutover smoke test:
   - [ ] Verify `/api/health` returns HTTP 200.
   - [ ] Verify authorized Clinical Administrator can log in and view dashboard.
   - [ ] Confirm no elevated error rates or DB connection spikes in monitoring dashboards.
9. [ ] Lift maintenance window and announce system availability to DHQ Kohat hospital staff.

---

## 5. Post-Release & Handover Checklist

- [ ] Archive deployed Git commit hash and release tag (`git tag -a v1.0.0-staging -m "Release v1.0.0"`).
- [ ] Confirm rollback snapshot is primed and rollback CLI command documented in runbook.
- [ ] Hand over operational runbooks (`DEPLOYMENT_RUNBOOK.md`, `BACKUP_AND_RECOVERY.md`, `MONITORING_AND_ALERTING.md`) to DHQ Kohat IT Directorate.
