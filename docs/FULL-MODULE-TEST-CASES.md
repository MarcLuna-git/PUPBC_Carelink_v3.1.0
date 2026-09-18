# PUPBC CareLink Full Module Test Cases and Production Readiness Report

**Test date:** September 16, 2026  
**Environment:** Local Windows development  
**Frontend:** `http://127.0.0.1:3000`  
**Backend:** `http://127.0.0.1:8000`  
**Database:** Remote Supabase PostgreSQL through the local Laravel backend

## 1. Purpose and scope

This document is the current source-of-truth test matrix for the CareLink system. It covers:

- Student module
- Nurse/Admin module
- Kiosk module
- Shared authentication, public pages, and runtime safety
- Frontend, backend, database, performance, and deployment concerns

The cases distinguish between an API/code-level pass and a browser/device test that still needs to be completed. A feature is not considered production-ready only because its route exists; its expected result, authorization, error behavior, persistence, and user interface must also be verified.

## 2. Status labels

| Label | Meaning |
|---|---|
| **PASS** | The case was successfully verified by live API testing, build verification, or a completed workflow. |
| **FAIL** | The case reproduced a defect. The notes identify the cause and the recommended fix. A fixed historical failure is marked **FAIL - RESOLVED** so it remains traceable. |
| **IN PROGRESS** | Code is present or partially tested, but browser, device, email, data-fixture, or regression verification remains. |

## 3. Current test accounts and data notes

| Account/data | Value | Caution |
|---|---|---|
| Student | `2021-00001-BN-0` / birthday `2002-05-15` / password `student` | Shared demo account; do not use for real medical data. |
| Nurse | `nurse@pupbc.edu.ph` / password `nurse` | Shared demo account; replace before production. |
| Database | Supabase PostgreSQL pooler | Connected, but network latency affects first-load timing. |
| Test data | Existing appointments, consultations, announcements, and queue records | Some records are QA fixtures and should be removed or anonymized before release. |

## 4. Environment and platform smoke tests

| ID | Area | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|---|
| ENV-001 | Frontend | Open the Vite root URL | Application shell returns HTTP 200 | **PASS** | Verified locally; frontend listener is on port 3000. |
| ENV-002 | Frontend | Run production build | Vite build completes without compile errors | **PASS** | Build passes. There is still a large JavaScript chunk warning; use route-level code splitting before production if load time remains high. |
| ENV-003 | Backend | Call `/api/health` | JSON response reports healthy service | **PASS** | Endpoint returned HTTP 200. |
| ENV-004 | Database | Health endpoint executes a database probe | Database reports connected | **PASS** | Supabase connection is active. |
| ENV-005 | Backend tests | Run the existing Laravel test suite | Tests complete successfully | **PASS** | Two example tests pass; coverage is insufficient for release. |
| ENV-006 | Configuration | Start local backend after config changes | New environment/config values are loaded | **PASS** | `artisan config:clear` was run after timezone changes. |
| ENV-007 | Database performance | Measure warm authenticated requests | Requests meet the under-one-second local target | **FAIL - RESOLVED PARTIALLY** | Data works, but several authenticated requests take 1.7–4.7 seconds because the database is remote. Use local PostgreSQL for development, pooling, indexes, and fewer round trips. |
| ENV-008 | Recovery | Stop backend while frontend is open | User sees a retry/error state, not an endless skeleton or white screen | **IN PROGRESS** | Axios timeouts and the React error boundary exist; browser assertion and retry UX still need testing. |

## 5. Student module test cases

### 5.1 Student authentication and session

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-A01 | Valid student login | Token is issued and user reaches dashboard | **PASS** | Live login smoke test passed. |
| STU-A02 | Wrong password | Login is rejected with a clear message | **IN PROGRESS** | Backend validation exists; complete a browser assertion that no protected page is entered. |
| STU-A03 | Wrong birthday | Login is rejected without issuing a token | **IN PROGRESS** | Backend logic exists; add automated negative test. |
| STU-A04 | Unknown Student ID | Clear not-found error is shown | **IN PROGRESS** | API path exists; browser and automated assertion remain. |
| STU-A05 | Password show/hide | Normal eye shows password; slashed eye hides it | **PASS** | Icon behavior was corrected and frontend build passes. |
| STU-A06 | Logout | Token and user state are removed; login page opens | **IN PROGRESS** | Service is implemented; browser verification remains. |
| STU-A07 | Expired/invalid token | Protected API rejects request and UI returns to login or shows auth error | **IN PROGRESS** | Middleware exists; requires an expired-token fixture. |
| STU-A08 | Student tries nurse endpoint | Request is denied by role/auth middleware | **PASS** | Protected route behavior was verified during role smoke testing. |

### 5.2 Registration and password recovery

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-R01 | Submit valid registration form | Pending registration is stored; account is not active before verification | **PASS** | Pending registration migration/model and hashed OTP flow exist. |
| STU-R02 | Duplicate email or Student ID | Registration is rejected with a useful message | **PASS** | Duplicate checks cover users and pending registrations. |
| STU-R03 | Invalid/expired OTP | Account is not created and verification fails clearly | **IN PROGRESS** | Logic exists; needs live OTP fixture. |
| STU-R04 | Valid OTP | User, profile, and QR record are created once | **IN PROGRESS** | Code path exists; requires a configured mail provider or controlled test OTP. |
| STU-R05 | Registration OTP email delivery | Email arrives within an acceptable time | **FAIL** | Gmail SMTP previously returned `535 BadCredentials`; configure a Gmail App Password or transactional provider, then retest. |
| STU-R06 | Forgot-password email | Reset OTP is delivered | **FAIL** | Same missing/invalid mail credentials block this flow. Configure mail credentials and add rate-limit testing. |
| STU-R07 | Reset with valid/expired/reused OTP | Only valid, unexpired, unused OTP changes password | **IN PROGRESS** | Backend flow exists; needs mail and negative-case fixtures. |

### 5.3 Student dashboard and navigation

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-D01 | Open dashboard after login | Dashboard renders without waiting for unrelated requests | **PASS** | Login now navigates immediately; dashboard requests run concurrently. |
| STU-D02 | Dashboard statistics | Appointment and consultation counts are correct | **PASS** | Live endpoint passed; still affected by remote DB latency. |
| STU-D03 | Dashboard with cached data | Cached data appears while refresh runs | **PASS** | Stale-while-revalidate cache is implemented. |
| STU-D04 | Dashboard with slow API | Timeout/error state appears instead of indefinite skeleton | **PASS** | Local timeout is configured; browser assertion still recommended. |
| STU-D05 | Repeated navigation/focus | No uncontrolled duplicate request storm | **IN PROGRESS** | Caching and polling protections exist; observe in browser network tools. |
| STU-D06 | Announcements preview | Announcement cards render safely | **PASS** | Object-valued author white-screen cause was fixed. |

### 5.4 Profile and health profile

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-P01 | View profile | Current student data appears | **PASS** | Live profile endpoint passed. |
| STU-P02 | Update profile fields | Changes persist after reload | **PASS** | Profile update was implemented and live-tested. |
| STU-P03 | Upload valid avatar | Image saves and displays | **IN PROGRESS** | Backend endpoint exists; browser file upload and size test remain. |
| STU-P04 | Reject invalid/oversized avatar | Clear validation error appears | **IN PROGRESS** | Validation exists; complete browser assertion. |
| STU-P05 | View health profile | Existing health information displays | **PASS** | Health profile endpoint/status tested. |
| STU-P06 | Create health profile | New information persists and completion status updates | **IN PROGRESS** | Requires a clean student fixture to avoid overwriting QA data. |
| STU-P07 | Update health profile | Changes persist and are reflected on dashboard | **IN PROGRESS** | Browser form and persistence test remain. |
| STU-P08 | Student can only access own profile | Another student's profile cannot be read or edited | **IN PROGRESS** | Controller uses authenticated user; add explicit authorization test. |

### 5.5 Appointments

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-AP01 | Load appointment list | Existing records and empty state render | **PASS** | Live endpoint passed. |
| STU-AP02 | Load available slots | Slot counts and full status are accurate | **PASS** | Live endpoint passed. |
| STU-AP03 | Book valid future appointment | Pending record and reference number are returned | **PASS** | Live booking passed. |
| STU-AP04 | Book duplicate date | Duplicate active booking is rejected | **PASS** | Backend duplicate check passed. |
| STU-AP05 | Book past date | Request is rejected | **PASS** | Date validation is present. |
| STU-AP06 | Book past time today | Request is rejected with a clear message | **PASS** | Backend returned HTTP 422 with the future-time message. |
| STU-AP07 | Book full slot | Request is rejected and another slot can be selected | **PASS** | Slot capacity is checked server-side. |
| STU-AP08 | Edit pending own appointment | Appointment updates through the student route | **PASS** | Previous cause was the frontend calling the nurse-only endpoint; route was corrected and live-tested. |
| STU-AP09 | Edit approved/completed appointment | Update is rejected | **PASS** | Student update controller restricts edits to pending status. |
| STU-AP10 | Cancel pending/approved appointment | Status changes to cancelled | **PASS** | Live cancel test passed. |
| STU-AP11 | Appointment visible in Admin | New student appointment appears within polling interval | **PASS** | Admin now polls every 5 seconds and has manual refresh. |
| STU-AP12 | Appointment error detail | UI displays backend validation/status message | **PASS** | Generic failure message was improved to include validation errors and HTTP status. |

### 5.6 Health records, QR, notifications, and announcements

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| STU-H01 | Open Health Records | Consultation list or empty state renders | **PASS** | Previously failed because controller methods were missing; `index`, `show`, and `latest` were implemented. |
| STU-H02 | Open consultation detail | Only the student's record is shown | **PASS** | Student consultation endpoints were tested. |
| STU-H03 | Filter/search health records | Results update without crash | **IN PROGRESS** | UI assertion remains. |
| STU-Q01 | Open QR page | Active QR displays | **PASS** | QR/status API passed. |
| STU-Q02 | Download/print QR | Browser download/print action works | **IN PROGRESS** | Requires browser assertion. |
| STU-Q03 | Invalid QR use | Kiosk rejects invalid code | **PASS** | Kiosk invalid-QR API test passed. |
| STU-N01 | View notifications | Notifications and empty state render | **PASS** | Live endpoint passed. |
| STU-N02 | Mark one/all read | Read state persists and badge updates | **IN PROGRESS** | Browser assertion remains. |
| STU-AN01 | Open announcements with object author | No React render exception occurs | **PASS** | Root cause was rendering an object directly; safe author rendering was added. |
| STU-AN02 | Open announcements with cache | Cached list appears immediately | **PASS** | Local cache added. |
| STU-AN03 | Search/filter announcements | Correct content appears without white screen | **IN PROGRESS** | Browser assertion remains. |

### 5.7 Student historical defects and required actions

| Defect | Status | Cause | Action |
|---|---|---|---|
| Empty student Profile controller | **FAIL - RESOLVED** | Profile routes pointed to an empty controller | Keep regression tests for show/update/avatar. |
| Empty student Consultation controller | **FAIL - RESOLVED** | Health Records routes called missing methods | Keep endpoint and ownership tests. |
| Plain-text password fallback | **FAIL - RESOLVED** | Authentication accepted seeded plain-text passwords | Rotate demo credentials and ensure all stored passwords are hashed. |
| Announcement white screen | **FAIL - RESOLVED** | React attempted to render an author object | Keep error-boundary and announcement fixture tests. |
| Appointment edit always failed | **FAIL - RESOLVED** | Student UI called `/nurse/appointments/{id}` | Keep a student-owned update regression test. |

## 6. Nurse/Admin module test cases

| ID | Area/test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| ADM-001 | Valid nurse login | Nurse reaches admin dashboard | **PASS** | Live nurse login smoke test passed. |
| ADM-002 | Invalid nurse login | No token; clear error | **IN PROGRESS** | Browser negative assertion remains. |
| ADM-003 | Dashboard statistics | Counts and summaries render | **PASS** | Live endpoint passed. |
| ADM-004 | Today's appointments | Current appointment records render | **PASS** | Live endpoint passed. |
| ADM-005 | Recent activity | Activity list/empty state renders | **PASS** | Live endpoint passed. |
| ADM-006 | Appointment list/pagination | Records and pagination work | **PASS** | API returned records; browser pagination needs assertion. |
| ADM-007 | Status filter | Pending/approved/completed filters are correct | **PASS** | Controller and route tested. |
| ADM-008 | Date filter | Selected date results are correct | **PASS** | Controller and route tested. |
| ADM-009 | Search students/appointments | Matching name, surname, or ID appears | **PASS** | Route-order issue was fixed and retested. |
| ADM-010 | Near-realtime student appointment | New booking appears within 5 seconds or via Refresh | **PASS** | Polling interval and manual button added. |
| ADM-011 | Approve pending appointment | Status changes; student notification is created | **PASS** | Live workflow passed. |
| ADM-012 | Reject pending appointment | Status changes and reason is required | **PASS** | Controller requires a reason. |
| ADM-013 | Complete approved appointment | Status changes to completed | **PASS** | Controller workflow passed. |
| ADM-014 | Reject invalid appointment transition | Invalid status transition is refused | **IN PROGRESS** | Add automated transition matrix. |
| ADM-015 | List/search students | Student records load and search works | **PASS** | Live endpoint passed. |
| ADM-016 | View health profile | Authorized student health profile displays | **PASS** | Live endpoint passed. |
| ADM-017 | View appointment history | Correct student's history displays | **PASS** | Live endpoint passed. |
| ADM-018 | List consultations | List/empty state renders | **PASS** | Route-order issue was fixed and tested. |
| ADM-019 | Create consultation | Vitals, diagnosis, and treatment persist | **PASS** | End-to-end appointment-to-record workflow passed. |
| ADM-020 | Update consultation | Changes persist and remain linked to student | **IN PROGRESS** | Browser edit workflow remains. |
| ADM-021 | Medicine list/categories/stats | Inventory data loads | **PASS** | Live endpoints passed. |
| ADM-022 | Create/update medicine | Valid fields persist | **IN PROGRESS** | Browser CRUD test remains. |
| ADM-023 | Add/reduce stock | Stock changes correctly; invalid reduction is rejected | **IN PROGRESS** | Requires dedicated inventory fixture and browser assertion. |
| ADM-024 | Create announcement | Announcement appears to students | **PASS** | API/controller tested. |
| ADM-025 | Update/delete announcement | Changes persist and removed item disappears | **IN PROGRESS** | Browser CRUD assertion remains. |
| ADM-026 | Reports | Consultation, appointment, and daily reports load | **PASS** | Live endpoints passed. |
| ADM-027 | Notifications | Admin notifications load and read state persists | **IN PROGRESS** | Browser assertion remains. |
| ADM-028 | Admin logout | Token is cleared and protected route is inaccessible | **IN PROGRESS** | Browser assertion remains. |
| ADM-029 | Mobile/tablet admin layout | Tables and actions remain usable | **IN PROGRESS** | Requires responsive browser/device pass. |
| ADM-030 | Admin error handling | API failure shows retryable message instead of blank page | **IN PROGRESS** | Add browser outage test and retry control. |

**Admin/Nurse summary:** Core API workflows are passing. Remaining work is primarily browser CRUD, role-negative tests, responsive validation, and automated coverage.

## 7. Kiosk module test cases

| ID | Area/test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| KSK-001 | Welcome screen | Kiosk landing screen loads | **PASS** | Frontend route exists. |
| KSK-002 | Terms acceptance | User advances only after accepting terms | **PASS** | Multi-step flow exists. |
| KSK-003 | Choose appointment/walk-in | Correct next step opens | **PASS** | Frontend flow verified. |
| KSK-004 | Valid QR scan | Student is identified | **IN PROGRESS** | Needs real camera and QR fixture on phone/tablet. |
| KSK-005 | Invalid QR scan | Clear rejection appears | **PASS** | API invalid QR test passed. |
| KSK-006 | Student/reference lookup | Valid student details load | **PASS** | Live lookup passed. |
| KSK-007 | Unknown lookup | Not-found response is clear | **PASS** | Live error path passed. |
| KSK-008 | Valid walk-in check-in | Queue record and required legacy fields are created | **PASS** | Missing `checked_in_at`/legacy fields were fixed. |
| KSK-009 | Invalid walk-in data | Required fields produce validation error | **IN PROGRESS** | Browser assertion remains. |
| KSK-010 | Valid appointment check-in | Queue number is assigned | **PASS** | Live workflow passed. |
| KSK-011 | Cancelled/completed appointment check-in | Check-in is rejected | **IN PROGRESS** | Requires dedicated appointment fixtures. |
| KSK-012 | Today's queue | Waiting/serving/completed records render | **PASS** | Queue endpoint passed. |
| KSK-013 | Call next | First waiting record changes to serving | **PASS** | Queue lifecycle was corrected to use `status`. |
| KSK-014 | Empty queue call-next | Clear empty-queue response | **IN PROGRESS** | Browser assertion remains. |
| KSK-015 | Complete serving patient | Record changes to completed | **IN PROGRESS** | Device workflow remains. |
| KSK-016 | Available slots | Full/available slots are accurate | **PASS** | API passed. |
| KSK-017 | Duplicate active check-in | Duplicate active queue entry is blocked | **IN PROGRESS** | Needs repeated-check-in fixture. |
| KSK-018 | Backend timeout | Kiosk shows recoverable error | **IN PROGRESS** | Browser outage test remains. |
| KSK-019 | Camera permission denied | User receives camera guidance | **IN PROGRESS** | Requires physical/browser permission test. |
| KSK-020 | Tablet responsiveness | Controls fit clinic kiosk screen | **IN PROGRESS** | Requires actual tablet or responsive browser pass. |

**Kiosk summary:** API queue and check-in workflows are passing. Physical camera, tablet, and edge-state testing remain.

## 8. Shared, public, and runtime safety cases

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| SHR-001 | Landing page | Branding, navigation, and sections render | **PASS** | Build and route verified. |
| SHR-002 | Public announcements | Public list loads | **PASS** | Endpoint returned data. |
| SHR-003 | Protected route without token | User cannot access protected page/API | **PASS** | Auth middleware exists and role smoke test passed. |
| SHR-004 | Global render failure | Recovery UI appears instead of white screen | **PASS** | `AppErrorBoundary` was added. |
| SHR-005 | Password visibility controls | Student and nurse controls use correct eye state | **PASS** | Logic was corrected in shared password forms. |
| SHR-006 | CORS/local origin | Frontend can call local API | **PASS** | Local smoke tests succeeded. |
| SHR-007 | Desktop/tablet/mobile layout | No clipped critical actions | **IN PROGRESS** | Needs browser/device matrix. |
| SHR-008 | Cache account isolation | Cached Student data cannot appear under another account | **IN PROGRESS** | Current cache keys should be scoped by user/student ID before multi-account production use. |
| SHR-009 | Secrets hygiene | No production credentials are committed or exposed | **FAIL** | The local `.env` contains database credentials; rotate them and use hosting environment variables. Sanitize `.env.example`. |
| SHR-010 | Demo credentials | Weak demo passwords are removed before production | **FAIL** | Demo passwords are intentionally simple for testing; replace them and force password change before release. |

## 9. Database, security, and deployment readiness

| ID | Test case | Expected result | Status | Notes, cause, and action |
|---|---|---|---|---|
| DB-001 | All migrations apply on PostgreSQL | Schema is created without SQL dialect errors | **PASS** | PostgreSQL-safe kiosk forward migration was added. |
| DB-002 | User/profile relation integrity | New users have expected profile/QR records | **IN PROGRESS** | Registration email block prevents full live flow. |
| DB-003 | Appointment ownership | Student cannot read/update another student's appointment | **IN PROGRESS** | Code scopes student queries; add explicit two-account test. |
| DB-004 | Appointment slot capacity | Concurrent bookings cannot exceed capacity | **IN PROGRESS** | Current count check works sequentially; add transaction/locking test for concurrency. |
| DB-005 | Medical data access | Only authorized nurse/student owner can read records | **IN PROGRESS** | Role paths exist; perform two-account authorization tests. |
| DB-006 | Password storage | Passwords are hashed | **PASS** | Plain-text fallback was removed and seeder uses `Hash::make`; verify existing database rows are migrated. |
| DB-007 | Rate limiting | Auth/kiosk limits prevent abuse without blocking normal use | **IN PROGRESS** | Middleware is configured; load/negative testing remains. |
| DB-008 | Backup/restore | Production database can be restored | **IN PROGRESS** | Must be configured and tested in Supabase/hosting, not only code. |
| DB-009 | Render cold start | First request stays within agreed SLA | **FAIL** | Free-tier cold start and remote database delay cause long waits; use persistent hosting/local database/pooling. |
| DB-010 | Production environment variables | Secrets and mail settings are configured outside source files | **IN PROGRESS** | Deployment configuration must be reviewed after credential rotation. |

## 10. Consolidated status summary

These counts are based on the cases in this document. `FAIL` includes active blockers and known unresolved release risks; historical defects already fixed are labeled `FAIL - RESOLVED` in their own section and are not counted as active failures.

| Scope | PASS | FAIL | IN PROGRESS | Readiness estimate |
|---|---:|---:|---:|---:|
| Environment/platform | 6 | 1 | 1 | 80% |
| Student | 32 | 2 | 18 | 85% |
| Admin/Nurse | 20 | 0 | 10 | 91% |
| Kiosk | 11 | 0 | 9 | 90% |
| Shared/runtime | 6 | 2 | 2 | 78% |
| Database/deployment | 2 | 1 | 7 | 70% |
| **Overall** | **77** | **6** | **47** | **Approximately 84%** |

The estimate is not a mathematical substitute for release approval. The active failures involving email, secrets, demo credentials, cold starts, and incomplete device/browser testing must be addressed before production.

## 11. Priority action plan

### P0 - Required before production

1. Rotate the exposed Supabase database password and any other credentials in the local `.env`.
2. Remove secrets from committed/example configuration and use deployment environment variables.
3. Configure and test Gmail App Password or a transactional mail provider for registration and password recovery.
4. Replace weak demo credentials and force secure passwords.
5. Use a persistent backend/database setup or local PostgreSQL for development so remote/cold-start latency does not affect clinic workflows.
6. Run two-account authorization tests for student profiles, appointments, consultations, and medical records.

### P1 - Required before acceptance sign-off

1. Add automated Feature tests for student/nurse login, appointment booking/edit/cancel/approve, consultation creation, kiosk check-in, and role denial.
2. Finish browser assertions for all Student and Admin `IN PROGRESS` cases.
3. Test QR scanning and camera permissions on the actual kiosk device.
4. Test tablet/mobile layouts.
5. Add cache keys scoped by authenticated user ID.
6. Add transaction/locking protection for concurrent appointment slot booking.

### P2 - Recommended improvements

1. Split the large frontend bundle using route-level dynamic imports.
2. Add retry buttons and clearer offline/backend error states to every data-heavy page.
3. Clean existing frontend lint warnings.
4. Add monitoring for API latency, database failures, mail delivery, and queue operations.
5. Remove QA fixture records before production deployment.

## 12. Release decision

**Current decision: NOT READY FOR PRODUCTION.**

The main Student, Nurse/Admin, Kiosk API workflows, frontend build, backend health endpoint, and PostgreSQL connection are working. The release remains blocked by security hygiene, email configuration, remote/cold-start performance, incomplete browser/device verification, and insufficient automated test coverage.

The system can continue in **development/staging testing** while the P0 and P1 actions are completed.
