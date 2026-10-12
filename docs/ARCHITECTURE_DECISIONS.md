# MedLedger — Architecture Decision Records

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Active

---

## Format

Each Architecture Decision Record (ADR) follows this structure:

- **Status**: Proposed, Accepted, Deprecated, Superseded.
- **Context**: The situation and forces driving the decision.
- **Decision**: What we decided.
- **Consequences**: What happens as a result — both positive and negative.
- **Alternatives Considered**: What else we evaluated and why we didn't choose it.

---

## ADR-001: Modular Monolith Architecture

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

MedLedger is a pharmacy management system for a single hospital pharmacy with 5–15 concurrent users. The development team is small (1–3 developers). All modules share a single PostgreSQL database. There is no requirement for independent scaling of individual modules.

### Decision

Adopt a **modular monolith** architecture: a single Next.js application with well-defined module boundaries enforced through directory structure, TypeScript module boundaries, and clear service interfaces.

### Consequences

**Positive:**

- Simple deployment: one application to build, deploy, and monitor.
- Easy local development: no need to run multiple services.
- Low operational overhead: no service mesh, API gateway, or distributed tracing needed.
- Module boundaries enforce clean separation without network overhead.
- Database transactions span all modules naturally (no distributed transactions).

**Negative:**

- All modules scale together (acceptable at this scale).
- A bug in one module could affect the entire application (mitigated by testing and error boundaries).
- Discipline required to maintain module boundaries (mitigated by code review and linting).

### Alternatives Considered

| Alternative                  | Why Rejected                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Microservices**            | Massive operational overhead for a small team. No independent scaling requirement. Distributed transactions would make dispensing much more complex. |
| **Serverless functions**     | Cold starts would impact perceived performance. Complex state management for transaction-heavy operations. Debugging is harder.                      |
| **Monolith without modules** | Risk of spaghetti code. Harder to reason about boundaries and dependencies. Modules are cheap to define and enforce.                                 |

---

## ADR-002: Next.js App Router with Server Components

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

MedLedger needs a React-based framework that supports server-side rendering, secure data fetching (database queries should not run in the browser), and modern React features. The team needs to choose between Next.js Pages Router, Next.js App Router, Remix, or a custom setup.

### Decision

Use **Next.js App Router** with React Server Components as the default rendering strategy.

### Consequences

**Positive:**

- Server Components reduce client-side JavaScript bundle.
- Data fetching happens on the server — no API layer needed for reads.
- Server Actions provide type-safe mutations without writing API endpoints.
- Built-in streaming, suspense boundaries, and loading states.
- Strong ecosystem, documentation, and community support.

**Negative:**

- App Router has a steeper learning curve than Pages Router.
- Some community packages may not yet fully support Server Components.
- "use client" boundary management requires care.

### Alternatives Considered

| Alternative              | Why Rejected                                                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| **Next.js Pages Router** | Mature but missing Server Components, Server Actions, and streaming. Would require more client-side code and API routes. |
| **Remix**                | Excellent form handling and data loading, but smaller ecosystem. Less community support for Supabase integration.        |
| **Vite + React SPA**     | No SSR. All data fetching would require API routes. Authentication is harder to secure (tokens in the browser).          |

---

## ADR-003: Supabase for Database and Authentication

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

MedLedger needs a PostgreSQL database with Row Level Security, an authentication system, and potentially file storage. The team needs to decide between self-managed PostgreSQL, managed database services, and full-stack Backend-as-a-Service platforms.

### Decision

Use **Supabase** for PostgreSQL hosting, authentication, and Row Level Security.

### Consequences

**Positive:**

- Managed PostgreSQL with automatic backups.
- Built-in authentication (email/password, with MFA support).
- Row Level Security as a first-class feature.
- Real-time subscriptions available if needed later.
- Good Next.js integration via `@supabase/ssr`.
- Generous free tier for development; reasonable Pro tier for production.

**Negative:**

- Vendor dependency: application logic is partially tied to Supabase APIs.
- Database is hosted externally (potential data residency concern — see OQ-010).
- Some PostgreSQL features may require raw SQL (not all operations are available through the SDK).
- Service role key management requires care.

### Alternatives Considered

| Alternative                 | Why Rejected                                                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Self-managed PostgreSQL** | Higher operational burden. Requires managing backups, auth, connection pooling, and security manually. Not appropriate for a small team.                                     |
| **PlanetScale (MySQL)**     | No PostgreSQL. No RLS equivalent. Foreign key handling differs significantly.                                                                                                |
| **Firebase**                | Not PostgreSQL. Document-based (Firestore) is a poor fit for relational, transaction-heavy data.                                                                             |
| **Neon DB + NextAuth**      | Viable. Neon provides serverless PostgreSQL. But splits auth and database into separate services, increasing integration complexity. Supabase provides both in one platform. |

### Migration Path

If Supabase becomes unsuitable, the application can migrate to any PostgreSQL host:

1. Export the database schema and data with `pg_dump`.
2. Replace the Supabase client with a standard PostgreSQL client (e.g., `pg`, Prisma, or Drizzle).
3. Replace Supabase Auth with NextAuth.js or a similar library.
4. RLS policies are standard PostgreSQL and will work on any PostgreSQL host.

---

## ADR-004: Zod for Validation (Client and Server)

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

Validation must happen on both client (for UX) and server (for security). Using different validation mechanisms risks drift between client and server rules.

### Decision

Use **Zod** for all input validation. Define schemas once and use them on both client (with React Hook Form) and server (in Server Actions).

### Consequences

**Positive:**

- Single source of truth for validation rules.
- TypeScript type inference from schemas (`z.infer<typeof schema>`).
- Excellent integration with React Hook Form via `@hookform/resolvers/zod`.
- Composable schemas (base → create → update variants).
- Good error message formatting.

**Negative:**

- Runtime validation library adds bundle size (mitigated: validation schemas can be tree-shaken; server-only validation adds zero client weight).
- Team must learn Zod's API (relatively simple).

### Alternatives Considered

| Alternative           | Why Rejected                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------- |
| **Yup**               | Similar capability but less TypeScript-native. Zod's type inference is stronger.                    |
| **AJV (JSON Schema)** | More verbose. Less ergonomic in TypeScript. JSON Schema is less intuitive than Zod's API.           |
| **Manual validation** | Error-prone, inconsistent, duplicated. Not acceptable for a system with financial and medical data. |

---

## ADR-005: Server Actions for Mutations (Not API Routes)

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

Next.js App Router supports both API Routes and Server Actions for handling mutations. The team needs to decide the primary pattern for write operations.

### Decision

Use **Server Actions** as the primary mechanism for mutations. API Routes are reserved for external integrations, webhooks, or cron triggers.

### Consequences

**Positive:**

- Type-safe: Server Actions receive and return typed data.
- Colocated with forms: clear association between UI and mutation.
- Built-in CSRF protection.
- Progressive enhancement: forms work without JavaScript (graceful degradation).
- No need to design or maintain REST endpoints for internal operations.

**Negative:**

- Less familiar pattern for developers used to REST APIs.
- Not suitable for external consumers (no public API).
- Debugging can be less transparent than explicit HTTP endpoints.

### Alternatives Considered

| Alternative                | Why Rejected                                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| **API Routes exclusively** | More boilerplate. Requires manual request/response handling, CSRF protection, and content-type negotiation.                       |
| **tRPC**                   | Excellent type safety but adds a dependency and abstraction layer that is redundant when Server Actions provide similar benefits. |

---

## ADR-006: Error Result Pattern (Not Thrown Exceptions)

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

Server Actions need to communicate success, validation errors, business rule violations, and unexpected failures to the UI. The choice is between throwing exceptions and returning typed result objects.

### Decision

Use a **typed result pattern** (`ActionResult<T>`) for expected outcomes. Reserve thrown exceptions for truly unexpected failures.

```typescript
type ActionResult<T> = { success: true; data: T } | { success: false; error: AppError };
```

### Consequences

**Positive:**

- UI always receives a predictable shape. No try/catch guessing.
- Compiler enforces handling of both success and error cases.
- Error codes enable structured UI handling (field errors, toast messages, redirects).
- Thrown exceptions remain for genuine bugs (crash reporting catches them).

**Negative:**

- Slightly more verbose than throwing.
- Team must consistently use the pattern (enforced by code review).

### Alternatives Considered

| Alternative                | Why Rejected                                                                                                                 |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **Throw for all errors**   | Catch blocks can't distinguish error types easily. Multiple catch blocks are messy. UI error handling becomes unpredictable. |
| **Return `null` on error** | Loses all error context. UI can't tell the user what went wrong.                                                             |

---

## ADR-007: PostgreSQL Functions (RPC) for Critical Transactions

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Proposed               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

Critical operations like dispensing involve multiple database writes that must be atomic: deducting batch stock, creating stock movements, recording dispensing items, updating prescription status, and logging audit events. These require database transactions.

The Supabase JavaScript SDK does not natively support multi-statement transactions. Options include using raw SQL with a direct PostgreSQL connection, using Supabase RPC to call PostgreSQL functions, or using a transaction-aware ORM.

### Decision

**Proposed:** Implement critical transaction logic as **PostgreSQL functions** called via Supabase RPC (`supabase.rpc('dispense_items', { ... })`).

### Consequences

**Positive:**

- Transaction boundary is tight: all operations happen in a single database round-trip.
- No multi-step transaction over multiple HTTP requests (which would require connection pooling awareness).
- PostgreSQL functions can use `SELECT FOR UPDATE` for row locking naturally.
- Performance: no network latency between transaction steps.

**Negative:**

- Business logic split between TypeScript (validation, authorization) and PostgreSQL (transaction execution).
- PostgreSQL functions are harder to unit test than TypeScript functions.
- Requires SQL expertise on the team.

### Alternatives Considered

| Alternative                       | Why Rejected                                                                                                                                                                      |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Drizzle ORM with transactions** | Would provide TypeScript-level transaction control. Adds a dependency but keeps all logic in TypeScript. **This is a viable alternative** and may be reconsidered during Phase 4. |
| **Prisma with `$transaction`**    | Similar to Drizzle but heavier. Prisma's abstraction may conflict with Supabase-specific features (RLS, Auth).                                                                    |
| **Raw `pg` client**               | Direct PostgreSQL connection. Viable but bypasses Supabase's connection pooling and auth integration.                                                                             |

> [!NOTE]
> This decision is **proposed**, not accepted. The final choice between Supabase RPC and Drizzle/pg transactions will be made during Phase 4 after evaluating the team's comfort with PostgreSQL functions and the complexity of the dispensing logic.

---

## ADR-008: Tailwind CSS for Styling

| Field               | Detail                 |
| ------------------- | ---------------------- |
| **Status**          | Accepted               |
| **Date**            | 2026-10-13             |
| **Decision Makers** | Tech4Edges Engineering |

### Context

The project requires a styling approach that is productive for a small team, consistent across the application, and compatible with shadcn/ui components.

### Decision

Use **Tailwind CSS** as the primary styling approach, per the project specification.

### Consequences

**Positive:**

- Utility-first approach enables rapid UI development.
- Consistent design tokens (colors, spacing, typography) configured via CSS `@theme` tokens in `src/app/globals.css` (Tailwind CSS v4).
- Excellent integration with shadcn/ui.
- No CSS naming conflicts or specificity issues.
- Easy responsive design with breakpoint prefixes.

**Negative:**

- HTML can become verbose with many utility classes (mitigated by extracting components).
- Requires familiarity with Tailwind's utility class naming.
- Custom designs may require extending the theme configuration.

### Alternatives Considered

| Alternative                     | Why Rejected                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------ |
| **CSS Modules**                 | More boilerplate. No design token system by default. Less compatible with shadcn/ui. |
| **Vanilla CSS**                 | Maximum flexibility but no design system enforcement. Risk of inconsistent styling.  |
| **Styled Components / Emotion** | Runtime CSS-in-JS has performance costs. Less compatible with Server Components.     |

---

## Decision Index

| ID      | Title                                          | Status   | Date       |
| ------- | ---------------------------------------------- | -------- | ---------- |
| ADR-001 | Modular Monolith Architecture                  | Accepted | 2026-10-13 |
| ADR-002 | Next.js App Router with Server Components      | Accepted | 2026-10-13 |
| ADR-003 | Supabase for Database and Authentication       | Accepted | 2026-10-13 |
| ADR-004 | Zod for Validation (Client and Server)         | Accepted | 2026-10-13 |
| ADR-005 | Server Actions for Mutations                   | Accepted | 2026-10-13 |
| ADR-006 | Error Result Pattern                           | Accepted | 2026-10-13 |
| ADR-007 | PostgreSQL Functions for Critical Transactions | Proposed | 2026-10-13 |
| ADR-008 | Tailwind CSS for Styling                       | Accepted | 2026-10-13 |
