# MedLedger — Open Questions

> **Version:** 0.1.0 (Phase 1 — Planning)
> **Last Updated:** 2026-10-13
> **Status:** Active — Items require client/team input before implementation

---

## How to Use This Document

Each open question has:

- **ID**: For cross-referencing from other documents.
- **Priority**: `Critical` (blocks implementation), `High` (affects design decisions), `Medium` (can be deferred with a reasonable default).
- **Status**: `Open`, `In Discussion`, `Resolved`.
- **Blocking Phase**: Which development phase cannot proceed without an answer.
- **Default Assumption**: What we will assume if no answer is received. The assumption is clearly marked and can be overridden at any time.

---

## Critical Questions (Block Implementation)

### OQ-001: Hospital Claim Rate Structure

| Field                  | Detail                                                                                                                                                                                                                                    |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🔴 Critical                                                                                                                                                                                                                               |
| **Status**             | Open                                                                                                                                                                                                                                      |
| **Blocking Phase**     | Phase 11 (Claims & Hospital Billing)                                                                                                                                                                                                      |
| **Question**           | How does the pharmacy charge the hospital for dispensed medicines? Is it a fixed rate per medicine, a markup percentage on cost, a flat fee per prescription, or a different formula? Are rates different for inpatients vs. outpatients? |
| **Why It Matters**     | The claim generation logic depends entirely on the rate structure. Incorrect assumptions would produce wrong financial records.                                                                                                           |
| **Default Assumption** | The system will support configurable per-medicine rates stored in the database. The actual rates will be entered by an authorized user. No rates will be hard-coded or invented.                                                          |

---

### OQ-002: Claim Approval Workflow

| Field                  | Detail                                                                                                                                                                                                                                   |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🔴 Critical                                                                                                                                                                                                                              |
| **Status**             | Open                                                                                                                                                                                                                                     |
| **Blocking Phase**     | Phase 11 (Claims & Hospital Billing)                                                                                                                                                                                                     |
| **Question**           | What is the exact claim approval workflow? Who reviews claims? Can claims be partially approved (some items approved, others rejected)? How many approval levels exist? Is there a monetary threshold that triggers additional approval? |
| **Why It Matters**     | The approval workflow determines the state machine and the permission model for claims.                                                                                                                                                  |
| **Default Assumption** | Single-level approval by an authorized finance user. Claims can be approved, partially approved (with item-level decisions), rejected, or returned for revision.                                                                         |

---

### OQ-003: Final Role Definitions and Permissions

| Field                  | Detail                                                                                                                                                                                               |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🔴 Critical                                                                                                                                                                                          |
| **Status**             | Open                                                                                                                                                                                                 |
| **Blocking Phase**     | Phase 4 (Auth & RLS) — can start with preliminary roles, but must be finalized before Phase 10.                                                                                                      |
| **Question**           | What are the final user roles? What specific actions can each role perform? Can a user have multiple roles? Are there any actions that require dual authorization (two people to approve)?           |
| **Why It Matters**     | Roles drive RLS policies, UI visibility, and server-side authorization. Getting this wrong means rebuilding security policies.                                                                       |
| **Default Assumption** | Five roles as documented in `SECURITY_PLAN.md`: System Administrator, Pharmacy Manager, Pharmacist, Purchasing Staff, Finance Staff. Users have exactly one role. No dual authorization requirement. |

---

### OQ-004: Internet Connectivity Reliability

| Field                  | Detail                                                                                                                                                                                                                                       |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🔴 Critical                                                                                                                                                                                                                                  |
| **Status**             | Open                                                                                                                                                                                                                                         |
| **Blocking Phase**     | Phase 2 (Architecture decision: cloud-only vs. offline-capable).                                                                                                                                                                             |
| **Question**           | How reliable is the internet connection at DHQ Hospital, Kohat? Are there frequent outages? Is there a backup connection? Would the pharmacy need to continue operating during internet downtime?                                            |
| **Why It Matters**     | If connectivity is unreliable, the architecture may need offline-capable features (local database, sync). This is a fundamental architecture decision that is difficult to retrofit.                                                         |
| **Default Assumption** | Internet is reasonably reliable. The system will show a connectivity warning banner when offline but will not support offline operation in the initial release. If this assumption is wrong, offline capability must be added as a priority. |

---

## High-Priority Questions (Affect Design)

### OQ-005: Multi-Factor Authentication (MFA)

| Field                  | Detail                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟡 High                                                                                                                                           |
| **Status**             | Open                                                                                                                                              |
| **Blocking Phase**     | Phase 4 (Auth)                                                                                                                                    |
| **Question**           | Does the pharmacy require MFA for any or all users? Are there regulatory requirements for healthcare system authentication in Khyber Pakhtunkhwa? |
| **Why It Matters**     | MFA adds a layer of security but also adds friction for staff with limited computer experience.                                                   |
| **Default Assumption** | MFA is not required for the initial release. The system uses Supabase Auth which supports MFA, so it can be enabled later without code changes.   |

---

### OQ-006: Medicine Substitution Rules

| Field                  | Detail                                                                                                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟡 High                                                                                                                                                                                                         |
| **Status**             | Open                                                                                                                                                                                                            |
| **Blocking Phase**     | Phase 10 (Dispensing)                                                                                                                                                                                           |
| **Question**           | Can a pharmacist substitute a prescribed medicine with a generic equivalent or another brand? If so, what are the rules? Does the prescriber need to be consulted? Must substitutions be approved by a manager? |
| **Why It Matters**     | Substitution logic affects the dispensing workflow and audit requirements.                                                                                                                                      |
| **Default Assumption** | Substitution is allowed with pharmacist discretion. The dispensing record logs the original prescribed medicine and the actually dispensed medicine if different. No automated substitution suggestion.         |

---

### OQ-007: Data Retention and Privacy Requirements

| Field                  | Detail                                                                                                                                                                                                                                                                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Priority**           | 🟡 High                                                                                                                                                                                                                                                                                                                  |
| **Status**             | Open                                                                                                                                                                                                                                                                                                                     |
| **Blocking Phase**     | Phase 4 (Database design) — affects retention policies.                                                                                                                                                                                                                                                                  |
| **Question**           | Are there specific data retention requirements under Pakistani law (e.g., DRAP regulations, provincial health authority requirements) for patient records, prescription records, and financial records? Is there a minimum retention period? Are there privacy requirements for patient data (consent, access controls)? |
| **Why It Matters**     | Determines retention policies, purging schedules, and potentially the level of data encryption needed.                                                                                                                                                                                                                   |
| **Default Assumption** | Patient and financial records retained indefinitely (soft delete). Audit records retained for 7 years minimum. No specific privacy legislation confirmed.                                                                                                                                                                |

---

### OQ-008: Stock Adjustment Approval Threshold

| Field                  | Detail                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟡 High                                                                                                                                                                |
| **Status**             | Open                                                                                                                                                                   |
| **Blocking Phase**     | Phase 8 (Inventory)                                                                                                                                                    |
| **Question**           | Do stock adjustments require manager approval? Is there a quantity or value threshold above which approval is needed? Who can approve?                                 |
| **Why It Matters**     | Affects the stock adjustment workflow — simple immediate adjustment vs. approval queue.                                                                                |
| **Default Assumption** | All stock adjustments require a reason but are immediately effective (no approval workflow). Manager review via audit log. Approval workflow can be added if required. |

---

### OQ-009: Backup and Disaster Recovery Requirements

| Field                  | Detail                                                                                                                                                                                                           |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟡 High                                                                                                                                                                                                          |
| **Status**             | Open                                                                                                                                                                                                             |
| **Blocking Phase**     | Phase 14 (Deployment) — but must be planned earlier.                                                                                                                                                             |
| **Question**           | What is the acceptable data loss window (Recovery Point Objective)? How quickly must the system be restored after a failure (Recovery Time Objective)? Is there a specific backup requirement from the hospital? |
| **Why It Matters**     | Determines backup frequency, recovery procedures, and potentially the Supabase plan tier (PITR requires Pro plan).                                                                                               |
| **Default Assumption** | Daily automatic backups with point-in-time recovery (Supabase Pro plan). RPO: 24 hours. RTO: 4 hours.                                                                                                            |

---

### OQ-010: Deployment and Hosting Preferences

| Field                  | Detail                                                                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Priority**           | 🟡 High                                                                                                                                                                                                                              |
| **Status**             | Open                                                                                                                                                                                                                                 |
| **Blocking Phase**     | Phase 14 (Deployment)                                                                                                                                                                                                                |
| **Question**           | Where should the application be hosted? Vercel (recommended for Next.js), a VPS, or on-premises? Does the hospital have any data residency requirements (data must be stored in Pakistan)? Is there a budget constraint for hosting? |
| **Why It Matters**     | Affects deployment pipeline, infrastructure costs, and potentially data residency compliance. Supabase regions may not include Pakistan.                                                                                             |
| **Default Assumption** | Vercel for the application. Supabase Cloud for the database (nearest available region). No confirmed data residency requirement.                                                                                                     |

---

## Medium-Priority Questions (Can Defer)

### OQ-011: Patient Identification

| Field                  | Detail                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Priority**           | 🟢 Medium                                                                                                                                                                      |
| **Status**             | Open                                                                                                                                                                           |
| **Blocking Phase**     | Phase 6 (Patients)                                                                                                                                                             |
| **Question**           | How are patients identified? Is the MR Number (Medical Record Number) assigned by the hospital? Is CNIC always available? Are there walk-in patients without hospital records? |
| **Why It Matters**     | Affects patient registration flow and uniqueness constraints.                                                                                                                  |
| **Default Assumption** | MR Number is the primary identifier, assigned by the pharmacy system. CNIC is optional but recommended. Walk-in patients are supported (no admission required).                |

---

### OQ-012: Prescription Format and Content

| Field                  | Detail                                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟢 Medium                                                                                                                                                                               |
| **Status**             | Open                                                                                                                                                                                    |
| **Blocking Phase**     | Phase 7 (Prescriptions)                                                                                                                                                                 |
| **Question**           | What information is typically included on a paper prescription at DHQ Hospital? Is the prescriber's name and license number always present? Are prescriptions numbered by the hospital? |
| **Why It Matters**     | Determines which fields are required vs. optional in the prescription capture form.                                                                                                     |
| **Default Assumption** | Prescription number is system-generated. Prescriber name is free text (not linked to a doctor directory). Items include medicine name, quantity, and dosage instructions.               |

---

### OQ-013: Reporting Frequency and Format

| Field                  | Detail                                                                                                                                                                     |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟢 Medium                                                                                                                                                                  |
| **Status**             | Open                                                                                                                                                                       |
| **Blocking Phase**     | Phase 12 (Reports)                                                                                                                                                         |
| **Question**           | What reports does the pharmacy currently generate manually? Who receives these reports? What format is preferred (on-screen, PDF, Excel)? How often are reports generated? |
| **Why It Matters**     | Determines report design and export functionality.                                                                                                                         |
| **Default Assumption** | On-screen reports with CSV export. PDF export is a nice-to-have for a later iteration. Daily/monthly reporting periods.                                                    |

---

### OQ-014: Barcode or QR Code Support

| Field                  | Detail                                                                                                                                                                       |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Priority**           | 🟢 Medium                                                                                                                                                                    |
| **Status**             | Open                                                                                                                                                                         |
| **Blocking Phase**     | Future phase (not in current scope).                                                                                                                                         |
| **Question**           | Would barcode scanning for medicine identification during goods receiving or dispensing be valuable? Are medicines currently barcoded? Is there a barcode scanner available? |
| **Why It Matters**     | Barcode support could significantly reduce data entry errors but requires hardware.                                                                                          |
| **Default Assumption** | Not in scope for the initial release. Architecture will not preclude adding it later.                                                                                        |

---

### OQ-015: Notification Delivery Channels

| Field                  | Detail                                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Priority**           | 🟢 Medium                                                                                                          |
| **Status**             | Open                                                                                                               |
| **Blocking Phase**     | Phase 12 (Notifications)                                                                                           |
| **Question**           | Should notifications be in-app only, or also via email/SMS/WhatsApp? If external notifications, who receives them? |
| **Why It Matters**     | External notification channels require additional infrastructure (email service, SMS gateway).                     |
| **Default Assumption** | In-app notifications only for the initial release.                                                                 |

---

### OQ-016: Currency and Tax Handling

| Field                  | Detail                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Priority**           | 🟢 Medium                                                                                                                      |
| **Status**             | Open                                                                                                                           |
| **Blocking Phase**     | Phase 9 (Purchasing) / Phase 11 (Claims)                                                                                       |
| **Question**           | Are all transactions in Pakistani Rupees? Is sales tax applicable to medicine purchases or hospital claims? If so, what rates? |
| **Why It Matters**     | Affects financial calculations and invoice/claim totals.                                                                       |
| **Default Assumption** | All transactions in PKR. No sales tax calculations in the initial version. Tax handling can be added as a configuration.       |

---

### OQ-017: Number of Concurrent Users

| Field                  | Detail                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------- |
| **Priority**           | 🟢 Medium                                                                               |
| **Status**             | Open                                                                                    |
| **Blocking Phase**     | Phase 13 (Performance)                                                                  |
| **Question**           | How many pharmacy staff will use the system simultaneously? Are there peak usage times? |
| **Why It Matters**     | Affects performance testing scenarios and hosting capacity planning.                    |
| **Default Assumption** | 5–15 concurrent users. Single pharmacy location.                                        |

---

## Resolution Log

| ID  | Question | Resolution                 | Resolved Date | Resolved By |
| --- | -------- | -------------------------- | ------------- | ----------- |
| —   | —        | No questions resolved yet. | —             | —           |
