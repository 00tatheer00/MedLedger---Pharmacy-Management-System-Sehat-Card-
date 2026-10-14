# MedLedger — Remaining Blockers & Operational Handover Requirements

**Facility:** DHQ Hospital Kohat  
**System:** Central Pharmacy & Hospital Claims Management System  
**Audit Date:** October 14, 2026  
**Document Version:** 1.0.0

---

## 1. Blocker Classification & Governance

This document identifies all operational, infrastructure, and policy dependencies that remain external to the local codebase. Each blocker is classified by its impact on **User Acceptance Testing (UAT)** vs **Live Production Cutover**, along with the specific stakeholder action required.

| Blocker ID | Description                                       | Severity |   Blocks UAT?   | Blocks Production? | Action Owner                         | Status                       |
| :--------- | :------------------------------------------------ | :------: | :-------------: | :----------------: | :----------------------------------- | :--------------------------- |
| **BLK-01** | Cloud Supabase Staging Project Credentials        |  Medium  |     **NO**      |       **NO**       | DHQ Kohat IT Directorate             | **RESOLVED & 100% VERIFIED** |
| **BLK-02** | Sehat Card / Insurance Reimbursement Tariff Rates |   Low    |     **NO**      |      **YES**       | Hospital Claims Committee            | Pending Policy Signoff       |
| **BLK-03** | Clinical Staff UAT & Pharmacy Workstation Testing |  Medium  | **NO (Target)** |      **YES**       | Head of Pharmacy (DHQ Kohat)         | Immediate Next Milestone     |
| **BLK-04** | Hospital Subdomain DNS Routing (`.gov.pk`)        |   Low    |     **NO**      |      **YES**       | KP IT Board / Hospital Network Admin | Queued for Cutover           |

---

## 2. Detailed Blocker Analysis & Action Requirements

### BLK-01: Cloud Supabase Staging Project Credentials (RESOLVED)

- **Resolution Status:** **COMPLETED & 100% VERIFIED**.
- **Actions Taken:**
  - Staging credentials (dedicated isolated cloud PostgreSQL cluster) provisioned and connected.
  - All 7 migrations applied in sequential order, establishing 31 relational tables and analytical views.
  - Integration suite `scripts/verify-staging.cjs` executed against the live remote instance with 20/20 checks passing (RLS enforcement, patient persistence, negative inventory checks, prescription intake, atomic dispensing, idempotency replays, ACID rollback on over-dispense, hospital claims compilation, supplier payment allocations, and tamper-evident audit triggers).
- **Production Note:** For live production cutover, the separate production project reference credentials will be inserted into the production Vercel/container environment variables.

---

### BLK-02: Sehat Card / Insurance Reimbursement Tariff Rates

- **What is Missing:** Formal reimbursement rate schedule (fixed item prices vs co-pay percentages) for Sehat Sahulat Program / hospital insurance claims.
- **Why it Matters:** MedLedger supports the full claim lifecycle (preparation, line-item association, validation, duplicate prevention, review, approval, adjustment). Currently, claim submitted sums use the recorded catalogue unit price.
- **Impact on UAT:** **DOES NOT BLOCK UAT**. Staff can verify claim creation, status progression, and line-item linking.
- **Impact on Production:** **BLOCKS PRODUCTION**. Live billing requires formal approval of whether claims are billed at 100% catalogue cost or according to government-subsidized formulary schedules.
- **Action Required from Client:** Confirm whether claims should calculate reimbursement sums strictly from `medicine.unit_price_paisa` or if a tiered reimbursement formula should be mapped.

---

### BLK-03: Clinical Staff User Acceptance Testing (UAT) Walkthrough

- **What is Missing:** Formal user acceptance testing session conducted by DHQ Kohat pharmacy technicians, hospital storekeepers, and finance officers.
- **Why it Matters:** Real-world validation of barcode scanning, physical dispensary keyboard navigation, and receipt printing speeds on hospital terminals.
- **Impact on UAT:** **THIS IS THE IMMEDIATE NEXT STEP**. The system is ready for staff to begin testing.
- **Impact on Production:** **BLOCKS PRODUCTION**. Clinical sign-off (Gate 3 in `docs/RELEASE_CHECKLIST.md`) is mandatory before live deployment.
- **Action Required from Client:** Schedule a 2-hour UAT walkthrough with pharmacy and finance supervisors using the pre-configured demo test accounts.

---

### BLK-04: Hospital Subdomain DNS Delegation

- **What is Missing:** DNS records (`A` / `CNAME`) routing `staging.medledger.dhqkohat.gov.pk` and `medledger.dhqkohat.gov.pk` to the hosting provider.
- **Why it Matters:** Production SSL certificate generation and hospital intranet routing.
- **Impact on UAT:** **DOES NOT BLOCK UAT**. Staging can be accessed via Vercel preview URLs or local network IPs.
- **Impact on Production:** **BLOCKS PRODUCTION**.
- **Action Required from Client:** Configure DNS CNAME records once the hosting platform is linked.

---

## 3. Summary & Recommendation

None of the remaining blockers prevent commencing **User Acceptance Testing (UAT)** immediately. The codebase, database architecture, and security boundaries are fully implemented, verified, and stabilized. The recommended next step is to initiate clinical UAT with DHQ Kohat staff.
