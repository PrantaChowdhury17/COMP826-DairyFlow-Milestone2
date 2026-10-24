# DairyFlow — Development process and reflection

## Approach

For Milestone 2 I worked on a restricted-scope prototype using a small task board and incremental checks rather than treating my plan as a full industrial Scrum project. I prioritised a working scan-to-task workflow, offline persistence, and successful server acknowledgement before attempting optional features. My retrospective board below records work I can substantiate from the source files and my device tests; it is not evidence that several formal sprints took place.

| Work item | Status on 25 October 2026 | Evidence |
|---|---|---|
| Implement deterministic cow-code validation and task ranking | Completed | `mobile/src/domain/rules.ts`; 7 passing tests |
| Implement FastAPI endpoints and repeat-safe sync | Completed | `backend/app.py`; 4 passing tests; request replay |
| Implement local SQLite storage and pending-operation queue | Completed and device-verified | Pending task retained through app restart |
| Implement farm worker/manager role selection and cow screens | Completed and device-verified | Android dashboard/profile images |
| Test offline completion through server acknowledgement | Completed in one documented end-to-end trial | Before/after screenshots, `/tasks`, `/metrics` |
| Measure QR and manual identification workflows | Completed with limited sample | Three runs per method, `qr_manual_timings.csv` |
| Build a publicly accessible GitHub `main` branch and README | Completed | Repository link and GitHub screenshot |
| Repeat study on second device and with independent farm users | Not completed | Outside the available prototype evaluation |
| Production authentication, automatic background sync, multi-device conflict handling | Not implemented | Scope reductions documented in report |

## Problems I encountered and how I responded

- **Expo SDK mismatch.** My Samsung phone had Expo Go for SDK 58, whereas the project initially used SDK 57. I upgraded dependencies, ran Expo Doctor, and used a fresh Expo session. The mobile prototype subsequently opened on the phone. This delayed device testing and showed me that an installed dependency set does not guarantee device compatibility.
- **Android status-bar overlap.** The application's header initially sat beneath the phone's notification bar, making Dashboard difficult to press. I changed the safe-area handling, installed the required React Native dependency and retested the screen. The header then appeared below the status bar.
- **Offline-to-online uncertainty.** I kept the update queued until the backend was reachable from both phone and laptop. After confirming the network address, I synced the one pending change. The device showed no pending changes and the server recorded the completed task. I separately repeated an identical operation ID to check backend de-duplication.
- **Repository setup.** Git initially was not available on my computer. After installing it and configuring a local author identity, I committed the source on the `main` branch and pushed it to GitHub. I checked that virtual environments, device databases and the local `.env` file were excluded.

## Reflection

The small-step approach helped me distinguish code-level success from working behaviour on a physical phone. Automated tests gave early feedback for deterministic rules and API inputs, but they could not expose the Android header problem or prove that a locally completed task survived a restart. Device-based evaluation was therefore a necessary second stage. The main weakness of my process was that physical-device verification and evidence collection happened late, increasing pressure before submission. In a longer development cycle I would put a physical-device smoke test and a short evidence record into the definition of done for each major feature, instead of leaving them to the final day.

I have not claimed automatic synchronisation, secure log-in, several formal Scrum sprints, or independent farm-user testing. These were not demonstrated in this prototype.
