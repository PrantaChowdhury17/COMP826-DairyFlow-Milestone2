# DairyFlow — System evaluation record

## Test setup and scope

I tested the Expo SDK 58 mobile prototype on a Samsung Android phone connected to the same private Wi-Fi as my Windows laptop. I used a local FastAPI server on port 8000 and the app's SQLite store. The exact Samsung model and Android release were not recorded. Testing used demonstration cows and tasks only. The automated tests and device screenshots are retained in `docs/evidence/`.

I used two complementary methods: (1) scenario-based black-box functional and connectivity testing supported by unit/API tests, and (2) repeated task-completion timing informed by mobile usability and benchmark practice. The QR-vs-manual comparison uses just three trials per method with one tester on one device. It is a preliminary developer-run measurement, not independent user research or a generalisable field result.

## Scenario-based outcomes

| Test | Procedure | Observed outcome | Status |
|---|---|---|---|
| Role change | Switch Farm Worker to Farm Manager | Taylor/Manager appeared; same visible task order in the examples | Role change verified; visible reorder not established |
| QR cow identification | Scan COW-101 | Daisy's Holstein profile and its task list displayed | Pass in observed trials |
| Invalid input | Submit COW-999 | Remained on scan page and displayed an invalid/unknown cow message | Pass |
| Priority rules | Execute TypeScript domain tests | 7/7 passed (including critical, overdue, completed and manager cases) | Pass |
| Offline task save | Complete TASK-001 while disconnected | Critical task no longer appeared on Daisy's open-task list | Pass in one documented scenario |
| Persist through restart | Reopen app with update still pending | One pending operation remained and TASK-001 stayed off the open-task list | Pass in one documented scenario |
| Mobile-to-server sync | Restore connectivity, manually press Sync | Server acknowledged 1/1, rejected 0; local pending 1→0 | Pass in one documented scenario |
| Backend state | Compare `/tasks` and `/metrics` | TASK-001 open→done; completedTasks 0→1; operationsApplied 0→1 | Pass |
| Retry with empty queue | Press Sync again when pending 0 | Nothing pending; operationsApplied remained 1 | Pass (client empty-queue only) |
| Repeat same operation ID | POST same stable operation ID twice | Both requests acknowledged; operationsApplied 1→2, not 3 | Pass (backend de-duplication) |
| Backend automated tests | Run Python pytest | 4/4 passed; one dependency deprecation warning | Pass |
| UI safe-area | Recheck the Android header after fix | Dashboard button visible below phone status bar | Pass on tested device |

The 11 automated tests cover different isolated code paths and must not be described as 11 separate real-device tests.

## Timing of cow identification

I used a stopwatch for three end-to-end trials per method with COW-101. For QR, I started timing when I pressed `Scan cow QR` and stopped when Daisy's profile appeared. For manual entry, I started from the same entry point, cleared the field, typed COW-101 and stopped when the profile appeared.

| Trial | QR scan (s) | Full manual entry (s) |
|---|---:|---:|
| 1 | 1.25 | 10 |
| 2 | 1.30 | 9 |
| 3 | 1.20 | 8 |
| **Mean** | **1.25** | **9.00** |
| **Median** | **1.25** | **9.00** |
| **Maximum** | **1.30** | **10.00** |
| **Success** | **3/3** | **3/3** |

The observed mean time was 86.1% lower for QR and the ratio of the two means was 7.2. Manual button-response readings from a separate exercise excluded typing and are not part of this full-workflow comparison.

## Milestone 1 acceptance targets and gaps

I had proposed ten QR/profile timing runs and a two-second target, five offline/restart tests, five sync tests within ten seconds, testing with five uncoached users, and compatibility across two Android configurations. The three observed QR trials were each below two seconds, but the original ten-run protocol and other replication targets were **not completed**. I also did not record the time from pressing Sync to server acknowledgement. I therefore cannot claim that the original synchronisation-duration target or independent-user usability acceptance target was achieved. No multi-device conflict tests, field-condition tests or controlled packet-loss tests were performed.

## Test evidence

The attached screenshot filenames describe the observed state. I retained the original screenshots and a CSV of stopwatch timings. Screenshots of source or a test runner are supporting evidence only; neither substitutes for testing on a real device.
