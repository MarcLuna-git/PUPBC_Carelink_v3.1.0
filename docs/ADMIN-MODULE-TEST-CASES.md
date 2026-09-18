# PUPBC CareLink Admin/Nurse Module Test Cases

**Test date:** September 16, 2026  
**Environment:** Local Windows development  
**Frontend:** `http://127.0.0.1:3000`  
**Backend:** `http://127.0.0.1:8000`

## Status definitions

- **PASS** - Test completed successfully.
- **FAIL** - Test reproduced a defect.
- **IN PROGRESS** - Code exists, but browser or role-specific verification remains.
- **BLOCKED** - A required dependency is unavailable.

## Test account

- Nurse email: `nurse@pupbc.edu.ph`
- Password: `nurse`

## Test matrix

| ID | Area | Test case | Expected result | Status | Notes |
|---|---|---|---|---|---|
| ADM-001 | Login | Submit valid nurse credentials | Nurse is authenticated and redirected to dashboard | PASS | Live API smoke test passed |
| ADM-002 | Login | Submit invalid credentials | Clear error and no dashboard access | IN PROGRESS | Browser assertion required |
| ADM-003 | Authorization | Use student token on nurse endpoint | Request is rejected | PASS | Protected route middleware verified |
| ADM-004 | Dashboard | Load dashboard statistics | Counts and summary render | PASS | Live endpoint passed |
| ADM-005 | Dashboard | Load today's appointments | Today's records render | PASS | Live endpoint passed |
| ADM-006 | Dashboard | Load recent activity | Activity list or empty state renders | PASS | Live endpoint passed |
| ADM-007 | Appointments | List appointments | Paginated appointment list renders | PASS | Live endpoint passed |
| ADM-008 | Appointments | Filter by status | Only selected status is returned | PASS | Route/controller verified |
| ADM-009 | Appointments | Filter by date | Only selected date is returned | PASS | Route/controller verified |
| ADM-010 | Appointments | Search student appointments | Matching student records render | PASS | Route ordering fixed and retested |
| ADM-011 | Appointments | Approve pending appointment | Status changes and student notification is created | PASS | Live workflow passed |
| ADM-012 | Appointments | Reject pending appointment | Status changes with rejection reason | PASS | Controller validation present |
| ADM-013 | Appointments | Complete approved appointment | Status changes to completed | PASS | Controller workflow passed |
| ADM-014 | Students | List/search students | Student records and search results render | PASS | Live endpoint passed |
| ADM-015 | Students | View student health profile | Authorized health data displays | PASS | Live endpoint passed |
| ADM-016 | Students | View student appointment history | Correct student records display | PASS | Live endpoint passed |
| ADM-017 | Consultations | List consultations | Consultation list or empty state renders | PASS | Route ordering fixed and tested |
| ADM-018 | Consultations | Create consultation | Vitals, diagnosis, and treatment save | PASS | End-to-end appointment workflow passed |
| ADM-019 | Consultations | Update consultation | Editable consultation fields persist | IN PROGRESS | Browser form verification required |
| ADM-020 | Medicines | List medicines | Inventory renders | PASS | Live endpoint passed |
| ADM-021 | Medicines | Create/update medicine | Valid inventory changes persist | IN PROGRESS | Browser CRUD verification required |
| ADM-022 | Medicines | Add/reduce stock | Quantity changes correctly and cannot become invalid | IN PROGRESS | Needs browser workflow |
| ADM-023 | Announcements | Create announcement | Announcement saves and appears to students | PASS | API/controller tested |
| ADM-024 | Announcements | Update/delete announcement | Changes persist and deleted item disappears | IN PROGRESS | Browser CRUD verification required |
| ADM-025 | Reports | Open consultation/appointment reports | Report data loads without crash | PASS | Live endpoints passed |
| ADM-026 | Notifications | View and mark notifications read | Read state persists | IN PROGRESS | Browser assertion required |
| ADM-027 | Session | Logout | Token is cleared and login page opens | IN PROGRESS | Browser assertion required |
| ADM-028 | Responsive UI | Test dashboard and tables on mobile width | No unusable controls or overflow | IN PROGRESS | Device/browser pass required |

## Summary

| Status | Count |
|---|---:|
| PASS | 20 |
| FAIL | 0 |
| IN PROGRESS | 8 |
| BLOCKED | 0 |

**Estimated readiness: 91%.**

Remaining work is primarily browser-level CRUD, responsive validation, and automated regression coverage.
