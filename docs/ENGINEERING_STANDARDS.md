# MedLedger — Engineering Standards

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Draft — Awaiting Review

---

## 1. Code Quality Foundation

### 1.1 Language and Compiler Settings

| Setting                 | Value                                                        | Rationale                                                                         |
| ----------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| **TypeScript**          | `strict: true`                                               | Catches null errors, implicit any, and other common mistakes at compile time.     |
| **No `any`**            | Enforced by ESLint rule `@typescript-eslint/no-explicit-any` | Forces proper typing. `unknown` is acceptable when the type is genuinely unknown. |
| **No unused variables** | `noUnusedLocals`, `noUnusedParameters`                       | Keeps code clean.                                                                 |
| **Strict null checks**  | Enabled via `strict`                                         | All nullable values must be explicitly handled.                                   |
| **Path aliases**        | `@/` maps to `src/`                                          | Clean imports: `import { Button } from '@/components/ui/button'`.                 |

### 1.2 Linting and Formatting

| Tool                    | Purpose                           | Configuration                                                                                    |
| ----------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------ |
| **ESLint**              | Code quality and error detection. | `next/core-web-vitals` + `@typescript-eslint/recommended`. Custom rules for project conventions. |
| **Prettier**            | Consistent code formatting.       | Single quotes, 2-space indentation, trailing commas, 100-character line width.                   |
| **lint-staged + Husky** | Pre-commit checks.                | Run ESLint and Prettier on staged files before every commit.                                     |

### 1.3 Naming Conventions

| Element                      | Convention                                             | Example                                          |
| ---------------------------- | ------------------------------------------------------ | ------------------------------------------------ |
| **Files (components)**       | PascalCase                                             | `PatientForm.tsx`, `DispensingTable.tsx`         |
| **Files (utilities, hooks)** | camelCase                                              | `usePatientSearch.ts`, `formatCurrency.ts`       |
| **Files (types, schemas)**   | camelCase                                              | `patient.types.ts`, `patient.schema.ts`          |
| **Files (server actions)**   | camelCase                                              | `patient.actions.ts`                             |
| **Components**               | PascalCase                                             | `export function PatientForm()`                  |
| **Functions**                | camelCase                                              | `function calculateTotal()`                      |
| **Constants**                | UPPER_SNAKE_CASE                                       | `const MAX_DISPENSING_ITEMS = 50`                |
| **Types/Interfaces**         | PascalCase                                             | `interface Patient {}`, `type DispensingResult`  |
| **Enums**                    | PascalCase (name), UPPER_SNAKE_CASE (values)           | `enum StockMovementType { RECEIPT, DISPENSING }` |
| **Database columns**         | snake_case                                             | `quantity_on_hand`, `created_at`                 |
| **Database tables**          | snake_case, plural                                     | `patients`, `medicine_batches`                   |
| **CSS classes**              | kebab-case (Tailwind utility classes are an exception) | `.patient-card`, `.stock-alert`                  |

### 1.4 Import Order

Enforce consistent import ordering via ESLint `import/order`:

```typescript
// 1. React / Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Core modules (@/core/...)
import { requirePermission } from '@/core/authorization';

// 4. Feature modules (@/modules/...)
import { patientService } from '@/modules/patients/services';

// 5. Shared components (@/components/...)
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/tables/data-table';

// 6. Local imports (relative)
import { PatientForm } from './PatientForm';
import type { PatientFormValues } from './types';
```

---

## 2. Validation Standards

### 2.1 Zod Schema Conventions

Every data boundary has a Zod schema. Schemas are defined once and reused:

```typescript
// modules/patients/schemas/patient.schema.ts

import { z } from 'zod';

// Base schema — shared fields
const patientBase = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  fatherName: z.string().min(2).max(100),
  cnic: z
    .string()
    .regex(/^\d{5}-\d{7}-\d$/, 'Invalid CNIC format')
    .optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.enum(['male', 'female', 'other']),
  phone: z.string().min(10).max(15).optional(),
  address: z.string().max(500).optional(),
});

// Create schema — used for new patient forms
export const createPatientSchema = patientBase;

// Update schema — all fields optional
export const updatePatientSchema = patientBase.partial();

// Type inference — single source of truth
export type CreatePatientInput = z.infer<typeof createPatientSchema>;
export type UpdatePatientInput = z.infer<typeof updatePatientSchema>;
```

### 2.2 Validation Locations

| Location         | Schema Used                            | Purpose                                        |
| ---------------- | -------------------------------------- | ---------------------------------------------- |
| Client-side form | `createPatientSchema`                  | Immediate field-level validation and feedback. |
| Server Action    | `createPatientSchema`                  | Authoritative validation. Reject if invalid.   |
| Database         | `CHECK` constraints, `NOT NULL`, types | Final safety net.                              |

### 2.3 Validation Rules

1. **Never trust client-side validation alone.** Server-side validation is mandatory.
2. **Use the same Zod schema** on both client and server to avoid drift.
3. **Monetary values** are validated as positive numbers with at most 2 decimal places.
4. **Quantities** are validated as positive integers (no fractional medicine units unless explicitly required).
5. **Dates** are validated using `z.coerce.date()` with appropriate range checks.
6. **Enum values** are validated against the exact allowed set, not loose strings.

---

## 3. Error Handling Standards

### 3.1 Error Result Pattern

Server Actions return typed results, never throw for expected errors:

```typescript
// core/errors/types.ts
export type ActionResult<T> = { success: true; data: T } | { success: false; error: AppError };

export interface AppError {
  code: ErrorCode;
  message: string;
  fields?: Record<string, string[]>; // Field-level validation errors
}

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'BUSINESS_RULE_VIOLATION'
  | 'INSUFFICIENT_STOCK'
  | 'INTERNAL_ERROR';
```

### 3.2 Server Action Pattern

```typescript
// modules/patients/actions/patient.actions.ts
'use server';

export async function createPatient(formData: CreatePatientInput): Promise<ActionResult<Patient>> {
  try {
    // 1. Authentication
    const user = await getAuthenticatedUser();
    if (!user)
      return { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } };

    // 2. Authorization
    const allowed = await hasPermission(user, 'patients:create');
    if (!allowed)
      return { success: false, error: { code: 'FORBIDDEN', message: 'Not authorized' } };

    // 3. Validation
    const parsed = createPatientSchema.safeParse(formData);
    if (!parsed.success) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: formatZodErrors(parsed.error),
        },
      };
    }

    // 4. Business logic
    const patient = await patientService.create(parsed.data, user.id);

    // 5. Revalidate
    revalidatePath('/patients');

    return { success: true, data: patient };
  } catch (error) {
    // Unexpected errors only
    logger.error('createPatient failed', { error, userId: user?.id });
    return {
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    };
  }
}
```

### 3.3 Error Display in UI

```typescript
// In a client component
const result = await createPatient(formValues);

if (!result.success) {
  switch (result.error.code) {
    case 'VALIDATION_ERROR':
      // Show field-level errors on the form
      setFieldErrors(result.error.fields);
      break;
    case 'INSUFFICIENT_STOCK':
      // Show a clear business error message
      toast.error(result.error.message);
      break;
    default:
      // Show generic error
      toast.error('Something went wrong. Please try again.');
  }
}
```

---

## 4. UI Component Standards

### 4.1 Component Architecture

| Component Type                  | Location                               | Conventions                                                            |
| ------------------------------- | -------------------------------------- | ---------------------------------------------------------------------- |
| **shadcn/ui primitives**        | `src/components/ui/`                   | Installed via CLI. Customized through Tailwind. Not modified directly. |
| **Shared composite components** | `src/components/` subfolders           | Reusable across modules: forms, tables, layout, feedback.              |
| **Module-specific components**  | `src/modules/<module>/components/`     | Only used within that module. May compose shared components.           |
| **Page components**             | `src/app/(dashboard)/<route>/page.tsx` | Server Components by default. Compose module components.               |

### 4.2 Server vs Client Components

| Default              | Use Client Component When                                                        |
| -------------------- | -------------------------------------------------------------------------------- |
| **Server Component** | The component needs interactivity (forms, dropdowns, modals, real-time updates). |
|                      | The component uses browser APIs (`useState`, `useEffect`, event handlers).       |
|                      | The component needs client-side state management.                                |

Guideline: **Start with Server Components. Add `'use client'` only when required.** The boundary should be as deep in the tree as possible.

### 4.3 Required UI States

Every data-driven view must handle these states:

| State                    | Implementation                                                                                  |
| ------------------------ | ----------------------------------------------------------------------------------------------- |
| **Loading**              | Skeleton loaders or spinner with descriptive text. Never a blank screen.                        |
| **Empty**                | Friendly message with a call-to-action (e.g., "No patients found. Register a new patient.").    |
| **Success**              | Toast notification for mutations. Updated data in the view.                                     |
| **Error**                | Inline error for forms. Toast or error banner for general errors. Retry option when applicable. |
| **Offline/Connectivity** | Banner indicating network issues (if connectivity monitoring is implemented).                   |

### 4.4 Form Standards

1. **All forms use Zod schemas** for validation (via React Hook Form or a similar library).
2. **Submit buttons are disabled** during submission to prevent double submission.
3. **Confirmation dialogs** before destructive or irreversible actions (dispensing, stock adjustments, deletions).
4. **Autofocus** on the first field when a form opens.
5. **Keyboard navigation** works correctly (Tab order, Enter to submit).
6. **Field-level errors** display immediately below the relevant field.

### 4.5 Table Standards

1. **Server-side pagination** for all tables with more than ~50 rows.
2. **Sortable columns** where appropriate (server-side for large datasets).
3. **Debounced search** (300ms delay) to avoid excessive server requests.
4. **Column visibility** configurable by the user where tables have many columns.
5. **Row actions** accessible via a dropdown menu or action column.
6. **Empty state** when no records match filters.

---

## 5. Database Query Standards

### 5.1 Query Rules

1. **Parameterized queries only.** Never concatenate user input into SQL strings.
2. **Queries live in `modules/<module>/queries/`.** Services never construct SQL directly.
3. **All queries return typed results.** Use TypeScript interfaces that match the expected shape.
4. **Pagination is server-side.** Use `LIMIT`/`OFFSET` or cursor-based pagination for large datasets.
5. **Select only needed columns.** Avoid `SELECT *` in production queries.

### 5.2 Transaction Patterns

Critical operations use PostgreSQL transactions:

```typescript
// Conceptual — actual implementation will use Supabase RPC or transaction helpers
async function dispenseItems(prescriptionId: string, items: DispenseItemInput[]) {
  return await db.transaction(async (tx) => {
    for (const item of items) {
      // Lock the batch row
      const batch = await tx.query('SELECT * FROM medicine_batches WHERE id = $1 FOR UPDATE', [
        item.batchId,
      ]);

      // Verify stock
      if (batch.quantity_on_hand < item.quantity) {
        throw new InsufficientStockError(batch, item.quantity);
      }

      // Deduct stock
      await tx.query(
        'UPDATE medicine_batches SET quantity_on_hand = quantity_on_hand - $1 WHERE id = $2',
        [item.quantity, item.batchId],
      );

      // Record movement
      await tx.query('INSERT INTO stock_movements (...) VALUES (...)', [/* movement details */]);
    }

    // Record audit event within the same transaction
    await tx.query('INSERT INTO audit_events (...) VALUES (...)', [/* ... */]);

    // COMMIT happens automatically if no error is thrown
  });
}
```

---

## 6. Testing Strategy

### 6.1 Testing Layers

| Layer                 | Tool                     | Coverage Target                                          | What to Test                                                            |
| --------------------- | ------------------------ | -------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Unit Tests**        | Vitest                   | Service functions, validation schemas, utility functions | Business logic correctness, edge cases, error handling.                 |
| **Integration Tests** | Vitest + Supabase local  | Database queries, transaction integrity, RLS policies    | Data flows correctly through the stack. Transactions behave atomically. |
| **Component Tests**   | Vitest + Testing Library | Interactive UI components                                | Form validation, user interactions, state transitions.                  |
| **End-to-End Tests**  | Playwright               | Critical user flows                                      | Dispensing workflow, login flow, claims submission.                     |

### 6.2 What Must Be Tested

| Area                       | Minimum Test Coverage                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **Dispensing transaction** | Stock deduction, partial dispensing, insufficient stock, concurrent access, duplicate prevention. |
| **Authorization**          | Every Server Action rejects unauthorized users. RLS policies deny access for wrong roles.         |
| **Validation**             | Every Zod schema with valid, invalid, and edge-case inputs.                                       |
| **Stock calculations**     | Batch quantity never goes negative. Movement sum equals quantity on hand.                         |
| **Financial calculations** | Payment totals, claim amounts, rounding behavior.                                                 |

### 6.3 Testing Rules

1. **No test passes by default.** Tests must verify specific behavior, not just "no error thrown."
2. **Tests must not depend on execution order.** Each test sets up its own state.
3. **Database tests use transactions that roll back.** No test leaves side effects.
4. **Seed data is separate from test data.** Tests create their own records.
5. **Flaky tests are fixed immediately** or removed with a tracking issue.
6. **Do not claim tests pass unless they were actually executed** and the results are available.

### 6.4 Test File Conventions

```
src/
├── modules/
│   └── patients/
│       ├── services/
│       │   ├── patient.service.ts
│       │   └── __tests__/
│       │       └── patient.service.test.ts
│       ├── schemas/
│       │   ├── patient.schema.ts
│       │   └── __tests__/
│       │       └── patient.schema.test.ts
│       └── queries/
│           ├── patient.queries.ts
│           └── __tests__/
│               └── patient.queries.test.ts
```

---

## 7. Performance Standards

### 7.1 Performance Targets

| Metric               | Target                   | Measurement                                       |
| -------------------- | ------------------------ | ------------------------------------------------- |
| **Page navigation**  | < 500ms perceived        | Time from click to meaningful content visible.    |
| **Form submission**  | < 1s response            | Time from submit to success/error feedback.       |
| **Search results**   | < 500ms after debounce   | Time from last keystroke to results displayed.    |
| **Dashboard load**   | < 2s initial             | Time to fully render dashboard with summary data. |
| **Database queries** | < 100ms for simple reads | Server-side query execution time.                 |

> [!NOTE]
> These are engineering benchmarks to guide implementation, not contractual guarantees. Data integrity takes priority over speed in all cases.

### 7.2 Performance Rules

1. **Server-side pagination** for all list views. Never load thousands of records into the browser.
2. **Debounce search inputs** (300ms default).
3. **Index database queries** that appear in pagination, search, or filtering.
4. **Use `EXPLAIN ANALYZE`** to verify query plans for critical paths.
5. **Avoid N+1 queries.** Use joins or batch loading for related data.
6. **Lazy-load non-critical UI** (charts, secondary data, below-the-fold content).
7. **Measure before optimizing.** Do not add caching or optimization without evidence of a problem.

---

## 8. Git and Version Control Standards

### 8.1 Branching Strategy

| Branch           | Purpose                          | Merges Into                  |
| ---------------- | -------------------------------- | ---------------------------- |
| `main`           | Production-ready code.           | —                            |
| `develop`        | Integration branch for features. | `main` (via release process) |
| `feature/<name>` | Individual feature development.  | `develop`                    |
| `fix/<name>`     | Bug fixes.                       | `develop` or `main` (hotfix) |

### 8.2 Commit Messages

Follow Conventional Commits:

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

Examples:

- `feat(dispensing): add partial dispensing support`
- `fix(inventory): prevent negative stock on concurrent dispense`
- `docs(security): update RLS policy documentation`
- `test(patients): add validation edge case tests`

### 8.3 Pull Request Standards

1. Every PR has a clear title and description of what changed and why.
2. PRs reference the relevant issue or phase number.
3. At least one code review before merging (when team size allows).
4. All CI checks must pass before merging.
5. Squash and merge to keep history clean.

---

## 9. Logging Standards

### 9.1 Log Levels

| Level   | Use Case                                                             |
| ------- | -------------------------------------------------------------------- |
| `error` | Unexpected failures. Requires investigation.                         |
| `warn`  | Recoverable issues. Potential problems.                              |
| `info`  | Significant business events (dispensing completed, claim submitted). |
| `debug` | Detailed diagnostic information. Disabled in production.             |

### 9.2 Logging Rules

1. **Never log sensitive data:** passwords, tokens, full CNIC, session keys.
2. **Always log:** user ID, action, entity type, entity ID, timestamp.
3. **Use structured logging** (JSON format) for machine parseability.
4. **Application logs are separate from audit logs.** Audit logs are in the database; application logs are in the hosting platform's log system.
5. **Log at the service layer,** not in queries or components.

---

## 10. Dependency Management

### 10.1 Rules

1. **Minimize dependencies.** Every dependency is a maintenance liability.
2. **Pin major versions.** Use `^` for minor/patch updates only.
3. **Audit dependencies** for known vulnerabilities (`npm audit`) before each release.
4. **No experimental or alpha dependencies** in production.
5. **Document why** non-obvious dependencies are included.

### 10.2 Approved Stack (Final versions determined at implementation)

| Category      | Package                                          | Purpose                                        |
| ------------- | ------------------------------------------------ | ---------------------------------------------- |
| Framework     | `next`                                           | Application framework.                         |
| Language      | `typescript`                                     | Type safety.                                   |
| Styling       | `tailwindcss`                                    | Utility-first CSS.                             |
| UI Components | `@shadcn/ui` (CLI-installed)                     | Accessible, composable components.             |
| Validation    | `zod`                                            | Schema validation and type inference.          |
| Database      | `@supabase/supabase-js`                          | Supabase client.                               |
| Auth          | `@supabase/ssr`                                  | Server-side Supabase auth helpers for Next.js. |
| Forms         | `react-hook-form` + `@hookform/resolvers`        | Form state and Zod integration.                |
| Date handling | `date-fns`                                       | Lightweight date utilities.                    |
| Tables        | `@tanstack/react-table`                          | Headless table logic.                          |
| Testing       | `vitest`, `@testing-library/react`, `playwright` | Testing framework.                             |
| Linting       | `eslint`, `prettier`                             | Code quality.                                  |

> Additional dependencies require justification and review. "It saves a few lines of code" is not sufficient justification for adding a dependency.
