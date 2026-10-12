# MedLedger — Security Plan

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Draft — Awaiting Review

---

## 1. Security Principles

1. **Defense in depth.** No single layer is trusted to be the sole barrier. Security is enforced at the UI, server, and database levels.
2. **Least privilege.** Users, services, and database roles have the minimum access required for their function.
3. **Server-side authority.** All authorization decisions are made on the server. Client-side checks are for UX only.
4. **Fail closed.** If a permission check fails or is ambiguous, access is denied.
5. **Audit everything sensitive.** Every dispensing, financial, stock-affecting, or access-related operation is logged immutably.
6. **Assume the client is untrusted.** All input is validated on the server. All responses are sanitized.
7. **Secrets never reach the client.** API keys, service role keys, and internal configuration are server-side only.

---

## 2. Authentication

### 2.1 Authentication Provider

MedLedger uses **Supabase Auth** for user authentication:

| Aspect                                | Detail                                                              |
| ------------------------------------- | ------------------------------------------------------------------- |
| **Sign-in method**                    | Email + password (primary). Other methods can be enabled later.     |
| **Session management**                | JWT-based sessions stored in HTTP-only, secure, same-site cookies.  |
| **Token refresh**                     | Handled automatically by the Supabase client library.               |
| **Session duration**                  | Configurable. Default: 1 hour access token, 7-day refresh token.    |
| **Multi-factor authentication (MFA)** | Not in initial scope. Can be enabled via Supabase Auth if required. |

### 2.2 Session Handling

- Sessions are validated on every server-side request (Server Components, Server Actions, API routes).
- The Next.js middleware verifies the session cookie and refreshes the token if needed.
- Invalid or expired sessions redirect to the login page.
- Logout invalidates the session on both client and server.

### 2.3 Account Management

- Only administrators can create user accounts. There is no self-registration.
- Password reset is handled through Supabase Auth's built-in flow (email link).
- Account deactivation (`is_active = false`) immediately prevents login.
- Password requirements: minimum 8 characters. Complexity rules are configurable.

> [!NOTE]
> Whether the pharmacy requires MFA depends on the client's security requirements. See [`OPEN_QUESTIONS.md`](file:///t:/DHQ%20KOhat%20Project/docs/OPEN_QUESTIONS.md) — OQ-005.

---

## 3. Authorization

### 3.1 Role-Based Access Control (RBAC)

Authorization follows an RBAC model with granular permissions:

```
User → assigned → Role(s) → grants → Permission(s)
```

#### Preliminary Role Definitions

| Role                     | Description                                     | Typical Permissions                                                                                            |
| ------------------------ | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **System Administrator** | Manages users, roles, and system configuration. | `users:*`, `roles:*`, `config:*`, `audit:read`                                                                 |
| **Pharmacy Manager**     | Full pharmacy operations. Approves adjustments. | `patients:*`, `prescriptions:*`, `dispensing:*`, `medicines:*`, `inventory:*`, `reports:*`, `audit:read`       |
| **Pharmacist**           | Day-to-day dispensing and patient interaction.  | `patients:read,create,update`, `prescriptions:*`, `dispensing:create,read`, `medicines:read`, `inventory:read` |
| **Purchasing Staff**     | Supplier and purchase management.               | `suppliers:*`, `purchasing:*`, `medicines:read`, `inventory:read`                                              |
| **Finance Staff**        | Claims, billing, and payment processing.        | `claims:*`, `finance:*`, `reports:read`                                                                        |

> [!IMPORTANT]
> These roles and permissions are preliminary. The final permission matrix must be confirmed with the client before production deployment. Permissions will be stored in the database and can be adjusted without code changes.

#### Permission Code Format

Permissions use the format `module:action`:

- `module`: One of `patients`, `prescriptions`, `dispensing`, `medicines`, `inventory`, `suppliers`, `purchasing`, `claims`, `finance`, `reports`, `users`, `roles`, `config`, `audit`.
- `action`: One of `create`, `read`, `update`, `delete`, or `*` (all actions).

### 3.2 Three-Layer Enforcement

| Layer                  | What It Does                                                                                                    | Failure Mode                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| **UI (Layer 1)**       | Hides buttons, menu items, and pages the user's role cannot access.                                             | Bypassed by any technical user. **Not a security boundary.**                               |
| **Server (Layer 2)**   | Every Server Action and API route checks `hasPermission(user, action)` before executing. Returns 403 if denied. | Primary enforcement. All mutations blocked here.                                           |
| **Database (Layer 3)** | PostgreSQL RLS policies restrict row-level access based on the authenticated user's role.                       | Safety net. Even if server code has a bug, the database prevents unauthorized data access. |

### 3.3 Permission Checking Flow

```typescript
// In a Server Action (pseudocode)
async function updatePatient(formData: FormData) {
  const user = await getAuthenticatedUser(); // Step 1: Who is this?
  if (!user) throw new AuthenticationError();

  await requirePermission(user, 'patients:update'); // Step 2: Can they do this?

  const validated = patientUpdateSchema.parse(formData); // Step 3: Is the input valid?

  return patientService.update(validated); // Step 4: Execute
}
```

---

## 4. Row Level Security (RLS)

### 4.1 RLS Strategy

Every table with user-facing data will have RLS enabled. Policies will enforce:

| Policy Type                | Purpose                                                               | Example                                                        |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Read restriction**       | Users only see data relevant to their role.                           | Finance staff can read claims but not patient medical details. |
| **Write restriction**      | Users can only modify data they are authorized to change.             | Only pharmacists can create dispensing records.                |
| **Soft delete visibility** | Records with `deleted_at IS NOT NULL` are hidden from normal queries. | Patients marked as deleted are excluded from search results.   |

### 4.2 Supabase Client Modes

| Client Mode            | Key Used                              | RLS Applied           | Use Case                                                     |
| ---------------------- | ------------------------------------- | --------------------- | ------------------------------------------------------------ |
| **Anonymous / Public** | `anon` key                            | Yes                   | Login page, public routes (minimal use).                     |
| **Authenticated User** | User's JWT                            | Yes                   | Standard user operations. RLS policies filter by user role.  |
| **Service Role**       | `service_role` key (server-side only) | **No** (bypasses RLS) | Admin operations, migrations, seed scripts, background jobs. |

> [!CAUTION]
> The `service_role` key **must never be exposed to the client**. It bypasses all RLS policies. It is used only in server-side code that has already performed its own authorization checks.

### 4.3 Example RLS Policy (Conceptual)

```sql
-- Pharmacists and managers can read all patients
CREATE POLICY "staff_read_patients" ON patients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
      AND r.name IN ('pharmacist', 'pharmacy_manager', 'system_admin')
    )
    AND deleted_at IS NULL
  );

-- Only authorized staff can insert patients
CREATE POLICY "staff_insert_patients" ON patients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      JOIN roles r ON r.id = ur.role_id
      JOIN role_permissions rp ON rp.role_id = r.id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE ur.user_id = auth.uid()
      AND p.code = 'patients:create'
    )
  );
```

> [!NOTE]
> Actual RLS policies will be designed and reviewed during the database phase (Phase 3). These examples illustrate the approach only.

---

## 5. Input Validation and Safe Error Messages

### 5.1 Validation Strategy

| Layer           | Tool                                                 | Purpose                                                             |
| --------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| **Client-side** | Zod schemas + React Hook Form                        | Immediate feedback. Prevents obviously invalid submissions.         |
| **Server-side** | Same Zod schemas in Server Actions                   | Authoritative validation. Never trust client-side validation alone. |
| **Database**    | `CHECK` constraints, `NOT NULL`, foreign keys, types | Final enforcement. Catches anything the application layer misses.   |

### 5.2 Error Message Rules

| Scenario                | What the User Sees                                                                               | What Is Logged                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| Validation error        | Specific field-level messages (e.g., "Quantity must be a positive number").                      | Nothing special — normal user error.                          |
| Authorization error     | "You do not have permission to perform this action."                                             | Full details: user ID, attempted action, resource, timestamp. |
| Business rule violation | Clear explanation (e.g., "Insufficient stock in batch B-2024-001. Available: 5, Requested: 10.") | Operation details.                                            |
| Internal server error   | "Something went wrong. Please try again or contact the administrator."                           | Full error stack trace, request context.                      |

> [!WARNING]
> Error messages must **never** expose database structure, query details, stack traces, or internal implementation details to the user. The server logs the full error; the client receives a safe summary.

---

## 6. Secrets and Environment Variables

### 6.1 Secret Categories

| Secret                            | Stored Where         | Access                                             |
| --------------------------------- | -------------------- | -------------------------------------------------- |
| `SUPABASE_URL`                    | Environment variable | Server-side only.                                  |
| `SUPABASE_ANON_KEY`               | Environment variable | Client-safe (used with RLS).                       |
| `SUPABASE_SERVICE_ROLE_KEY`       | Environment variable | **Server-side only. Never exposed to the client.** |
| `NEXTAUTH_SECRET` (or equivalent) | Environment variable | Server-side only.                                  |
| Database connection string        | Supabase platform    | Not directly used by the application.              |

### 6.2 Environment Variable Management

- `.env.local` for local development. **Never committed to version control.**
- `.env.example` committed with placeholder values and descriptions.
- Production secrets managed through the hosting platform's secret management (e.g., Vercel Environment Variables).
- `.gitignore` explicitly includes `.env.local`, `.env.*.local`.

### 6.3 Key Rotation

- Service role keys should be rotatable without application downtime.
- A key rotation procedure will be documented during the deployment phase.

---

## 7. Audit Trail

### 7.1 What Is Audited

| Category               | Events                                                                             |
| ---------------------- | ---------------------------------------------------------------------------------- |
| **Authentication**     | Login, logout, failed login attempts, password changes.                            |
| **Dispensing**         | Every dispensing event: items, quantities, batches, pharmacist.                    |
| **Stock Changes**      | Receipts, adjustments, write-offs, returns.                                        |
| **Financial**          | Claim submissions, approvals, rejections, payments (supplier and hospital).        |
| **User Management**    | User creation, role assignment/removal, deactivation.                              |
| **Permission Changes** | Role permission modifications.                                                     |
| **Configuration**      | System configuration changes.                                                      |
| **Data Modifications** | Updates/deletions to patients, medicines, suppliers (old and new values captured). |

### 7.2 Audit Record Structure

Each audit event captures:

| Field         | Purpose                                                               |
| ------------- | --------------------------------------------------------------------- |
| `event_type`  | Category of the event (e.g., `DISPENSING`, `STOCK_ADJUSTMENT`).       |
| `action`      | Specific action (e.g., `CREATE`, `UPDATE`, `DELETE`, `APPROVE`).      |
| `entity_type` | Type of entity affected (e.g., `prescription`, `medicine_batch`).     |
| `entity_id`   | ID of the affected record.                                            |
| `user_id`     | Who performed the action.                                             |
| `old_values`  | JSONB snapshot of the record before the change (for updates/deletes). |
| `new_values`  | JSONB snapshot of the record after the change (for creates/updates).  |
| `ip_address`  | Request origin.                                                       |
| `user_agent`  | Browser/client info.                                                  |
| `created_at`  | Timestamp.                                                            |

### 7.3 Audit Integrity

- Audit records are **append-only**. No UPDATE or DELETE operations are permitted on the audit table.
- Audit writes occur within the **same transaction** as the operation they record. If the operation fails, the audit record is also rolled back.
- RLS on the audit table restricts read access to administrators and managers.
- No user role (including admin) can delete audit records through the application.

---

## 8. Protection Against Specific Threats

### 8.1 Duplicate Dispensing

| Mechanism                     | Description                                                                                                |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Prescription status check** | Before dispensing, verify the prescription and item statuses allow further dispensing.                     |
| **Quantity check**            | `dispensed_quantity + new_quantity <= prescribed_quantity` enforced within the transaction.                |
| **Idempotency key**           | Each dispensing request carries a unique client-generated key. The server rejects duplicate keys.          |
| **Optimistic locking**        | Prescriptions have an `updated_at` timestamp checked during dispensing to detect concurrent modifications. |
| **UI safeguards**             | Submit button disabled after click. Confirmation dialog before dispensing.                                 |

### 8.2 Unauthorized Stock Adjustments

| Mechanism             | Description                                                                                |
| --------------------- | ------------------------------------------------------------------------------------------ |
| **Permission check**  | Only users with `inventory:adjust` permission can perform stock adjustments.               |
| **Reason required**   | Every adjustment requires a reason code and text explanation.                              |
| **Audit trail**       | Every adjustment is logged with old and new quantities, reason, and user.                  |
| **Approval workflow** | Adjustments above a configurable threshold may require manager approval (to be confirmed). |

### 8.3 Common Web Application Threats

| Threat                                       | Mitigation                                                                                                             |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **SQL Injection**                            | Parameterized queries exclusively. No string concatenation for SQL. Supabase SDK enforces this by default.             |
| **Cross-Site Scripting (XSS)**               | React's default escaping. No `dangerouslySetInnerHTML` without explicit sanitization. Content Security Policy headers. |
| **Cross-Site Request Forgery (CSRF)**        | Server Actions have built-in CSRF protection in Next.js. SameSite cookie attribute.                                    |
| **Broken Authentication**                    | Supabase Auth handles token management. HTTP-only, secure cookies. Session validation on every request.                |
| **Insecure Direct Object References (IDOR)** | RLS policies prevent accessing other users' data. Server-side ownership checks where RLS is insufficient.              |
| **Mass Assignment**                          | Zod schemas whitelist allowed fields. Only validated fields are passed to the database layer.                          |
| **Rate Limiting**                            | Login attempts rate-limited by Supabase Auth. Application-level rate limiting via middleware for sensitive endpoints.  |

---

## 9. Backup and Recovery

### 9.1 Backup Strategy

| Aspect                            | Plan                                                                                       |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| **Database backups**              | Supabase provides automatic daily backups (Pro plan). Verify retention period is adequate. |
| **Point-in-time recovery (PITR)** | Available on Supabase Pro plan. Allows recovery to any point within the retention window.  |
| **Manual backups**                | Periodic `pg_dump` exports for additional safety. Stored in a separate location.           |
| **Backup testing**                | Quarterly restore tests to verify backup integrity.                                        |
| **Code/Configuration**            | All application code and infrastructure configuration stored in Git.                       |

### 9.2 Recovery Procedures

| Scenario                     | Procedure                                                            |
| ---------------------------- | -------------------------------------------------------------------- |
| **Accidental data deletion** | Restore from PITR to the moment before deletion.                     |
| **Database corruption**      | Restore from the latest clean backup.                                |
| **Application failure**      | Redeploy from the last known-good Git commit.                        |
| **Account compromise**       | Deactivate affected account. Rotate service keys. Review audit logs. |

> [!WARNING]
> Backup and recovery procedures must be tested before production launch. A disaster recovery plan will be finalized during the deployment phase. See [`OPEN_QUESTIONS.md`](file:///t:/DHQ%20KOhat%20Project/docs/OPEN_QUESTIONS.md) — OQ-009.

---

## 10. Environment Separation

| Control            | Development           | Staging              | Production          |
| ------------------ | --------------------- | -------------------- | ------------------- |
| Supabase project   | Separate project      | Separate project     | Separate project    |
| Database           | Dummy data only       | Dummy data only      | Real data           |
| Service role key   | Dev-specific          | Staging-specific     | Production-specific |
| Visual indicator   | Banner: "DEVELOPMENT" | Banner: "STAGING"    | No banner           |
| Seed data script   | Can run               | Can run              | **Blocked**         |
| Debug logging      | Verbose               | Verbose              | Errors only         |
| Error detail in UI | Stack traces allowed  | Stack traces allowed | Safe messages only  |

---

## 11. Security Review Checklist (Phase 11)

Before production deployment, the following security checks must pass:

- [ ] All Server Actions validate input with Zod.
- [ ] All Server Actions check user authentication and authorization.
- [ ] RLS is enabled on all user-facing tables.
- [ ] RLS policies are tested with different roles.
- [ ] No `service_role` key is exposed to the client.
- [ ] No sensitive data is logged (passwords, tokens, full CNIC).
- [ ] Audit trail covers all sensitive operations.
- [ ] Audit records cannot be modified or deleted through the application.
- [ ] Error messages do not leak internal details.
- [ ] Rate limiting is configured for login and sensitive endpoints.
- [ ] Content Security Policy headers are set.
- [ ] HTTPS is enforced.
- [ ] Backups are configured and tested.
- [ ] Password requirements meet minimum standards.
- [ ] Session timeouts are configured appropriately.
- [ ] No default accounts or passwords exist.
