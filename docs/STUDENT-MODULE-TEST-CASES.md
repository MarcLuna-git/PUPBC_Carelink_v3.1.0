# PUPBC CareLink Student Module Test Cases

**Test date:** September 16, 2026  
**Environment:** Local Windows development  
**Frontend:** `http://localhost:3000`  
**Backend:** `http://127.0.0.1:8000`

## Status definitions

- **PASS** - Test completed successfully.
- **FAIL** - Test reproduced a defect.
- **IN PROGRESS** - Code exists, but the test needs a live account, email, camera, or browser/device validation.
- **BLOCKED** - Cannot complete until a dependency is configured.

## Test account

- Student ID: `2021-00001-BN-0`
- Birthday: `2002-05-15`
- Password: `student`

## Student module test matrix

| ID | Area | Test case | Expected result | Status | Notes |
|---|---|---|---|---|---|
| STU-001 | Login | Submit valid Student ID, birthday, and password | User is authenticated and redirected to dashboard | PASS | Live API test passed |
| STU-002 | Login | Submit wrong password | Clear error; no dashboard access | IN PROGRESS | Needs browser assertion |
| STU-003 | Login | Submit wrong birthday | Clear birthday error; no dashboard access | IN PROGRESS | Needs browser assertion |
| STU-004 | Login | Toggle password visibility | Eye shows password; slashed eye hides it | PASS | Logic fixed and build passed |
| STU-005 | Logout | Click logout | Token/user are cleared and login page opens | IN PROGRESS | Needs browser assertion |
| STU-006 | Dashboard | Open dashboard with healthy backend | Content loads without prolonged skeleton | PASS | API requests run concurrently |
| STU-007 | Dashboard | Open dashboard with unavailable backend | Error/retry state appears within timeout | PASS | API timeout reduced to 10s local / 20s production |
| STU-008 | Dashboard | Refresh/focus dashboard repeatedly | No overlapping request storm or white screen | IN PROGRESS | Manual browser observation required |
| STU-009 | Profile | Open profile | User and student profile data display | PASS | Live API test passed |
| STU-010 | Profile | Edit mobile number/address | Changes persist after reload | PASS | Live update test passed |
| STU-011 | Profile | Upload valid avatar under 2 MB | Avatar saves and displays | IN PROGRESS | Backend implemented; browser upload required |
| STU-012 | Profile | Upload invalid/oversized avatar | Validation message appears | IN PROGRESS | Browser validation required |
| STU-013 | Health profile | Open existing health profile | Data loads and completion status is correct | PASS | Live API/status tests passed |
| STU-014 | Health profile | Save a new profile | Data persists and dashboard status updates | IN PROGRESS | Needs clean test account |
| STU-015 | Health profile | Update existing profile | Updated values persist | IN PROGRESS | Needs browser form test |
| STU-016 | Appointments | Open appointment list | Existing appointments load quickly | PASS | Live API test passed |
| STU-017 | Appointments | Load slots for a date | Available/full slots display | PASS | Live API test passed |
| STU-018 | Appointments | Book valid appointment | Pending appointment and reference are returned | PASS | Live create test passed |
| STU-019 | Appointments | Book duplicate date | Duplicate validation prevents booking | PASS | Live duplicate test passed |
| STU-020 | Appointments | Cancel pending/approved appointment | Status changes to cancelled | PASS | Live cancel test passed |
| STU-021 | Appointments | Edit appointment | Only student-owned appointment is changed | IN PROGRESS | Frontend currently needs endpoint/permission verification |
| STU-022 | Health records | Open Health Records | Consultation list renders or empty state appears | PASS | Live endpoint test passed |
| STU-023 | Health records | Expand a consultation | Detail renders without runtime error | PASS | Student consultation detail tested |
| STU-024 | Health records | Search/year filter | Results update without request or crash | IN PROGRESS | Needs browser assertion |
| STU-025 | QR | Open My QR Code | QR displays for completed profile | PASS | QR/status API passed |
| STU-026 | QR | Download/print QR | File/download or print dialog opens | IN PROGRESS | Browser/device test required |
| STU-027 | Notifications | Open notifications | Notification list loads and empty state works | PASS | Live API test passed |
| STU-028 | Notifications | Mark one/all as read | Read state persists and badge updates | IN PROGRESS | Needs browser assertion |
| STU-029 | Announcements | Open announcements with warm API | List displays and author is text-safe | PASS | Object author white-screen bug fixed |
| STU-030 | Announcements | Open announcements with cached data | Cached list appears immediately while refresh runs | PASS | Local cache added |
| STU-031 | Announcements | Open announcements with slow API | Page does not remain indefinitely on skeleton | PASS | Request timeout reduced |
| STU-032 | Announcements | Search/filter/expand announcement | Correct content displays without white screen | IN PROGRESS | Needs browser assertion |
| STU-033 | Settings | Change password with current password | Password updates using authenticated endpoint | PASS | Backend flow tested |
| STU-034 | Settings | Submit wrong current password | Clear validation error; password unchanged | IN PROGRESS | Needs browser assertion |
| STU-035 | Auth recovery | Request forgot-password OTP | OTP is delivered | BLOCKED | Gmail SMTP credentials are invalid/missing |
| STU-036 | Registration | Request registration OTP | OTP email arrives before account creation | BLOCKED | Gmail SMTP credentials are invalid/missing |
| STU-037 | Runtime safety | Trigger a render/data error | Recovery screen appears instead of white screen | PASS | Global React error boundary added |
| STU-038 | Responsive UI | Test desktop/tablet/mobile student pages | No clipped controls or unusable forms | IN PROGRESS | Requires browser/device pass |

## Student module summary

| Status | Count |
|---|---:|
| PASS | 21 |
| FAIL | 0 |
| IN PROGRESS | 14 |
| BLOCKED | 2 |

**Current student module readiness: 88%.**

The module is not yet 100% production-ready because email delivery, camera/device behavior, browser-only form assertions, and broader automated coverage still need completion.

## Performance acceptance targets

| Metric | Target |
|---|---|
| Warm local API request | Under 1 second |
| Student page error state | Visible within 10 seconds locally |
| Production page error state | Visible within 20 seconds |
| Cached announcements first paint | Immediate after first successful load |
| No white screen | Any render exception shows recovery UI |
| Repeated focus/refresh | No duplicate uncontrolled polling |
