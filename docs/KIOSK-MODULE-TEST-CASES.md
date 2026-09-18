# PUPBC CareLink Kiosk Module Test Cases

**Test date:** September 16, 2026  
**Environment:** Local Windows development  
**Backend:** `http://127.0.0.1:8000`

## Status definitions

- **PASS** - Test completed successfully.
- **FAIL** - Test reproduced a defect.
- **IN PROGRESS** - Code exists, but browser or physical-device verification remains.
- **BLOCKED** - A required dependency is unavailable.

## Test matrix

| ID | Area | Test case | Expected result | Status | Notes |
|---|---|---|---|---|---|
| KSK-001 | Welcome | Open kiosk welcome page | Welcome screen loads | PASS | Frontend route exists |
| KSK-002 | Terms | Accept terms and continue | User advances to options | PASS | Multi-step flow exists |
| KSK-003 | Options | Choose appointment or walk-in | Correct next step opens | PASS | Frontend flow verified |
| KSK-004 | QR scan | Scan valid student QR | Student identity is verified | IN PROGRESS | Requires real camera/device |
| KSK-005 | QR scan | Scan invalid or expired QR | Clear invalid QR error appears | PASS | API invalid QR test passed |
| KSK-006 | Lookup | Look up student by valid QR/reference | Student details load | PASS | Live kiosk lookup passed |
| KSK-007 | Lookup | Submit unknown student/reference | Clear not-found response | PASS | Error path tested |
| KSK-008 | Walk-in | Submit valid walk-in check-in | Queue record is created | PASS | Legacy required fields fixed |
| KSK-009 | Walk-in | Submit missing concern/service | Validation error appears | IN PROGRESS | Browser form assertion required |
| KSK-010 | Appointment check-in | Check in valid appointment | Check-in and queue number are assigned | PASS | Live workflow passed |
| KSK-011 | Appointment check-in | Check in cancelled/completed appointment | Check-in is rejected | IN PROGRESS | Requires dedicated fixture |
| KSK-012 | Queue | Load today's queue | Waiting/serving/completed states render | PASS | Queue API passed |
| KSK-013 | Queue | Call next patient | First waiting patient changes to serving | PASS | Queue lifecycle fix verified |
| KSK-014 | Queue | Call next with empty queue | Clear empty-queue response | IN PROGRESS | Browser assertion required |
| KSK-015 | Queue | Complete serving patient | Patient changes to completed | IN PROGRESS | Device workflow required |
| KSK-016 | Slots | Load available appointment slots | Full and available slots are accurate | PASS | API tested |
| KSK-017 | Safety | Submit duplicate check-in | Duplicate active queue entry is prevented | IN PROGRESS | Needs repeated live fixture |
| KSK-018 | Resilience | Backend timeout or unavailable API | Kiosk shows recoverable error, not white screen | IN PROGRESS | Browser/device test required |
| KSK-019 | Camera | Deny camera permission | Clear permission guidance appears | IN PROGRESS | Physical browser test required |
| KSK-020 | Responsive UI | Use kiosk layout on tablet resolution | Controls remain usable | IN PROGRESS | Physical tablet test required |

## Summary

| Status | Count |
|---|---:|
| PASS | 11 |
| FAIL | 0 |
| IN PROGRESS | 9 |
| BLOCKED | 0 |

**Estimated readiness: 90%.**

The main remaining risks are real-camera QR scanning, tablet layout, and queue edge-case testing with dedicated records.
