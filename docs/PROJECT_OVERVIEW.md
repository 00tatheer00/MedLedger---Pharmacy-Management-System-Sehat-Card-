# MedLedger — Project Overview

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Draft — Awaiting Client Review
> **Developed by:** Tech4Edges

---

## 1. Purpose

MedLedger is a browser-based pharmacy management system designed for a private pharmacy operating inside DHQ Hospital, Kohat, Pakistan. It replaces manual paper-based workflows with a structured digital system covering:

- Patient and hospital admission record-keeping.
- Prescription capture and medicine dispensing (including partial and repeat dispensing).
- Medicine catalogue management, batch tracking, expiry monitoring, and stock control.
- Supplier management, purchasing, goods receiving, and supplier payables.
- Hospital claims, billing, finance approval, and payment tracking.
- Operational reports, notifications, role-based access control, and audit trails.

The system is intended for use by pharmacy staff, purchasing personnel, and authorized finance staff within the hospital environment.

---

## 2. Scope

### 2.1 In Scope

| Area                          | Description                                                                                                                           |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Patient Management**        | Register patients, record hospital admissions, link prescriptions to admissions.                                                      |
| **Prescriptions**             | Capture paper-based prescriptions digitally, associate prescribed items with the medicine catalogue.                                  |
| **Dispensing**                | Dispense medicines against prescriptions with support for partial dispensing and repeat dispensing. Track batch-level deductions.     |
| **Medicine Catalogue**        | Maintain a catalogue of medicines with dosage forms, strengths, and categories.                                                       |
| **Inventory Management**      | Track medicine batches, expiry dates, stock quantities, and stock movements (receipts, dispensing, adjustments, returns).             |
| **Supplier Management**       | Maintain supplier records, manage purchase orders, record goods receipts.                                                             |
| **Supplier Payables**         | Track supplier invoices and payments against purchase orders and receipts.                                                            |
| **Hospital Claims & Billing** | Generate claims against the hospital for dispensed medicines, track approval workflow and payment status.                             |
| **Reports**                   | Operational and financial reports including stock status, dispensing history, expiry alerts, purchase summaries, and claim summaries. |
| **Notifications**             | System-generated alerts for low stock, approaching expiry, pending approvals, and overdue payments.                                   |
| **Role-Based Access Control** | Configurable roles and permissions with enforcement at the server and database levels.                                                |
| **Audit Trail**               | Immutable log of sensitive operations (dispensing, stock adjustments, financial transactions, permission changes).                    |

### 2.2 Out of Scope

| Exclusion                                                    | Rationale                                                                                        |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Electronic prescribing by doctors                            | Prescriptions originate on paper. The system captures them digitally after the fact.             |
| Integration with external hospital information systems (HIS) | No HIS integration requirement has been confirmed. Can be revisited.                             |
| Online patient portal                                        | Patients do not interact with the system directly.                                               |
| Barcode/QR scanning                                          | Not confirmed as a requirement. Can be added in a future phase.                                  |
| Mobile application                                           | The system is browser-based. Responsive design will support tablet use.                          |
| Regulatory reporting (DRAP)                                  | Specific regulatory reporting formats have not been confirmed.                                   |
| Multi-pharmacy / multi-branch support                        | Single pharmacy deployment. Multi-tenancy is not required.                                       |
| Automated medicine ordering / reorder points                 | Not confirmed. The system will track stock levels; automated ordering is a future consideration. |

### 2.3 Future Considerations

These items are not in scope but may be evaluated in later phases:

- Barcode scanning for goods receipt and dispensing.
- Integration with external HIS or laboratory systems.
- SMS/WhatsApp notifications for patients.
- Automated reorder point alerts and suggested purchase orders.
- Regulatory compliance reporting (DRAP or provincial health authority).
- Multi-branch support if the pharmacy expands.

---

## 3. Stakeholders

| Role                     | Responsibility                                                                                |
| ------------------------ | --------------------------------------------------------------------------------------------- |
| **Pharmacy Manager**     | Oversees pharmacy operations, approves stock adjustments, manages staff access.               |
| **Pharmacist**           | Dispenses medicines, verifies prescriptions, manages day-to-day stock.                        |
| **Purchasing Staff**     | Creates purchase orders, manages supplier relationships, records goods receipts.              |
| **Finance Staff**        | Reviews hospital claims, processes approvals, tracks payments to/from suppliers and hospital. |
| **System Administrator** | Manages user accounts, roles, and system configuration.                                       |
| **Tech4Edges**           | Development team responsible for building, testing, and deploying MedLedger.                  |

> [!IMPORTANT]
> Final roles and their exact permissions must be confirmed with the client before production deployment. The roles listed above are based on initial understanding and are subject to change.

---

## 4. Assumptions

The following assumptions guide design decisions. Each must be validated with the client:

| ID   | Assumption                                                                                                                         | Status                           |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| A-01 | The pharmacy operates as a single location within DHQ Hospital, Kohat.                                                             | **Assumed**                      |
| A-02 | Prescriptions originate on paper and are entered into the system by pharmacy staff.                                                | **Assumed**                      |
| A-03 | All users access the system through modern web browsers (Chrome, Edge, Firefox).                                                   | **Assumed**                      |
| A-04 | The hospital has reliable internet connectivity for cloud-hosted Supabase access.                                                  | **Assumed — Needs Confirmation** |
| A-05 | Currency is Pakistani Rupees (PKR) for all financial transactions.                                                                 | **Assumed**                      |
| A-06 | The system does not need to operate offline.                                                                                       | **Assumed — Needs Confirmation** |
| A-07 | Medicine data (names, formulations) can be seeded from a standard reference or entered manually.                                   | **Assumed**                      |
| A-08 | The hospital claim process is internal (pharmacy bills the hospital) rather than insurance-based.                                  | **Assumed — Needs Confirmation** |
| A-09 | Realistic dummy data will be used during development and testing. This data must be clearly distinguished from production records. | **Confirmed**                    |
| A-10 | The system will be deployed to a cloud environment (Supabase-hosted PostgreSQL).                                                   | **Assumed**                      |

---

## 5. Constraints

| Constraint                     | Impact                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Browser-based only**         | No native mobile or desktop application. Must work well on tablets and desktops.                                            |
| **Single pharmacy**            | Architecture does not need multi-tenancy but should not preclude it.                                                        |
| **Small team**                 | Architecture and tooling must be maintainable by a small engineering team (1–3 developers).                                 |
| **Staff computer literacy**    | UI must be simple, clear, and forgiving. Minimal training should be required.                                               |
| **Unconfirmed business rules** | Claim rates, approval policies, and substitution rules must remain configurable. Hard-coding these values is not permitted. |
| **Data integrity over speed**  | Stock operations, dispensing, and financial transactions must prioritize correctness over performance.                      |

---

## 6. Success Criteria

| Criteria                                                                                    | Measurement                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Staff can register patients and record admissions.                                          | Functional test.                               |
| Paper prescriptions can be captured and linked to patients/admissions.                      | Functional test.                               |
| Medicines can be dispensed with batch-level stock deduction (including partial and repeat). | Transaction integrity test.                    |
| Stock levels are always accurate and auditable.                                             | Reconciliation test.                           |
| Purchase orders, goods receipts, and supplier payments are tracked end-to-end.              | Workflow test.                                 |
| Hospital claims can be generated, approved, and payment tracked.                            | Workflow test.                                 |
| All sensitive operations are logged in an immutable audit trail.                            | Audit log verification.                        |
| Role-based access prevents unauthorized actions at both UI and server levels.               | Security test.                                 |
| Common operations complete with sub-second perceived response time.                         | Performance benchmark (target, not guarantee). |
| Staff with limited computer experience can perform daily tasks after brief training.        | Usability observation.                         |

---

## 7. Environments

| Environment         | Purpose                                        | Data                             |
| ------------------- | ---------------------------------------------- | -------------------------------- |
| **Development**     | Feature development and debugging.             | Dummy/seed data only.            |
| **Staging/Testing** | Integration testing, UAT, and security review. | Dummy/seed data only.            |
| **Production**      | Live operations by pharmacy staff.             | Real patient and financial data. |

> [!CAUTION]
> Dummy data must never be deployed to or confused with production data. Environment-specific configuration and clear visual indicators (e.g., banner or color scheme) must distinguish non-production environments.

---

## 8. Document References

| Document                                                                                       | Purpose                                                       |
| ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [`ARCHITECTURE.md`](file:///t:/DHQ%20KOhat%20Project/docs/ARCHITECTURE.md)                     | System architecture, module responsibilities, and boundaries. |
| [`DATABASE_DESIGN.md`](file:///t:/DHQ%20KOhat%20Project/docs/DATABASE_DESIGN.md)               | Preliminary data model and integrity considerations.          |
| [`SECURITY_PLAN.md`](file:///t:/DHQ%20KOhat%20Project/docs/SECURITY_PLAN.md)                   | Security strategy and controls.                               |
| [`ENGINEERING_STANDARDS.md`](file:///t:/DHQ%20KOhat%20Project/docs/ENGINEERING_STANDARDS.md)   | Coding conventions, quality gates, and testing strategy.      |
| [`DEVELOPMENT_ROADMAP.md`](file:///t:/DHQ%20KOhat%20Project/docs/DEVELOPMENT_ROADMAP.md)       | Phased delivery plan.                                         |
| [`OPEN_QUESTIONS.md`](file:///t:/DHQ%20KOhat%20Project/docs/OPEN_QUESTIONS.md)                 | Unresolved decisions and risks.                               |
| [`ARCHITECTURE_DECISIONS.md`](file:///t:/DHQ%20KOhat%20Project/docs/ARCHITECTURE_DECISIONS.md) | Architectural decision records.                               |
